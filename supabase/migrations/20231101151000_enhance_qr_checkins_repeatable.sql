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

