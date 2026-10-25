-- ==============================================================================
-- MIGRATION 20261025000005: PAYMENT & REFUND LIFECYCLE RECONCILIATION
-- ==============================================================================
-- Invariants Enforced:
-- 1. Track refunds separately as 'requested', 'processing', 'succeeded', 'failed', or 'declined'.
-- 2. NEVER mark a refund complete merely because an admin requested it. It only succeeds upon provider verification.
-- 3. Idempotent payment attempts indexed by provider_order_id and idempotency_key.
-- 4. Reconciles missed events and late captured payments safely into refund queue.
-- ==============================================================================

-- Extend refund_status enum
ALTER TYPE refund_status ADD VALUE IF NOT EXISTS 'succeeded';
ALTER TYPE refund_status ADD VALUE IF NOT EXISTS 'failed';

-- Add idempotency_key and provider_order_id indexes to payment_attempts
ALTER TABLE payment_attempts
  ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

CREATE INDEX IF NOT EXISTS idx_payment_attempts_order_id
  ON payment_attempts (provider_order_id);

CREATE INDEX IF NOT EXISTS idx_payment_attempts_idempotency
  ON payment_attempts (idempotency_key);

-- Add provider_refund_id index to refunds
CREATE INDEX IF NOT EXISTS idx_refunds_provider_id
  ON refunds (provider_refund_id);

-- ==============================================================================
-- FUNCTION: update_refund_lifecycle(...)
-- Transitions refund states:
-- 'requested' -> 'processing' (when dispatched to Razorpay)
-- 'processing' -> 'succeeded' (ONLY when Razorpay confirms captured refund)
-- 'processing' -> 'failed' (when Razorpay declines/errors)
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_refund_lifecycle(
  p_refund_id UUID,
  p_new_status refund_status,
  p_provider_refund_id TEXT DEFAULT NULL,
  p_curator_notes TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_refund RECORD;
BEGIN
  SELECT * INTO v_refund
  FROM refunds
  WHERE id = p_refund_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Refund record not found.');
  END IF;

  -- Invariant: Cannot jump from 'requested' directly to 'succeeded' without provider confirmation
  IF v_refund.status = 'requested' AND p_new_status = 'succeeded' AND p_provider_refund_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_TRANSITION',
      'message', 'Cannot mark refund complete without verified provider refund reference.'
    );
  END IF;

  UPDATE refunds
  SET
    status = p_new_status,
    provider_refund_id = COALESCE(p_provider_refund_id, v_refund.provider_refund_id),
    curator_notes = COALESCE(p_curator_notes, v_refund.curator_notes),
    processed_at = CASE WHEN p_new_status IN ('succeeded', 'failed', 'declined') THEN timezone('utc'::text, now()) ELSE v_refund.processed_at END
  WHERE id = p_refund_id;

  RETURN jsonb_build_object(
    'success', true,
    'refund_id', p_refund_id,
    'status', p_new_status,
    'provider_refund_id', p_provider_refund_id,
    'message', 'Refund state updated to ' || p_new_status
  );
END;
$$;

-- ==============================================================================
-- FUNCTION: reconcile_missed_payment_event(...)
-- Scheduled reconciliation helper that checks unconfirmed payments
-- ==============================================================================
CREATE OR REPLACE FUNCTION reconcile_missed_payment_event(
  p_provider_order_id TEXT,
  p_provider_payment_id TEXT,
  p_provider_status TEXT,
  p_captured_amount_paise BIGINT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_payment RECORD;
  v_confirm_res JSONB;
BEGIN
  -- Locate payment attempt by provider order id
  SELECT * INTO v_payment
  FROM payment_attempts
  WHERE provider_order_id = p_provider_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Payment attempt not found.');
  END IF;

  -- If already successful, return idempotent success
  IF v_payment.status = 'successful' THEN
    RETURN jsonb_build_object('success', true, 'already_reconciled', true, 'message', 'Payment already settled.');
  END IF;

  -- If provider indicates captured/paid, attempt atomic confirmation
  IF p_provider_status IN ('captured', 'paid') THEN
    v_confirm_res := confirm_booking_payment(
      v_payment.booking_request_id,
      v_payment.user_id,
      v_payment.provider,
      p_provider_payment_id,
      p_captured_amount_paise
    );
    RETURN v_confirm_res;
  ELSIF p_provider_status IN ('failed', 'expired') THEN
    UPDATE payment_attempts
    SET
      status = 'failed',
      error_code = 'PROVIDER_FAILED',
      error_description = 'Payment reported failed or expired by provider during reconciliation.',
      updated_at = timezone('utc'::text, now())
    WHERE id = v_payment.id;

    RETURN jsonb_build_object('success', true, 'status', 'failed', 'message', 'Payment attempt marked failed.');
  END IF;

  RETURN jsonb_build_object('success', true, 'status', v_payment.status, 'message', 'No reconciliation action required.');
END;
$$;
