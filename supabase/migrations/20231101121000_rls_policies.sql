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

