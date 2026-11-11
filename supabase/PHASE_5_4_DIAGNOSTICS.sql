-- ================================================================
-- KING'S PAVILION INTIMACY PRAYER BOOTCAMP
-- PHASE 5.4 — READ-ONLY DATABASE DIAGNOSTIC AUDIT (SAFE PRE-MIGRATION)
-- ================================================================
-- Target Database : Supabase PostgreSQL (Public Schema)
-- Execution       : Supabase Dashboard → SQL Editor → New Query
-- Safety          : 100% READ-ONLY. Contains NO DDL (CREATE, ALTER, DROP),
--                   NO DML (INSERT, UPDATE, DELETE), and NO DCL (GRANT, REVOKE).
-- Pre-migration   : Fully safe to run on the live database BEFORE Phase 5.4
--                   migrations are applied. Does NOT assume pending columns
--                   (such as qr_checkins.operator_id) exist.
-- Role Testing    : Tests effective privileges using actual roles (anon,
--                   authenticated, service_role). Does NOT pass pseudo-role
--                   'public' to has_*_privilege() functions.
-- Transaction Note: In PostgreSQL, an uncommitted transaction is automatically
--                   rolled back if its database connection closes, while a
--                   successfully committed transaction remains committed.
--                   When applying PHASE_5_4_MIGRATIONS.sql, the complete
--                   migration must be executed as one unbroken transaction.
-- ================================================================

-- ----------------------------------------------------------------
-- 1. DATABASE CONTEXT & SERVER VERSION
-- ----------------------------------------------------------------
SELECT
  version()                         AS pg_version,
  current_database()                AS current_db,
  current_schema()                  AS current_schema,
  current_user                      AS current_user,
  session_user                      AS session_user;


-- ----------------------------------------------------------------
-- 2. TABLE EXISTENCE & ESTIMATED ROW COUNTS
-- ----------------------------------------------------------------
SELECT
  t.table_name,
  EXISTS (
    SELECT 1 FROM information_schema.tables it
    WHERE it.table_schema = 'public' AND it.table_name = t.table_name
  ) AS table_exists,
  COALESCE(s.n_live_tup, 0) AS estimated_rows
FROM (VALUES ('admin_users'), ('qr_checkins'), ('attendees'), ('volunteers'), ('testimonies')) AS t(table_name)
LEFT JOIN pg_stat_user_tables s
  ON s.schemaname = 'public' AND s.relname = t.table_name;


-- ----------------------------------------------------------------
-- 3. COLUMN DEFINITIONS, TYPES, NULLABILITY & DEFAULTS
-- ----------------------------------------------------------------
SELECT
  table_name,
  ordinal_position,
  column_name,
  data_type,
  udt_name,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'qr_checkins', 'attendees')
ORDER BY table_name, ordinal_position;


-- ----------------------------------------------------------------
-- 4. DATA INTEGRITY & ANOMALY DIAGNOSTICS (Dynamically Safe)
-- Evaluates live records without assuming Phase 5.4 columns or tables exist.
-- Genuinely safe: verifies existence of each referenced table and column
-- (id, email, role, created_at, is_active, attendee_id, scanned_at,
-- operator_id, qr_token_hash) before querying. Reports missing columns
-- via RAISE NOTICE without failing unexpectedly.
-- ----------------------------------------------------------------

DO $$
DECLARE
  _tbl_exists         boolean;
  _has_role           boolean;
  _has_id             boolean;
  _has_email          boolean;
  _has_created_at     boolean;
  _has_is_active      boolean;
  _has_attendee_id    boolean;
  _has_checkin_id     boolean;
  _has_scanned_at     boolean;
  _has_operator_id    boolean;
  _has_qr_token_hash  boolean;
  _admin_count        integer := 0;
  _null_role_count    integer := 0;
  _inv_role_count     integer := 0;
  _checkin_count      integer := 0;
  _dup_count          integer := 0;
  _orphan_count       integer := 0;
  _id_expr            text;
  _email_expr         text;
  _role_expr          text;
  _created_expr       text;
  _scanned_expr       text;
  _rec                record;
BEGIN
  RAISE NOTICE '================================================================';
  RAISE NOTICE '4. DATA INTEGRITY DIAGNOSTICS (NON-DESTRUCTIVE & COLUMN-SAFE)';
  RAISE NOTICE '================================================================';

  -- ── 4-A: admin_users role and record audit ────────────────────
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'admin_users'
  ) INTO _tbl_exists;

  IF NOT _tbl_exists THEN
    RAISE NOTICE 'Table public.admin_users: NOT FOUND. Skipping admin_users checks.';
  ELSE
    -- Check individual columns on admin_users before querying:
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'role'
    ) INTO _has_role;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'id'
    ) INTO _has_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'email'
    ) INTO _has_email;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'created_at'
    ) INTO _has_created_at;

    IF NOT _has_role THEN
      RAISE NOTICE 'admin_users.role column: NOT FOUND. Cannot evaluate role distribution.';
    ELSE
      EXECUTE 'SELECT COUNT(*), '
           || 'COUNT(*) FILTER (WHERE role IS NULL), '
           || 'COUNT(*) FILTER (WHERE role IS NOT NULL AND role NOT IN (''main_admin'', ''checkin_operator'')) '
           || 'FROM public.admin_users;'
        INTO _admin_count, _null_role_count, _inv_role_count;

      RAISE NOTICE 'admin_users records: total=% | null_roles=% | invalid_roles=%',
        _admin_count, _null_role_count, _inv_role_count;
    END IF;

    -- Report any missing columns on admin_users:
    IF NOT _has_id THEN
      RAISE NOTICE 'admin_users.id column: NOT FOUND.';
    END IF;
    IF NOT _has_email THEN
      RAISE NOTICE 'admin_users.email column: NOT FOUND.';
    END IF;
    IF NOT _has_created_at THEN
      RAISE NOTICE 'admin_users.created_at column: NOT FOUND.';
    END IF;

    -- Print masked administrator records. Full email addresses and UUIDs are intentionally
    -- suppressed to avoid exposing personal identifiers in routine diagnostic output.
    -- Masked email format: first character of local part + '****@****' + TLD only.
    -- Example: solarumoses@gmail.com is displayed as s****@****.com
    _email_expr   := CASE WHEN _has_email
      THEN 'left(email::text, 1) || ''****@****'' || COALESCE(substring(email::text from ''(\.[^.]+)$''), '''')'
      ELSE '''[email not available]'''
    END;
    _role_expr    := CASE WHEN _has_role THEN 'COALESCE(role::text, ''NULL'')' ELSE '''N/A''' END;
    _created_expr := CASE WHEN _has_created_at THEN 'created_at::text' ELSE '''N/A''' END;
    -- _id_expr is not used in the admin record output below; it is assigned in Section 4-C
    -- for the duplicate check-in query and re-assigned there before use.
    _id_expr      := CASE WHEN _has_id THEN 'id::text' ELSE '''N/A''' END;

    FOR _rec IN EXECUTE format(
      'SELECT %s AS email_masked, %s AS role_val, %s AS created_val FROM public.admin_users;',
      _email_expr, _role_expr, _created_expr
    ) LOOP
      RAISE NOTICE 'ADMIN RECORD (masked): email=% | role=% | created_at=%',
        _rec.email_masked, _rec.role_val, _rec.created_val;
    END LOOP;
  END IF;

  -- ── 4-B: admin_users.is_active column structure check ────────
  IF NOT _tbl_exists THEN
    RAISE NOTICE 'admin_users.is_active: Skipped (table public.admin_users not found).';
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active'
    ) INTO _has_is_active;

    IF _has_is_active THEN
      FOR _rec IN
        SELECT data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'is_active'
      LOOP
        RAISE NOTICE 'admin_users.is_active: EXISTS | type=% | nullable=% | default=%',
          _rec.data_type, _rec.is_nullable, _rec.column_default;
      END LOOP;
    ELSE
      RAISE NOTICE 'admin_users.is_active column: NOT YET PRESENT (Pending Phase 5.4 migration)';
    END IF;
  END IF;

  -- ── 4-C: qr_checkins duplicate check (excluding NULL) ─────────
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'qr_checkins'
  ) INTO _tbl_exists;

  IF NOT _tbl_exists THEN
    RAISE NOTICE 'Table public.qr_checkins: NOT FOUND. Skipping qr_checkins checks.';
  ELSE
    EXECUTE 'SELECT COUNT(*) FROM public.qr_checkins;' INTO _checkin_count;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'attendee_id'
    ) INTO _has_attendee_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'id'
    ) INTO _has_checkin_id;

    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'scanned_at'
    ) INTO _has_scanned_at;

    IF NOT _has_attendee_id THEN
      RAISE NOTICE 'qr_checkins.attendee_id column: NOT FOUND. Cannot evaluate duplicate attendee check-ins.';
    ELSE
      EXECUTE 'SELECT COUNT(*) FROM ('
           || '  SELECT attendee_id FROM public.qr_checkins '
           || '  WHERE attendee_id IS NOT NULL '
           || '  GROUP BY attendee_id '
           || '  HAVING COUNT(*) > 1'
           || ') dups;'
        INTO _dup_count;

      RAISE NOTICE 'qr_checkins records: total=% | duplicate_attendee_ids=%',
        _checkin_count, _dup_count;

      IF _dup_count > 0 THEN
        IF NOT _has_checkin_id THEN
          RAISE NOTICE 'qr_checkins.id column: NOT FOUND.';
        END IF;
        IF NOT _has_scanned_at THEN
          RAISE NOTICE 'qr_checkins.scanned_at column: NOT FOUND.';
        END IF;

        _id_expr      := CASE WHEN _has_checkin_id THEN 'id::text' ELSE '''N/A''' END;
        _scanned_expr := CASE WHEN _has_scanned_at THEN 'scanned_at::text' ELSE '''N/A''' END;

        FOR _rec IN EXECUTE format(
          'SELECT %s AS id_val, attendee_id::text AS attendee_val, %s AS scanned_val '
          || 'FROM public.qr_checkins '
          || 'WHERE attendee_id IS NOT NULL AND attendee_id IN ('
          || '  SELECT attendee_id FROM public.qr_checkins WHERE attendee_id IS NOT NULL GROUP BY attendee_id HAVING COUNT(*) > 1'
          || ') ORDER BY attendee_id;',
          _id_expr, _scanned_expr
        ) LOOP
          RAISE NOTICE 'DUPLICATE CHECKIN: id=% | attendee_id=% | scanned_at=%',
            _rec.id_val, _rec.attendee_val, _rec.scanned_val;
        END LOOP;
      END IF;
    END IF;
  END IF;

  -- ── 4-D: qr_checkins.operator_id existence and orphan audit ───
  IF NOT _tbl_exists THEN
    RAISE NOTICE 'qr_checkins.operator_id: Skipped (table public.qr_checkins not found).';
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'qr_checkins' AND column_name = 'operator_id'
    ) INTO _has_operator_id;

    IF _has_operator_id THEN
      -- Also verify that admin_users and admin_users.id exist before running orphan check:
      SELECT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'admin_users' AND column_name = 'id'
      ) INTO _has_id;

      IF _has_id THEN
        EXECUTE 'SELECT COUNT(*) FROM public.qr_checkins q '
             || 'WHERE q.operator_id IS NOT NULL '
             || 'AND NOT EXISTS (SELECT 1 FROM public.admin_users a WHERE a.id = q.operator_id);'
          INTO _orphan_count;
        RAISE NOTICE 'qr_checkins.operator_id column: EXISTS | orphaned_references=%', _orphan_count;
      ELSE
        RAISE NOTICE 'qr_checkins.operator_id column: EXISTS | admin_users.id NOT FOUND (cannot verify orphan references).';
      END IF;
    ELSE
      RAISE NOTICE 'qr_checkins.operator_id column: NOT YET PRESENT (Pending Phase 5.4 migration)';
    END IF;
  END IF;

  -- ── 4-E: attendees.qr_token_hash existence audit ──────────────
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'attendees'
  ) INTO _tbl_exists;

  IF NOT _tbl_exists THEN
    RAISE NOTICE 'Table public.attendees: NOT FOUND. Skipping attendees checks.';
  ELSE
    SELECT EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'attendees' AND column_name = 'qr_token_hash'
    ) INTO _has_qr_token_hash;

    IF _has_qr_token_hash THEN
      EXECUTE 'SELECT COUNT(*), COUNT(*) FILTER (WHERE qr_token_hash IS NOT NULL) FROM public.attendees;'
        INTO _admin_count, _null_role_count;
      RAISE NOTICE 'attendees qr_token_hash: EXISTS | total_attendees=% | with_hash=%',
        _admin_count, _null_role_count;
    ELSE
      RAISE NOTICE 'attendees.qr_token_hash column: NOT YET PRESENT (Pending Phase 5.4 migration)';
    END IF;
  END IF;

  RAISE NOTICE '================================================================';
END $$;


-- ----------------------------------------------------------------
-- 5. CONSTRAINTS STRUCTURAL AUDIT
-- ----------------------------------------------------------------
SELECT
  t.relname                                 AS table_name,
  c.conname                                 AS constraint_name,
  c.contype                                 AS constraint_type,
  CASE c.contype
    WHEN 'c' THEN 'CHECK'
    WHEN 'f' THEN 'FOREIGN KEY'
    WHEN 'p' THEN 'PRIMARY KEY'
    WHEN 'u' THEN 'UNIQUE'
    WHEN 't' THEN 'TRIGGER'
    ELSE c.contype::text
  END                                       AS type_desc,
  c.convalidated                            AS is_validated,
  c.condeferrable                           AS is_deferrable,
  c.condeferred                             AS is_deferred,
  c.conkey                                  AS local_column_attnums,
  c.confkey                                 AS referenced_column_attnums,
  pg_get_constraintdef(c.oid, true)         AS full_constraint_definition,
  rf_ns.nspname                             AS referenced_schema,
  rf_t.relname                              AS referenced_table,
  CASE c.confdeltype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE c.confdeltype::text
  END                                       AS on_delete_action,
  CASE c.confupdtype
    WHEN 'a' THEN 'NO ACTION'
    WHEN 'r' THEN 'RESTRICT'
    WHEN 'c' THEN 'CASCADE'
    WHEN 'n' THEN 'SET NULL'
    WHEN 'd' THEN 'SET DEFAULT'
    ELSE c.confupdtype::text
  END                                       AS on_update_action
FROM pg_constraint c
JOIN pg_class t ON c.conrelid = t.oid
JOIN pg_namespace n ON t.relnamespace = n.oid
LEFT JOIN pg_class rf_t ON c.confrelid = rf_t.oid
LEFT JOIN pg_namespace rf_ns ON rf_t.relnamespace = rf_ns.oid
WHERE n.nspname = 'public'
  AND t.relname IN ('admin_users', 'qr_checkins', 'attendees')
ORDER BY t.relname, c.conname;


-- ----------------------------------------------------------------
-- 6. INDEXES AUDIT (Complete Definition, Including Expressions & Included Columns)
-- - Accesses indoption and indclass ONLY for index key columns (indkey_subscript <= indnkeyatts).
-- - Handles included columns separately (without accessing indoption/indclass).
-- - Handles expression indexes safely (attnum = 0): labels individual key positions accurately
--   and provides the complete expression tree in index_expressions as well as canonical_index_def.
-- ----------------------------------------------------------------
SELECT
  tc.relname                                                AS table_name,
  ic.relname                                                AS index_name,
  am.amname                                                 AS access_method,
  ix.indisunique                                            AS is_unique,
  ix.indisvalid                                             AS is_valid,
  ix.indisready                                             AS is_ready,
  (ix.indpred IS NOT NULL)                                  AS is_partial,
  pg_get_expr(ix.indpred, ix.indrelid)                      AS predicate_expression,
  ix.indnatts                                               AS total_column_count,
  ix.indnkeyatts                                            AS key_column_count,
  (ix.indnatts - ix.indnkeyatts)                            AS included_column_count,
  -- Safe column, expression, and included column aggregation:
  string_agg(
    CASE
      -- Key column (subscript <= indnkeyatts): safe to access indoption and indclass
      WHEN ik.indkey_subscript <= ix.indnkeyatts THEN
        CASE
          WHEN ik.attnum = 0 THEN '(expression key)'
          ELSE COALESCE(a.attname, 'attnum ' || ik.attnum::text)
        END ||
        ' [KEY ' || ik.indkey_subscript || ']' ||
        ' (opclass: ' || COALESCE(oc.opcname, 'default') || ', ' ||
        CASE WHEN (ix.indoption[ik.indkey_subscript - 1] & 1) = 1 THEN 'DESC' ELSE 'ASC' END || ', ' ||
        CASE WHEN (ix.indoption[ik.indkey_subscript - 1] & 2) = 2 THEN 'NULLS FIRST' ELSE 'NULLS LAST' END || ')'
      -- Included column (subscript > indnkeyatts): no indoption or opclass
      ELSE
        COALESCE(a.attname, CASE WHEN ik.attnum = 0 THEN '(expression included column)' ELSE 'attnum ' || ik.attnum::text END) ||
        ' [INCLUDED ' || (ik.indkey_subscript - ix.indnkeyatts) || ']'
    END,
    ', ' ORDER BY ik.indkey_subscript
  )                                                         AS columns_and_expressions,
  CASE WHEN ix.indexprs IS NOT NULL THEN pg_get_expr(ix.indexprs, ix.indrelid) ELSE NULL END AS index_expressions,
  pg_get_indexdef(ic.oid)                                   AS canonical_index_def
FROM pg_index ix
JOIN pg_class ic ON ic.oid = ix.indexrelid
JOIN pg_class tc ON tc.oid = ix.indrelid
JOIN pg_namespace n ON n.oid = tc.relnamespace
JOIN pg_am am ON am.oid = ic.relam
JOIN LATERAL unnest(ix.indkey) WITH ORDINALITY AS ik(attnum, indkey_subscript) ON true
LEFT JOIN pg_attribute a ON a.attrelid = tc.oid AND a.attnum = ik.attnum
LEFT JOIN pg_opclass oc ON oc.oid = (
  CASE
    WHEN ik.indkey_subscript <= ix.indnkeyatts THEN ix.indclass[ik.indkey_subscript - 1]
    ELSE NULL
  END
)
WHERE n.nspname = 'public'
  AND tc.relname IN ('admin_users', 'qr_checkins', 'attendees')
GROUP BY tc.relname, ic.relname, am.amname, ix.indisunique, ix.indisvalid, ix.indisready,
         ix.indpred, ix.indrelid, ix.indnatts, ix.indnkeyatts, ic.oid, ix.indexprs
ORDER BY tc.relname, ic.relname;


-- ----------------------------------------------------------------
-- 7. ROW LEVEL SECURITY (RLS) & COMPREHENSIVE POLICY AUDIT
-- ----------------------------------------------------------------

-- 7-A. RLS Activation status and table ownership
SELECT
  c.relname                                                 AS table_name,
  c.relrowsecurity                                          AS rls_enabled,
  c.relforcerowsecurity                                     AS rls_forced,
  r.rolname                                                 AS table_owner
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
JOIN pg_roles r ON r.oid = c.relowner
WHERE n.nspname = 'public'
  AND c.relname IN ('admin_users', 'qr_checkins', 'attendees');

-- 7-B. Policy details with per-role applicability classification
-- Columns:
--   targets_public_pseudorole        : policy is assigned to PUBLIC — applies to every user.
--   targets_anon_directly            : policy explicitly names the anon role.
--   targets_authenticated_directly   : policy explicitly names the authenticated role.
--   targets_custom_role_inherited_by_client :
--     policy names a role other than service_role / public / anon / authenticated,
--     and that role is reachable by anon or authenticated via MEMBER graph traversal.
--     Uses conservative MEMBER semantics (matches the migration's Section 0-H logic).
--     May include INHERIT=false edges in PG 16+ — use Section 8-D for confirmed privilege access.
-- Administrative roles such as postgres and supabase_admin do not appear in any column
-- unless they are explicitly named in a policy or reachable by anon/authenticated.
SELECT
  tablename,
  policyname,
  permissive,
  roles                                                     AS target_roles,
  cmd                                                       AS command,
  qual                                                      AS using_expression,
  with_check                                                AS with_check_expression,
  EXISTS (
    SELECT 1 FROM unnest(roles) r WHERE r::text = 'public'
  )                                                         AS targets_public_pseudorole,
  EXISTS (
    SELECT 1 FROM unnest(roles) r WHERE r::text = 'anon'
  )                                                         AS targets_anon_directly,
  EXISTS (
    SELECT 1 FROM unnest(roles) r WHERE r::text = 'authenticated'
  )                                                         AS targets_authenticated_directly,
  EXISTS (
    SELECT 1
    FROM unnest(roles) r
    JOIN pg_roles pr ON pr.rolname = r::text
    WHERE r::text NOT IN ('service_role', 'public', 'anon', 'authenticated')
      AND (
        (EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon')
         AND pg_has_role('anon', pr.oid, 'MEMBER'))
        OR
        (EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated')
         AND pg_has_role('authenticated', pr.oid, 'MEMBER'))
      )
  )                                                         AS targets_custom_role_inherited_by_client
FROM pg_policies
WHERE schemaname = 'public'
  AND tablename IN ('admin_users', 'qr_checkins', 'attendees')
ORDER BY tablename, policyname;


-- ----------------------------------------------------------------
-- 8. EFFECTIVE PRIVILEGES, INHERITANCE & ROLE AUDIT
-- Note: Evaluated using actual PostgreSQL roles (anon, authenticated,
-- service_role). Testing these roles automatically accounts for all
-- privileges granted to the special pseudo-role PUBLIC.
-- ----------------------------------------------------------------

-- 8-A. Role attributes (Superuser & BYPASSRLS)
SELECT
  rolname,
  rolsuper                                                  AS is_superuser,
  rolinherit                                                AS can_inherit,
  rolcanlogin                                               AS can_login,
  rolbypassrls                                              AS bypasses_rls
FROM pg_roles
WHERE rolname IN ('anon', 'authenticated', 'service_role', 'authenticator', 'postgres', 'supabase_admin')
ORDER BY rolname;

-- 8-B. Role membership graph (structural traversal — does NOT imply active privilege inheritance)
-- This query maps the role membership hierarchy recorded in pg_auth_members.
--
-- IMPORTANT INTERPRETATION NOTE:
--   A membership edge (member_role → member_of_role) records that member_role has been
--   granted member_of_role, but does NOT guarantee that the privileges of member_of_role
--   automatically flow to member_role at query time:
--   • In PostgreSQL 14 / 15, privilege flow depends on whether member_role carries the
--     INHERIT role attribute (see Section 8-A, can_inherit column).
--   • In PostgreSQL 16+, it additionally depends on the INHERIT option on the specific
--     GRANT statement (stored in pg_auth_members.inherit_option when available).
--   Use Section 8-D (effective table privileges via has_table_privilege) for confirmed
--   effective access that accounts for all inheritance and SET restrictions.
--
-- Cycle guard: traversal halts if the target role OID has already been visited in the
--   current path (explicit cycle detection via visited_oids array) OR if traversal depth
--   exceeds 20 levels (hard safety limit). Both guards are applied simultaneously.
WITH RECURSIVE role_membership_graph AS (
  SELECT
    m.rolname                                               AS member_role,
    p.rolname                                               AS member_of_role,
    am.admin_option,
    1                                                       AS depth,
    ARRAY[m.oid, p.oid]                                     AS visited_oids
  FROM pg_auth_members am
  JOIN pg_roles m ON m.oid = am.member
  JOIN pg_roles p ON p.oid = am.roleid
  UNION ALL
  SELECT
    rmg.member_role,
    p.rolname,
    am.admin_option,
    rmg.depth + 1,
    rmg.visited_oids || p.oid
  FROM role_membership_graph rmg
  JOIN pg_roles cur ON cur.rolname = rmg.member_of_role
  JOIN pg_auth_members am ON am.member = cur.oid
  JOIN pg_roles p ON p.oid = am.roleid
  WHERE rmg.depth < 20                                      -- Hard depth limit (cycle safety)
    AND NOT (p.oid = ANY(rmg.visited_oids))                 -- Explicit OID-based cycle detection
)
SELECT DISTINCT
  member_role,
  member_of_role,
  admin_option,
  depth                                                     AS graph_depth
FROM role_membership_graph
ORDER BY member_role, graph_depth;

-- 8-C. Schema USAGE privilege (Tested on actual database roles)
SELECT
  r.role_name,
  has_schema_privilege(r.role_name, 'public', 'USAGE')      AS has_usage_privilege,
  has_schema_privilege(r.role_name, 'public', 'CREATE')     AS has_create_privilege
FROM (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role_name);

-- 8-D. Effective table privileges (Evaluates direct, inherited, and PUBLIC grants)
SELECT
  t.table_name,
  r.role_name,
  p.privilege_type,
  has_table_privilege(r.role_name, 'public.' || t.table_name, p.privilege_type) AS has_effective_privilege
FROM (VALUES ('admin_users'), ('qr_checkins'), ('attendees')) AS t(table_name)
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role_name)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('DELETE'), ('TRUNCATE'), ('REFERENCES'), ('TRIGGER')) AS p(privilege_type)
ORDER BY t.table_name, r.role_name, p.privilege_type;

-- 8-E. Effective column-level privileges (Inspects every column for actual roles)
SELECT
  c.table_name,
  c.column_name,
  r.role_name,
  p.privilege_type,
  has_column_privilege(r.role_name, 'public.' || c.table_name, c.column_name, p.privilege_type) AS has_effective_col_privilege
FROM information_schema.columns c
CROSS JOIN (VALUES ('anon'), ('authenticated'), ('service_role')) AS r(role_name)
CROSS JOIN (VALUES ('SELECT'), ('INSERT'), ('UPDATE'), ('REFERENCES')) AS p(privilege_type)
WHERE c.table_schema = 'public'
  AND c.table_name IN ('admin_users', 'qr_checkins', 'attendees')
ORDER BY c.table_name, c.column_name, r.role_name, p.privilege_type;

-- 8-F. Explicit table-level privilege grants in information_schema
SELECT
  table_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'qr_checkins', 'attendees')
  AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
ORDER BY table_name, grantee, privilege_type;

-- 8-G. Explicit column-level privilege grants in information_schema
SELECT
  table_name,
  column_name,
  grantee,
  privilege_type,
  is_grantable
FROM information_schema.column_privileges
WHERE table_schema = 'public'
  AND table_name IN ('admin_users', 'qr_checkins', 'attendees')
  AND grantee IN ('anon', 'authenticated', 'service_role', 'PUBLIC')
ORDER BY table_name, column_name, grantee, privilege_type;

-- 8-H. Relevant default privileges on public schema
SELECT
  r.rolname                                                 AS target_role,
  d.defaclobjtype                                           AS object_type,
  d.defaclacl                                               AS default_acl
FROM pg_default_acl d
JOIN pg_roles r ON r.oid = d.defaclrole
JOIN pg_namespace n ON n.oid = d.defaclnamespace
WHERE n.nspname = 'public';

-- ================================================================
-- END OF SAFE DIAGNOSTIC SCRIPT (100% Read-Only)
-- ================================================================
