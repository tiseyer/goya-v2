CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_content text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  last_edited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admins and moderators can CRUD
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
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

-- Auto-update updated_at (reuses existing trigger function)
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed 10 template rows (empty html_content — populated via admin UI)
INSERT INTO public.email_templates (template_key, name, description, subject) VALUES
  ('welcome',               'Welcome Email',             'Sent immediately after a user registers',                        'Welcome to GOYA, {{firstName}}!'),
  ('onboarding_complete',   'Onboarding Complete',       'Sent after the user finishes the onboarding flow',               'Your GOYA profile is live!'),
  ('verification_approved', 'Verification Approved',     'Sent when an admin approves a teacher or wellness registration', '🎉 Your GOYA status has been verified!'),
  ('verification_rejected', 'Verification Rejected',     'Sent when an admin rejects a registration',                     'Update required on your GOYA registration'),
  ('credits_expiring',      'Credits Expiring',          'Sent 30 days before a user''s credits expire',                  '⚠️ Your GOYA credits are expiring soon'),
  ('new_message',           'New Message Notification',  'Sent when a user receives a direct message',                    '{{senderName}} sent you a message on GOYA'),
  ('school_approved',       'School Approved',           'Sent when a school registration is approved',                   '🏫 Your school is now live on GOYA!'),
  ('school_rejected',       'School Rejected',           'Sent when a school registration is rejected',                   'Update required on your school registration'),
  ('admin_digest',          'Admin Weekly Digest',       'Sent every Monday to admins with pending inbox summary',        'GOYA Admin: {{count}} items need your attention'),
  ('password_reset',        'Password Reset',            'Available for custom password reset flows',                     'Reset your GOYA password')
ON CONFLICT (template_key) DO NOTHING;
