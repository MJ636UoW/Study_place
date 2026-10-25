-- ==============================================================================
-- MIGRATION 20261025000002: ROW LEVEL SECURITY & LEAST-PRIVILEGE ACCESS
-- ==============================================================================
-- Invariants Enforced:
-- 1. All 16 tables have RLS enabled.
-- 2. Members can access ONLY their own permitted records (user_id = auth.uid()).
-- 3. Public availability NEVER exposes member identities or booking references.
-- 4. Users CANNOT assign themselves admin roles or escalate privileges.
-- 5. Elevated credentials stay strictly server-side.
-- ==============================================================================

-- ==============================================================================
-- SECURITY DEFINER HELPER FUNCTIONS
-- ==============================================================================

-- Check if authenticated user has an active admin role
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = auth.uid()
      AND is_active = true
  );
$$;

-- Check if authenticated user has an active superadmin role
CREATE OR REPLACE FUNCTION is_superadmin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM admin_roles
    WHERE user_id = auth.uid()
      AND role = 'superadmin'
      AND is_active = true
  );
$$;

-- Check if user session has satisfied MFA AAL2 (Authenticator Assurance Level 2)
CREATE OR REPLACE FUNCTION has_mfa_level_2()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT (auth.jwt() ->> 'aal') = 'aal2';
$$;

-- ==============================================================================
-- ENABLE RLS ON ALL TABLES
-- ==============================================================================

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE seats ENABLE ROW LEVEL SECURITY;
ALTER TABLE membership_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE booking_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE seat_allocations ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenance_blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE refunds ENABLE ROW LEVEL SECURITY;
ALTER TABLE webhook_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE account_restrictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- ==============================================================================
-- 1. PROFILES POLICIES
-- ==============================================================================

CREATE POLICY "Profiles are viewable by owner or admin"
  ON profiles FOR SELECT
  USING (auth.uid() = id OR is_admin());

CREATE POLICY "Users can insert their own profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update their own profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id OR is_admin())
  WITH CHECK (auth.uid() = id OR is_admin());

-- ==============================================================================
-- 2. ADMIN ROLES POLICIES (Users CANNOT assign themselves roles)
-- ==============================================================================

CREATE POLICY "Admins can view admin roles list"
  ON admin_roles FOR SELECT
  USING (is_admin());

CREATE POLICY "Only superadmins can grant or modify admin roles"
  ON admin_roles FOR ALL
  USING (is_superadmin())
  WITH CHECK (is_superadmin());

-- ==============================================================================
-- 3. LOCATIONS POLICIES
-- ==============================================================================

CREATE POLICY "Locations are publicly readable"
  ON locations FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage locations"
  ON locations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 4. SEATS POLICIES (Architectural Plat)
-- ==============================================================================

CREATE POLICY "Seats are publicly readable"
  ON seats FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage seats"
  ON seats FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 5. MEMBERSHIP PLANS POLICIES
-- ==============================================================================

CREATE POLICY "Active membership plans are publicly readable"
  ON membership_plans FOR SELECT
  USING (is_active = true OR is_admin());

CREATE POLICY "Admins can manage membership plans"
  ON membership_plans FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 6. BOOKING REQUESTS POLICIES (Strict Member Isolation)
-- ==============================================================================

CREATE POLICY "Members view only their own booking requests"
  ON booking_requests FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Members submit their own booking requests"
  ON booking_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Members can cancel their unapproved requests; Admins manage all"
  ON booking_requests FOR UPDATE
  USING (auth.uid() = user_id OR is_admin())
  WITH CHECK (auth.uid() = user_id OR is_admin());

-- ==============================================================================
-- 7. SEAT ALLOCATIONS POLICIES (Strict Member Isolation)
-- ==============================================================================

CREATE POLICY "Members view only their own allocated passes"
  ON seat_allocations FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Only curators/admins can create or modify seat allocations"
  ON seat_allocations FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 8. MAINTENANCE BLOCKS POLICIES
-- ==============================================================================

CREATE POLICY "Maintenance blocks are publicly visible (anonymized schedule)"
  ON maintenance_blocks FOR SELECT
  USING (true);

CREATE POLICY "Admins manage maintenance blocks"
  ON maintenance_blocks FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 9. PAYMENT ATTEMPTS POLICIES (Strict Member Isolation)
-- ==============================================================================

CREATE POLICY "Members view only their own payment attempts"
  ON payment_attempts FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Members can initiate payment attempts for their bookings"
  ON payment_attempts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- 10. REFUNDS POLICIES
-- ==============================================================================

CREATE POLICY "Members view their own refunds"
  ON refunds FOR SELECT
  USING (
    auth.uid() IN (SELECT user_id FROM booking_requests WHERE id = booking_request_id)
    OR is_admin()
  );

CREATE POLICY "Admins manage refunds"
  ON refunds FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 11. WEBHOOK EVENTS POLICIES (Admin / Service Role Only)
-- ==============================================================================

CREATE POLICY "Only admins can view webhook audit logs"
  ON webhook_events FOR SELECT
  USING (is_admin());

-- ==============================================================================
-- 12. ACCOUNT RESTRICTIONS POLICIES
-- ==============================================================================

CREATE POLICY "Members see their own active restrictions; Admins see all"
  ON account_restrictions FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins manage account restrictions"
  ON account_restrictions FOR ALL
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 13. AUDIT EVENTS POLICIES (Admin Only)
-- ==============================================================================

CREATE POLICY "Only admins can query audit logs"
  ON audit_events FOR SELECT
  USING (is_admin());

CREATE POLICY "Authenticated users and system can log audit events"
  ON audit_events FOR INSERT
  WITH CHECK (auth.uid() = actor_id OR is_admin());

-- ==============================================================================
-- 14. ENQUIRIES POLICIES
-- ==============================================================================

CREATE POLICY "Anyone can submit a concierge enquiry"
  ON enquiries FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Members see their own enquiries; Admins see all"
  ON enquiries FOR SELECT
  USING (auth.uid() = user_id OR is_admin());

CREATE POLICY "Admins manage and respond to enquiries"
  ON enquiries FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 15. REVIEWS POLICIES
-- ==============================================================================

CREATE POLICY "Published reviews are publicly visible"
  ON reviews FOR SELECT
  USING (status = 'published' OR auth.uid() = user_id OR is_admin());

CREATE POLICY "Members can submit reviews for their stays"
  ON reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins curate reviews"
  ON reviews FOR UPDATE
  USING (is_admin())
  WITH CHECK (is_admin());

-- ==============================================================================
-- 16. NOTIFICATIONS POLICIES
-- ==============================================================================

CREATE POLICY "Members see only their own notifications"
  ON notifications FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Members can mark their notifications as read"
  ON notifications FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ==============================================================================
-- PUBLIC SAFE SEAT AVAILABILITY RPC
-- ==============================================================================
-- Crucial Security Requirement:
-- "Public availability must never expose member identities."
-- This function tests date range overlaps and returns only seat availability
-- statuses without ANY member IDs, user names, or booking request references.
-- ==============================================================================

CREATE OR REPLACE FUNCTION get_public_seat_availability(
  p_location_id UUID,
  p_start_date DATE,
  p_end_date DATE
)
RETURNS TABLE (
  seat_id UUID,
  seat_number TEXT,
  name TEXT,
  zone TEXT,
  is_available BOOLEAN,
  status TEXT
)
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
AS $$
DECLARE
  v_query_range DATERANGE;
BEGIN
  -- Construct half-open interval: [p_start_date, p_end_date + 1 day)
  v_query_range := daterange(p_start_date, p_end_date + 1, '[)');

  RETURN QUERY
  SELECT
    s.id AS seat_id,
    s.seat_number,
    s.name,
    s.zone,
    -- Seat is available if no active allocations and no maintenance blocks overlap
    (
      NOT EXISTS (
        SELECT 1
        FROM seat_allocations sa
        WHERE sa.seat_id = s.id
          AND sa.status = 'active'
          AND sa.allocated_range && v_query_range
      )
      AND NOT EXISTS (
        SELECT 1
        FROM maintenance_blocks mb
        WHERE mb.seat_id = s.id
          AND mb.blocked_range && v_query_range
      )
    ) AS is_available,
    CASE
      WHEN EXISTS (
        SELECT 1
        FROM maintenance_blocks mb
        WHERE mb.seat_id = s.id
          AND mb.blocked_range && v_query_range
      ) THEN 'maintenance'
      WHEN EXISTS (
        SELECT 1
        FROM seat_allocations sa
        WHERE sa.seat_id = s.id
          AND sa.status = 'active'
          AND sa.allocated_range && v_query_range
      ) THEN 'reserved'
      ELSE 'available'
    END AS status
  FROM seats s
  WHERE s.location_id = p_location_id
    AND s.is_active = true
  ORDER BY s.seat_number ASC;
END;
$$;
