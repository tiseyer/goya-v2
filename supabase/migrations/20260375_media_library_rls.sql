-- ============================================================
-- Migration: Media Library — RLS Policies
--
-- is_admin() returns true for role IN ('admin', 'moderator')
-- Admin-only DELETE uses inline role check (no separate function)
--
-- Policy matrix:
--   SELECT  media_items:   admin/mod = all rows; member = own rows only; public = none
--   INSERT  media_items:   via service role only (registerMediaItem uses getSupabaseService)
--   UPDATE  media_items:   admin/mod only (title, alt_text, caption editing in Phase 2)
--   DELETE  media_items:   admin only (role = 'admin')
--   SELECT  media_folders: admin/mod all; members none; public none
--   INSERT  media_folders: admin/mod only
--   UPDATE  media_folders: admin/mod only
--   DELETE  media_folders: admin only
-- ============================================================

-- Enable RLS
ALTER TABLE public.media_items    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_folders  ENABLE ROW LEVEL SECURITY;

-- ── media_items ──────────────────────────────────────────────────────────────

-- Admin + moderator: read all (DB-03)
CREATE POLICY "Admins and moderators can read all media items"
  ON public.media_items FOR SELECT
  USING (public.is_admin());

-- Members: read own (DB-05)
CREATE POLICY "Members can read own media items"
  ON public.media_items FOR SELECT
  USING (uploaded_by = auth.uid());

-- Admin + moderator: update metadata (needed for Phase 2 detail panel)
CREATE POLICY "Admins and moderators can update media items"
  ON public.media_items FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin only: delete (DB-04)
CREATE POLICY "Admins can delete media items"
  ON public.media_items FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- No public SELECT, INSERT, or UPDATE policies — service role bypasses RLS for inserts (DB-06)

-- ── media_folders ─────────────────────────────────────────────────────────────

-- Admin + moderator: read all folders (DB-03)
CREATE POLICY "Admins and moderators can read media folders"
  ON public.media_folders FOR SELECT
  USING (public.is_admin());

-- Admin + moderator: create folders (DB-03)
CREATE POLICY "Admins and moderators can insert media folders"
  ON public.media_folders FOR INSERT
  WITH CHECK (public.is_admin());

-- Admin + moderator: rename / reorder folders (DB-03)
CREATE POLICY "Admins and moderators can update media folders"
  ON public.media_folders FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- Admin only: delete folders (DB-04)
CREATE POLICY "Admins can delete media folders"
  ON public.media_folders FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );
