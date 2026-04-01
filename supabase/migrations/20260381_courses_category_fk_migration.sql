-- ============================================================
-- Migration: Courses Table Schema Migration
-- 1. Add category_id FK referencing course_categories
-- 2. Add duration_minutes integer column
-- 3. Backfill category_id by matching on category text name
-- 4. Backfill duration_minutes by parsing freeform duration text
-- 5. Drop legacy columns: category (text), vimeo_url, duration (text)
-- 6. Add index on category_id
-- ============================================================

-- Step 1: Add new columns
ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS category_id uuid REFERENCES public.course_categories(id) ON DELETE SET NULL;

ALTER TABLE public.courses
  ADD COLUMN IF NOT EXISTS duration_minutes integer;

-- Step 2: Backfill category_id from existing category text column (match on name)
UPDATE public.courses
SET category_id = cc.id
FROM public.course_categories cc
WHERE public.courses.category = cc.name;

-- Step 3: Backfill duration_minutes by parsing freeform duration text (e.g. "4h 30m")
UPDATE public.courses
SET duration_minutes = (
  COALESCE(
    (regexp_match(duration, '(\d+)h'))[1]::int * 60,
    0
  ) +
  COALESCE(
    (regexp_match(duration, '(\d+)m'))[1]::int,
    0
  )
)
WHERE duration IS NOT NULL AND duration != '';

-- Default any unparseable values to 0
UPDATE public.courses
SET duration_minutes = 0
WHERE duration IS NOT NULL AND duration != '' AND duration_minutes IS NULL;

-- Step 4: Drop legacy columns
-- Drop the category text CHECK constraint first
ALTER TABLE public.courses DROP CONSTRAINT IF EXISTS courses_category_check;
ALTER TABLE public.courses DROP COLUMN IF EXISTS category;
ALTER TABLE public.courses DROP COLUMN IF EXISTS vimeo_url;
ALTER TABLE public.courses DROP COLUMN IF EXISTS duration;

-- Step 5: Add index on category_id for join performance
CREATE INDEX IF NOT EXISTS idx_courses_category_id ON public.courses(category_id);
