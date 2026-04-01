-- Health monitor log: stores periodic health check results and alert history
CREATE TABLE public.health_monitor_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  checked_at timestamptz DEFAULT now(),
  overall_status text NOT NULL CHECK (overall_status IN ('healthy', 'degraded', 'critical')),
  checks jsonb NOT NULL,
  alert_sent boolean DEFAULT false,
  alert_type text
);

-- Index for recent-first queries and cleanup
CREATE INDEX idx_health_monitor_log_checked_at ON public.health_monitor_log (checked_at DESC);

-- RLS: service-role only (no policies = deny all for anon/authenticated)
ALTER TABLE public.health_monitor_log ENABLE ROW LEVEL SECURITY;
