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

