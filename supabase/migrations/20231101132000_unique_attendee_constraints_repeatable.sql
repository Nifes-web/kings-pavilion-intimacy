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
