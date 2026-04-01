-- ============================================================
-- Migration: Media Library — Schema
-- Creates media_items and media_folders tables (DB-01, DB-02)
--
-- Buckets expected to exist (see Task 8 verification):
--   avatars, event-images, school-logos, upgrade-certificates,
--   chatbot-avatars, post-images, post-videos, post-audio
-- ============================================================

-- media_folders must be created first because media_items.folder references it
CREATE TABLE IF NOT EXISTS public.media_folders (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name        text NOT NULL,
  parent_id   uuid REFERENCES public.media_folders(id) ON DELETE CASCADE,
  bucket      text NOT NULL,
  sort_order  integer NOT NULL DEFAULT 0,
  created_by  uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.media_items (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  bucket         text NOT NULL,
  folder         uuid REFERENCES public.media_folders(id) ON DELETE SET NULL,
  file_name      text NOT NULL,
  file_path      text NOT NULL,
  file_url       text NOT NULL,
  file_type      text NOT NULL,                      -- MIME type e.g. image/jpeg
  file_size      bigint,                             -- bytes
  width          integer,                            -- pixels, images only
  height         integer,                            -- pixels, images only
  title          text,
  alt_text       text,
  caption        text,
  uploaded_by    uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  uploaded_by_role text,                             -- snapshot of role at upload time
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS media_items_uploaded_by_idx ON public.media_items(uploaded_by);
CREATE INDEX IF NOT EXISTS media_items_bucket_idx      ON public.media_items(bucket);
CREATE INDEX IF NOT EXISTS media_folders_bucket_idx    ON public.media_folders(bucket);
CREATE INDEX IF NOT EXISTS media_folders_parent_idx    ON public.media_folders(parent_id);

-- updated_at trigger (same pattern as member_courses)
CREATE OR REPLACE FUNCTION public.set_media_items_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TRIGGER media_items_updated_at
  BEFORE UPDATE ON public.media_items
  FOR EACH ROW EXECUTE FUNCTION public.set_media_items_updated_at();
