---
phase: quick-task
plan: 260401-f1l
subsystem: scripts/migrations
tags: [wordpress, migration, storage, media-library, supabase]
dependency_graph:
  requires: [media_items table, media bucket]
  provides: [wp_media_id column, media:migrate-wp script]
  affects: [media_items, Supabase Storage media bucket]
tech_stack:
  added: []
  patterns: [Management API migration, exponential backoff retry, email-based author resolution, partial unique index for deduplication]
key_files:
  created:
    - supabase/migrations/20260401_add_wp_media_id_to_media_items.sql
    - scripts/migrate-wp-media.ts
  modified:
    - package.json
    - docs/developer/storage.md
decisions:
  - "Applied migration via Supabase Management API — db push blocked by CLI history mismatch (established pattern per STATE.md)"
  - "Partial unique index on wp_media_id (WHERE NOT NULL) allows existing rows without WP origin to remain unchanged"
  - "Author resolution fetches /wp-json/wp/v2/users/{id} per unique author then caches WP ID -> email and email -> profile ID"
  - "Storage path prefix wp-media/ scopes migrated files away from UI-uploaded content"
metrics:
  duration_minutes: 15
  tasks_completed: 2
  files_created: 3
  files_modified: 2
  completed_date: "2026-04-01"
---

# Quick Task 260401-f1l: WordPress Media Library Migration Script Summary

One-liner: WP media library migration script with Basic Auth pagination, subfolder routing, exponential-backoff downloads, wp_media_id deduplication, and per-page progress/failure tracking.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | DB migration (wp_media_id column + partial unique index) + npm script | d64f9b9 | 20260401_add_wp_media_id_to_media_items.sql, package.json |
| 2 | WordPress media migration script | cb51c1a | scripts/migrate-wp-media.ts |
| — | Docs + activity | 7502b4a | docs/developer/storage.md, search-index.json, activity/quick-tasks/ |

## What Was Built

### DB Migration (`supabase/migrations/20260401_add_wp_media_id_to_media_items.sql`)

- Adds `wp_media_id integer` (nullable) to `public.media_items`
- Creates `media_items_wp_media_id_idx` — a partial unique index `WHERE wp_media_id IS NOT NULL`
- Applied via Supabase Management API (db push blocked on this project — see STATE.md decisions)

### npm Script

Added `"media:migrate-wp": "tsx scripts/migrate-wp-media.ts"` to package.json, adjacent to `avatars:migrate`.

### Migration Script (`scripts/migrate-wp-media.ts`)

Full WordPress media library migrator:

**API access:**
- `GET https://members.globalonlineyogaassociation.org/wp-json/wp/v2/media?per_page=100&page=N`
- Basic Auth header using `WP-Media-Library-Migration` application password
- Stops on HTTP 400/404 (WP past-last-page response) or empty array

**File handling:**
- Skips `wp-content/uploads/avatars/` paths (separate `avatars:migrate` script handles these)
- Downloads with 3x retry / exponential backoff (1 s → 2 s → 4 s)
- Routes to subfolders: `images/`, `videos/`, `audio/`, `documents/`, `other/` based on mime type
- Storage path: `wp-media/{subfolder}/{wp_media_id}_{original_filename}`
- Uploads to `media` bucket with `upsert: true`

**Author resolution:**
- Fetches `/wp-json/wp/v2/users/{id}` for each unique WP author
- Caches `WP user ID -> email` and `email -> Supabase profile ID` in-memory Maps
- Falls back to `uploaded_by: null` if no matching profile found

**Database:**
- Upserts `media_items` with `onConflict: 'wp_media_id'`
- Strips HTML entities from `title.rendered` and `caption.rendered`
- Pre-fetches already-migrated `wp_media_id` set from DB to skip on resume

**Progress/failure tracking:**
- `.migration-state/wp-media-progress.json` — updated after every page
- `.migration-state/wp-media-failures.json` — appended after every page

**Flags:**
- `--dry-run` — logs actions without writes
- `--resume` — reads `lastCompletedPage` from progress file and starts there

## Deviations from Plan

None — plan executed exactly as written. Migration applied via Management API as noted in plan action instructions.

## Known Stubs

None. Script is not run during plan execution by design — no stubs exist.

## Self-Check

- [x] `supabase/migrations/20260401_add_wp_media_id_to_media_items.sql` exists
- [x] `scripts/migrate-wp-media.ts` exists
- [x] `package.json` contains `media:migrate-wp` script
- [x] `wp_media_id` column confirmed live via Management API query
- [x] Partial unique index `media_items_wp_media_id_idx` confirmed live
- [x] `npx tsc --noEmit` — only pre-existing `linkify-it`/`mdurl` errors, none from our script

## Self-Check: PASSED
