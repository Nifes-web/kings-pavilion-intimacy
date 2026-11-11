-- 20231101134000_rate_limits_table.sql
-- Table for simple IP‑based rate limiting
CREATE TABLE IF NOT EXISTS public.rate_limits (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  ip text NOT NULL,
  endpoint text NOT NULL,
  request_count int NOT NULL DEFAULT 0,
  window_start timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT unique_ip_endpoint UNIQUE (ip, endpoint)
);

-- Index for quick look‑up
CREATE INDEX IF NOT EXISTS idx_rate_limits_ip_endpoint ON public.rate_limits (ip, endpoint);

