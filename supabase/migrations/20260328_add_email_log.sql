CREATE TABLE IF NOT EXISTS public.email_log (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  recipient    text NOT NULL,
  subject      text NOT NULL,
  template_name text NOT NULL,
  status       text NOT NULL DEFAULT 'sent' CHECK (status IN ('sent', 'failed')),
  error_message text,
  sent_at      timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.email_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can read email log" ON public.email_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

CREATE INDEX IF NOT EXISTS email_log_sent_at_idx ON public.email_log (sent_at DESC);
CREATE INDEX IF NOT EXISTS email_log_recipient_idx ON public.email_log (recipient);
