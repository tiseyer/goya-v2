CREATE TABLE chatbot_config (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL DEFAULT 'Mattea',
  avatar_url text,
  is_active boolean NOT NULL DEFAULT false,
  system_prompt text NOT NULL DEFAULT '',
  selected_key_id uuid REFERENCES admin_secrets(id) ON DELETE SET NULL,
  guest_retention_days integer NOT NULL DEFAULT 5,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE chatbot_config ENABLE ROW LEVEL SECURITY;
-- No RLS policies — service role only (admin operations use getSupabaseService())

CREATE OR REPLACE FUNCTION update_chatbot_config_updated_at()
RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chatbot_config_updated_at
  BEFORE UPDATE ON chatbot_config
  FOR EACH ROW EXECUTE FUNCTION update_chatbot_config_updated_at();

-- Insert a single default row so the config always exists
INSERT INTO chatbot_config (name, system_prompt) VALUES (
  'Mattea',
  'You are Mattea, a warm and knowledgeable AI assistant for the Global Online Yoga Association (GOYA). You help members and visitors with questions about yoga, GOYA community, events, courses, and memberships. You are friendly, supportive, and professional. When you cannot confidently answer a question, suggest the user speak with a human support agent. Always maintain a yogic and compassionate tone.'
);
