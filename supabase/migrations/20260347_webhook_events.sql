-- Webhook events idempotency table
-- Prevents duplicate processing when Stripe retries webhook delivery.
-- Pattern: INSERT event ID before processing; ON CONFLICT skip processing.

CREATE TABLE IF NOT EXISTS public.webhook_events (
  id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text UNIQUE NOT NULL,
  event_type      text NOT NULL,
  status          text NOT NULL DEFAULT 'received' CHECK (status IN ('received', 'processing', 'processed', 'failed')),
  error_message   text,
  payload         jsonb,
  created_at      timestamptz DEFAULT now(),
  processed_at    timestamptz
);

ALTER TABLE public.webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage webhook events"
  ON public.webhook_events
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );
