-- ============================================================
-- Migration: Add soft-delete support to courses table
-- ============================================================

-- Add deleted_at column for soft-delete
ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS deleted_at timestamptz DEFAULT null;

-- Expand status CHECK constraint to include 'deleted'
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_status_check;
ALTER TABLE public.courses ADD CONSTRAINT courses_status_check CHECK (status IN ('published', 'draft', 'deleted'));
