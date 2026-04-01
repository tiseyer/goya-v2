INSERT INTO site_settings (key, value, description)
VALUES ('chatbot_maintenance_mode', 'false', 'When true, hides the chat widget for non-admin users')
ON CONFLICT (key) DO NOTHING;
