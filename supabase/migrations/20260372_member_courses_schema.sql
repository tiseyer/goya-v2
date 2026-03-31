-- ============================================================
-- Migration: Member Courses — Schema Changes
-- Adds course_type, created_by, rejection_reason, deleted_at to courses.
-- Extends status to support member submission workflow.
-- Creates course_audit_log table.
-- ============================================================

-- 1. Add course_type column (goya = admin-created, member = user-submitted)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS course_type text NOT NULL DEFAULT 'goya'
  CHECK (course_type IN ('goya', 'member'));

-- 2. Add created_by FK (null for legacy admin-created courses)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS created_by uuid REFERENCES profiles(id) ON DELETE SET NULL;

-- 3. Extend status CHECK to include pending_review, rejected, cancelled, deleted
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_status_check;
ALTER TABLE public.courses
  ADD CONSTRAINT courses_status_check
  CHECK (status IN ('draft', 'pending_review', 'published', 'rejected', 'cancelled', 'deleted'));

-- 4. Add rejection_reason column
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS rejection_reason text;

-- 5. Add deleted_at for soft-delete (matching events pattern)
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- 6. Create course_audit_log table
CREATE TABLE IF NOT EXISTS public.course_audit_log (
  id                uuid          PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id         uuid          NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
  action            text          NOT NULL CHECK (action IN ('created', 'edited', 'status_changed', 'deleted')),
  performed_by      uuid          REFERENCES profiles(id) ON DELETE SET NULL,
  performed_by_role text,
  changes           jsonb,
  created_at        timestamptz   NOT NULL DEFAULT now()
);

-- 7. Indexes
CREATE INDEX IF NOT EXISTS idx_course_audit_log_course_id
  ON public.course_audit_log(course_id);

CREATE INDEX IF NOT EXISTS idx_courses_created_by
  ON public.courses(created_by);

CREATE INDEX IF NOT EXISTS idx_courses_course_type
  ON public.courses(course_type);
