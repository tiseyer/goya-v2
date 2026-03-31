---
phase: quick
plan: 260331-pe2
subsystem: media/storage
tags: [migration, avatars, storage, media-items, brand-assets]
dependency_graph:
  requires: []
  provides: [scripts/migrate-wp-avatars.ts]
  affects: [profiles, media_items, avatars bucket, uploads bucket]
tech_stack:
  added: []
  patterns: [batch-pagination, dry-run-flag, resumable-migration]
key_files:
  created:
    - scripts/migrate-wp-avatars.ts
    - activity/quick-tasks/quick-task_migrate-wp-avatars_31-03-2026.md
  modified:
    - package.json
decisions:
  - folder column in media_items set to null (UUID FK, not text string 'brand')
  - file_path uses 'brand/{filename}' convention for logo files in uploads bucket
  - Per-profile error handling: log and continue (non-fatal), increment failed counter
metrics:
  duration: ~5 minutes
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Quick Task 260331-pe2: Migrate WordPress Avatar URLs and GOYA Logos — Summary

**One-liner:** Batch-resumable migration script moving WordPress-hosted avatars to Supabase `avatars` bucket and uploading 5 GOYA brand logos to `uploads/brand/`, with dry-run support and `media_items` registration.

## What Was Built

### scripts/migrate-wp-avatars.ts

Migration script with two functions:

**migrateAvatars():**
- Queries `profiles` where `avatar_url LIKE '%members.globalonlineyogaassociation.org%'` in batches of 50
- For each profile: fetches image via HTTP, detects extension from `Content-Type` header, uploads to `avatars/{user_id}/avatar.{ext}`, updates `profiles.avatar_url`, inserts into `media_items`
- Resumability: skips profiles whose URL already contains the Supabase project URL
- Per-profile try/catch — failures logged and counted, run continues

**migrateLogos():**
- Reads 5 files from `public/images/`: Favicon.png, GOYA Logo Black.png, GOYA Logo Blue.png, GOYA Logo Short.png, GOYA Logo White.png
- Checks `media_items` for existing `file_path = brand/{filename}` before uploading (resumability)
- Uploads to `uploads` bucket at path `brand/{filename}` with `upsert: true`
- Inserts into `media_items` with `folder: null` (UUID FK — not the string 'brand')

**Dry-run mode:** `--dry-run` flag skips all network calls and DB writes; logs what would happen.

### package.json

Added `"avatars:migrate": "tsx scripts/migrate-wp-avatars.ts"` to scripts.

## Verification

Dry-run confirmed working — found multiple batches of real WordPress avatar URLs and logged correct migration targets.

```
[DRY RUN] No uploads, inserts, or updates will be performed.
Starting WordPress avatar migration...
=== Migrating WordPress Avatar URLs ===
Processing batch at offset 0: 50 profiles
  [DRY RUN] Would migrate user 70fbe547-...: https://members.globalonlineyogaassociation.org/...
  ...
```

## Deviations from Plan

### Auto-applied Constraint

**[Constraint] folder = null for media_items inserts (logos)**
- **Reason:** Plan specified `folder='brand'` but `folder` column is a UUID FK to `media_items_folders` table, not a text field
- **Fix:** Set `folder: null` on all inserts; use `file_path = 'brand/{filename}'` to encode location
- **Applied to:** Both avatar and logo `media_items` inserts

## Known Stubs

None — this is a migration script with no UI rendering.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1    | f078306 | feat(quick/260331-pe2): add WP avatar + GOYA logo migration script |
| 2    | 1d2fd6c | chore(quick/260331-pe2): add avatars:migrate npm script and activity log |

## Self-Check: PASSED

- [x] scripts/migrate-wp-avatars.ts exists
- [x] package.json has avatars:migrate script
- [x] activity/quick-tasks/quick-task_migrate-wp-avatars_31-03-2026.md exists
- [x] Commits f078306 and 1d2fd6c exist
- [x] Dry-run verified: script runs without errors, logs real WP avatar URLs
