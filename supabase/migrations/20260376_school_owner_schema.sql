-- =============================================================================
-- School Owner Schema
-- Migration: 20260370_school_owner_schema
-- Extends: schools table, profiles table
-- Creates: school_designations, school_faculty, school_verification_documents
-- Also: storage buckets, indexes, RLS, triggers
-- =============================================================================

-- === Section 1: ALTER TABLE public.schools — Add new columns ===

ALTER TABLE public.schools
  ADD COLUMN IF NOT EXISTS short_bio text,
  ADD COLUMN IF NOT EXISTS bio text,
  ADD COLUMN IF NOT EXISTS video_platform text CHECK (video_platform IN ('youtube', 'vimeo')),
  ADD COLUMN IF NOT EXISTS video_url text,
  ADD COLUMN IF NOT EXISTS practice_styles text[],
  ADD COLUMN IF NOT EXISTS programs_offered text[],
  ADD COLUMN IF NOT EXISTS course_delivery_format text CHECK (course_delivery_format IN ('in_person', 'online', 'hybrid')),
  ADD COLUMN IF NOT EXISTS location_address text,
  ADD COLUMN IF NOT EXISTS location_city text,
  ADD COLUMN IF NOT EXISTS location_country text,
  ADD COLUMN IF NOT EXISTS location_lat double precision,
  ADD COLUMN IF NOT EXISTS location_lng double precision,
  ADD COLUMN IF NOT EXISTS location_place_id text,
  ADD COLUMN IF NOT EXISTS lineage text,
  ADD COLUMN IF NOT EXISTS established_year integer,
  ADD COLUMN IF NOT EXISTS languages text[],
  ADD COLUMN IF NOT EXISTS is_insured boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS onboarding_completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS cover_image_url text;

-- === Section 2: Update schools status CHECK constraint ===

ALTER TABLE public.schools DROP CONSTRAINT IF EXISTS schools_status_check;
ALTER TABLE public.schools ADD CONSTRAINT schools_status_check
  CHECK (status IN ('pending', 'pending_review', 'approved', 'rejected', 'suspended'));

-- === Section 3: CREATE TABLE public.school_designations ===

CREATE TABLE public.school_designations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  designation_type text NOT NULL CHECK (designation_type IN ('CYS200','CYS300','CYS500','CCYS','CPYS','CMS','CYYS','CRYS')),
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'suspended', 'cancelled')),
  stripe_subscription_id text,
  stripe_price_id text,
  signup_fee_paid boolean DEFAULT false,
  signup_fee_amount integer,
  annual_fee_amount integer,
  activated_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (school_id, designation_type)
);

-- === Section 4: CREATE TABLE public.school_faculty ===

CREATE TABLE public.school_faculty (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  profile_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  invited_email text,
  invite_token text UNIQUE,
  position text,
  is_principal_trainer boolean DEFAULT false,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'removed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT faculty_has_profile_or_email CHECK (profile_id IS NOT NULL OR invited_email IS NOT NULL)
);

-- === Section 5: CREATE TABLE public.school_verification_documents ===

CREATE TABLE public.school_verification_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id uuid NOT NULL REFERENCES public.schools(id) ON DELETE CASCADE,
  designation_id uuid REFERENCES public.school_designations(id) ON DELETE CASCADE,
  document_type text NOT NULL CHECK (document_type IN ('business_registration', 'qualification_certificate', 'insurance', 'other')),
  file_url text NOT NULL,
  file_name text,
  file_size integer,
  uploaded_at timestamptz NOT NULL DEFAULT now(),
  reviewed_at timestamptz,
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- === Section 6: ALTER TABLE public.profiles — Add school columns ===

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS principal_trainer_school_id uuid REFERENCES public.schools(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS faculty_school_ids uuid[] DEFAULT '{}';

-- === Section 7: Indexes ===

CREATE INDEX IF NOT EXISTS idx_school_designations_school_id ON public.school_designations(school_id);
CREATE INDEX IF NOT EXISTS idx_school_faculty_school_id ON public.school_faculty(school_id);
CREATE INDEX IF NOT EXISTS idx_school_faculty_profile_id ON public.school_faculty(profile_id);
CREATE INDEX IF NOT EXISTS idx_school_faculty_invite_token ON public.school_faculty(invite_token) WHERE invite_token IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_school_verification_docs_school_id ON public.school_verification_documents(school_id);
CREATE INDEX IF NOT EXISTS idx_school_verification_docs_designation_id ON public.school_verification_documents(designation_id);
CREATE INDEX IF NOT EXISTS idx_profiles_principal_trainer ON public.profiles(principal_trainer_school_id) WHERE principal_trainer_school_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_schools_status ON public.schools(status);
CREATE INDEX IF NOT EXISTS idx_schools_slug ON public.schools(slug);

-- === Section 8: Enable RLS on new tables ===

ALTER TABLE public.school_designations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_faculty ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.school_verification_documents ENABLE ROW LEVEL SECURITY;

-- === Section 9: updated_at triggers for new tables ===

CREATE TRIGGER update_school_designations_updated_at
  BEFORE UPDATE ON public.school_designations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_school_faculty_updated_at
  BEFORE UPDATE ON public.school_faculty
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- === Section 10: Storage buckets for school documents and covers ===

INSERT INTO storage.buckets (id, name, public) VALUES ('school-documents', 'school-documents', false) ON CONFLICT DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('school-covers', 'school-covers', true) ON CONFLICT DO NOTHING;

CREATE POLICY "School owners can upload documents" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'school-documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "School owners can view own documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'school-documents' AND auth.uid()::text = (storage.foldername(name))[1]
  );
CREATE POLICY "Admins can view school documents" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'school-documents' AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))
  );
CREATE POLICY "Public can view school covers" ON storage.objects
  FOR SELECT USING (bucket_id = 'school-covers');
CREATE POLICY "School owners can upload covers" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'school-covers' AND auth.uid()::text = (storage.foldername(name))[1]
  );
