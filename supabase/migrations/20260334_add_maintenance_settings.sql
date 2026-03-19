-- Add maintenance mode settings to site_settings table
INSERT INTO public.site_settings (key, value, description) VALUES
  ('maintenance_mode_enabled',   'false', 'When true, non-admin users are redirected to the maintenance page immediately'),
  ('maintenance_mode_scheduled', 'false', 'When true, the platform enters maintenance during the scheduled start/end window'),
  ('maintenance_start_utc',      '',      'Scheduled maintenance window start (ISO 8601 UTC)'),
  ('maintenance_end_utc',        '',      'Scheduled maintenance window end (ISO 8601 UTC)'),
  ('maintenance_message',        'We are currently performing scheduled maintenance. We will be back online shortly. Thank you for your patience.', 'Message displayed to visitors on the maintenance page')
ON CONFLICT (key) DO NOTHING;
