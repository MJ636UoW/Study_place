-- ==============================================================================
-- ELITE STUDY ZONE — SUPABASE DATABASE INITIAL SCHEMA & SECURITY MIGRATION
-- Project: dyaobbudjufenwporvdb
-- Region: Mumbai / India (Asia/Kolkata)
-- ==============================================================================

-- 1. Enable UUID Extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. User Profiles & Roles Table
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  role TEXT NOT NULL DEFAULT 'student' CHECK (role IN ('student', 'admin', 'staff')),
  biometric_enrolled BOOLEAN DEFAULT FALSE,
  biometric_template_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Dedicated Admin Roles Table
CREATE TABLE IF NOT EXISTS public.admin_roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'super_admin' CHECK (role IN ('super_admin', 'curator', 'manager')),
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, role)
);

-- 4. Workstation Inventory Table
CREATE TABLE IF NOT EXISTS public.workstations (
  id TEXT PRIMARY KEY,
  seat_number TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  zone TEXT NOT NULL,
  is_available BOOLEAN DEFAULT TRUE,
  power_socket BOOLEAN DEFAULT TRUE,
  high_back_mesh_chair BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bookings & Hourly Passes Table
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_ref TEXT NOT NULL UNIQUE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  guest_name TEXT NOT NULL,
  guest_email TEXT NOT NULL,
  guest_phone TEXT,
  seat_id TEXT NOT NULL REFERENCES public.workstations(id),
  duration_type TEXT NOT NULL CHECK (duration_type IN ('hour', 'day', 'week', 'month', 'quarter', 'year')),
  hours_count INT DEFAULT 1,
  time_slot TEXT,
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'confirmed' CHECK (status IN ('hold', 'confirmed', 'in_session', 'completed', 'cancelled')),
  total_amount_inr NUMERIC(10, 2) NOT NULL,
  total_amount_paise BIGINT NOT NULL,
  currency TEXT DEFAULT 'INR',
  razorpay_order_id TEXT,
  razorpay_payment_id TEXT,
  biometric_synced BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Biometric Hardware Device Configuration
CREATE TABLE IF NOT EXISTS public.biometric_devices (
  id TEXT PRIMARY KEY,
  model TEXT NOT NULL,
  api_key TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  status TEXT DEFAULT 'connected',
  last_ping_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. Biometric Live Access / Punch Logs
CREATE TABLE IF NOT EXISTS public.biometric_punch_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  user_name TEXT NOT NULL,
  seat_id TEXT NOT NULL,
  punch_type TEXT NOT NULL CHECK (punch_type IN ('check_in', 'check_out', 'enroll_success', 'access_denied')),
  matched_score NUMERIC(5, 2) DEFAULT 99.00,
  terminal_gate TEXT NOT NULL DEFAULT 'Turnstile Gate 1',
  timestamp TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Seed Default Workstations (Desks 1 to 16)
INSERT INTO public.workstations (id, seat_number, name, zone, is_available)
VALUES
  ('seat-N01', 'N-01', 'North Pier 01', 'Main Study Hall', true),
  ('seat-N02', 'N-02', 'North Pier 02', 'Main Study Hall', true),
  ('seat-N03', 'N-03', 'North Pier 03', 'Main Study Hall', true),
  ('seat-N04', 'N-04', 'North Pier 04', 'Main Study Hall', true),
  ('seat-A01', 'A-01', 'Archival Alcove 01', 'Quiet Zone', true),
  ('seat-A02', 'A-02', 'Archival Alcove 02', 'Quiet Zone', true),
  ('seat-A03', 'A-03', 'Archival Alcove 03', 'Quiet Zone', true),
  ('seat-A04', 'A-04', 'Archival Alcove 04', 'Quiet Zone', true),
  ('seat-S01', 'S-01', 'South Mezzanine 01', 'Flexi-Zone', true),
  ('seat-S02', 'S-02', 'South Mezzanine 02', 'Flexi-Zone', true),
  ('seat-S03', 'S-03', 'South Mezzanine 03', 'Flexi-Zone', true),
  ('seat-S04', 'S-04', 'South Mezzanine 04', 'Flexi-Zone', true)
ON CONFLICT (id) DO NOTHING;

-- 9. Row-Level Security (RLS) Enablement
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workstations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_devices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.biometric_punch_logs ENABLE ROW LEVEL SECURITY;

-- 10. RLS Policies
-- Workstations: Publicly readable by all
CREATE POLICY "Workstations are readable by everyone" ON public.workstations FOR SELECT USING (true);

-- Bookings: Students view their own; Admins view all
CREATE POLICY "Users can view own bookings" ON public.bookings FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own bookings" ON public.bookings FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Profiles: Users view and update own profile
CREATE POLICY "Users view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
