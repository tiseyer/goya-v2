CREATE TABLE faq_items (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  question text NOT NULL,
  answer text NOT NULL,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('published', 'draft')),
  created_by uuid REFERENCES profiles(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE faq_items ENABLE ROW LEVEL SECURITY;

-- Public read for published items (chatbot API uses anon key)
CREATE POLICY "Anyone can read published FAQ items"
  ON faq_items FOR SELECT
  USING (status = 'published');

-- No insert/update/delete policies — admin operations use service role

CREATE OR REPLACE FUNCTION update_faq_items_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER faq_items_updated_at
  BEFORE UPDATE ON faq_items
  FOR EACH ROW EXECUTE FUNCTION update_faq_items_updated_at();
