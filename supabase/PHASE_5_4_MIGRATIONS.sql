-- ================================================================
-- KING'S PAVILION INTIMACY PRAYER BOOTCAMP
-- PHASE 5.4 — ENHANCED DATABASE MIGRATION SCRIPT (RIGOROUS VERIFICATION)
-- ================================================================
-- Target Database : Supabase PostgreSQL (Public Schema)
-- Execution       : Supabase Dashboard → SQL Editor → New Query (Run as single script)
-- Safety          : Fully repeatable and idempotent.
--                   Preserves ALL existing data — NO DELETE, UPDATE,
--                   or MERGE on any table.
--                   Does NOT create any administrator accounts.
-- Role Testing    : Effective privilege verification evaluates actual
--                   database roles (anon, authenticated, service_role).
--                   Testing these roles automatically incorporates all
--                   grants made to the special pseudo-role PUBLIC.
--
-- EXECUTION METHOD & TRANSACTION BOUNDARY DOCUMENTATION:
-- - This script is enclosed within an explicit BEGIN; ... COMMIT; block.
-- - In PostgreSQL, all DDL operations in this script (ALTER TABLE,
--   CREATE INDEX, CREATE POLICY, REVOKE) are fully transactional.
-- - If an audit assertion fails, duplicate data is found, or an unhandled
--   anomaly is detected, a RAISE EXCEPTION is thrown, which prompts
--   PostgreSQL to roll back the entire transaction.
-- - TRANSACTION BOUNDARY & CONNECTION LIFECYCLE:
--   An uncommitted transaction is automatically rolled back by PostgreSQL
--   if its database connection terminates or closes unexpectedly before
--   COMMIT is executed.
--   Conversely, once COMMIT successfully finishes, all changes made within
--   that transaction remain permanently committed.
-- - MANDATORY EXECUTION REQUIREMENT:
--   The entire migration MUST be executed as a single, unbroken query batch
--   (one single transaction) in the Supabase Dashboard SQL Editor.
--   Do not highlight or execute individual statements or sections separately.
--   Executing partial snippets violates atomic guarantees and can leave the
--   database in an intermediate, partially migrated state.
-- ================================================================

BEGIN;

-- ================================================================
-- SECTION 0: COMPREHENSIVE PRE-FLIGHT AUDITS
-- These checks run BEFORE any schema changes are executed.
-- Any unsafe policy, missing requirement, or structural anomaly
-- will trigger a RAISE EXCEPTION and abort the transaction.
-- ================================================================

DO $$
DECLARE
  _tbl_name             text;
  _tbl_exists           boolean;
  _col_exists           boolean;
  _priv_rec             record;
  _col_priv_rec         record;
  _role_rec             record;
  _pol_rec              record;
  _def_acl_rec          record;
  _unsafe_policy        boolean := false;
  _unsafe_policy_msg    text    := '';
  _is_client_applicable boolean;
  _col_priv_count       integer := 0;
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE 'PHASE 5.4 PRE-FLIGHT COMPREHENSIVE SECURITY AUDIT';
  RAISE NOTICE '================================================================';

  -- ── 0-A: CONFIRM REQUIRED TABLES EXIST ─────────────────────────
  FOREACH _tbl_name IN ARRAY ARRAY['admin_users', 'qr_checkins', 'attendees'] LOOP
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = _tbl_name
    ) INTO _tbl_exists;

    IF NOT _tbl_exists THEN
      RAISE EXCEPTION
        'Pre-flight halted: required table public.% does not exist in database.', _tbl_name;
    END IF;
  END LOOP;

  -- ── 0-B: CONFIRM REQUIRED BASE COLUMNS EXIST ───────────────────
  -- Validates all foundational columns required by subsequent migration steps
  -- (admin_users.id, admin_users.role, qr_checkins.id, qr_checkins.attendee_id,
  -- qr_checkins.scanned_at) to ensure missing base schema causes an immediate
  -- pre-flight halt before any schema modifications or constraints are attempted.
  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'id'
  ) INTO _col_exists;

  IF NOT _col_exists THEN
    RAISE EXCEPTION
      'Pre-flight halted: required base column "id" does not exist on public.admin_users.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'role'
  ) INTO _col_exists;

  IF NOT _col_exists THEN
    RAISE EXCEPTION
      'Pre-flight halted: required base column "role" does not exist on public.admin_users.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'id'
  ) INTO _col_exists;

  IF NOT _col_exists THEN
    RAISE EXCEPTION
      'Pre-flight halted: required base column "id" does not exist on public.qr_checkins.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'attendee_id'
  ) INTO _col_exists;

  IF NOT _col_exists THEN
    RAISE EXCEPTION
      'Pre-flight halted: required base column "attendee_id" does not exist on public.qr_checkins.';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'scanned_at'
  ) INTO _col_exists;

  IF NOT _col_exists THEN
    RAISE EXCEPTION
      'Pre-flight halted: required base column "scanned_at" does not exist on public.qr_checkins.';
  END IF;

  -- ── 0-C: TABLE OWNERSHIP & RLS ACTIVATION STATUS ───────────────
  RAISE NOTICE '--- 0-C: Table ownership & RLS activation status ---';

  FOR _priv_rec IN
    SELECT
      c.relname        AS table_name,
      r.rolname        AS table_owner,
      c.relrowsecurity AS rls_enabled,
      c.relforcerowsecurity AS rls_forced
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    JOIN pg_roles r ON r.oid = c.relowner
    WHERE n.nspname = 'public'
      AND c.relname IN ('admin_users', 'qr_checkins', 'attendees')
    ORDER BY c.relname
  LOOP
    RAISE NOTICE 'TABLE STATUS  table=% | owner=% | rls_enabled=% | rls_forced=%',
      _priv_rec.table_name, _priv_rec.table_owner, _priv_rec.rls_enabled, _priv_rec.rls_forced;
  END LOOP;

  -- ── 0-D: AUDIT EFFECTIVE TABLE PRIVILEGES (ACTUAL ROLES) ───────
  -- Evaluates actual effective privileges taking into account role
  -- inheritance and PUBLIC grants via has_table_privilege:
  RAISE NOTICE '--- 0-D: Effective table privileges (anon, authenticated, service_role) ---';

  FOR _priv_rec IN
    SELECT
      t.table_name,
      r.role_name,
      p.privilege_type,
      has_table_privilege(r.role_name, 'public.' || t.table_name, p.privilege_type) AS has_privilege
    FROM (VALUES ('admin_users'), ('qr_checkins'), ('attendees')) AS t(table_name)
    CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role_name)
    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(privilege_type)
    ORDER BY t.table_name, r.role_name, p.privilege_type
  LOOP
    IF _priv_rec.has_privilege THEN
      RAISE NOTICE 'EFFECTIVE TABLE PRIVILEGE: table=% | role=% | privilege=%',
        _priv_rec.table_name, _priv_rec.role_name, _priv_rec.privilege_type;
    END IF;
  END LOOP;

  -- ── 0-E: AUDIT EFFECTIVE COLUMN-LEVEL PRIVILEGES ───────────────
  RAISE NOTICE '--- 0-E: Effective column-level privileges (anon, authenticated) ---';

  FOR _col_priv_rec IN
    SELECT
      c.table_name,
      c.column_name,
      r.role_name,
      p.privilege_type,
      has_column_privilege(r.role_name, 'public.' || c.table_name, c.column_name, p.privilege_type) AS has_privilege
    FROM information_schema.columns c
    CROSS JOIN (VALUES ('anon'), ('authenticated')) AS r(role_name)
    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES')) AS p(privilege_type)
    WHERE c.table_schema = 'public'
      AND c.table_name IN ('admin_users', 'qr_checkins', 'attendees')
    ORDER BY c.table_name, c.column_name, r.role_name, p.privilege_type
  LOOP
    IF _col_priv_rec.has_privilege THEN
      RAISE NOTICE 'EFFECTIVE COLUMN PRIVILEGE: table=% | col=% | role=% | privilege=%',
        _col_priv_rec.table_name, _col_priv_rec.column_name, _col_priv_rec.role_name, _col_priv_rec.privilege_type;
      _col_priv_count := _col_priv_count + 1;
    END IF;
  END LOOP;

  IF _col_priv_count > 0 THEN
    RAISE WARNING
      'Pre-flight notice: % effective column privilege(s) currently held by anon/authenticated. '
      'Explicit column-level revocations will be executed in Section 4.',
      _col_priv_count;
  ELSE
    RAISE NOTICE 'No effective column-level privileges currently held by anon/authenticated.';
  END IF;

  -- ── 0-F: AUDIT RECURSIVE ROLE INHERITANCE & ATTRIBUTES ─────────
  RAISE NOTICE '--- 0-F: Role attributes (Superuser & BYPASSRLS) ---';

  FOR _role_rec IN
    SELECT
      rolname,
      rolsuper,
      rolbypassrls,
      rolcanlogin
    FROM pg_roles
    WHERE rolname IN ('anon', 'authenticated', 'service_role', 'authenticator', 'postgres', 'supabase_admin')
    ORDER BY rolname
  LOOP
    RAISE NOTICE 'ROLE ATTRIBUTES: role=% | superuser=% | bypassrls=% | can_login=%',
      _role_rec.rolname, _role_rec.rolsuper, _role_rec.rolbypassrls, _role_rec.rolcanlogin;
  END LOOP;

  -- ── 0-G: AUDIT DEFAULT PRIVILEGES ─────────────────────────────
  RAISE NOTICE '--- 0-G: Default privileges on public schema ---';

  FOR _def_acl_rec IN
    SELECT
      r.rolname   AS target_role,
      d.defaclobjtype AS object_type,
      d.defaclacl AS default_acl
    FROM pg_default_acl d
    JOIN pg_roles r ON r.oid = d.defaclrole
    JOIN pg_namespace n ON n.oid = d.defaclnamespace
    WHERE n.nspname = 'public'
  LOOP
    RAISE NOTICE 'DEFAULT PRIVILEGE: role=% | type=% | acl=%',
      _def_acl_rec.target_role, _def_acl_rec.object_type, _def_acl_rec.default_acl;
  END LOOP;

  -- ── 0-H: COMPREHENSIVE RLS POLICY INSPECTION ───────────────────
  -- Inspects: USING (qual), WITH CHECK, permissive vs restrictive,
  -- command scope, PUBLIC grantee, and effective role access.
  RAISE NOTICE '--- 0-H: Comprehensive RLS policy audit ---';

  FOR _pol_rec IN
    SELECT
      schemaname,
      tablename,
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename IN ('admin_users', 'qr_checkins', 'attendees')
    ORDER BY tablename, policyname
  LOOP
    RAISE NOTICE 'POLICY AUDIT: table=% | name=% | mode=% | roles=% | cmd=% | using=% | with_check=%',
      _pol_rec.tablename, _pol_rec.policyname, _pol_rec.permissive,
      _pol_rec.roles, _pol_rec.cmd,
      COALESCE(_pol_rec.qual,       '(none)'),
      COALESCE(_pol_rec.with_check, '(none)');

    -- PostgreSQL Role-Membership Semantics:
    -- In PostgreSQL RLS, a policy applies to the current session role if:
    -- 1. The policy targets 'public' (pseudo-role applying to all connections)
    -- 2. The policy targets a role of which 'anon' is a member (directly or inherited)
    -- 3. The policy targets a role of which 'authenticated' is a member (directly or inherited)
    --
    -- We inspect pg_roles and use pg_has_role(client_role, target_role, 'MEMBER')
    -- to evaluate transitive role inheritance accurately without hardcoding arbitrary
    -- exclusion lists or misclassifying administrative roles (e.g. postgres,
    -- supabase_admin) as client-accessible roles.
    SELECT COALESCE(
      bool_or(
        r::text = 'public'
        OR EXISTS (
          SELECT 1 FROM pg_roles pr
          WHERE pr.rolname = r::text
            AND (
              (EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
               AND pg_has_role('anon', pr.oid, 'MEMBER'))
              OR
              (EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
               AND pg_has_role('authenticated', pr.oid, 'MEMBER'))
            )
        )
      ),
      false
    )
    INTO _is_client_applicable
    FROM unnest(_pol_rec.roles) AS r;

    -- CHECK 1: On administrative tables (admin_users, qr_checkins), NO permissive
    -- policy should exist that is applicable to client roles (public, anon, authenticated,
    -- or any role inherited by them). All administrative access must be mediated
    -- through server-side APIs via service_role.
    IF _pol_rec.tablename IN ('admin_users', 'qr_checkins')
       AND _pol_rec.permissive = 'PERMISSIVE'
       AND _is_client_applicable
    THEN
      _unsafe_policy     := true;
      _unsafe_policy_msg := format(
        'Table public.%s has permissive policy "%s" granting %s access to client-applicable role(s) %s. '
        'Administrative tables must not grant direct client access.',
        _pol_rec.tablename, _pol_rec.policyname, _pol_rec.cmd, _pol_rec.roles
      );
    END IF;

    -- CHECK 2: On attendees table, detect any permissive policy granting
    -- unrestricted modifications (UPDATE/DELETE/ALL) or unvalidated reads/writes
    -- to client-applicable roles.
    --
    -- STATIC COVERAGE LIMITATION (documented, not correctable within SQL):
    -- This check identifies the most common broad-access patterns:
    --   • UPDATE / DELETE / ALL commands to client-applicable roles are always flagged.
    --   • SELECT is flagged when qual = 'true' or qual IS NULL (no USING restriction).
    --   • INSERT is flagged when with_check = 'true' or with_check IS NULL (no WITH CHECK).
    -- Policies whose expressions are functionally equivalent to unrestricted access
    -- (e.g. USING (1=1), USING (now() IS NOT NULL), USING (current_user IS NOT NULL))
    -- are NOT detected by this check because static SQL cannot evaluate arbitrary
    -- policy expressions without executing them against live data.
    -- Any attendees policy with a non-trivial expression requires independent manual review.
    -- This limitation is accepted and documented. Existing protections are not weakened.
    IF _pol_rec.tablename = 'attendees'
       AND _pol_rec.permissive = 'PERMISSIVE'
       AND _is_client_applicable
       AND (
         _pol_rec.cmd IN ('ALL', 'UPDATE', 'DELETE')
         OR (_pol_rec.cmd = 'SELECT' AND (_pol_rec.qual = 'true' OR _pol_rec.qual IS NULL))
         OR (_pol_rec.cmd = 'INSERT' AND (_pol_rec.with_check = 'true' OR _pol_rec.with_check IS NULL))
       )
    THEN
      _unsafe_policy     := true;
      _unsafe_policy_msg := format(
        'Table public.attendees has overly permissive policy "%s" (%s) for client-applicable role(s) %s with using="%s", with_check="%s".',
        _pol_rec.policyname, _pol_rec.cmd, _pol_rec.roles,
        COALESCE(_pol_rec.qual, 'none'), COALESCE(_pol_rec.with_check, 'none')
      );
    END IF;

  END LOOP;

  IF _unsafe_policy THEN
    RAISE EXCEPTION
      'Migration halted (pre-flight audit): % '
      'Review and resolve existing policies manually before re-running.',
      _unsafe_policy_msg;
  END IF;

  RAISE NOTICE 'Pre-flight audit complete — table requirements, integrity assertions, and RLS policies verified.';
  RAISE NOTICE '================================================================';
END $$;


-- ================================================================
-- SECTION 1: ATTENDEES TABLE — QR TOKEN HASH & INDEX
-- ================================================================
DO $$
DECLARE
  _col_type text;
BEGIN

  -- ── Column: qr_token_hash ─────────────────────────────────────
  SELECT data_type INTO _col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'attendees'
    AND column_name  = 'qr_token_hash';

  IF _col_type IS NULL THEN
    ALTER TABLE public.attendees ADD COLUMN qr_token_hash text;
    RAISE NOTICE 'APPLIED  Added qr_token_hash column to public.attendees.';
  ELSIF _col_type IN ('text', 'character varying') THEN
    RAISE NOTICE 'SKIPPED  Column qr_token_hash already exists on public.attendees with verified type (%).', _col_type;
  ELSE
    RAISE EXCEPTION
      'Migration halted: column qr_token_hash on public.attendees exists with incompatible type "%" (expected text).',
      _col_type;
  END IF;

END $$;

-- ── Index: idx_attendees_qr_token_hash ─────────────────────────
-- Robust structural verification:
-- 1. Detects whether ANY relation with the expected name exists in schema public (without filtering by relkind).
-- 2. If missing, safely creates the index.
-- 3. If present, verifies it is an ordinary btree index matching the exact structural specification.
--    Partitioned indexes, tables, views, or mismatched indexes halt the migration with a clear exception.
DO $$
DECLARE
  _idx_record record;
BEGIN
  SELECT
    ic.relname                                                AS index_name,
    ic.relkind                                                AS rel_kind,
    tc.relname                                                AS table_name,
    am.amname                                                 AS am_name,
    ix.indisunique                                            AS is_unique,
    ix.indisvalid                                             AS is_valid,
    ix.indisready                                             AS is_ready,
    (ix.indpred IS NOT NULL)                                  AS is_partial,
    ix.indnatts                                               AS total_cols,
    ix.indnkeyatts                                            AS key_cols,
    (ix.indoption[0] & 1 = 1)                                 AS is_desc,
    (ix.indoption[0] & 2 = 2)                                 AS is_nulls_first,
    COALESCE(
      (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = tc.oid AND a.attnum = ix.indkey[0]),
      CASE WHEN ix.indexprs IS NOT NULL THEN pg_get_expr(ix.indexprs, ix.indrelid) ELSE 'unknown' END
    )                                                         AS indexed_target,
    (SELECT oc.opcname FROM pg_opclass oc WHERE oc.oid = ix.indclass[0]) AS opclass_name,
    pg_get_indexdef(ic.oid)                                   AS full_def
  INTO _idx_record
  FROM pg_class ic
  JOIN pg_namespace n ON n.oid = ic.relnamespace
  LEFT JOIN pg_index ix ON ic.oid = ix.indexrelid
  LEFT JOIN pg_class tc ON tc.oid = ix.indrelid
  LEFT JOIN pg_am am ON am.oid = ic.relam
  WHERE n.nspname = 'public'
    AND ic.relname = 'idx_attendees_qr_token_hash';

  IF NOT FOUND OR _idx_record.index_name IS NULL THEN
    CREATE INDEX idx_attendees_qr_token_hash ON public.attendees (qr_token_hash);
    RAISE NOTICE 'APPLIED  Created index idx_attendees_qr_token_hash on public.attendees(qr_token_hash).';
  ELSIF _idx_record.rel_kind = 'i'
    AND _idx_record.table_name = 'attendees'
    AND _idx_record.am_name = 'btree'
    AND _idx_record.is_unique = false
    AND _idx_record.is_valid = true
    AND _idx_record.is_ready = true
    AND _idx_record.is_partial = false
    AND _idx_record.total_cols = 1
    AND _idx_record.key_cols = 1
    AND _idx_record.indexed_target = 'qr_token_hash'
    AND _idx_record.is_desc = false
    AND _idx_record.is_nulls_first = false
    AND _idx_record.opclass_name = 'text_ops'
  THEN
    RAISE NOTICE 'SKIPPED  Index idx_attendees_qr_token_hash exists with exact verified structural definition: %', _idx_record.full_def;
  ELSE
    RAISE EXCEPTION
      'Migration halted: relation idx_attendees_qr_token_hash exists in schema public with unexpected kind or definition: % '
      '(relkind=%, table=%, am=%, unique=%, valid=%, ready=%, partial=%, total_cols=%, target=%, desc=%, nulls_first=%, opclass=%). '
      'Expected: relkind=i (ordinary index), table=attendees, am=btree, unique=false, valid=true, ready=true, partial=false, target=qr_token_hash, desc=false, nulls_first=false, opclass=text_ops.',
      COALESCE(_idx_record.full_def, '(not an index or no definition)'),
      _idx_record.rel_kind, COALESCE(_idx_record.table_name, 'unknown'), _idx_record.am_name,
      _idx_record.is_unique, _idx_record.is_valid, _idx_record.is_ready, _idx_record.is_partial,
      _idx_record.total_cols, _idx_record.indexed_target, _idx_record.is_desc, _idx_record.is_nulls_first,
      _idx_record.opclass_name;
  END IF;
END $$;


-- ================================================================
-- SECTION 2: ADMIN_USERS TABLE — COLUMNS, ROLES & CONSTRAINTS
-- ================================================================
DO $$
DECLARE
  _col_type           text;
  _col_nullable       text;
  _col_default        text;
  _null_role_count    integer;
  _invalid_role_count integer;
  _null_active_count  integer;
  _role_attnum        smallint;
  _con_type           char;
  _con_validated      boolean;
  _con_deferrable     boolean;
  _con_deferred       boolean;
  _con_key            smallint[];
  _con_def            text;
BEGIN

  -- ── Column: full_name ─────────────────────────────────────────
  SELECT data_type INTO _col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'admin_users'
    AND column_name  = 'full_name';

  IF _col_type IS NULL THEN
    ALTER TABLE public.admin_users ADD COLUMN full_name text;
    RAISE NOTICE 'APPLIED  Added full_name column to public.admin_users.';
  ELSIF _col_type IN ('text', 'character varying') THEN
    RAISE NOTICE 'SKIPPED  Column full_name already exists on public.admin_users with verified type (%).', _col_type;
  ELSE
    RAISE EXCEPTION
      'Migration halted: column full_name on public.admin_users exists with incompatible type "%" (expected text).',
      _col_type;
  END IF;

  -- ── Column: is_active ─────────────────────────────────────────
  -- Verifies: BOOLEAN NOT NULL DEFAULT TRUE
  SELECT data_type, is_nullable, column_default
  INTO _col_type, _col_nullable, _col_default
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'admin_users'
    AND column_name  = 'is_active';

  IF _col_type IS NULL THEN
    ALTER TABLE public.admin_users ADD COLUMN is_active boolean NOT NULL DEFAULT true;
    RAISE NOTICE 'APPLIED  Added is_active boolean NOT NULL DEFAULT true to public.admin_users.';
  ELSIF _col_type = 'boolean' THEN
    -- Column exists with correct boolean type. Verify nullability:
    IF _col_nullable = 'YES' THEN
      SELECT COUNT(*) INTO _null_active_count FROM public.admin_users WHERE is_active IS NULL;
      IF _null_active_count > 0 THEN
        RAISE EXCEPTION
          'Migration halted: % row(s) in public.admin_users have is_active IS NULL. '
          'Correct these records manually, then re-run.', _null_active_count;
      END IF;
      ALTER TABLE public.admin_users ALTER COLUMN is_active SET NOT NULL;
      RAISE NOTICE 'APPLIED  Enforced NOT NULL on public.admin_users.is_active.';
    END IF;

    -- Reliable structural check for default true (exact PostgreSQL boolean true representation):
    IF _col_default IS NULL THEN
      ALTER TABLE public.admin_users ALTER COLUMN is_active SET DEFAULT true;
      RAISE NOTICE 'APPLIED  Enforced DEFAULT true on public.admin_users.is_active.';
    ELSIF _col_default IN ('true', 'true::boolean') THEN
      RAISE NOTICE 'SKIPPED  Column is_active on public.admin_users verified (BOOLEAN NOT NULL DEFAULT true).';
    ELSE
      RAISE EXCEPTION
        'Migration halted: column is_active on public.admin_users has unexpected default expression "%" (expected true).',
        _col_default;
    END IF;
  ELSE
    RAISE EXCEPTION
      'Migration halted: column is_active on public.admin_users exists with incompatible type "%" (expected boolean).',
      _col_type;
  END IF;

  -- ── Column: last_sign_in_at ───────────────────────────────────
  -- Strictly requires timestamp with time zone (timestamptz).
  -- Does NOT silently accept timestamp without time zone.
  SELECT data_type INTO _col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'admin_users'
    AND column_name  = 'last_sign_in_at';

  IF _col_type IS NULL THEN
    ALTER TABLE public.admin_users ADD COLUMN last_sign_in_at timestamp with time zone;
    RAISE NOTICE 'APPLIED  Added last_sign_in_at column to public.admin_users.';
  ELSIF _col_type = 'timestamp with time zone' THEN
    RAISE NOTICE 'SKIPPED  Column last_sign_in_at already exists on public.admin_users with verified timestamptz type.';
  ELSIF _col_type = 'timestamp without time zone' THEN
    RAISE EXCEPTION
      'Migration halted: column last_sign_in_at on public.admin_users exists with type "timestamp without time zone". '
      'Expected "timestamp with time zone". Automatic conversion is not permitted without explicit data preservation '
      'and timezone safety assessment.';
  ELSE
    RAISE EXCEPTION
      'Migration halted: column last_sign_in_at exists with incompatible type "%" (expected timestamp with time zone).',
      _col_type;
  END IF;

  -- ── Column: role — Nullability, Data Verification & NOT NULL ──
  SELECT data_type, is_nullable
  INTO _col_type, _col_nullable
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'admin_users'
    AND column_name  = 'role';

  IF _col_type NOT IN ('text', 'character varying') THEN
    RAISE EXCEPTION
      'Migration halted: column role on public.admin_users exists with unexpected type "%" (expected text).',
      _col_type;
  END IF;

  -- Inspect existing administrator records for NULL roles:
  SELECT COUNT(*) INTO _null_role_count
  FROM public.admin_users
  WHERE role IS NULL;

  IF _null_role_count > 0 THEN
    RAISE EXCEPTION
      'Migration halted: % row(s) in public.admin_users have role IS NULL. '
      'Every administrator record must have an explicit assigned role. '
      'Correct these records manually, then re-run this migration. '
      'No administrator records were modified.',
      _null_role_count;
  END IF;

  -- Inspect existing administrator records for invalid roles:
  SELECT COUNT(*) INTO _invalid_role_count
  FROM public.admin_users
  WHERE role IS NOT NULL AND role NOT IN ('main_admin', 'checkin_operator');

  IF _invalid_role_count > 0 THEN
    RAISE EXCEPTION
      'Migration halted: % row(s) in public.admin_users have invalid role values. '
      'Permitted roles are: ''main_admin'', ''checkin_operator''. '
      'Correct these records manually, then re-run this migration. '
      'No administrator records were modified.',
      _invalid_role_count;
  END IF;

  -- Enforce NOT NULL if column is currently nullable:
  IF _col_nullable = 'YES' THEN
    ALTER TABLE public.admin_users ALTER COLUMN role SET NOT NULL;
    RAISE NOTICE 'APPLIED  Enforced NOT NULL on public.admin_users.role (verified 0 NULL rows).';
  ELSE
    RAISE NOTICE 'SKIPPED  Column public.admin_users.role is already NOT NULL.';
  END IF;

  -- ── Role Constraint: Strict Structural Verification ────────────
  -- Resolves role column attnum for strict key column verification:
  SELECT a.attnum INTO _role_attnum
  FROM pg_attribute a
  JOIN pg_class c ON a.attrelid = c.oid
  JOIN pg_namespace n ON c.relnamespace = n.oid
  WHERE n.nspname = 'public' AND c.relname = 'admin_users' AND a.attname = 'role';

  SELECT
    c.contype,
    c.convalidated,
    c.condeferrable,
    c.condeferred,
    c.conkey,
    pg_get_constraintdef(c.oid, true)
  INTO _con_type, _con_validated, _con_deferrable, _con_deferred, _con_key, _con_def
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'admin_users'
    AND c.conname = 'check_admin_role';

  IF _con_def IS NULL THEN
    ALTER TABLE public.admin_users
      ADD CONSTRAINT check_admin_role CHECK (role IN ('main_admin', 'checkin_operator'));
    RAISE NOTICE 'APPLIED  Added constraint check_admin_role CHECK (role IN (''main_admin'', ''checkin_operator'')).';
  ELSIF _con_type = 'c'
    AND _con_validated = true
    AND _con_deferrable = false
    AND _con_deferred = false
    AND array_length(_con_key, 1) = 1
    AND _con_key[1] = _role_attnum
    AND _con_def IN (
      'CHECK (role = ANY (ARRAY[''main_admin''::text, ''checkin_operator''::text]))',
      'CHECK ((role = ANY (ARRAY[''main_admin''::text, ''checkin_operator''::text])))',
      'CHECK (((role)::text = ANY (ARRAY[''main_admin''::text, ''checkin_operator''::text])))',
      'CHECK (((role)::text = ANY (ARRAY[''main_admin''::character varying, ''checkin_operator''::character varying]::text[])))',
      'CHECK (role = ANY (ARRAY[''main_admin''::character varying, ''checkin_operator''::character varying]))',
      'CHECK (role IN (''main_admin'', ''checkin_operator''))'
    )
  THEN
    RAISE NOTICE 'SKIPPED  Constraint check_admin_role already exists with verified structural definition: %', _con_def;
  ELSE
    RAISE EXCEPTION
      'Migration halted: constraint check_admin_role exists on public.admin_users with unexpected definition: % '
      'Expected strict CHECK (role IN (''main_admin'', ''checkin_operator'')).',
      _con_def;
  END IF;

END $$;

-- ── Index: idx_admin_users_is_active ───────────────────────────
-- Robust structural verification:
-- 1. Detects whether ANY relation with the expected name exists in schema public (without filtering by relkind).
-- 2. If missing, safely creates the index.
-- 3. If present, verifies it is an ordinary btree index matching the exact structural specification.
--    Partitioned indexes, tables, views, or mismatched indexes halt the migration with a clear exception.
DO $$
DECLARE
  _idx_record record;
BEGIN
  SELECT
    ic.relname                                                AS index_name,
    ic.relkind                                                AS rel_kind,
    tc.relname                                                AS table_name,
    am.amname                                                 AS am_name,
    ix.indisunique                                            AS is_unique,
    ix.indisvalid                                             AS is_valid,
    ix.indisready                                             AS is_ready,
    (ix.indpred IS NOT NULL)                                  AS is_partial,
    ix.indnatts                                               AS total_cols,
    ix.indnkeyatts                                            AS key_cols,
    (ix.indoption[0] & 1 = 1)                                 AS is_desc,
    (ix.indoption[0] & 2 = 2)                                 AS is_nulls_first,
    COALESCE(
      (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = tc.oid AND a.attnum = ix.indkey[0]),
      CASE WHEN ix.indexprs IS NOT NULL THEN pg_get_expr(ix.indexprs, ix.indrelid) ELSE 'unknown' END
    )                                                         AS indexed_target,
    (SELECT oc.opcname FROM pg_opclass oc WHERE oc.oid = ix.indclass[0]) AS opclass_name,
    pg_get_indexdef(ic.oid)                                   AS full_def
  INTO _idx_record
  FROM pg_class ic
  JOIN pg_namespace n ON n.oid = ic.relnamespace
  LEFT JOIN pg_index ix ON ic.oid = ix.indexrelid
  LEFT JOIN pg_class tc ON tc.oid = ix.indrelid
  LEFT JOIN pg_am am ON am.oid = ic.relam
  WHERE n.nspname = 'public'
    AND ic.relname = 'idx_admin_users_is_active';

  IF NOT FOUND OR _idx_record.index_name IS NULL THEN
    CREATE INDEX idx_admin_users_is_active ON public.admin_users (is_active);
    RAISE NOTICE 'APPLIED  Created index idx_admin_users_is_active on public.admin_users(is_active).';
  ELSIF _idx_record.rel_kind = 'i'
    AND _idx_record.table_name = 'admin_users'
    AND _idx_record.am_name = 'btree'
    AND _idx_record.is_unique = false
    AND _idx_record.is_valid = true
    AND _idx_record.is_ready = true
    AND _idx_record.is_partial = false
    AND _idx_record.total_cols = 1
    AND _idx_record.key_cols = 1
    AND _idx_record.indexed_target = 'is_active'
    AND _idx_record.is_desc = false
    AND _idx_record.is_nulls_first = false
    AND _idx_record.opclass_name = 'bool_ops'
  THEN
    RAISE NOTICE 'SKIPPED  Index idx_admin_users_is_active exists with exact verified structural definition: %', _idx_record.full_def;
  ELSE
    RAISE EXCEPTION
      'Migration halted: relation idx_admin_users_is_active exists in schema public with unexpected kind or definition: % '
      '(relkind=%, table=%, am=%, unique=%, valid=%, ready=%, partial=%, total_cols=%, target=%, desc=%, nulls_first=%, opclass=%). '
      'Expected: relkind=i (ordinary index), table=admin_users, am=btree, unique=false, valid=true, ready=true, partial=false, target=is_active, desc=false, nulls_first=false, opclass=bool_ops.',
      COALESCE(_idx_record.full_def, '(not an index or no definition)'),
      _idx_record.rel_kind, COALESCE(_idx_record.table_name, 'unknown'), _idx_record.am_name,
      _idx_record.is_unique, _idx_record.is_valid, _idx_record.is_ready, _idx_record.is_partial,
      _idx_record.total_cols, _idx_record.indexed_target, _idx_record.is_desc, _idx_record.is_nulls_first,
      _idx_record.opclass_name;
  END IF;
END $$;


-- ================================================================
-- SECTION 3: QR_CHECKINS TABLE — OPERATOR ATTRIBUTION & RACE GUARD
-- ================================================================
DO $$
DECLARE
  _col_type         text;
  _rec              record;
  _dup_count        integer;
  _fk_count         integer;
  _fk_name          text;
  _fk_def           text;
  _fk_delete_action char;
  _fk_update_action char;
  _fk_validated     boolean;
  _fk_deferrable    boolean;
  _fk_deferred      boolean;
  _fk_ref_schema    text;
  _fk_ref_table     text;
  _fk_src_col       text;
  _fk_ref_col       text;
  _fk_conkey        smallint[];
  _fk_confkey       smallint[];
  _expected_src_att smallint;
  _expected_ref_att smallint;
  _violation_count  integer;
  _con_type         char;
  _con_validated    boolean;
  _con_def          text;
BEGIN

  -- ── operator_id column & Foreign Key ─────────────────────────
  SELECT data_type INTO _col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'qr_checkins'
    AND column_name  = 'operator_id';

  IF _col_type IS NULL THEN
    ALTER TABLE public.qr_checkins
      ADD COLUMN operator_id uuid REFERENCES public.admin_users(id) ON DELETE SET NULL;
    RAISE NOTICE 'APPLIED  Added operator_id column with FK → public.admin_users(id) ON DELETE SET NULL.';
  ELSIF _col_type = 'uuid' THEN
    RAISE NOTICE 'SKIPPED  Column operator_id already exists on public.qr_checkins with verified type (uuid).';

    -- Resolve expected attribute numbers:
    SELECT attnum INTO _expected_src_att
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'qr_checkins' AND a.attname = 'operator_id';

    SELECT attnum INTO _expected_ref_att
    FROM pg_attribute a
    JOIN pg_class c ON a.attrelid = c.oid
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE n.nspname = 'public' AND c.relname = 'admin_users' AND a.attname = 'id';

    -- Exhaustive Foreign Key Verification (Removes LIMIT 1, counts all FKs):
    SELECT COUNT(*) INTO _fk_count
    FROM pg_constraint c
    JOIN pg_class src ON c.conrelid = src.oid
    JOIN pg_namespace sn ON src.relnamespace = sn.oid
    WHERE c.contype = 'f'
      AND src.relname = 'qr_checkins'
      AND sn.nspname = 'public'
      AND _expected_src_att = ANY(c.conkey);

    IF _fk_count = 0 THEN
      -- Check for orphaned operator_id values before attaching foreign key:
      SELECT COUNT(*) INTO _violation_count
      FROM public.qr_checkins q
      WHERE q.operator_id IS NOT NULL
        AND NOT EXISTS (
          SELECT 1 FROM public.admin_users a WHERE a.id = q.operator_id
        );

      IF _violation_count > 0 THEN
        RAISE EXCEPTION
          'Migration halted: % row(s) in public.qr_checkins contain operator_id values '
          'that do not exist in public.admin_users. Foreign key creation would fail. '
          'Resolve orphaned records manually, then re-run.',
          _violation_count;
      END IF;

      ALTER TABLE public.qr_checkins
        ADD CONSTRAINT qr_checkins_operator_id_fkey
        FOREIGN KEY (operator_id) REFERENCES public.admin_users(id) ON DELETE SET NULL;
      RAISE NOTICE 'APPLIED  Added FK qr_checkins_operator_id_fkey → public.admin_users(id) ON DELETE SET NULL.';

    ELSIF _fk_count = 1 THEN
      SELECT
        c.conname,
        c.confdeltype,
        c.confupdtype,
        c.convalidated,
        c.condeferrable,
        c.condeferred,
        c.conkey,
        c.confkey,
        rf_ns.nspname                          AS ref_schema,
        rf_t.relname                           AS ref_table,
        sa.attname                             AS src_col,
        ra.attname                             AS ref_col,
        pg_get_constraintdef(c.oid, true)      AS full_def
      INTO
        _fk_name, _fk_delete_action, _fk_update_action, _fk_validated,
        _fk_deferrable, _fk_deferred, _fk_conkey, _fk_confkey,
        _fk_ref_schema, _fk_ref_table, _fk_src_col, _fk_ref_col, _fk_def
      FROM pg_constraint c
      JOIN pg_class      src   ON c.conrelid  = src.oid
      JOIN pg_namespace  sn    ON src.relnamespace = sn.oid
      JOIN pg_attribute  sa    ON sa.attrelid = src.oid AND sa.attnum = c.conkey[1]
      JOIN pg_class      rf_t  ON c.confrelid = rf_t.oid
      JOIN pg_namespace  rf_ns ON rf_t.relnamespace = rf_ns.oid
      JOIN pg_attribute  ra    ON ra.attrelid = rf_t.oid AND ra.attnum = c.confkey[1]
      WHERE c.contype = 'f'
        AND src.relname = 'qr_checkins'
        AND sn.nspname  = 'public'
        AND _expected_src_att = ANY(c.conkey);

      -- Strict structural assertion of all foreign key attributes:
      IF _fk_delete_action = 'n'                                  -- ON DELETE SET NULL
         AND _fk_update_action IN ('a', 'r')                      -- NO ACTION or RESTRICT
         AND _fk_ref_schema = 'public'                            -- public schema
         AND _fk_ref_table = 'admin_users'                        -- admin_users table
         AND _fk_src_col = 'operator_id'                          -- operator_id column
         AND _fk_ref_col = 'id'                                   -- id column
         AND array_length(_fk_conkey, 1) = 1                      -- exactly 1 source column
         AND _fk_conkey[1] = _expected_src_att                    -- matches operator_id attnum
         AND array_length(_fk_confkey, 1) = 1                     -- exactly 1 target column
         AND _fk_confkey[1] = _expected_ref_att                   -- matches id attnum
         AND _fk_validated = true                                 -- validated
         AND _fk_deferrable = false                               -- NOT DEFERRABLE
      THEN
        RAISE NOTICE 'SKIPPED  Single verified FK "%" on qr_checkins.operator_id: %', _fk_name, _fk_def;
      ELSE
        RAISE EXCEPTION
          'Migration halted: foreign key on qr_checkins.operator_id has unexpected definition: % '
          '(schema=%, table=%, src_col=%, ref_col=%, on_delete=%, on_update=%, validated=%, deferrable=%). '
          'Expected: public.admin_users(id) ON DELETE SET NULL, validated=true, deferrable=false.',
          _fk_def, _fk_ref_schema, _fk_ref_table, _fk_src_col, _fk_ref_col,
          _fk_delete_action, _fk_update_action, _fk_validated, _fk_deferrable;
      END IF;

    ELSE
      RAISE EXCEPTION
        'Migration halted: multiple foreign keys (%) found involving qr_checkins.operator_id. '
        'Manual database review and constraint cleanup required.', _fk_count;
    END IF;

  ELSE
    RAISE EXCEPTION
      'Migration halted: column operator_id on public.qr_checkins exists with incompatible type "%" (expected uuid).',
      _col_type;
  END IF;

  -- ── operator_email column ─────────────────────────────────────
  SELECT data_type INTO _col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'qr_checkins'
    AND column_name  = 'operator_email';

  IF _col_type IS NULL THEN
    ALTER TABLE public.qr_checkins ADD COLUMN operator_email text;
    RAISE NOTICE 'APPLIED  Added operator_email column to public.qr_checkins.';
  ELSIF _col_type IN ('text', 'character varying') THEN
    RAISE NOTICE 'SKIPPED  Column operator_email already exists on public.qr_checkins with verified type (%).', _col_type;
  ELSE
    RAISE EXCEPTION
      'Migration halted: column operator_email exists with incompatible type "%" (expected text).',
      _col_type;
  END IF;

  -- ── Unique Constraint: unique_attendee_checkin ─────────────────
  SELECT
    c.contype,
    c.convalidated,
    pg_get_constraintdef(c.oid, true)
  INTO _con_type, _con_validated, _con_def
  FROM pg_constraint c
  JOIN pg_class t ON c.conrelid = t.oid
  JOIN pg_namespace n ON t.relnamespace = n.oid
  WHERE n.nspname = 'public'
    AND t.relname = 'qr_checkins'
    AND c.conname = 'unique_attendee_checkin';

  IF _con_def IS NULL THEN
    -- Check for duplicate attendee_id records (NULL values strictly excluded):
    SELECT COUNT(*) INTO _dup_count
    FROM (
      SELECT attendee_id
      FROM public.qr_checkins
      WHERE attendee_id IS NOT NULL
      GROUP BY attendee_id
      HAVING COUNT(*) > 1
    ) AS dups;

    IF _dup_count > 0 THEN
      RAISE NOTICE '======================================================';
      RAISE NOTICE 'DUPLICATE CHECK-IN RECORDS DETECTED (non-NULL only)';
      RAISE NOTICE 'No records have been modified.';
      RAISE NOTICE 'Affected records (id | attendee_id | scanned_at):';
      RAISE NOTICE '------------------------------------------------------';

      FOR _rec IN
        SELECT id, attendee_id, scanned_at
        FROM public.qr_checkins
        WHERE attendee_id IS NOT NULL
          AND attendee_id IN (
            SELECT attendee_id
            FROM public.qr_checkins
            WHERE attendee_id IS NOT NULL
            GROUP BY attendee_id
            HAVING COUNT(*) > 1
          )
        ORDER BY attendee_id, scanned_at
      LOOP
        RAISE NOTICE 'ID: %  |  Attendee ID: %  |  Scanned At: %',
          _rec.id, _rec.attendee_id, _rec.scanned_at;
      END LOOP;

      RAISE NOTICE '======================================================';

      RAISE EXCEPTION
        'Migration halted: % attendee_id value(s) appear more than once in '
        'public.qr_checkins (NULL values excluded). Resolve duplicates manually '
        'via Supabase Dashboard, then re-run this migration.',
        _dup_count;
    END IF;

    ALTER TABLE public.qr_checkins
      ADD CONSTRAINT unique_attendee_checkin UNIQUE (attendee_id);
    RAISE NOTICE 'APPLIED  Added unique_attendee_checkin UNIQUE (attendee_id) to public.qr_checkins.';

  ELSIF _con_type = 'u' AND _con_validated = true AND _con_def = 'UNIQUE (attendee_id)' THEN
    RAISE NOTICE 'SKIPPED  Constraint unique_attendee_checkin already exists with verified definition: %', _con_def;
  ELSE
    RAISE EXCEPTION
      'Migration halted: constraint unique_attendee_checkin exists on public.qr_checkins with unexpected definition: % '
      'Expected UNIQUE (attendee_id).',
      _con_def;
  END IF;

END $$;

-- ── Index: idx_qr_checkins_operator ───────────────────────────
-- Robust structural verification:
-- 1. Detects whether ANY relation with the expected name exists in schema public (without filtering by relkind).
-- 2. If missing, safely creates the index.
-- 3. If present, verifies it is an ordinary btree index matching the exact structural specification.
--    Partitioned indexes, tables, views, or mismatched indexes halt the migration with a clear exception.
DO $$
DECLARE
  _idx_record record;
BEGIN
  SELECT
    ic.relname                                                AS index_name,
    ic.relkind                                                AS rel_kind,
    tc.relname                                                AS table_name,
    am.amname                                                 AS am_name,
    ix.indisunique                                            AS is_unique,
    ix.indisvalid                                             AS is_valid,
    ix.indisready                                             AS is_ready,
    (ix.indpred IS NOT NULL)                                  AS is_partial,
    ix.indnatts                                               AS total_cols,
    ix.indnkeyatts                                            AS key_cols,
    (ix.indoption[0] & 1 = 1)                                 AS is_desc,
    (ix.indoption[0] & 2 = 2)                                 AS is_nulls_first,
    COALESCE(
      (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = tc.oid AND a.attnum = ix.indkey[0]),
      CASE WHEN ix.indexprs IS NOT NULL THEN pg_get_expr(ix.indexprs, ix.indrelid) ELSE 'unknown' END
    )                                                         AS indexed_target,
    (SELECT oc.opcname FROM pg_opclass oc WHERE oc.oid = ix.indclass[0]) AS opclass_name,
    pg_get_indexdef(ic.oid)                                   AS full_def
  INTO _idx_record
  FROM pg_class ic
  JOIN pg_namespace n ON n.oid = ic.relnamespace
  LEFT JOIN pg_index ix ON ic.oid = ix.indexrelid
  LEFT JOIN pg_class tc ON tc.oid = ix.indrelid
  LEFT JOIN pg_am am ON am.oid = ic.relam
  WHERE n.nspname = 'public'
    AND ic.relname = 'idx_qr_checkins_operator';

  IF NOT FOUND OR _idx_record.index_name IS NULL THEN
    CREATE INDEX idx_qr_checkins_operator ON public.qr_checkins (operator_id);
    RAISE NOTICE 'APPLIED  Created index idx_qr_checkins_operator on public.qr_checkins(operator_id).';
  ELSIF _idx_record.rel_kind = 'i'
    AND _idx_record.table_name = 'qr_checkins'
    AND _idx_record.am_name = 'btree'
    AND _idx_record.is_unique = false
    AND _idx_record.is_valid = true
    AND _idx_record.is_ready = true
    AND _idx_record.is_partial = false
    AND _idx_record.total_cols = 1
    AND _idx_record.key_cols = 1
    AND _idx_record.indexed_target = 'operator_id'
    AND _idx_record.is_desc = false
    AND _idx_record.is_nulls_first = false
    AND _idx_record.opclass_name = 'uuid_ops'
  THEN
    RAISE NOTICE 'SKIPPED  Index idx_qr_checkins_operator exists with exact verified structural definition: %', _idx_record.full_def;
  ELSE
    RAISE EXCEPTION
      'Migration halted: relation idx_qr_checkins_operator exists in schema public with unexpected kind or definition: % '
      '(relkind=%, table=%, am=%, unique=%, valid=%, ready=%, partial=%, total_cols=%, target=%, desc=%, nulls_first=%, opclass=%). '
      'Expected: relkind=i (ordinary index), table=qr_checkins, am=btree, unique=false, valid=true, ready=true, partial=false, target=operator_id, desc=false, nulls_first=false, opclass=uuid_ops.',
      COALESCE(_idx_record.full_def, '(not an index or no definition)'),
      _idx_record.rel_kind, COALESCE(_idx_record.table_name, 'unknown'), _idx_record.am_name,
      _idx_record.is_unique, _idx_record.is_valid, _idx_record.is_ready, _idx_record.is_partial,
      _idx_record.total_cols, _idx_record.indexed_target, _idx_record.is_desc, _idx_record.is_nulls_first,
      _idx_record.opclass_name;
  END IF;
END $$;

-- ── Index: idx_qr_checkins_scanned_at (DESC) ──────────────────
-- Robust structural verification:
-- 1. Explicitly verifies that qr_checkins.scanned_at exists with verified
--    timestamp with time zone (timestamptz) type before index verification.
-- 2. Detects whether ANY relation with the expected name exists in schema public (without filtering by relkind).
-- 3. If missing, safely creates the index.
-- 4. If present, verifies it is an ordinary btree index matching the exact structural specification.
--    Partitioned indexes, tables, views, or mismatched indexes halt the migration with a clear exception.
DO $$
DECLARE
  _col_type   text;
  _idx_record record;
BEGIN
  -- Explicit type assertion (L-2): Enforce timestamptz before verifying its btree index
  SELECT data_type INTO _col_type
  FROM information_schema.columns
  WHERE table_schema = 'public'
    AND table_name   = 'qr_checkins'
    AND column_name  = 'scanned_at';

  IF _col_type = 'timestamp with time zone' THEN
    RAISE NOTICE 'SKIPPED  Column scanned_at on public.qr_checkins verified (timestamp with time zone).';
  ELSIF _col_type = 'timestamp without time zone' THEN
    RAISE EXCEPTION
      'Migration halted: column scanned_at on public.qr_checkins exists with type "timestamp without time zone". '
      'Expected "timestamp with time zone". Automatic conversion is not permitted without explicit data preservation '
      'and timezone safety assessment.';
  ELSE
    RAISE EXCEPTION
      'Migration halted: column scanned_at on public.qr_checkins exists with unexpected type "%" (expected timestamp with time zone).',
      _col_type;
  END IF;

  SELECT
    ic.relname                                                AS index_name,
    ic.relkind                                                AS rel_kind,
    tc.relname                                                AS table_name,
    am.amname                                                 AS am_name,
    ix.indisunique                                            AS is_unique,
    ix.indisvalid                                             AS is_valid,
    ix.indisready                                             AS is_ready,
    (ix.indpred IS NOT NULL)                                  AS is_partial,
    ix.indnatts                                               AS total_cols,
    ix.indnkeyatts                                            AS key_cols,
    (ix.indoption[0] & 1 = 1)                                 AS is_desc,
    (ix.indoption[0] & 2 = 2)                                 AS is_nulls_first,
    COALESCE(
      (SELECT a.attname FROM pg_attribute a WHERE a.attrelid = tc.oid AND a.attnum = ix.indkey[0]),
      CASE WHEN ix.indexprs IS NOT NULL THEN pg_get_expr(ix.indexprs, ix.indrelid) ELSE 'unknown' END
    )                                                         AS indexed_target,
    (SELECT oc.opcname FROM pg_opclass oc WHERE oc.oid = ix.indclass[0]) AS opclass_name,
    pg_get_indexdef(ic.oid)                                   AS full_def
  INTO _idx_record
  FROM pg_class ic
  JOIN pg_namespace n ON n.oid = ic.relnamespace
  LEFT JOIN pg_index ix ON ic.oid = ix.indexrelid
  LEFT JOIN pg_class tc ON tc.oid = ix.indrelid
  LEFT JOIN pg_am am ON am.oid = ic.relam
  WHERE n.nspname = 'public'
    AND ic.relname = 'idx_qr_checkins_scanned_at';

  IF NOT FOUND OR _idx_record.index_name IS NULL THEN
    CREATE INDEX idx_qr_checkins_scanned_at ON public.qr_checkins (scanned_at DESC);
    RAISE NOTICE 'APPLIED  Created index idx_qr_checkins_scanned_at on public.qr_checkins(scanned_at DESC).';
  ELSIF _idx_record.rel_kind = 'i'
    AND _idx_record.table_name = 'qr_checkins'
    AND _idx_record.am_name = 'btree'
    AND _idx_record.is_unique = false
    AND _idx_record.is_valid = true
    AND _idx_record.is_ready = true
    AND _idx_record.is_partial = false
    AND _idx_record.total_cols = 1
    AND _idx_record.key_cols = 1
    AND _idx_record.indexed_target = 'scanned_at'
    AND _idx_record.is_desc = true
    AND _idx_record.is_nulls_first = true
    AND _idx_record.opclass_name = 'timestamptz_ops'
  THEN
    RAISE NOTICE 'SKIPPED  Index idx_qr_checkins_scanned_at exists with exact verified structural definition (scanned_at DESC NULLS FIRST): %', _idx_record.full_def;
  ELSE
    RAISE EXCEPTION
      'Migration halted: relation idx_qr_checkins_scanned_at exists in schema public with unexpected kind or definition: % '
      '(relkind=%, table=%, am=%, unique=%, valid=%, ready=%, partial=%, total_cols=%, target=%, desc=%, nulls_first=%, opclass=%). '
      'Expected: relkind=i (ordinary index), table=qr_checkins, am=btree, unique=false, valid=true, ready=true, partial=false, target=scanned_at, desc=true, nulls_first=true, opclass=timestamptz_ops.',
      COALESCE(_idx_record.full_def, '(not an index or no definition)'),
      _idx_record.rel_kind, COALESCE(_idx_record.table_name, 'unknown'), _idx_record.am_name,
      _idx_record.is_unique, _idx_record.is_valid, _idx_record.is_ready, _idx_record.is_partial,
      _idx_record.total_cols, _idx_record.indexed_target, _idx_record.is_desc, _idx_record.is_nulls_first,
      _idx_record.opclass_name;
  END IF;
END $$;


-- ================================================================
-- SECTION 4: ROW LEVEL SECURITY — POLICIES & PERMISSIONS
-- ================================================================

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_checkins ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendees   ENABLE ROW LEVEL SECURITY;

DO $$
DECLARE
  _target_tbl text;
  _pol_exists boolean;
  _pol_valid  boolean;
  _pol_record record;
BEGIN

  -- ── Complete Structural Verification of service_role_full_access ─
  FOREACH _target_tbl IN ARRAY ARRAY['admin_users', 'qr_checkins', 'attendees'] LOOP
    SELECT
      policyname,
      permissive,
      roles,
      cmd,
      qual,
      with_check
    INTO _pol_record
    FROM pg_policies
    WHERE schemaname = 'public'
      AND tablename  = _target_tbl
      AND policyname = 'service_role_full_access';

    IF _pol_record.policyname IS NOT NULL THEN
      -- Validate complete policy definition:
      -- Permissive, FOR ALL, TO service_role only, USING (true), WITH CHECK (true)
      _pol_valid := (
        _pol_record.permissive = 'PERMISSIVE'
        AND _pol_record.cmd = 'ALL'
        AND _pol_record.qual = 'true'
        AND _pol_record.with_check = 'true'
        AND _pol_record.roles = ARRAY['service_role'::name]
      );

      IF _pol_valid THEN
        RAISE NOTICE 'SKIPPED  Policy service_role_full_access on public.% verified with complete definition.', _target_tbl;
      ELSE
        RAISE EXCEPTION
          'Migration halted: policy service_role_full_access on public.% exists with unexpected definition: '
          'mode=%, cmd=%, roles=%, using=%, with_check=%. '
          'Expected: PERMISSIVE, ALL, {service_role}, using=true, with_check=true.',
          _target_tbl, _pol_record.permissive, _pol_record.cmd, _pol_record.roles,
          _pol_record.qual, _pol_record.with_check;
      END IF;

    ELSE
      EXECUTE format(
        'CREATE POLICY "service_role_full_access" ON public.%I AS PERMISSIVE FOR ALL TO service_role USING (true) WITH CHECK (true);',
        _target_tbl
      );
      RAISE NOTICE 'APPLIED  Created policy service_role_full_access on public.%.', _target_tbl;
    END IF;
  END LOOP;

END $$;

-- ── Table-level Revocations ───────────────────────────────────
REVOKE ALL ON public.admin_users FROM anon;
REVOKE ALL ON public.admin_users FROM authenticated;
REVOKE ALL ON public.admin_users FROM PUBLIC;

REVOKE ALL ON public.qr_checkins FROM anon;
REVOKE ALL ON public.qr_checkins FROM authenticated;
REVOKE ALL ON public.qr_checkins FROM PUBLIC;

REVOKE ALL ON public.attendees FROM anon;
REVOKE ALL ON public.attendees FROM authenticated;
REVOKE ALL ON public.attendees FROM PUBLIC;

-- ── Column-level Revocations ──────────────────────────────────
-- Handles PUBLIC as PostgreSQL special pseudo-role (unquoted),
-- validates privilege names against whitelist, quotes regular role names.
DO $$
DECLARE
  _col_grant record;
BEGIN
  FOR _col_grant IN
    SELECT grantee, table_name, column_name, privilege_type
    FROM information_schema.column_privileges
    WHERE table_schema = 'public'
      AND table_name IN ('admin_users', 'qr_checkins', 'attendees')
      AND grantee IN ('anon', 'authenticated', 'PUBLIC')
  LOOP
    -- Whitelist validation of privilege_type before building dynamic SQL:
    IF _col_grant.privilege_type NOT IN ('SELECT', 'INSERT', 'UPDATE', 'REFERENCES') THEN
      RAISE EXCEPTION
        'Migration halted: unexpected column privilege name "%" encountered on public.%(%).',
        _col_grant.privilege_type, _col_grant.table_name, _col_grant.column_name;
    END IF;

    -- Correct syntax distinction: PUBLIC is an unquoted special grantee in PostgreSQL:
    IF _col_grant.grantee = 'PUBLIC' THEN
      EXECUTE format(
        'REVOKE %s (%I) ON public.%I FROM PUBLIC;',
        _col_grant.privilege_type,
        _col_grant.column_name,
        _col_grant.table_name
      );
    ELSE
      EXECUTE format(
        'REVOKE %s (%I) ON public.%I FROM %I;',
        _col_grant.privilege_type,
        _col_grant.column_name,
        _col_grant.table_name,
        _col_grant.grantee
      );
    END IF;

    RAISE NOTICE 'APPLIED  Revoked column privilege % on public.%(%) from %.',
      _col_grant.privilege_type, _col_grant.table_name, _col_grant.column_name, _col_grant.grantee;
  END LOOP;
END $$;

-- ── Post-revocation: Verify service_role Retains ALL Table Privileges ──
-- Ensures service_role holds SELECT, INSERT, UPDATE, and DELETE on every table.
DO $$
DECLARE
  _tbl      text;
  _priv     text;
  _has_priv boolean;
BEGIN
  FOREACH _tbl IN ARRAY ARRAY['admin_users', 'qr_checkins', 'attendees'] LOOP
    FOREACH _priv IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE'] LOOP
      _has_priv := has_table_privilege('service_role', 'public.' || _tbl, _priv);

      IF NOT _has_priv THEN
        RAISE EXCEPTION
          'Migration halted: service_role lacks required privilege % on public.%. '
          'Verify schema-level grants for service_role.',
          _priv, _tbl;
      END IF;
    END LOOP;
    RAISE NOTICE 'VERIFIED  service_role possesses all required privileges (SELECT, INSERT, UPDATE, DELETE) on public.%.', _tbl;
  END LOOP;
END $$;

-- ── Post-revocation: Verify Zero Effective Client Table Privileges ──
-- Evaluates has_table_privilege for actual roles (anon, authenticated).
-- Testing these roles automatically accounts for all PUBLIC grants.
-- Verifies zero access across all applicable PostgreSQL table privileges:
-- SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER.
DO $$
DECLARE
  _tbl      text;
  _role     text;
  _priv     text;
  _has_priv boolean;
BEGIN
  FOREACH _tbl IN ARRAY ARRAY['admin_users', 'qr_checkins', 'attendees'] LOOP
    FOREACH _role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      FOREACH _priv IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'DELETE', 'TRUNCATE', 'REFERENCES', 'TRIGGER'] LOOP
        _has_priv := has_table_privilege(_role, 'public.' || _tbl, _priv);

        IF _has_priv THEN
          RAISE EXCEPTION
            'Migration halted: role "%" retains effective table privilege "%" on public.% through inherited grants! '
            'Direct revocation did not eliminate access. Manual review of role inheritance is required.',
            _role, _priv, _tbl;
        END IF;
      END LOOP;
    END LOOP;
    RAISE NOTICE 'VERIFIED  Zero effective table privileges (SELECT, INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER) for anon and authenticated on public.%.', _tbl;
  END LOOP;
END $$;

-- ── Post-revocation: Verify Zero Effective Client Column Privileges ─
-- Uses has_column_privilege to inspect every single column in admin_users,
-- qr_checkins, and attendees. Ensures anon and authenticated cannot access
-- any column through direct or inherited grants.
DO $$
DECLARE
  _col_rec  record;
  _role     text;
  _priv     text;
  _has_priv boolean;
BEGIN
  FOR _col_rec IN
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name IN ('admin_users', 'qr_checkins', 'attendees')
    ORDER BY table_name, column_name
  LOOP
    FOREACH _role IN ARRAY ARRAY['anon', 'authenticated'] LOOP
      FOREACH _priv IN ARRAY ARRAY['SELECT', 'INSERT', 'UPDATE', 'REFERENCES'] LOOP
        _has_priv := has_column_privilege(_role, 'public.' || _col_rec.table_name, _col_rec.column_name, _priv);

        IF _has_priv THEN
          RAISE EXCEPTION
            'Migration halted: role "%" retains effective column privilege "%" on public.%(%)! '
            'Direct revocation did not eliminate column access. Manual review is required.',
            _role, _priv, _col_rec.table_name, _col_rec.column_name;
        END IF;
      END LOOP;
    END LOOP;
  END LOOP;

  RAISE NOTICE 'VERIFIED  Zero effective column privileges for anon and authenticated across all columns in admin_users, qr_checkins, and attendees.';
END $$;

COMMIT;

-- ================================================================
-- POST-MIGRATION VERIFICATION QUERIES
-- Run these queries after successful execution to confirm state:
-- ================================================================
--
-- 1. Table structure and column nullability:
--    SELECT table_name, column_name, data_type, is_nullable, column_default
--    FROM information_schema.columns
--    WHERE table_schema = 'public'
--      AND table_name IN ('admin_users', 'qr_checkins', 'attendees')
--    ORDER BY table_name, ordinal_position;
--
-- 2. Constraints and definitions:
--    SELECT t.relname AS table_name, c.conname, c.contype, pg_get_constraintdef(c.oid, true) AS def
--    FROM pg_constraint c
--    JOIN pg_class t ON c.conrelid = t.oid
--    JOIN pg_namespace n ON t.relnamespace = n.oid
--    WHERE n.nspname = 'public'
--      AND t.relname IN ('admin_users', 'qr_checkins')
--    ORDER BY t.relname, c.conname;
--
-- 3. Indexes and exact definitions:
--    SELECT ic.relname AS index_name, tc.relname AS table_name, am.amname,
--           ix.indisunique, (ix.indpred IS NOT NULL) AS is_partial,
--           (ix.indoption[0] & 1 = 1) AS is_desc,
--           pg_get_indexdef(ic.oid) AS index_definition
--    FROM pg_index ix
--    JOIN pg_class ic ON ic.oid = ix.indexrelid
--    JOIN pg_class tc ON tc.oid = ix.indrelid
--    JOIN pg_namespace n ON n.oid = tc.relnamespace
--    JOIN pg_am am ON am.oid = ic.relam
--    WHERE n.nspname = 'public'
--      AND tc.relname IN ('admin_users', 'qr_checkins', 'attendees')
--    ORDER BY tc.relname, ic.relname;
--
-- 4. Active RLS policies:
--    SELECT tablename, policyname, permissive, roles, cmd, qual, with_check
--    FROM pg_policies
--    WHERE schemaname = 'public'
--    ORDER BY tablename, policyname;
--
-- 5. Remaining effective table privileges:
--    SELECT t.table_name, r.role_name, p.privilege_type,
--           has_table_privilege(r.role_name, 'public.' || t.table_name, p.privilege_type) AS has_privilege
--    FROM (VALUES ('admin_users'), ('qr_checkins'), ('attendees')) AS t(table_name)
--    CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role_name)
--    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(privilege_type)
--    ORDER BY t.table_name, r.role_name, p.privilege_type;
--
-- 6. Remaining effective column privileges:
--    SELECT c.table_name, c.column_name, r.role_name, p.privilege_type,
--           has_column_privilege(r.role_name, 'public.' || c.table_name, c.column_name, p.privilege_type) AS has_col_privilege
--    FROM information_schema.columns c
--    CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role_name)
--    CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES')) AS p(privilege_type)
--    WHERE c.table_schema = 'public'
--      AND c.table_name IN ('admin_users', 'qr_checkins', 'attendees')
--    ORDER BY c.table_name, c.column_name, r.role_name, p.privilege_type;
-- ================================================================
