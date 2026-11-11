-- 20231101120000_create_tables.sql
-- Supabase migrations: create core tables for King's Pavilion app

-- ================================
-- ATTENDEES
-- ================================
CREATE TABLE public.attendees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  normalized_email text NOT NULL,
  phone text NOT NULL,
  normalized_phone text NOT NULL,
  residential_address text NOT NULL,
  attendance_category text NOT NULL,
  first_time boolean NOT NULL,
  prayer_point text,
  expectation text,
  qr_token_hash text,
  checked_in_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_attendees_normalized_email ON public.attendees (normalized_email);
CREATE INDEX idx_attendees_normalized_phone ON public.attendees (normalized_phone);

-- ================================
-- VOLUNTEERS
-- ================================
CREATE TABLE public.volunteers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  reference text NOT NULL UNIQUE,
  full_name text NOT NULL,
  email text NOT NULL,
  phone text NOT NULL,
  residential_address text NOT NULL,
  experience text,
  availability text,
  department text NOT NULL,
  application_status text NOT NULL DEFAULT 'pending',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_volunteers_email ON public.volunteers (email);

-- ================================
-- TESTIMONIES
-- ================================
CREATE TABLE public.testimonies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  testifier_name text NOT NULL,
  content text NOT NULL,
  profile_image text,
  published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_testimonies_published ON public.testimonies (published);

-- ================================
-- ADMIN_USERS
-- ================================
CREATE TABLE public.admin_users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  auth_user_id uuid NOT NULL UNIQUE,
  email text NOT NULL UNIQUE,
  role text NOT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_admin_users_role ON public.admin_users (role);

-- ================================
-- QR_CHECKINS
-- ================================
CREATE TABLE public.qr_checkins (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  attendee_id uuid NOT NULL REFERENCES public.attendees(id) ON DELETE CASCADE,
  scanned_at timestamp with time zone NOT NULL DEFAULT now(),
  device_id text,
  sync_status text NOT NULL DEFAULT 'pending'
);

CREATE INDEX idx_qr_checkins_attendee_id ON public.qr_checkins (attendee_id);

