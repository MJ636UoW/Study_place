-- ==============================================================================
-- MIGRATION 20261025000001: INITIAL SCHEMA FOR SANCTUARY (STUDY & ATELIER)
-- ==============================================================================
-- Domains Covered:
-- 1. Profiles & Identity
-- 2. Private Admin Roles
-- 3. Locations
-- 4. Seats (Architectural Workstations)
-- 5. Membership Plans
-- 6. Booking Requests (with Price & Terms Snapshotting)
-- 7. Seat Allocations (with GiST Half-Open Date Range Exclusion)
-- 8. Maintenance Blocks
-- 9. Payment Attempts (Isolated from Bookings)
-- 10. Refunds (Isolated from Payments)
-- 11. Webhook Events (Idempotent Ingestion)
-- 12. Account Restrictions
-- 13. Audit Events
-- 14. Enquiries (Concierge Dispatches)
-- 15. Reviews
-- 16. Notification Records
-- ==============================================================================

-- Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "btree_gist";

-- ==============================================================================
-- DOMAIN ENUMS (Separation of State Machines)
-- ==============================================================================

CREATE TYPE admin_role_type AS ENUM (
  'curator',
  'admin',
  'superadmin'
);

CREATE TYPE membership_plan_duration AS ENUM (
  'day',
  'week',
  'month',
  'quarter',
  'year'
);

CREATE TYPE booking_request_status AS ENUM (
  'draft',
  'submitted',
  'under_review',
  'approved',
  'rejected',
  'cancelled'
);

CREATE TYPE seat_allocation_status AS ENUM (
  'active',
  'completed',
  'released',
  'revoked'
);

CREATE TYPE payment_attempt_status AS ENUM (
  'initiated',
  'processing',
  'successful',
  'failed',
  'expired'
);

CREATE TYPE refund_status AS ENUM (
  'requested',
  'approved',
  'processing',
  'completed',
  'declined'
);

CREATE TYPE enquiry_status AS ENUM (
  'new',
  'in_progress',
  'resolved',
  'archived'
);

CREATE TYPE review_status AS ENUM (
  'pending_review',
  'published',
  'archived'
);

-- ==============================================================================
-- 1. PROFILES
-- ==============================================================================
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  affiliation TEXT,
  avatar_url TEXT,
  biography TEXT,
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 2. PRIVATE ADMIN ROLES (Separate Table — Users Cannot Assign Themselves Roles)
-- ==============================================================================
CREATE TABLE admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role admin_role_type NOT NULL DEFAULT 'curator',
  is_active BOOLEAN NOT NULL DEFAULT true,
  granted_by UUID REFERENCES auth.users(id),
  granted_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  revoked_at TIMESTAMPTZ,
  notes TEXT,
  CONSTRAINT unique_active_admin_user UNIQUE(user_id)
);

-- ==============================================================================
-- 3. LOCATIONS
-- ==============================================================================
CREATE TABLE locations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  address_line1 TEXT NOT NULL,
  address_line2 TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'India',
  timezone TEXT NOT NULL DEFAULT 'Asia/Kolkata',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 4. SEATS (Architectural Workstations)
-- ==============================================================================
CREATE TABLE seats (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  location_id UUID NOT NULL REFERENCES locations(id) ON DELETE RESTRICT,
  seat_number TEXT NOT NULL,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  view_description TEXT NOT NULL,
  verified_features TEXT[] NOT NULL DEFAULT '{}',
  photo_url TEXT,
  map_x NUMERIC(6, 2) NOT NULL,
  map_y NUMERIC(6, 2) NOT NULL,
  map_width NUMERIC(6, 2) NOT NULL,
  map_height NUMERIC(6, 2) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_seat_number_per_location UNIQUE(location_id, seat_number)
);

-- ==============================================================================
-- 5. MEMBERSHIP PLANS (Financial Model in Integer Paise)
-- ==============================================================================
CREATE TABLE membership_plans (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  tagline TEXT NOT NULL,
  duration_type membership_plan_duration NOT NULL,
  duration_days INTEGER NOT NULL,
  base_price_paise BIGINT NOT NULL CHECK (base_price_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  is_active BOOLEAN NOT NULL DEFAULT true,
  terms_markdown TEXT NOT NULL,
  inclusions TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 6. BOOKING REQUESTS (Price & Plan Terms Snapshotting)
-- ==============================================================================
CREATE TABLE booking_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  request_number TEXT NOT NULL UNIQUE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  plan_id UUID NOT NULL REFERENCES membership_plans(id) ON DELETE RESTRICT,
  status booking_request_status NOT NULL DEFAULT 'submitted',
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  -- Half-open interval: [start_date, end_date + 1 day)
  period_range DATERANGE NOT NULL,
  total_price_paise BIGINT NOT NULL CHECK (total_price_paise >= 0),
  price_snapshot JSONB NOT NULL,
  plan_terms_snapshot TEXT NOT NULL,
  guest_notes TEXT,
  special_accommodations TEXT,
  curator_decision_notes TEXT,
  decision_by UUID REFERENCES auth.users(id),
  decision_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT valid_date_order CHECK (end_date >= start_date)
);

-- ==============================================================================
-- 7. SEAT ALLOCATIONS (Exclusion Constraint on Half-Open Intervals)
-- ==============================================================================
CREATE TABLE seat_allocations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID NOT NULL UNIQUE REFERENCES booking_requests(id) ON DELETE CASCADE,
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  allocated_range DATERANGE NOT NULL,
  status seat_allocation_status NOT NULL DEFAULT 'active',
  access_pass_code TEXT NOT NULL UNIQUE,
  assigned_locker_number TEXT,
  check_in_window TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  -- Prevents overlapping active allocations for the same seat
  CONSTRAINT exclude_overlapping_seat_allocations
    EXCLUDE USING gist (seat_id WITH =, allocated_range WITH &&)
    WHERE (status = 'active')
);

-- ==============================================================================
-- 8. MAINTENANCE BLOCKS (Prevents Booking During Physical Maintenance)
-- ==============================================================================
CREATE TABLE maintenance_blocks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seat_id UUID NOT NULL REFERENCES seats(id) ON DELETE CASCADE,
  blocked_range DATERANGE NOT NULL,
  reason TEXT NOT NULL,
  curator_id UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT exclude_overlapping_maintenance_blocks
    EXCLUDE USING gist (seat_id WITH =, blocked_range WITH &&)
);

-- ==============================================================================
-- 9. PAYMENT ATTEMPTS (Strictly Isolated State Machine)
-- ==============================================================================
CREATE TABLE payment_attempts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE RESTRICT,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount_paise BIGINT NOT NULL CHECK (amount_paise >= 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  provider TEXT NOT NULL DEFAULT 'razorpay',
  provider_order_id TEXT,
  provider_payment_id TEXT,
  status payment_attempt_status NOT NULL DEFAULT 'initiated',
  error_code TEXT,
  error_description TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  initiated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  settled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 10. REFUNDS (Strictly Isolated State Machine)
-- ==============================================================================
CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  payment_attempt_id UUID NOT NULL REFERENCES payment_attempts(id) ON DELETE RESTRICT,
  booking_request_id UUID NOT NULL REFERENCES booking_requests(id) ON DELETE RESTRICT,
  amount_paise BIGINT NOT NULL CHECK (amount_paise > 0),
  currency TEXT NOT NULL DEFAULT 'INR',
  reason TEXT NOT NULL,
  status refund_status NOT NULL DEFAULT 'requested',
  provider_refund_id TEXT,
  curator_id UUID REFERENCES auth.users(id),
  curator_notes TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 11. WEBHOOK EVENTS (Idempotent Ingestion Log)
-- ==============================================================================
CREATE TABLE webhook_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  provider TEXT NOT NULL,
  event_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  payload JSONB NOT NULL,
  processed BOOLEAN NOT NULL DEFAULT false,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_provider_event UNIQUE(provider, event_id)
);

-- ==============================================================================
-- 12. ACCOUNT RESTRICTIONS
-- ==============================================================================
CREATE TABLE account_restrictions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  restriction_type TEXT NOT NULL,
  reason TEXT NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  imposed_by UUID REFERENCES auth.users(id),
  imposed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  lifted_at TIMESTAMPTZ,
  lifted_by UUID REFERENCES auth.users(id)
);

-- ==============================================================================
-- 13. AUDIT EVENTS (Immutable Record of Security Operations)
-- ==============================================================================
CREATE TABLE audit_events (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  actor_id UUID REFERENCES auth.users(id),
  action TEXT NOT NULL,
  resource_type TEXT NOT NULL,
  resource_id TEXT NOT NULL,
  payload JSONB,
  ip_address TEXT,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 14. ENQUIRIES (Concierge Dispatches)
-- ==============================================================================
CREATE TABLE enquiries (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  topic TEXT NOT NULL,
  message TEXT NOT NULL,
  status enquiry_status NOT NULL DEFAULT 'new',
  curator_response TEXT,
  responded_by UUID REFERENCES auth.users(id),
  responded_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 15. REVIEWS (Curated Studio Testimonials)
-- ==============================================================================
CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  booking_request_id UUID REFERENCES booking_requests(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  title TEXT,
  comment TEXT NOT NULL,
  status review_status NOT NULL DEFAULT 'pending_review',
  curator_approved_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- 16. NOTIFICATION RECORDS (In-App Member Dispatch Queue)
-- ==============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'in_app',
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- ==============================================================================
-- INDEXES FOR PERFORMANCE & INTEGRITY
-- ==============================================================================
CREATE INDEX idx_booking_requests_user ON booking_requests(user_id);
CREATE INDEX idx_booking_requests_seat ON booking_requests(seat_id);
CREATE INDEX idx_booking_requests_status ON booking_requests(status);
CREATE INDEX idx_booking_requests_period ON booking_requests USING gist (period_range);

CREATE INDEX idx_seat_allocations_seat ON seat_allocations(seat_id);
CREATE INDEX idx_seat_allocations_user ON seat_allocations(user_id);
CREATE INDEX idx_seat_allocations_range ON seat_allocations USING gist (allocated_range);

CREATE INDEX idx_payment_attempts_booking ON payment_attempts(booking_request_id);
CREATE INDEX idx_payment_attempts_user ON payment_attempts(user_id);
CREATE INDEX idx_refunds_booking ON refunds(booking_request_id);

CREATE INDEX idx_audit_events_actor ON audit_events(actor_id);
CREATE INDEX idx_audit_events_created ON audit_events(created_at DESC);
CREATE INDEX idx_notifications_user_unread ON notifications(user_id) WHERE (is_read = false);
