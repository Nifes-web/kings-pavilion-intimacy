-- 20231101135000_rate_limit_function.sql
-- SECURITY DEFINER function for atomic IP-based rate limiting.
-- Callable via supabase RPC from the service-role server client.
-- Revokes direct table access from anon and authenticated roles.

-- Drop and recreate to make idempotent
DROP FUNCTION IF EXISTS public.increment_rate_limit(text, text, integer, integer);

CREATE OR REPLACE FUNCTION public.increment_rate_limit(
  p_ip         text,
  p_endpoint   text,
  p_limit      integer,
  p_window_sec integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count   integer;
  v_allowed boolean;
BEGIN
  -- Upsert: insert a new row or update an existing one atomically.
  -- On conflict (same ip + endpoint):
  --   if the current window has expired → reset window_start and set count to 1
  --   else                              → increment count
  INSERT INTO public.rate_limits (ip, endpoint, request_count, window_start)
  VALUES (p_ip, p_endpoint, 1, now())
  ON CONFLICT (ip, endpoint) DO UPDATE
    SET
      request_count = CASE
        WHEN (now() - rate_limits.window_start) > (p_window_sec || ' seconds')::interval
        THEN 1
        ELSE rate_limits.request_count + 1
      END,
      window_start = CASE
        WHEN (now() - rate_limits.window_start) > (p_window_sec || ' seconds')::interval
        THEN now()
        ELSE rate_limits.window_start
      END
  RETURNING request_count INTO v_count;

  v_allowed := v_count <= p_limit;
  RETURN v_allowed;
END;
$$;

-- Revoke direct table access from anon and authenticated roles.
-- Only the SECURITY DEFINER function (running as the owner) may touch the table.
REVOKE ALL ON public.rate_limits FROM anon;
REVOKE ALL ON public.rate_limits FROM authenticated;

-- Grant EXECUTE on the function to service_role so server-side RPC calls work.
GRANT EXECUTE ON FUNCTION public.increment_rate_limit(text, text, integer, integer) TO service_role;

