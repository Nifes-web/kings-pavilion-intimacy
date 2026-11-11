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

