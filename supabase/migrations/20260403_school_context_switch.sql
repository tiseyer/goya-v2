-- =============================================================================
-- School Context Switch
-- Migration: 20260403_school_context_switch
-- Adds: can_manage to school_faculty, author context columns to events/courses/messages
-- =============================================================================

-- === Section 1: Add can_manage to school_faculty ===

ALTER TABLE public.school_faculty
  ADD COLUMN IF NOT EXISTS can_manage boolean DEFAULT false;

-- === Section 2: Author context columns on events ===

ALTER TABLE public.events
  ADD COLUMN IF NOT EXISTS author_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS school_author_id uuid REFERENCES public.schools(id);

-- === Section 3: Author context columns on courses ===

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS author_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS school_author_id uuid REFERENCES public.schools(id);

-- === Section 4: Author context columns on messages ===

ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS sender_type text DEFAULT 'personal',
  ADD COLUMN IF NOT EXISTS sender_school_id uuid REFERENCES public.schools(id);

-- === Section 5: Indexes ===

CREATE INDEX IF NOT EXISTS idx_events_school_author ON public.events(school_author_id) WHERE school_author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_courses_school_author ON public.courses(school_author_id) WHERE school_author_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_messages_sender_school ON public.messages(sender_school_id) WHERE sender_school_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_school_faculty_can_manage ON public.school_faculty(school_id) WHERE can_manage = true;
