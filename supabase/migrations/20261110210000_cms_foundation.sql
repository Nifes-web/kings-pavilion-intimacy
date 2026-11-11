-- Location: supabase/migrations/20261110210000_cms_foundation.sql
-- Description: King's Pavilion CMS Expansion - Phase 1 Foundation
-- Target: Supabase PostgreSQL (Execution Ready, Fully Audited)

BEGIN;

-- ============================================================================
-- 1. PREFLIGHT VERIFICATION
-- ============================================================================
DO $$
DECLARE
  v_col_count integer;
  v_constraint_count integer;
  v_policy_count integer;
BEGIN
  -- 1.1 Verify public.admin_users baseline schema integrity
  SELECT count(*) INTO v_col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'admin_users'
    AND (
      (column_name = 'id' AND data_type = 'uuid' AND is_nullable = 'NO') OR
      (column_name = 'auth_user_id' AND data_type = 'uuid' AND is_nullable = 'NO') OR
      (column_name = 'email' AND data_type = 'text' AND is_nullable = 'NO') OR
      (column_name = 'role' AND data_type = 'text' AND is_nullable = 'NO') OR
      (column_name = 'is_active' AND data_type = 'boolean' AND is_nullable = 'NO')
    );

  IF v_col_count IS DISTINCT FROM 5 THEN
    RAISE EXCEPTION 'Preflight Abort: public.admin_users missing expected columns or types';
  END IF;

  -- 1.2a Verify check_admin_role constraint exists on admin_users
  SELECT count(*) INTO v_constraint_count
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'admin_users'
    AND con.conname = 'check_admin_role'
    AND pg_get_constraintdef(con.oid) LIKE '%role%main_admin%checkin_operator%';

  IF v_constraint_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Preflight Abort: public.admin_users.check_admin_role constraint missing or unexpected';
  END IF;

  -- 1.2b Verify unique constraint exists on admin_users(auth_user_id)
  SELECT count(*) INTO v_constraint_count
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'admin_users'
    AND con.contype = 'u'
    AND pg_get_constraintdef(con.oid) LIKE '%auth_user_id%';

  IF v_constraint_count < 1 THEN
    RAISE EXCEPTION 'Preflight Abort: public.admin_users missing unique constraint on auth_user_id';
  END IF;

  -- 1.3 Verify public.testimonies baseline schema exists with all 7 original columns
  -- (id, slug, testifier_name, content, profile_image, published, created_at)
  SELECT count(*) INTO v_col_count
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name = 'testimonies'
    AND (
      (column_name = 'id' AND data_type = 'uuid' AND is_nullable = 'NO') OR
      (column_name = 'slug' AND data_type = 'text' AND is_nullable = 'NO') OR
      (column_name = 'testifier_name' AND data_type = 'text' AND is_nullable = 'NO') OR
      (column_name = 'content' AND data_type = 'text' AND is_nullable = 'NO') OR
      (column_name = 'profile_image' AND data_type = 'text') OR
      (column_name = 'published' AND data_type = 'boolean' AND is_nullable = 'NO') OR
      (column_name = 'created_at' AND data_type = 'timestamp with time zone' AND is_nullable = 'NO')
    );

  IF v_col_count IS DISTINCT FROM 7 THEN
    RAISE EXCEPTION 'Preflight Abort: public.testimonies baseline schema missing expected columns or types';
  END IF;

  -- 1.4 Verify baseline public select policy on testimonies exists
  SELECT count(*) INTO v_policy_count
  FROM pg_policies
  WHERE schemaname = 'public'
    AND tablename = 'testimonies'
    AND policyname = 'public_select_published';

  IF v_policy_count IS DISTINCT FROM 1 THEN
    RAISE EXCEPTION 'Preflight Abort: public.testimonies baseline RLS policy "public_select_published" not found';
  END IF;

  -- 1.5 Assert planned new columns on testimonies DO NOT already exist
  IF EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'testimonies' 
      AND column_name IN ('status', 'category', 'display_order', 'reviewed_by', 'reviewed_at', 'rejection_reason', 'updated_at')
  ) THEN
    RAISE EXCEPTION 'Preflight Abort: Target Phase 1 columns already exist on public.testimonies';
  END IF;

  -- 1.6 Assert target CMS tables DO NOT already exist
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_content') THEN
    RAISE EXCEPTION 'Preflight Abort: public.site_content already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ministers') THEN
    RAISE EXCEPTION 'Preflight Abort: public.ministers already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'faqs') THEN
    RAISE EXCEPTION 'Preflight Abort: public.faqs already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'announcements') THEN
    RAISE EXCEPTION 'Preflight Abort: public.announcements already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'site_settings') THEN
    RAISE EXCEPTION 'Preflight Abort: public.site_settings already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'content_audit_logs') THEN
    RAISE EXCEPTION 'Preflight Abort: public.content_audit_logs already exists';
  END IF;

  -- 1.7 Assert functions DO NOT already exist
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'mutate_content_with_audit') THEN
    RAISE EXCEPTION 'Preflight Abort: public.mutate_content_with_audit already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_prevent_audit_log_mutation') THEN
    RAISE EXCEPTION 'Preflight Abort: public.fn_prevent_audit_log_mutation already exists';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'fn_prevent_audit_log_truncate') THEN
    RAISE EXCEPTION 'Preflight Abort: public.fn_prevent_audit_log_truncate already exists';
  END IF;

  RAISE NOTICE 'Preflight validation completed successfully. Proceeding with CMS Foundation Migration.';
END $$;

-- ============================================================================
-- 2. NON-BREAKING ADDITIONS TO EXISTING TESTIMONIES TABLE
-- ============================================================================
ALTER TABLE public.testimonies
  ADD COLUMN status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  ADD COLUMN category text,
  ADD COLUMN display_order integer NOT NULL DEFAULT 0,
  ADD COLUMN reviewed_by uuid REFERENCES public.admin_users(id) ON DELETE SET NULL,
  ADD COLUMN reviewed_at timestamp with time zone,
  ADD COLUMN rejection_reason text,
  ADD COLUMN updated_at timestamp with time zone NOT NULL DEFAULT now();

CREATE INDEX idx_testimonies_status_order 
  ON public.testimonies(status, display_order);

-- Sync existing published testimonies into status = 'published'
UPDATE public.testimonies 
SET status = 'published' 
WHERE published = true;

-- ============================================================================
-- 3. CREATE NEW CMS CONTENT TABLES
-- ============================================================================

-- A. site_content
CREATE TABLE public.site_content (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text NOT NULL UNIQUE,
  title text NOT NULL,
  subtitle text,
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  version integer NOT NULL DEFAULT 1,
  published_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_content_section_status 
  ON public.site_content(section_key, status);

-- B. ministers
CREATE TABLE public.ministers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  role_title text,
  category text NOT NULL DEFAULT 'Minister',
  biography text,
  photo_url text,
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_ministers_order_published 
  ON public.ministers(display_order) 
  WHERE is_published = true;

-- C. faqs
CREATE TABLE public.faqs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  question text NOT NULL,
  answer text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  display_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_faqs_category_order 
  ON public.faqs(category, display_order) 
  WHERE is_published = true;

-- D. announcements
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL,
  content text NOT NULL,
  priority text NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  is_active boolean NOT NULL DEFAULT false,
  start_date timestamp with time zone NOT NULL DEFAULT now(),
  end_date timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_announcements_active_dates 
  ON public.announcements(is_active, start_date, end_date);

-- E. site_settings
CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  is_public boolean NOT NULL DEFAULT false,
  description text,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_site_settings_public 
  ON public.site_settings(key) 
  WHERE is_public = true;

-- ============================================================================
-- 4. APPEND-ONLY CONTENT AUDIT LOG TABLE & IMMUTABILITY GUARDS
-- ============================================================================
CREATE TABLE public.content_audit_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text NOT NULL,
  record_id uuid,
  action text NOT NULL CHECK (action IN ('create', 'update', 'delete', 'publish', 'archive', 'reject')),
  changed_by uuid NOT NULL REFERENCES public.admin_users(id),
  admin_email text NOT NULL,
  admin_role text NOT NULL,
  ip_address text,
  user_agent text,
  old_data jsonb,
  new_data jsonb,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX idx_content_audit_table_record 
  ON public.content_audit_logs(table_name, record_id);
CREATE INDEX idx_content_audit_changed_by 
  ON public.content_audit_logs(changed_by);
CREATE INDEX idx_content_audit_created_at 
  ON public.content_audit_logs(created_at DESC);

-- Trigger function: Prevent UPDATE or DELETE on audit logs
CREATE OR REPLACE FUNCTION public.fn_prevent_audit_log_mutation()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'content_audit_logs is append-only: % is strictly prohibited', TG_OP;
END;
$$;

CREATE TRIGGER trg_protect_audit_logs_mutation
  BEFORE UPDATE OR DELETE ON public.content_audit_logs
  FOR EACH ROW
  EXECUTE FUNCTION public.fn_prevent_audit_log_mutation();

-- Trigger function: Prevent TRUNCATE on audit logs
CREATE OR REPLACE FUNCTION public.fn_prevent_audit_log_truncate()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'content_audit_logs is append-only: TRUNCATE is strictly prohibited';
END;
$$;

CREATE TRIGGER trg_protect_audit_logs_truncate
  BEFORE TRUNCATE ON public.content_audit_logs
  FOR EACH STATEMENT
  EXECUTE FUNCTION public.fn_prevent_audit_log_truncate();

-- ============================================================================
-- 5. PERMISSIONS, ROW LEVEL SECURITY & PUBLIC READ POLICIES
-- ============================================================================
ALTER TABLE public.site_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ministers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_audit_logs ENABLE ROW LEVEL SECURITY;

-- Explicit Minimum Table Privileges for Public Content (SELECT only)
GRANT SELECT ON TABLE public.site_content TO anon, authenticated;
GRANT SELECT ON TABLE public.ministers TO anon, authenticated;
GRANT SELECT ON TABLE public.faqs TO anon, authenticated;
GRANT SELECT ON TABLE public.announcements TO anon, authenticated;
GRANT SELECT ON TABLE public.site_settings TO anon, authenticated;

-- Hardened Content Audit Logs Privileges:
-- Completely revoked from public roles.
-- Direct INSERT, UPDATE, DELETE, TRUNCATE are revoked from application roles.
-- Only the trusted SECURITY DEFINER RPC (running with owner privileges) can INSERT.
REVOKE ALL ON TABLE public.content_audit_logs FROM PUBLIC;
REVOKE ALL ON TABLE public.content_audit_logs FROM anon;
REVOKE ALL ON TABLE public.content_audit_logs FROM authenticated;
REVOKE INSERT, UPDATE, DELETE, TRUNCATE ON TABLE public.content_audit_logs FROM service_role;
GRANT SELECT ON TABLE public.content_audit_logs TO service_role;

-- Public Read Policies (Drafts and private settings remain strictly invisible)
CREATE POLICY "public_read_published_site_content" 
  ON public.site_content FOR SELECT 
  TO public 
  USING (status = 'published');

CREATE POLICY "public_read_published_ministers" 
  ON public.ministers FOR SELECT 
  TO public 
  USING (is_published = true);

CREATE POLICY "public_read_published_faqs" 
  ON public.faqs FOR SELECT 
  TO public 
  USING (is_published = true);

CREATE POLICY "public_read_active_announcements" 
  ON public.announcements FOR SELECT 
  TO public 
  USING (is_active = true AND now() >= start_date AND (end_date IS NULL OR now() <= end_date));

CREATE POLICY "public_read_site_settings" 
  ON public.site_settings FOR SELECT 
  TO public 
  USING (is_public = true);

CREATE POLICY "service_role_select_content_audit_logs"
  ON public.content_audit_logs FOR SELECT
  TO service_role
  USING (true);

-- ============================================================================
-- 6. AUDITED CONTENT MUTATION RPC
-- ============================================================================
CREATE OR REPLACE FUNCTION public.mutate_content_with_audit(
  p_auth_user_id uuid,
  p_admin_email text,
  p_table_name text,
  p_action text,
  p_record_id uuid DEFAULT NULL,
  p_payload jsonb DEFAULT '{}'::jsonb,
  p_ip_address text DEFAULT NULL,
  p_user_agent text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = pg_catalog, public, pg_temp
AS $$
DECLARE
  v_db_admin_id uuid;
  v_db_email text;
  v_db_role text;
  v_db_is_active boolean;
  v_old_data jsonb := NULL;
  v_new_data jsonb := NULL;
  v_existing_status text;
  v_existing_published boolean;
  v_existing_active boolean;
  v_rows_affected integer := 0;
  v_field_key text;
  v_field_allowed boolean;
BEGIN
  -- 1. Explicitly reject NULL or empty entity names and actions
  IF p_table_name IS NULL OR btrim(p_table_name) = '' THEN
    RAISE EXCEPTION 'Entity name cannot be null or empty';
  END IF;

  IF p_action IS NULL OR btrim(p_action) = '' THEN
    RAISE EXCEPTION 'Action cannot be null or empty';
  END IF;

  -- 2. Reject NULL auth_user_id
  IF p_auth_user_id IS NULL THEN
    RAISE EXCEPTION 'Authenticated user ID cannot be null';
  END IF;

  -- 3. Validate Table Whitelist
  IF p_table_name NOT IN ('site_content', 'ministers', 'faqs', 'announcements', 'site_settings', 'testimonies') THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- 4. Validate Action Whitelist
  IF p_action NOT IN ('create', 'update', 'delete', 'publish', 'archive', 'reject') THEN
    RAISE EXCEPTION 'Invalid action: %', p_action;
  END IF;

  -- 5. Validate Supported Entity/Action Combinations
  IF p_table_name = 'site_settings' AND p_action IN ('publish', 'archive', 'reject') THEN
    RAISE EXCEPTION 'Action % is not supported for entity %', p_action, p_table_name;
  END IF;

  IF p_action = 'reject' AND p_table_name != 'testimonies' THEN
    RAISE EXCEPTION 'Action reject is only applicable to testimonies';
  END IF;

  -- 6. Record UUID Validation:
  -- Create must NOT supply a record ID (prevents accidental ID collisions)
  -- Non-create operations (update, delete, publish, archive, reject) MUST supply a valid record UUID
  IF p_action = 'create' AND p_record_id IS NOT NULL THEN
    RAISE EXCEPTION 'Create action must not supply a record ID';
  END IF;

  IF p_action IN ('update', 'delete', 'publish', 'archive', 'reject') AND p_record_id IS NULL THEN
    RAISE EXCEPTION 'Action % requires a valid record UUID', p_action;
  END IF;

  -- 7. Authoritative Administrator Verification via admin_users.auth_user_id
  SELECT au.id, au.email, au.role, au.is_active 
  INTO v_db_admin_id, v_db_email, v_db_role, v_db_is_active
  FROM public.admin_users au
  WHERE au.auth_user_id = p_auth_user_id;

  IF v_db_admin_id IS NULL THEN
    RAISE EXCEPTION 'Administrator identity not found for auth_user_id: %', p_auth_user_id;
  END IF;

  IF v_db_is_active IS NOT TRUE THEN
    RAISE EXCEPTION 'Administrator account is deactivated: %', v_db_email;
  END IF;

  IF p_admin_email IS NOT NULL AND LOWER(v_db_email) != LOWER(p_admin_email) THEN
    RAISE EXCEPTION 'Mismatched administrator email: expected %, got %', v_db_email, p_admin_email;
  END IF;

  -- Option 1 Role Enforcement: Only main_admin can mutate CMS in Phase 1
  IF v_db_role != 'main_admin' THEN
    RAISE EXCEPTION 'Role % is not authorized for CMS mutations in Phase 1', v_db_role;
  END IF;

  -- 8. Row-level Lock & Verification for Existing Record
  IF p_record_id IS NOT NULL THEN
    IF p_table_name = 'site_content' THEN
      SELECT to_jsonb(t.*), t.status INTO v_old_data, v_existing_status
      FROM public.site_content t WHERE t.id = p_record_id FOR UPDATE;
    ELSIF p_table_name = 'ministers' THEN
      SELECT to_jsonb(t.*), t.is_published INTO v_old_data, v_existing_published
      FROM public.ministers t WHERE t.id = p_record_id FOR UPDATE;
    ELSIF p_table_name = 'faqs' THEN
      SELECT to_jsonb(t.*), t.is_published INTO v_old_data, v_existing_published
      FROM public.faqs t WHERE t.id = p_record_id FOR UPDATE;
    ELSIF p_table_name = 'announcements' THEN
      SELECT to_jsonb(t.*), t.is_active INTO v_old_data, v_existing_active
      FROM public.announcements t WHERE t.id = p_record_id FOR UPDATE;
    ELSIF p_table_name = 'site_settings' THEN
      SELECT to_jsonb(t.*) INTO v_old_data
      FROM public.site_settings t WHERE t.id = p_record_id FOR UPDATE;
    ELSIF p_table_name = 'testimonies' THEN
      SELECT to_jsonb(t.*), t.status, t.published INTO v_old_data, v_existing_status, v_existing_published
      FROM public.testimonies t WHERE t.id = p_record_id FOR UPDATE;
    END IF;

    -- Strict check: Record must exist for update, delete, publish, archive, reject
    IF v_old_data IS NULL THEN
      RAISE EXCEPTION 'Target record % in table % not found', p_record_id, p_table_name;
    END IF;
  END IF;

  -- 9. Field Allowlist Validation Inside RPC
  IF p_payload IS NOT NULL AND jsonb_typeof(p_payload) = 'object' AND p_action IN ('create', 'update') THEN
    FOR v_field_key IN SELECT jsonb_object_keys(p_payload) LOOP
      v_field_allowed := false;
      IF p_table_name = 'site_content' AND v_field_key IN ('section_key', 'title', 'subtitle', 'content') THEN
        v_field_allowed := true;
      ELSIF p_table_name = 'ministers' AND v_field_key IN ('slug', 'name', 'role_title', 'category', 'biography', 'photo_url', 'display_order') THEN
        v_field_allowed := true;
      ELSIF p_table_name = 'faqs' AND v_field_key IN ('slug', 'question', 'answer', 'category', 'display_order') THEN
        v_field_allowed := true;
      ELSIF p_table_name = 'announcements' AND v_field_key IN ('slug', 'title', 'content', 'priority', 'start_date', 'end_date') THEN
        v_field_allowed := true;
      ELSIF p_table_name = 'site_settings' AND v_field_key IN ('key', 'value', 'is_public', 'description') THEN
        v_field_allowed := true;
      ELSIF p_table_name = 'testimonies' AND v_field_key IN ('slug', 'testifier_name', 'content', 'profile_image', 'category', 'display_order') THEN
        v_field_allowed := true;
      END IF;

      IF NOT v_field_allowed THEN
        RAISE EXCEPTION 'Unsupported payload field % for entity %', v_field_key, p_table_name;
      END IF;
    END LOOP;
  END IF;

  -- 10. Required Fields and Data Types Validation
  IF p_action = 'create' THEN
    IF p_table_name = 'site_content' THEN
      IF p_payload->>'section_key' IS NULL OR btrim(p_payload->>'section_key') = '' THEN
        RAISE EXCEPTION 'Required field section_key is missing or empty';
      END IF;
      IF p_payload->>'title' IS NULL OR btrim(p_payload->>'title') = '' THEN
        RAISE EXCEPTION 'Required field title is missing or empty';
      END IF;
      IF p_payload ? 'content' AND jsonb_typeof(p_payload->'content') != 'object' THEN
        RAISE EXCEPTION 'Field content must be a JSON object';
      END IF;

    ELSIF p_table_name = 'ministers' THEN
      IF p_payload->>'slug' IS NULL OR btrim(p_payload->>'slug') = '' THEN
        RAISE EXCEPTION 'Required field slug is missing or empty';
      END IF;
      IF p_payload->>'name' IS NULL OR btrim(p_payload->>'name') = '' THEN
        RAISE EXCEPTION 'Required field name is missing or empty';
      END IF;
      IF p_payload ? 'display_order' AND (p_payload->>'display_order') !~ '^-?[0-9]+$' THEN
        RAISE EXCEPTION 'Field display_order must be a valid integer';
      END IF;

    ELSIF p_table_name = 'faqs' THEN
      IF p_payload->>'slug' IS NULL OR btrim(p_payload->>'slug') = '' THEN
        RAISE EXCEPTION 'Required field slug is missing or empty';
      END IF;
      IF p_payload->>'question' IS NULL OR btrim(p_payload->>'question') = '' THEN
        RAISE EXCEPTION 'Required field question is missing or empty';
      END IF;
      IF p_payload->>'answer' IS NULL OR btrim(p_payload->>'answer') = '' THEN
        RAISE EXCEPTION 'Required field answer is missing or empty';
      END IF;
      IF p_payload ? 'display_order' AND (p_payload->>'display_order') !~ '^-?[0-9]+$' THEN
        RAISE EXCEPTION 'Field display_order must be a valid integer';
      END IF;

    ELSIF p_table_name = 'announcements' THEN
      IF p_payload->>'slug' IS NULL OR btrim(p_payload->>'slug') = '' THEN
        RAISE EXCEPTION 'Required field slug is missing or empty';
      END IF;
      IF p_payload->>'title' IS NULL OR btrim(p_payload->>'title') = '' THEN
        RAISE EXCEPTION 'Required field title is missing or empty';
      END IF;
      IF p_payload->>'content' IS NULL OR btrim(p_payload->>'content') = '' THEN
        RAISE EXCEPTION 'Required field content is missing or empty';
      END IF;
      IF p_payload ? 'priority' AND p_payload->>'priority' NOT IN ('low', 'normal', 'high', 'urgent') THEN
        RAISE EXCEPTION 'Invalid priority: %', p_payload->>'priority';
      END IF;

    ELSIF p_table_name = 'site_settings' THEN
      IF p_payload->>'key' IS NULL OR btrim(p_payload->>'key') = '' THEN
        RAISE EXCEPTION 'Required field key is missing or empty';
      END IF;
      IF p_payload ? 'is_public' AND (p_payload->>'is_public') NOT IN ('true', 'false') THEN
        RAISE EXCEPTION 'Field is_public must be a boolean';
      END IF;

    ELSIF p_table_name = 'testimonies' THEN
      IF p_payload->>'slug' IS NULL OR btrim(p_payload->>'slug') = '' THEN
        RAISE EXCEPTION 'Required field slug is missing or empty';
      END IF;
      IF p_payload->>'testifier_name' IS NULL OR btrim(p_payload->>'testifier_name') = '' THEN
        RAISE EXCEPTION 'Required field testifier_name is missing or empty';
      END IF;
      IF p_payload->>'content' IS NULL OR btrim(p_payload->>'content') = '' THEN
        RAISE EXCEPTION 'Required field content is missing or empty';
      END IF;
      IF p_payload ? 'display_order' AND (p_payload->>'display_order') !~ '^-?[0-9]+$' THEN
        RAISE EXCEPTION 'Field display_order must be a valid integer';
      END IF;
    END IF;

  ELSIF p_action = 'update' THEN
    -- site_content.content must be a JSON object; other entities use text content
    IF p_table_name = 'site_content' AND p_payload ? 'content' AND jsonb_typeof(p_payload->'content') != 'object' THEN
      RAISE EXCEPTION 'Field content must be a JSON object';
    END IF;
    IF p_payload ? 'display_order' AND (p_payload->>'display_order') !~ '^-?[0-9]+$' THEN
      RAISE EXCEPTION 'Field display_order must be a valid integer';
    END IF;
    IF p_payload ? 'priority' AND p_payload->>'priority' NOT IN ('low', 'normal', 'high', 'urgent') THEN
      RAISE EXCEPTION 'Invalid priority: %', p_payload->>'priority';
    END IF;
    IF p_payload ? 'is_public' AND (p_payload->>'is_public') NOT IN ('true', 'false') THEN
      RAISE EXCEPTION 'Field is_public must be a boolean';
    END IF;

  ELSIF p_action = 'reject' THEN
    IF p_payload->>'rejection_reason' IS NULL OR btrim(p_payload->>'rejection_reason') = '' THEN
      RAISE EXCEPTION 'Reject action requires a non-empty rejection_reason';
    END IF;
  END IF;

  -- 11. Execute Mutation Block
  IF p_action = 'create' THEN
    IF p_table_name = 'site_content' THEN
      INSERT INTO public.site_content (section_key, title, subtitle, content, status, version)
      VALUES (
        p_payload->>'section_key',
        p_payload->>'title',
        p_payload->>'subtitle',
        COALESCE(p_payload->'content', '{}'::jsonb),
        'draft',
        1
      ) RETURNING to_jsonb(site_content.*) INTO v_new_data;

    ELSIF p_table_name = 'ministers' THEN
      INSERT INTO public.ministers (slug, name, role_title, category, biography, photo_url, display_order, is_published)
      VALUES (
        p_payload->>'slug',
        p_payload->>'name',
        p_payload->>'role_title',
        COALESCE(p_payload->>'category', 'Minister'),
        p_payload->>'biography',
        p_payload->>'photo_url',
        COALESCE((p_payload->>'display_order')::integer, 0),
        false
      ) RETURNING to_jsonb(ministers.*) INTO v_new_data;

    ELSIF p_table_name = 'faqs' THEN
      INSERT INTO public.faqs (slug, question, answer, category, display_order, is_published)
      VALUES (
        p_payload->>'slug',
        p_payload->>'question',
        p_payload->>'answer',
        COALESCE(p_payload->>'category', 'general'),
        COALESCE((p_payload->>'display_order')::integer, 0),
        false
      ) RETURNING to_jsonb(faqs.*) INTO v_new_data;

    ELSIF p_table_name = 'announcements' THEN
      INSERT INTO public.announcements (slug, title, content, priority, is_active, start_date, end_date)
      VALUES (
        p_payload->>'slug',
        p_payload->>'title',
        p_payload->>'content',
        COALESCE(p_payload->>'priority', 'normal'),
        false,
        COALESCE((p_payload->>'start_date')::timestamptz, now()),
        (p_payload->>'end_date')::timestamptz
      ) RETURNING to_jsonb(announcements.*) INTO v_new_data;

    ELSIF p_table_name = 'site_settings' THEN
      INSERT INTO public.site_settings (key, value, is_public, description)
      VALUES (
        p_payload->>'key',
        COALESCE(p_payload->'value', '{}'::jsonb),
        COALESCE((p_payload->>'is_public')::boolean, false),
        p_payload->>'description'
      ) RETURNING to_jsonb(site_settings.*) INTO v_new_data;

    ELSIF p_table_name = 'testimonies' THEN
      INSERT INTO public.testimonies (slug, testifier_name, content, profile_image, published, status, category, display_order)
      VALUES (
        p_payload->>'slug',
        p_payload->>'testifier_name',
        p_payload->>'content',
        p_payload->>'profile_image',
        false,
        'draft',
        p_payload->>'category',
        COALESCE((p_payload->>'display_order')::integer, 0)
      ) RETURNING to_jsonb(testimonies.*) INTO v_new_data;
    END IF;

  ELSIF p_action = 'update' THEN
    IF (p_payload ? 'status') OR (p_payload ? 'is_published') OR (p_payload ? 'published') OR (p_payload ? 'is_active') THEN
      RAISE EXCEPTION 'State transitions require explicit action (publish, archive, reject), not update payload';
    END IF;

    IF p_table_name = 'site_content' THEN
      UPDATE public.site_content SET
        section_key = COALESCE(NULLIF(btrim(p_payload->>'section_key'), ''), section_key),
        title = COALESCE(NULLIF(btrim(p_payload->>'title'), ''), title),
        subtitle = CASE WHEN p_payload ? 'subtitle' THEN p_payload->>'subtitle' ELSE subtitle END,
        content = CASE WHEN p_payload ? 'content' THEN p_payload->'content' ELSE content END,
        version = version + 1,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(site_content.*) INTO v_new_data;

    ELSIF p_table_name = 'ministers' THEN
      UPDATE public.ministers SET
        slug = COALESCE(NULLIF(btrim(p_payload->>'slug'), ''), slug),
        name = COALESCE(NULLIF(btrim(p_payload->>'name'), ''), name),
        role_title = CASE WHEN p_payload ? 'role_title' THEN p_payload->>'role_title' ELSE role_title END,
        category = COALESCE(p_payload->>'category', category),
        biography = CASE WHEN p_payload ? 'biography' THEN p_payload->>'biography' ELSE biography END,
        photo_url = CASE WHEN p_payload ? 'photo_url' THEN p_payload->>'photo_url' ELSE photo_url END,
        display_order = COALESCE((p_payload->>'display_order')::integer, display_order),
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(ministers.*) INTO v_new_data;

    ELSIF p_table_name = 'faqs' THEN
      UPDATE public.faqs SET
        slug = COALESCE(NULLIF(btrim(p_payload->>'slug'), ''), slug),
        question = COALESCE(NULLIF(btrim(p_payload->>'question'), ''), question),
        answer = COALESCE(NULLIF(btrim(p_payload->>'answer'), ''), answer),
        category = COALESCE(p_payload->>'category', category),
        display_order = COALESCE((p_payload->>'display_order')::integer, display_order),
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(faqs.*) INTO v_new_data;

    ELSIF p_table_name = 'announcements' THEN
      UPDATE public.announcements SET
        slug = COALESCE(NULLIF(btrim(p_payload->>'slug'), ''), slug),
        title = COALESCE(NULLIF(btrim(p_payload->>'title'), ''), title),
        content = COALESCE(NULLIF(btrim(p_payload->>'content'), ''), content),
        priority = COALESCE(p_payload->>'priority', priority),
        start_date = COALESCE((p_payload->>'start_date')::timestamptz, start_date),
        end_date = CASE WHEN p_payload ? 'end_date' THEN (p_payload->>'end_date')::timestamptz ELSE end_date END,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(announcements.*) INTO v_new_data;

    ELSIF p_table_name = 'site_settings' THEN
      UPDATE public.site_settings SET
        key = COALESCE(NULLIF(btrim(p_payload->>'key'), ''), key),
        value = COALESCE(p_payload->'value', value),
        is_public = COALESCE((p_payload->>'is_public')::boolean, is_public),
        description = CASE WHEN p_payload ? 'description' THEN p_payload->>'description' ELSE description END,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(site_settings.*) INTO v_new_data;

    ELSIF p_table_name = 'testimonies' THEN
      UPDATE public.testimonies SET
        slug = COALESCE(NULLIF(btrim(p_payload->>'slug'), ''), slug),
        testifier_name = COALESCE(NULLIF(btrim(p_payload->>'testifier_name'), ''), testifier_name),
        content = COALESCE(NULLIF(btrim(p_payload->>'content'), ''), content),
        profile_image = CASE WHEN p_payload ? 'profile_image' THEN p_payload->>'profile_image' ELSE profile_image END,
        category = CASE WHEN p_payload ? 'category' THEN p_payload->>'category' ELSE category END,
        display_order = COALESCE((p_payload->>'display_order')::integer, display_order),
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(testimonies.*) INTO v_new_data;
    END IF;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected = 0 THEN
      RAISE EXCEPTION 'Update affected zero rows in table % for id %', p_table_name, p_record_id;
    END IF;

  ELSIF p_action = 'publish' THEN
    IF p_table_name = 'site_content' THEN
      IF v_existing_status = 'published' THEN
        RAISE EXCEPTION 'Record is already published';
      END IF;
      UPDATE public.site_content SET
        status = 'published',
        published_at = now(),
        version = version + 1,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(site_content.*) INTO v_new_data;

    ELSIF p_table_name = 'ministers' THEN
      IF v_existing_published IS TRUE THEN
        RAISE EXCEPTION 'Minister is already published';
      END IF;
      UPDATE public.ministers SET
        is_published = true,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(ministers.*) INTO v_new_data;

    ELSIF p_table_name = 'faqs' THEN
      IF v_existing_published IS TRUE THEN
        RAISE EXCEPTION 'FAQ is already published';
      END IF;
      UPDATE public.faqs SET
        is_published = true,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(faqs.*) INTO v_new_data;

    ELSIF p_table_name = 'announcements' THEN
      IF v_existing_active IS TRUE THEN
        RAISE EXCEPTION 'Announcement is already active';
      END IF;
      UPDATE public.announcements SET
        is_active = true,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(announcements.*) INTO v_new_data;

    ELSIF p_table_name = 'testimonies' THEN
      IF v_existing_status = 'published' OR v_existing_published IS TRUE THEN
        RAISE EXCEPTION 'Testimony is already published';
      END IF;
      UPDATE public.testimonies SET
        status = 'published',
        published = true,
        reviewed_by = v_db_admin_id,
        reviewed_at = now(),
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(testimonies.*) INTO v_new_data;
    END IF;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected = 0 THEN
      RAISE EXCEPTION 'Publish affected zero rows in table % for id %', p_table_name, p_record_id;
    END IF;

  ELSIF p_action = 'archive' THEN
    IF p_table_name = 'site_content' THEN
      UPDATE public.site_content SET
        status = 'archived',
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(site_content.*) INTO v_new_data;

    ELSIF p_table_name = 'ministers' THEN
      UPDATE public.ministers SET
        is_published = false,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(ministers.*) INTO v_new_data;

    ELSIF p_table_name = 'faqs' THEN
      UPDATE public.faqs SET
        is_published = false,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(faqs.*) INTO v_new_data;

    ELSIF p_table_name = 'announcements' THEN
      UPDATE public.announcements SET
        is_active = false,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(announcements.*) INTO v_new_data;

    ELSIF p_table_name = 'testimonies' THEN
      UPDATE public.testimonies SET
        status = 'archived',
        published = false,
        updated_at = now()
      WHERE id = p_record_id
      RETURNING to_jsonb(testimonies.*) INTO v_new_data;
    END IF;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected = 0 THEN
      RAISE EXCEPTION 'Archive affected zero rows in table % for id %', p_table_name, p_record_id;
    END IF;

  ELSIF p_action = 'reject' THEN
    UPDATE public.testimonies SET
      status = 'archived',
      published = false,
      reviewed_by = v_db_admin_id,
      reviewed_at = now(),
      rejection_reason = p_payload->>'rejection_reason',
      updated_at = now()
    WHERE id = p_record_id
    RETURNING to_jsonb(testimonies.*) INTO v_new_data;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected = 0 THEN
      RAISE EXCEPTION 'Reject affected zero rows in table % for id %', p_table_name, p_record_id;
    END IF;

  ELSIF p_action = 'delete' THEN
    IF p_table_name = 'site_content' THEN
      DELETE FROM public.site_content WHERE id = p_record_id;
    ELSIF p_table_name = 'ministers' THEN
      DELETE FROM public.ministers WHERE id = p_record_id;
    ELSIF p_table_name = 'faqs' THEN
      DELETE FROM public.faqs WHERE id = p_record_id;
    ELSIF p_table_name = 'announcements' THEN
      DELETE FROM public.announcements WHERE id = p_record_id;
    ELSIF p_table_name = 'site_settings' THEN
      DELETE FROM public.site_settings WHERE id = p_record_id;
    ELSIF p_table_name = 'testimonies' THEN
      DELETE FROM public.testimonies WHERE id = p_record_id;
    END IF;

    GET DIAGNOSTICS v_rows_affected = ROW_COUNT;
    IF v_rows_affected = 0 THEN
      RAISE EXCEPTION 'Delete affected zero rows in table % for id %', p_table_name, p_record_id;
    END IF;

    v_new_data := jsonb_build_object('deleted_id', p_record_id);
  END IF;

  -- 12. Atomic Audit Log Insertion
  INSERT INTO public.content_audit_logs (
    table_name,
    record_id,
    action,
    changed_by,
    admin_email,
    admin_role,
    ip_address,
    user_agent,
    old_data,
    new_data
  ) VALUES (
    p_table_name,
    COALESCE(p_record_id, (v_new_data->>'id')::uuid),
    p_action,
    v_db_admin_id,
    v_db_email,
    v_db_role,
    p_ip_address,
    p_user_agent,
    v_old_data,
    v_new_data
  );

  RETURN jsonb_build_object(
    'success', true,
    'action', p_action,
    'table', p_table_name,
    'record', v_new_data
  );
END;
$$;

-- 13. Hardened Permissions for mutate_content_with_audit
REVOKE ALL ON FUNCTION public.mutate_content_with_audit(uuid, text, text, text, uuid, jsonb, text, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.mutate_content_with_audit(uuid, text, text, text, uuid, jsonb, text, text) FROM anon;
REVOKE ALL ON FUNCTION public.mutate_content_with_audit(uuid, text, text, text, uuid, jsonb, text, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.mutate_content_with_audit(uuid, text, text, text, uuid, jsonb, text, text) TO service_role;

COMMIT;
