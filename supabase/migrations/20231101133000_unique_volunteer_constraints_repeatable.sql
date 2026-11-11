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
