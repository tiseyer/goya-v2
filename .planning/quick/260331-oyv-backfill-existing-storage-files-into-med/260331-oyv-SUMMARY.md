---
phase: quick
plan: 260331-oyv
subsystem: media
tags: [supabase, storage, media-items, backfill, scripts]

requires: []
provides:
  - One-time backfill script that registers all pre-existing Supabase Storage files into media_items
  - Idempotent npm script "media:backfill" for safe re-runs
affects: [media-library, admin-media]

tech-stack:
  added: []
  patterns:
    - "Recursive storage listing: listFilesRecursively() walks bucket tree using item.id === null to detect folders"
    - "Idempotent backfill: load existing file_paths into a Set before insert to skip already-registered files"
    - "CWD-based env loading for scripts that run from different directories than their source"

key-files:
  created:
    - scripts/backfill-media-items.ts
  modified:
    - package.json
    - docs/developer/storage.md

key-decisions:
  - "Use process.cwd() for .env.local resolution so script works from main repo root across worktree environments"
  - "Batch insert in chunks of 50 to avoid Supabase request size limits"
  - "Store null for uploaded_by and folder on legacy files since provenance is unknown"

patterns-established:
  - "Backfill pattern: query existing rows into a Set, filter new files, batch insert"

requirements-completed: []

duration: 15min
completed: 2026-03-31
---

# Quick Task 260331-oyv: Backfill Existing Storage Files into media_items

**One-time backfill script that registers all pre-existing Supabase Storage files into the media_items table, bridging the gap between files uploaded before the media library existed and the new centralised inventory.**

## Performance

- **Duration:** ~15 min
- **Completed:** 2026-03-31
- **Tasks:** 2/2
- **Files modified:** 3

## Accomplishments

### Task 1: Create backfill script and add npm script

Created `scripts/backfill-media-items.ts` following the same env-loading pattern as `scripts/seed-faqs.ts`. The script:

- Loads env from `process.cwd()/.env.local` (with `__dirname`-relative fallback)
- Recursively lists all files in 5 buckets: `avatars`, `event-images`, `school-logos`, `upgrade-certificates`, `uploads`
- Skips `.emptyFolderPlaceholder` files created by Supabase
- Detects folders via `item.id === null` and recurses into them
- Paginates `storage.list()` with limit=1000 and offset loop
- Deduplicates by querying existing `file_path` values per bucket into a Set
- Infers MIME type from file extension
- Batch-inserts new rows in chunks of 50

Added `"media:backfill": "tsx scripts/backfill-media-items.ts"` to `package.json`.

### Task 2: Run backfill and verify idempotency

Executed `npm run media:backfill` from the main repo root:

```
[avatars] Found 5 files, 0 already registered, 5 inserted
[event-images] Found 0 files, 0 already registered, 0 inserted
[school-logos] Found 0 files, 0 already registered, 0 inserted
[upgrade-certificates] Found 0 files, 0 already registered, 0 inserted
[uploads] Found 0 files, 0 already registered, 0 inserted
Backfill complete: 5 total files inserted across all buckets
```

Second run confirmed idempotency:
```
[avatars] Found 5 files, 5 already registered, 0 inserted
Backfill complete: 0 total files inserted across all buckets
```

### Documentation

Updated `docs/developer/storage.md`:
- Corrected the media library bucket list to match `constants.ts` (avatars, event-images, school-logos, upgrade-certificates, uploads)
- Added backfill script documentation with usage instructions

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed .env.local path resolution in worktree environments**
- **Found during:** Task 2 (first run failed)
- **Issue:** Script used `resolve(__dirname, '..', '.env.local')` which resolved to the worktree directory (not main repo root) when run via `npm run media:backfill`
- **Fix:** Added `config({ path: resolve(process.cwd(), '.env.local') })` as primary resolution before the `__dirname`-relative fallback
- **Files modified:** scripts/backfill-media-items.ts
- **Commit:** b3d7bc0

## Known Stubs

None — the backfill script is complete and the data is live in media_items.

## Commits

| Hash | Message |
|------|---------|
| 3d282da | feat(quick-260331-oyv): add media:backfill script for storage to media_items |
| b3d7bc0 | fix(quick-260331-oyv): fix env loading to work from CWD for worktree environments |

## Self-Check: PASSED

- [x] `scripts/backfill-media-items.ts` exists
- [x] `package.json` contains `media:backfill` script
- [x] Backfill ran successfully — 5 rows inserted
- [x] Second run produced 0 inserts (idempotent)
- [x] `docs/developer/storage.md` updated
- [x] docs:index regenerated
