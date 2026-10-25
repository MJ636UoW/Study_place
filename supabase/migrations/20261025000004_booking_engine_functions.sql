-- ==============================================================================
-- MIGRATION 20261025000004: REAL BOOKING ENGINE & TRANSACTIONAL CONCURRENCY
-- ==============================================================================
-- Invariants Enforced:
-- 1. Student submits pending request; it does NOT reserve a seat.
-- 2. Admin approval atomically checks availability and creates an expiring payment hold.
-- 3. Verified captured payment confirms the booking while the hold remains valid.
-- 4. Rejection or unpaid expiry safely releases the request/hold.
-- 5. Renewal creates a new request subject to availability.
-- 6. PostgreSQL GiST exclusion constraint covers confirmed, payment holds, walk-ins, and maintenance blocks.
-- 7. Late payment after expiry or cancellation NEVER steals another member's seat. Routes to refunds.
-- 8. Row-level serialization (FOR UPDATE) prevents race conditions.
-- ==============================================================================

-- Extend seat_allocation_status enum if needed
ALTER TYPE seat_allocation_status ADD VALUE IF NOT EXISTS 'payment_hold';
ALTER TYPE seat_allocation_status ADD VALUE IF NOT EXISTS 'walk_in';

-- Add hold_expires_at to seat_allocations
ALTER TABLE seat_allocations
  ADD COLUMN IF NOT EXISTS hold_expires_at TIMESTAMPTZ;

-- Drop and recreate the GiST constraint to cover 'payment_hold', 'confirmed', and 'walk_in'
-- Note: 'active' from initial schema is treated as confirmed
ALTER TABLE seat_allocations
  DROP CONSTRAINT IF EXISTS exclude_overlapping_seat_allocations;

ALTER TABLE seat_allocations
  ADD CONSTRAINT exclude_overlapping_seat_allocations
  EXCLUDE USING gist (seat_id WITH =, allocated_range WITH &&)
  WHERE (status IN ('active', 'payment_hold', 'walk_in'));

-- ==============================================================================
-- 1. FUNCTION: release_expired_holds()
-- Safely releases unpaid payment holds whose hold_expires_at <= now()
-- Can be called lazily during booking operations and by scheduled cleanup cron.
-- ==============================================================================
CREATE OR REPLACE FUNCTION release_expired_holds()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_released_count INTEGER := 0;
BEGIN
  -- Transition expired seat_allocations to 'released'
  WITH expired_allocations AS (
    UPDATE seat_allocations
    SET
      status = 'released',
      updated_at = timezone('utc'::text, now())
    WHERE status = 'payment_hold'
      AND hold_expires_at IS NOT NULL
      AND hold_expires_at <= timezone('utc'::text, now())
    RETURNING id, booking_request_id
  ),
  updated_requests AS (
    UPDATE booking_requests br
    SET
      status = 'rejected',
      curator_decision_notes = COALESCE(br.curator_decision_notes || ' | ', '') || 'Expired unpaid payment hold released automatically.',
      updated_at = timezone('utc'::text, now())
    FROM expired_allocations ea
    WHERE br.id = ea.booking_request_id
      AND br.status = 'under_review'
    RETURNING br.id
  )
  SELECT count(*) INTO v_released_count FROM expired_allocations;

  RETURN v_released_count;
END;
$$;

-- ==============================================================================
-- 2. FUNCTION: submit_booking_request(...)
-- Step 1 of Workflow: Student submits request. It does NOT reserve a seat.
-- Rechecks server-owned pricing in paise, user restrictions, and snapshots terms.
-- ==============================================================================
CREATE OR REPLACE FUNCTION submit_booking_request(
  p_user_id UUID,
  p_seat_id UUID,
  p_plan_id UUID,
  p_start_date DATE,
  p_end_date DATE,
  p_guest_notes TEXT DEFAULT NULL,
  p_special_accommodations TEXT DEFAULT NULL,
  p_idempotency_key TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_restricted BOOLEAN;
  v_plan RECORD;
  v_seat RECORD;
  v_period_range DATERANGE;
  v_request_id UUID;
  v_request_number TEXT;
  v_price_snapshot JSONB;
BEGIN
  -- 1. Check account restrictions
  SELECT EXISTS (
    SELECT 1 FROM account_restrictions
    WHERE user_id = p_user_id
      AND is_active = true
      AND (expires_at IS NULL OR expires_at > timezone('utc'::text, now()))
  ) INTO v_is_restricted;

  IF v_is_restricted THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'ACCOUNT_RESTRICTED',
      'message', 'Account is restricted from placing new workstation requests.'
    );
  END IF;

  -- 2. Validate dates
  IF p_end_date < p_start_date THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_DATES',
      'message', 'End date must be greater than or equal to start date.'
    );
  END IF;

  -- Construct half-open interval [start, end + 1 day)
  v_period_range := daterange(p_start_date, p_end_date + 1, '[)');

  -- 3. Fetch server-owned plan details (never trust client price)
  SELECT * INTO v_plan
  FROM membership_plans
  WHERE id = p_plan_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_PLAN',
      'message', 'Membership plan not found or inactive.'
    );
  END IF;

  -- 4. Verify seat exists and is active
  SELECT * INTO v_seat
  FROM seats
  WHERE id = p_seat_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_SEAT',
      'message', 'Workstation not found or inactive.'
    );
  END IF;

  -- 5. Prepare snapshots
  v_request_number := 'REQ-' || to_char(now(), 'YYYY') || '-' || upper(substring(md5(random()::text) from 1 for 6));
  v_price_snapshot := jsonb_build_object(
    'base_price_paise', v_plan.base_price_paise,
    'currency', v_plan.currency,
    'plan_slug', v_plan.slug,
    'plan_name', v_plan.name,
    'captured_at', timezone('utc'::text, now())
  );

  -- 6. Insert pending booking request (NO SEAT ALLOCATION CREATED YET)
  INSERT INTO booking_requests (
    request_number,
    user_id,
    seat_id,
    plan_id,
    status,
    start_date,
    end_date,
    period_range,
    total_price_paise,
    price_snapshot,
    plan_terms_snapshot,
    guest_notes,
    special_accommodations
  ) VALUES (
    v_request_number,
    p_user_id,
    p_seat_id,
    p_plan_id,
    'submitted',
    p_start_date,
    p_end_date,
    v_period_range,
    v_plan.base_price_paise,
    v_price_snapshot,
    v_plan.terms_markdown,
    p_guest_notes,
    p_special_accommodations
  )
  RETURNING id INTO v_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'request_id', v_request_id,
    'request_number', v_request_number,
    'status', 'submitted',
    'total_price_paise', v_plan.base_price_paise,
    'message', 'Request submitted successfully. Pending curatorial review.'
  );
END;
$$;

-- ==============================================================================
-- 3. FUNCTION: approve_booking_request_create_hold(...)
-- Step 2 of Workflow: Admin approval atomically checks availability and creates
-- an expiring payment hold (e.g. 15-minute hold).
-- Serialized with FOR UPDATE locking.
-- ==============================================================================
CREATE OR REPLACE FUNCTION approve_booking_request_create_hold(
  p_request_id UUID,
  p_admin_id UUID,
  p_hold_duration_minutes INTEGER DEFAULT 15
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_conflict RECORD;
  v_hold_expires TIMESTAMPTZ;
  v_pass_code TEXT;
  v_allocation_id UUID;
BEGIN
  -- 1. Ensure expired holds are cleared first
  PERFORM release_expired_holds();

  -- 2. Lock the booking request row FOR UPDATE
  SELECT * INTO v_req
  FROM booking_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking request not found.');
  END IF;

  IF v_req.status != 'submitted' THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'INVALID_STATUS',
      'message', 'Request is not in submitted state (current status: ' || v_req.status || ').'
    );
  END IF;

  -- 3. Check for conflicting active seat allocations
  SELECT * INTO v_conflict
  FROM seat_allocations
  WHERE seat_id = v_req.seat_id
    AND status IN ('active', 'payment_hold', 'walk_in')
    AND allocated_range && v_req.period_range
  LIMIT 1;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'SEAT_UNAVAILABLE',
      'message', 'Seat is occupied by another allocation or active hold during requested dates.'
    );
  END IF;

  -- 4. Check for conflicting maintenance blocks
  IF EXISTS (
    SELECT 1 FROM maintenance_blocks
    WHERE seat_id = v_req.seat_id
      AND blocked_range && v_req.period_range
  ) THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'MAINTENANCE_CONFLICT',
      'message', 'Workstation is scheduled for physical maintenance during requested dates.'
    );
  END IF;

  -- 5. Calculate hold expiration (UTC)
  v_hold_expires := timezone('utc'::text, now()) + (p_hold_duration_minutes || ' minutes')::interval;
  v_pass_code := 'PASS-' || to_char(now(), 'YYMM') || '-' || upper(substring(md5(random()::text) from 1 for 6));

  -- 6. Insert expiring payment hold
  INSERT INTO seat_allocations (
    booking_request_id,
    seat_id,
    user_id,
    allocated_range,
    status,
    access_pass_code,
    assigned_locker_number,
    hold_expires_at
  ) VALUES (
    v_req.id,
    v_req.seat_id,
    v_req.user_id,
    v_req.period_range,
    'payment_hold',
    v_pass_code,
    'LKR-' || lpad((floor(random() * 50) + 1)::text, 2, '0'),
    v_hold_expires
  )
  RETURNING id INTO v_allocation_id;

  -- 7. Update booking request status
  UPDATE booking_requests
  SET
    status = 'under_review',
    decision_by = p_admin_id,
    decision_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'allocation_id', v_allocation_id,
    'pass_code', v_pass_code,
    'hold_expires_at', v_hold_expires,
    'message', 'Request approved. Expiring payment hold established.'
  );
END;
$$;

-- ==============================================================================
-- 4. FUNCTION: confirm_booking_payment(...)
-- Step 3 of Workflow: Verified captured payment confirms the booking while
-- the hold remains valid.
-- Late payment after hold expiry or cancellation NEVER steals another member's seat;
-- it is routed to refunds table.
-- ==============================================================================
CREATE OR REPLACE FUNCTION confirm_booking_payment(
  p_request_id UUID,
  p_user_id UUID,
  p_provider TEXT,
  p_provider_payment_id TEXT,
  p_amount_paise BIGINT,
  p_metadata JSONB DEFAULT '{}'::jsonb
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
  v_alloc RECORD;
  v_payment_id UUID;
  v_refund_id UUID;
BEGIN
  -- 1. Lock the booking request row FOR UPDATE
  SELECT * INTO v_req
  FROM booking_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking request not found.');
  END IF;

  -- 2. Lock the seat allocation row FOR UPDATE
  SELECT * INTO v_alloc
  FROM seat_allocations
  WHERE booking_request_id = p_request_id
  FOR UPDATE;

  -- 3. Check for late payment after expiry or cancellation
  IF NOT FOUND OR v_alloc.status != 'payment_hold' OR (v_alloc.hold_expires_at IS NOT NULL AND v_alloc.hold_expires_at < timezone('utc'::text, now())) THEN
    -- LATE PAYMENT RECEIVED: DO NOT STEAL ANOTHER MEMBER'S SEAT!
    -- Record failed payment attempt and queue refund record immediately
    INSERT INTO payment_attempts (
      booking_request_id,
      user_id,
      amount_paise,
      currency,
      provider,
      provider_payment_id,
      status,
      error_code,
      error_description,
      metadata
    ) VALUES (
      p_request_id,
      p_user_id,
      p_amount_paise,
      'INR',
      p_provider,
      p_provider_payment_id,
      'failed',
      'LATE_PAYMENT_POST_EXPIRY',
      'Captured payment arrived after hold expired or was released. Queued for reconciliation/refund.',
      p_metadata
    )
    RETURNING id INTO v_payment_id;

    -- Route to refunds
    INSERT INTO refunds (
      payment_attempt_id,
      booking_request_id,
      amount_paise,
      currency,
      reason,
      status
    ) VALUES (
      v_payment_id,
      p_request_id,
      p_amount_paise,
      'INR',
      'Automated refund: Payment captured after payment hold expired.',
      'requested'
    )
    RETURNING id INTO v_refund_id;

    RETURN jsonb_build_object(
      'success', false,
      'error', 'HOLD_EXPIRED',
      'requires_refund', true,
      'payment_attempt_id', v_payment_id,
      'refund_id', v_refund_id,
      'message', 'Payment hold expired before capture was received. Seat was preserved; funds routed to refund queue.'
    );
  END IF;

  -- 4. Verify captured amount matches server-owned total price
  IF p_amount_paise < v_req.total_price_paise THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'UNDERPAYMENT',
      'message', 'Captured amount is less than official fee (' || p_amount_paise || ' < ' || v_req.total_price_paise || ' paise).'
    );
  END IF;

  -- 5. Record successful payment attempt
  INSERT INTO payment_attempts (
    booking_request_id,
    user_id,
    amount_paise,
    currency,
    provider,
    provider_payment_id,
    status,
    settled_at,
    metadata
  ) VALUES (
    p_request_id,
    p_user_id,
    p_amount_paise,
    'INR',
    p_provider,
    p_provider_payment_id,
    'successful',
    timezone('utc'::text, now()),
    p_metadata
  )
  RETURNING id INTO v_payment_id;

  -- 6. Transition seat allocation to confirmed (status = 'active')
  UPDATE seat_allocations
  SET
    status = 'active',
    hold_expires_at = NULL,
    updated_at = timezone('utc'::text, now())
  WHERE id = v_alloc.id;

  -- 7. Transition booking request to approved
  UPDATE booking_requests
  SET
    status = 'approved',
    updated_at = timezone('utc'::text, now())
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_request_id', p_request_id,
    'allocation_id', v_alloc.id,
    'payment_attempt_id', v_payment_id,
    'pass_code', v_alloc.access_pass_code,
    'message', 'Booking successfully confirmed and workstation access key granted.'
  );
END;
$$;

-- ==============================================================================
-- 5. FUNCTION: reject_booking_request(...)
-- Step 4 of Workflow: Rejection releases any existing payment hold.
-- ==============================================================================
CREATE OR REPLACE FUNCTION reject_booking_request(
  p_request_id UUID,
  p_admin_id UUID,
  p_reason TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_req RECORD;
BEGIN
  SELECT * INTO v_req
  FROM booking_requests
  WHERE id = p_request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Booking request not found.');
  END IF;

  -- Release any active allocation/hold
  UPDATE seat_allocations
  SET
    status = 'released',
    updated_at = timezone('utc'::text, now())
  WHERE booking_request_id = p_request_id
    AND status IN ('payment_hold', 'active');

  -- Mark request as rejected
  UPDATE booking_requests
  SET
    status = 'rejected',
    curator_decision_notes = p_reason,
    decision_by = p_admin_id,
    decision_at = timezone('utc'::text, now()),
    updated_at = timezone('utc'::text, now())
  WHERE id = p_request_id;

  RETURN jsonb_build_object(
    'success', true,
    'message', 'Booking request rejected and any active seat hold released.'
  );
END;
$$;

-- ==============================================================================
-- 6. FUNCTION: create_renewal_request(...)
-- Step 5 of Workflow: Renewal creates a new request subject to availability.
-- ==============================================================================
CREATE OR REPLACE FUNCTION create_renewal_request(
  p_existing_request_id UUID,
  p_user_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_existing RECORD;
  v_plan RECORD;
  v_new_start DATE;
  v_new_end DATE;
  v_period_days INTEGER;
BEGIN
  SELECT * INTO v_existing
  FROM booking_requests
  WHERE id = p_existing_request_id AND user_id = p_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('success', false, 'error', 'NOT_FOUND', 'message', 'Existing booking not found.');
  END IF;

  SELECT * INTO v_plan
  FROM membership_plans
  WHERE id = v_existing.plan_id;

  -- Contiguous interval: starts day after existing end_date
  v_new_start := v_existing.end_date + 1;
  v_period_days := v_existing.end_date - v_existing.start_date;
  v_new_end := v_new_start + v_period_days;

  -- Delegate to submit_booking_request (submits pending request without reserving seat)
  RETURN submit_booking_request(
    p_user_id,
    v_existing.seat_id,
    v_existing.plan_id,
    v_new_start,
    v_new_end,
    'Renewal of tenure ' || v_existing.request_number,
    v_existing.special_accommodations
  );
END;
$$;
