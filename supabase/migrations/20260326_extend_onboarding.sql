-- ============================================================
-- Migration: Extend onboarding with new structure
-- ============================================================

-- Drop and recreate onboarding_progress with new structure
DROP TABLE IF EXISTS public.onboarding_progress;

CREATE TABLE public.onboarding_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  current_step_key text DEFAULT 'member_type',
  answers jsonb DEFAULT '{}',
  started_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.onboarding_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own onboarding progress" ON public.onboarding_progress
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can read all onboarding progress" ON public.onboarding_progress
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );

-- New profile columns (all ADD COLUMN IF NOT EXISTS)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS youtube_intro_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS facebook text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS tiktok text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS practice_format text CHECK (practice_format IN ('online', 'in_person', 'hybrid'));
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS languages text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teacher_status text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teaching_styles text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teaching_focus_arr text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS other_org_member boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS other_org_names text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS other_org_name_other text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS other_org_registration text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS other_org_designations text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificate_is_official boolean;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS certificate_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wellness_designations text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wellness_designation_other text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wellness_org_name text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wellness_regulatory_body boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wellness_regulatory_designations text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS wellness_focus text[];
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS influences_arr text[];
