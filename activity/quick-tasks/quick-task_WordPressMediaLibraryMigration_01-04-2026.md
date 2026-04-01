# Quick Task: WordPress Media Library Migration Script

**Date:** 01-04-2026
**Task ID:** 260401-f1l
**Status:** Done

## Task Description

Create a migration script to move all WordPress media library files into Supabase Storage and register them in the `media_items` table. This is required to fully decommission the WordPress backend.

## Solution

### Task 1: DB Migration + npm Script

- Created `supabase/migrations/20260401_add_wp_media_id_to_media_items.sql`:
  - Adds `wp_media_id` integer column (nullable) to `media_items`
  - Creates partial unique index (`WHERE wp_media_id IS NOT NULL`) to enforce deduplication without affecting existing rows
- Applied via Supabase Management API (db push blocked by CLI history mismatch — established pattern for this project)
- Added `"media:migrate-wp": "tsx scripts/migrate-wp-media.ts"` to package.json

### Task 2: Migration Script

Created `scripts/migrate-wp-media.ts` with:

- WP REST API pagination (`/wp-json/wp/v2/media?per_page=100&page=N`) with Basic Auth
- Skips `wp-content/uploads/avatars/` paths (handled by separate `avatars:migrate` script)
- Downloads files with 3x exponential backoff retry (1s / 2s / 4s)
- Uploads to Supabase Storage `media` bucket under `wp-media/{subfolder}/{wp_media_id}_{filename}`
- Upserts `media_items` with `onConflict: 'wp_media_id'` for idempotent re-runs
- Matches WP authors to Supabase profiles by email (cached in memory)
- Strips HTML entities from title/caption fields
- Per-page progress tracking: `.migration-state/wp-media-progress.json`
- Failure tracking: `.migration-state/wp-media-failures.json`
- Supports `--dry-run` and `--resume` flags

## Commits

- `d64f9b9` — chore(260401-f1l): add wp_media_id to media_items + npm script
- `cb51c1a` — feat(260401-f1l): add WordPress media library migration script
