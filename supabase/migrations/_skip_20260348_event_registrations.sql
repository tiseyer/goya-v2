-- ============================================================
-- Migration: Add event_registrations table
-- ============================================================

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id              uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        uuid          NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id         uuid          NOT NULL,
  registered_at   timestamptz   DEFAULT now(),
  created_at      timestamptz   DEFAULT now(),
  updated_at      timestamptz   DEFAULT now(),
  UNIQUE(event_id, user_id)
);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_trigger
    WHERE tgname = 'update_event_registrations_updated_at'
  ) THEN
    CREATE TRIGGER update_event_registrations_updated_at
      BEFORE UPDATE ON public.event_registrations
      FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
  END IF;
END $$;

-- RLS: enabled with no policies (service-role-only access, same as api_keys)
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;

-- Index for fast lookups by event
CREATE INDEX IF NOT EXISTS idx_event_registrations_event_id ON public.event_registrations(event_id);
-- Index for fast lookups by user
CREATE INDEX IF NOT EXISTS idx_event_registrations_user_id ON public.event_registrations(user_id);
