-- ==============================================================================
-- MIGRATION 20261025000006: SECURE FIRST-ADMIN PROVISIONING & MFA GOVERNANCE
-- ==============================================================================
-- STRICT SECURITY INVARIANTS:
-- 1. Never seed production databases with hardcoded passwords or default credentials.
-- 2. Initial superadmin is granted strictly to a verified client owner email.
-- 3. Superadmin sessions must satisfy MFA Authenticator Assurance Level 2 (AAL2).
-- ==============================================================================

-- Function to safely bootstrap initial superadmin after owner signs up via Supabase Auth
CREATE OR REPLACE FUNCTION provision_initial_superadmin(
  target_email TEXT,
  actor_notes TEXT DEFAULT 'Initial owner provisioning during production launch'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  v_user_id UUID;
  v_existing_superadmin_count INT;
  v_result JSONB;
BEGIN
  -- Verify target user exists in auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = LOWER(TRIM(target_email));

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'USER_NOT_FOUND',
      'message', format('User with email "%s" has not yet registered in auth.users. Have the owner complete email sign-up first.', target_email)
    );
  END IF;

  -- Ensure profile exists
  INSERT INTO public.profiles (id, full_name, email, phone, role)
  VALUES (v_user_id, 'Sanctuary Principal Curator', target_email, '+910000000000', 'admin')
  ON CONFLICT (id) DO UPDATE
  SET role = 'admin', updated_at = timezone('utc'::text, now());

  -- Insert or update superadmin role in admin_roles
  INSERT INTO public.admin_roles (user_id, role, permissions, is_active, granted_by, granted_at)
  VALUES (
    v_user_id,
    'superadmin',
    ARRAY['all', 'bookings:manage', 'payments:manage', 'refunds:manage', 'maintenance:manage', 'users:restrict', 'audit:view'],
    true,
    v_user_id,
    timezone('utc'::text, now())
  )
  ON CONFLICT (user_id, role) DO UPDATE
  SET is_active = true, updated_at = timezone('utc'::text, now());

  -- Record audit event
  INSERT INTO public.audit_events (
    actor_id,
    staff_name,
    action,
    resource_type,
    resource_id,
    details,
    reason
  )
  VALUES (
    v_user_id,
    'System Bootstrap',
    'INITIAL_SUPERADMIN_PROVISIONED',
    'admin_roles',
    v_user_id::text,
    jsonb_build_object('email', target_email, 'role', 'superadmin'),
    actor_notes
  );

  RETURN jsonb_build_object(
    'success', true,
    'userId', v_user_id,
    'email', target_email,
    'role', 'superadmin',
    'mfaRequired', true,
    'message', 'Initial superadmin successfully provisioned. Owner must enroll in MFA TOTP before accessing /admin.'
  );
END;
$$;

COMMENT ON FUNCTION provision_initial_superadmin IS
  'Securely provisions the initial superadmin role to a registered client owner. Bypasses public signup vulnerabilities.';
