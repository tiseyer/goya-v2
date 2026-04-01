-- Universal fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS introduction text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS biography text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS video_intro_url text;

-- Student-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS practice_level text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS practice_styles jsonb DEFAULT '[]'::jsonb;

-- Teacher-specific fields
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS influences jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS years_teaching text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teaching_styles_profile jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teaching_format text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS teaching_focus jsonb DEFAULT '[]'::jsonb;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS lineage jsonb DEFAULT '[]'::jsonb;

-- Schools table
CREATE TABLE IF NOT EXISTS public.schools (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  principal_trainer_id uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  faculty_ids jsonb DEFAULT '[]'::jsonb,
  programs_offered jsonb DEFAULT '[]'::jsonb,
  established_year integer,
  delivery_format text,
  lineage jsonb DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.schools ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Schools viewable by authenticated users"
  ON public.schools FOR SELECT TO authenticated USING (true);

CREATE POLICY "Principal trainer can update school"
  ON public.schools FOR UPDATE TO authenticated
  USING (auth.uid() = principal_trainer_id);

CREATE POLICY "Authenticated users can insert schools"
  ON public.schools FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = principal_trainer_id);
