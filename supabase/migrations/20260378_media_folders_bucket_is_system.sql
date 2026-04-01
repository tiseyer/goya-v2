-- ============================================================
-- Migration: Media Folders — bucket default + is_system column
-- Adds DEFAULT 'media' to existing bucket column (SCHEMA-01)
-- Adds is_system boolean NOT NULL DEFAULT false (SCHEMA-02)
--
-- Note: media_folders table and bucket column already exist
-- from migration 20260374_media_library_schema.sql.
-- This migration does NOT recreate or drop anything.
-- ============================================================

-- SCHEMA-01: Set default 'media' on existing bucket column
ALTER TABLE public.media_folders
  ALTER COLUMN bucket SET DEFAULT 'media';

-- SCHEMA-02: Add is_system column to distinguish system folders
-- from user-created folders (used by bucket-based sidebar UI)
ALTER TABLE public.media_folders
  ADD COLUMN IF NOT EXISTS is_system boolean NOT NULL DEFAULT false;
