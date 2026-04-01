---
task_id: 260331-oyv
date: 2026-03-31
status: complete
---

# Quick Task: Backfill Existing Storage Files into media_items

## Task Description

The `media_items` table was added after files already existed in Supabase Storage. This task created a one-time backfill script to bridge the gap — registering all pre-existing storage files into the new centralised media inventory.

## Status

Complete.

## Solution

Created `scripts/backfill-media-items.ts`:
- Recursively lists all files across 5 buckets (avatars, event-images, school-logos, upgrade-certificates, uploads)
- Skips files already in `media_items` (idempotent by `file_path + bucket`)
- Batch-inserts new rows in chunks of 50 with MIME type inference
- Added `media:backfill` npm script

**Result:** 5 avatar files inserted on first run. All other buckets empty. Second run confirmed 0 inserts (idempotent).

**Bug fixed:** `.env.local` path resolution — script now uses `process.cwd()` first so it works correctly when run from the main repo root rather than relative to `__dirname`.
