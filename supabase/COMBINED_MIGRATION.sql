-- KING'S PAVILION -- FULL SYSTEM COMBINED MIGRATIONS
-- Run in Supabase SQL Editor.
-- All statements are safe, repeatable, and idempotent.

-- ================================================================
-- 20231101120000_create_tables.sql
-- ================================================================
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



-- ================================================================
-- 20231101121000_rls_policies.sql
-- ================================================================
-- 20231101121000_rls_policies.sql
-- Row Level Security policies for King's Pavilion Supabase backend
-- Enable RLS on all tables

-- ATTENDEES
ALTER TABLE public.attendees ENABLE ROW LEVEL SECURITY;

-- Only service role (server) can SELECT/INSERT/UPDATE/DELETE attendees.
-- Public (anon) role must have no permissions.
CREATE POLICY "service_role_full_access" ON public.attendees
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- VOLUNTEERS
ALTER TABLE public.volunteers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON public.volunteers
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- TESTIMONIES
ALTER TABLE public.testimonies ENABLE ROW LEVEL SECURITY;
-- Public can SELECT only published testimonies
CREATE POLICY "public_select_published" ON public.testimonies
  AS PERMISSIVE FOR SELECT TO anon USING (published = true);
-- Service role can manage testimonies
CREATE POLICY "service_role_full_access" ON public.testimonies
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- ADMIN_USERS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
-- Only service role can manage admin_users; admin auth will be via JWT claims.
CREATE POLICY "service_role_full_access" ON public.admin_users
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- QR_CHECKINS
ALTER TABLE public.qr_checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service_role_full_access" ON public.qr_checkins
  AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);

-- Ensure anon role cannot access any of the protected tables except published testimonies.
REVOKE ALL ON public.attendees FROM anon;
REVOKE ALL ON public.volunteers FROM anon;
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.qr_checkins FROM anon;

-- Service role must be created in Supabase and assigned to the server-side client.



-- ================================================================
-- 20231101132000_unique_attendee_constraints_repeatable.sql
-- ================================================================
-- 20231101132000_unique_attendee_constraints_repeatable.sql
-- Idempotent unique constraints for attendees table.
-- Uses DO block to check pg_constraint before adding; safe to run multiple times.
-- Never deletes existing records automatically.

DO $$
DECLARE
  v_email_dups  integer;
  v_phone_dups  integer;
BEGIN
  -- Count duplicate normalized_email values (excluding NULLs)
  SELECT COUNT(*) INTO v_email_dups
  FROM (
    SELECT normalized_email
    FROM public.attendees
    WHERE normalized_email IS NOT NULL
    GROUP BY normalized_email
    HAVING COUNT(*) > 1
  ) sub;

  -- Count duplicate normalized_phone values (excluding NULLs)
  SELECT COUNT(*) INTO v_phone_dups
  FROM (
    SELECT normalized_phone
    FROM public.attendees
    WHERE normalized_phone IS NOT NULL
    GROUP BY normalized_phone
    HAVING COUNT(*) > 1
  ) sub;

  -- Add unique constraint on normalized_email only if no duplicates exist and constraint is absent
  IF v_email_dups > 0 THEN
    RAISE NOTICE 'Skipping unique_normalized_email constraint: % duplicate normalized_email value(s) detected. Resolve duplicates manually before re-running.', v_email_dups;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'unique_normalized_email'
        AND conrelid = 'public.attendees'::regclass
    ) THEN
      ALTER TABLE public.attendees ADD CONSTRAINT unique_normalized_email UNIQUE (normalized_email);
      RAISE NOTICE 'Added constraint unique_normalized_email on attendees.';
    ELSE
      RAISE NOTICE 'Constraint unique_normalized_email already exists on attendees — skipped.';
    END IF;
  END IF;

  -- Add unique constraint on normalized_phone only if no duplicates exist and constraint is absent
  IF v_phone_dups > 0 THEN
    RAISE NOTICE 'Skipping unique_normalized_phone constraint: % duplicate normalized_phone value(s) detected. Resolve duplicates manually before re-running.', v_phone_dups;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'unique_normalized_phone'
        AND conrelid = 'public.attendees'::regclass
    ) THEN
      ALTER TABLE public.attendees ADD CONSTRAINT unique_normalized_phone UNIQUE (normalized_phone);
      RAISE NOTICE 'Added constraint unique_normalized_phone on attendees.';
    ELSE
      RAISE NOTICE 'Constraint unique_normalized_phone already exists on attendees — skipped.';
    END IF;
  END IF;
END $$;


-- ================================================================
-- 20231101133000_unique_volunteer_constraints_repeatable.sql
-- ================================================================
-- 20231101133000_unique_volunteer_constraints_repeatable.sql
-- Idempotent unique constraints for volunteers table.
-- Uses DO block to check pg_constraint before adding; safe to run multiple times.
-- Never deletes existing records automatically.

DO $$
DECLARE
  v_email_dups  integer;
  v_phone_dups  integer;
BEGIN
  -- Count duplicate email values (excluding NULLs)
  SELECT COUNT(*) INTO v_email_dups
  FROM (
    SELECT email
    FROM public.volunteers
    WHERE email IS NOT NULL
    GROUP BY email
    HAVING COUNT(*) > 1
  ) sub;

  -- Count duplicate phone values (excluding NULLs)
  SELECT COUNT(*) INTO v_phone_dups
  FROM (
    SELECT phone
    FROM public.volunteers
    WHERE phone IS NOT NULL
    GROUP BY phone
    HAVING COUNT(*) > 1
  ) sub;

  -- Add unique constraint on email only if no duplicates exist and constraint is absent
  IF v_email_dups > 0 THEN
    RAISE NOTICE 'Skipping unique_volunteer_email constraint: % duplicate email value(s) detected. Resolve duplicates manually before re-running.', v_email_dups;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'unique_volunteer_email'
        AND conrelid = 'public.volunteers'::regclass
    ) THEN
      ALTER TABLE public.volunteers ADD CONSTRAINT unique_volunteer_email UNIQUE (email);
      RAISE NOTICE 'Added constraint unique_volunteer_email on volunteers.';
    ELSE
      RAISE NOTICE 'Constraint unique_volunteer_email already exists on volunteers — skipped.';
    END IF;
  END IF;

  -- Add unique constraint on phone only if no duplicates exist and constraint is absent
  IF v_phone_dups > 0 THEN
    RAISE NOTICE 'Skipping unique_volunteer_phone constraint: % duplicate phone value(s) detected. Resolve duplicates manually before re-running.', v_phone_dups;
  ELSE
    IF NOT EXISTS (
      SELECT 1 FROM pg_constraint
      WHERE conname = 'unique_volunteer_phone'
        AND conrelid = 'public.volunteers'::regclass
    ) THEN
      ALTER TABLE public.volunteers ADD CONSTRAINT unique_volunteer_phone UNIQUE (phone);
      RAISE NOTICE 'Added constraint unique_volunteer_phone on volunteers.';
    ELSE
      RAISE NOTICE 'Constraint unique_volunteer_phone already exists on volunteers — skipped.';
    END IF;
  END IF;
END $$;


-- ================================================================
-- 20231101134000_rate_limits_table.sql
-- ================================================================
-- 20231101134000_rate_limits_table.sql
-- Table for simple IP‑based rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  endpoint text NOT NULL,
  request_count int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_ip_endpoint UNIQUE (ip, endpoint)
);

-- Index for quick look‑up
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits (ip, endpoint);



-- ================================================================
-- 20231101135000_rate_limit_function.sql
-- ================================================================
-- 20231101135000_rate_limit_function.sql
-- SECURITY DEFINER function for atomic IP-based rate limiting.
-- Callable via supabase RPC from the service-role server client.
-- Revokes direct table access from anon and authenticated roles.

-- Drop and recreate to make idempotent
DROP FUNCTION IF EXISTS public.increment_rate_limit(text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_ip         text,
  p_endpoint   text,
  p_limit      integer,
  p_window_sec integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count   integer;
  v_allowed boolean;
BEGIN
  -- Upsert: insert a new row or update an existing one atomically.
  -- On conflict (same ip + endpoint):
  --   if the current window has expired → reset window_start and set count to 1
  --   else                              → increment count
  INSERT INTO public.rate_limits (ip, endpoint, request_count, window_start)
  VALUES (p_ip, p_endpoint, 1, now())
  ON CONFLICT (ip, endpoint) DO UPDATE
    SET
      request_count = CASE
        WHEN (now() - rate_limits.window_start) > (p_window_sec || ' seconds')::interval
        THEN 1
        ELSE rate_limits.request_count + 1
      END,
      window_start = CASE
        WHEN (now() - rate_limits.window_start) > (p_window_sec || ' seconds')::interval
        THEN now()
        ELSE rate_limits.window_start
      END
  RETURNING request_count INTO v_count;

  v_allowed := v_count <= p_limit;
  RETURN v_allowed;
END;
$$;

-- Revoke direct table access from anon and authenticated roles.
-- Only the SECURITY DEFINER function (running as the owner) may touch the table.
REVOKE ALL ON public.rate_limits FROM anon;
REVOKE ALL ON public.rate_limits FROM authenticated;

-- Grant EXECUTE on the function to service_role so server-side RPC calls work.
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(text, text, integer, integer) TO service_role;



-- ================================================================
-- 20231101140000_attendees_qr_token_hash_repeatable.sql
-- ================================================================
-- 20231101140000_attendees_qr_token_hash_repeatable.sql
-- Repeatable and idempotent migration to ensure qr_token_hash exists on attendees table.
-- Safe to run on existing databases; never drops data or fails if column already exists.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'attendees'
      AND column_name = 'qr_token_hash'
  ) THEN
    ALTER TABLE public.attendees ADD COLUMN qr_token_hash text;
    RAISE NOTICE 'Added qr_token_hash column to public.attendees.';
  ELSE
    RAISE NOTICE 'Column qr_token_hash already exists on public.attendees — skipped.';
  END IF;
END $$;

-- Optional index for rapid lookup if needed
CREATE INDEX IF NOT EXISTS idx_attendees_qr_token_hash ON public.attendees (qr_token_hash);



-- ================================================================
-- 20231101150000_enhance_admin_users_repeatable.sql
-- ================================================================
-- 20231101150000_enhance_admin_users_repeatable.sql
-- Enhance public.admin_users table with full_name, is_active, and last_sign_in_at
-- Fully idempotent and safe to run multiple times.

DO $$
BEGIN
  -- Add full_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'full_name'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN full_name text;
    RAISE NOTICE 'Added full_name column to admin_users.';
  END IF;

  -- Add is_active if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    RAISE NOTICE 'Added is_active column to admin_users.';
  END IF;

  -- Add last_sign_in_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'last_sign_in_at'
  ) THEN
    ALTER TABLE public.admin_users ADD COLUMN last_sign_in_at timestamp with time zone;
    RAISE NOTICE 'Added last_sign_in_at column to admin_users.';
  END IF;

  -- Add role check constraint
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'check_admin_role'
  ) THEN
    ALTER TABLE public.admin_users 
      ADD CONSTRAINT check_admin_role CHECK (role IN ('main_admin', 'checkin_operator'));
    RAISE NOTICE 'Added check_admin_role constraint to admin_users.';
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_admin_users_is_active ON public.admin_users (is_active);


-- ================================================================
-- 20231101151000_enhance_qr_checkins_repeatable.sql
-- ================================================================
-- 20231101151000_enhance_qr_checkins_repeatable.sql
-- Enhance public.qr_checkins with operator accountability, duplicate protection, and indexes.
-- Fully idempotent and repeatable.

DO $$
BEGIN
  -- Add operator_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'operator_id'
  ) THEN
    ALTER TABLE public.qr_checkins 
      ADD COLUMN operator_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;
    RAISE NOTICE 'Added operator_id column to qr_checkins.';
  END IF;

  -- Add operator_email if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'operator_email'
  ) THEN
    ALTER TABLE public.qr_checkins ADD COLUMN operator_email text;
    RAISE NOTICE 'Added operator_email column to qr_checkins.';
  END IF;

  -- Enforce unique attendee check-in constraint at database level
  -- Prevents race condition double-scans from multiple devices simultaneously
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'unique_attendee_checkin'
  ) THEN
    -- Check if any existing duplicates exist before applying constraint
    IF EXISTS (
      SELECT 1 FROM public.qr_checkins
      GROUP BY attendee_id
      HAVING COUNT(*) > 1
    ) THEN
      RAISE NOTICE 'qr_checkins table has duplicate attendee_id records; resolve manually before adding constraint.';
    ELSE
      ALTER TABLE public.qr_checkins 
        ADD CONSTRAINT unique_attendee_checkin UNIQUE (attendee_id);
      RAISE NOTICE 'Added unique_attendee_checkin constraint to qr_checkins.';
    END IF;
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_qr_checkins_operator ON public.qr_checkins (operator_id);
CREATE INDEX IF NOT EXISTS idx_qr_checkins_scanned_at ON public.qr_checkins (scanned_at DESC);



