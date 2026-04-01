-- =============================================================================
-- School Owner RLS Policies
-- Migration: 20260377_school_rls_policies
-- Adds RLS policies for: school_designations, school_faculty, school_verification_documents
-- Note: RLS was enabled on these tables in 20260376_school_owner_schema.sql
-- =============================================================================

-- === RLS Policies: school_designations ===

CREATE POLICY "Public can view designations of approved schools" ON public.school_designations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND status = 'approved')
  );

CREATE POLICY "Owner can view own school designations" ON public.school_designations
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owner can insert designations for own school" ON public.school_designations
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owner can update own school designations" ON public.school_designations
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all designations" ON public.school_designations
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- === RLS Policies: school_faculty ===

CREATE POLICY "Public can view faculty of approved schools" ON public.school_faculty
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND status = 'approved')
  );

CREATE POLICY "Owner can view own school faculty" ON public.school_faculty
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owner can insert faculty for own school" ON public.school_faculty
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owner can update own school faculty" ON public.school_faculty
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owner can delete own school faculty" ON public.school_faculty
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all faculty" ON public.school_faculty
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));

-- === RLS Policies: school_verification_documents ===
-- Note: No public SELECT policy — documents are private (owner + admin only)

CREATE POLICY "Owner can view own school documents" ON public.school_verification_documents
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owner can insert documents for own school" ON public.school_verification_documents
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Owner can update own school documents" ON public.school_verification_documents
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.schools WHERE id = school_id AND owner_id = auth.uid())
  );

CREATE POLICY "Admins can manage all school documents" ON public.school_verification_documents
  USING (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')))
  WITH CHECK (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator')));
