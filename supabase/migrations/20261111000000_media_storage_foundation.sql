-- ============================================================================
-- KING'S PAVILION INTIMACY PRAYER BOOTCAMP
-- MEDIA STORAGE AND ASSET MANAGEMENT FOUNDATION
-- Migration: 20261111000000_media_storage_foundation.sql
-- ============================================================================
-- NOTE: Prepared for execution ONLY with explicit Main Administrator approval.
-- Do NOT execute against production without authorization.
-- ============================================================================

DO $$
BEGIN
  -- 1. Ensure storage.buckets table exists before attempting configuration
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'buckets') THEN
    -- Create public 'media' bucket if not already present
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (
      'media',
      'media',
      true,
      52428800, -- 50MB
      ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4']
    )
    ON CONFLICT (id) DO UPDATE SET
      public = true,
      file_size_limit = 52428800,
      allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/svg+xml', 'video/mp4'];
  END IF;
END $$;

-- 2. Public Storage Access Policies (if storage schema exists)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'storage' AND table_name = 'objects') THEN
    -- Public read policy
    DROP POLICY IF EXISTS "Public Media Read Access" ON storage.objects;
    CREATE POLICY "Public Media Read Access"
      ON storage.objects FOR SELECT
      USING (bucket_id = 'media');

    -- Admin insert policy (service role or authenticated main admin)
    DROP POLICY IF EXISTS "Admin Media Upload Access" ON storage.objects;
    CREATE POLICY "Admin Media Upload Access"
      ON storage.objects FOR INSERT
      WITH CHECK (
        bucket_id = 'media'
        AND (
          auth.role() = 'service_role'
          OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE auth_user_id = auth.uid()
              AND role = 'main_admin'
              AND is_active = true
          )
        )
      );

    -- Admin delete policy
    DROP POLICY IF EXISTS "Admin Media Delete Access" ON storage.objects;
    CREATE POLICY "Admin Media Delete Access"
      ON storage.objects FOR DELETE
      USING (
        bucket_id = 'media'
        AND (
          auth.role() = 'service_role'
          OR EXISTS (
            SELECT 1 FROM public.admin_users
            WHERE auth_user_id = auth.uid()
              AND role = 'main_admin'
              AND is_active = true
          )
        )
      );
  END IF;
END $$;

-- 3. Dedicated public.media_assets Table
CREATE TABLE IF NOT EXISTS public.media_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  filename text NOT NULL,
  url text NOT NULL,
  type text NOT NULL,
  size integer NOT NULL,
  dimensions text,
  category text NOT NULL DEFAULT 'general' CHECK (category IN ('flyer', 'logo', 'portrait', 'section', 'banner', 'video', 'general')),
  alt_text text,
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Index for category searches
CREATE INDEX IF NOT EXISTS idx_media_assets_category ON public.media_assets(category);
CREATE INDEX IF NOT EXISTS idx_media_assets_created ON public.media_assets(created_at DESC);

-- Enable RLS
ALTER TABLE public.media_assets ENABLE ROW LEVEL SECURITY;

-- Public can view all media assets
DROP POLICY IF EXISTS "Public select media assets" ON public.media_assets;
CREATE POLICY "Public select media assets"
  ON public.media_assets FOR SELECT
  USING (true);

-- Only service role can modify media assets directly
DROP POLICY IF EXISTS "Service role manage media assets" ON public.media_assets;
CREATE POLICY "Service role manage media assets"
  ON public.media_assets FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

