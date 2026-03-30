-- Phase 10 DB-08: Add pending_cron status for deferred webhook processing via Vercel Cron
ALTER TABLE public.webhook_events
  DROP CONSTRAINT IF EXISTS webhook_events_status_check;

ALTER TABLE public.webhook_events
  ADD CONSTRAINT webhook_events_status_check
  CHECK (status IN ('received', 'processing', 'processed', 'failed', 'pending_cron'));
