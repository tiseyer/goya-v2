ALTER TABLE chatbot_config ADD COLUMN IF NOT EXISTS enabled_tools jsonb NOT NULL DEFAULT '["faq"]'::jsonb;
