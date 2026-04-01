-- Add missing columns to health_monitor_log for richer monitor data
ALTER TABLE public.health_monitor_log
  ADD COLUMN IF NOT EXISTS failed_services text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS latency_ms integer,
  ADD COLUMN IF NOT EXISTS metadata jsonb DEFAULT '{}';
