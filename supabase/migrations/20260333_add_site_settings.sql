CREATE TABLE public.site_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  value text,
  description text,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage site settings" ON public.site_settings
  USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

CREATE POLICY "Settings are publicly readable" ON public.site_settings
  FOR SELECT USING (true);

-- Seed default empty settings
INSERT INTO public.site_settings (key, value, description) VALUES
  ('ga4_measurement_id', '', 'Google Analytics 4 Measurement ID (format: G-XXXXXXXXXX)'),
  ('clarity_project_id', '', 'Microsoft Clarity Project ID (format: abc123def4)'),
  ('analytics_enabled', 'false', 'Master switch to enable/disable all analytics scripts')
ON CONFLICT (key) DO NOTHING;
