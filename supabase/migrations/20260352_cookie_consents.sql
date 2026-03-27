-- Cookie consent storage for logged-in users (GDPR / CASL compliance).
-- Guests use browser cookie only; logged-in users sync here for cross-device persistence.

CREATE TABLE public.cookie_consents (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  version     text NOT NULL,
  preferences boolean NOT NULL DEFAULT false,
  statistics  boolean NOT NULL DEFAULT false,
  marketing   boolean NOT NULL DEFAULT false,
  consented_at timestamptz NOT NULL DEFAULT now(),
  updated_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_cookie_consents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER cookie_consents_updated_at
  BEFORE UPDATE ON public.cookie_consents
  FOR EACH ROW EXECUTE FUNCTION update_cookie_consents_updated_at();

-- RLS: users can only read/write their own row
ALTER TABLE public.cookie_consents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own cookie consent"
  ON public.cookie_consents
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own cookie consent"
  ON public.cookie_consents
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own cookie consent"
  ON public.cookie_consents
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
