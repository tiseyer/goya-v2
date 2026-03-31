---
task: migrate-wp-avatars
date: 2026-03-31
status: Complete
---

# Quick Task: Migrate WordPress Avatar URLs and GOYA Logos

## Description

Created a migration script to eliminate dependency on WordPress servers for member avatar images, and to centralize GOYA brand assets in Supabase Storage alongside existing media.

**Scope:**
- Migrate all profiles with `avatar_url` pointing to `members.globalonlineyogaassociation.org` into the `avatars` Supabase Storage bucket
- Upload 5 GOYA brand logo files from `public/images/` into the `uploads` bucket under the `brand/` path
- Register all migrated/uploaded files in the `media_items` table

## Status

Complete — script created and verified with `--dry-run` flag.

Dry-run output confirmed: **found real WordPress avatar URLs** across multiple profile batches, logo upload paths correct.

## Solution

Created `scripts/migrate-wp-avatars.ts` with:

- **Batch processing:** Queries profiles 50 at a time using `.range(offset, offset+49)`
- **Resumability:** Skips profiles whose `avatar_url` already contains the Supabase URL; skips logos already present in `media_items`
- **Error resilience:** Per-profile try/catch — errors are logged and counted but don't abort the run
- **Dry-run mode:** `--dry-run` flag logs all intended actions without performing any uploads, updates, or inserts
- **Content-Type detection:** Infers file extension from HTTP `Content-Type` header, falls back to URL extension, defaults to `jpg`
- **media_items registration:** Inserts a record for every successfully migrated avatar and uploaded logo (folder set to `null` — UUID FK, not text string)

Added `"avatars:migrate": "tsx scripts/migrate-wp-avatars.ts"` to `package.json` scripts.

## Files

- `scripts/migrate-wp-avatars.ts` — migration script (created)
- `package.json` — added `avatars:migrate` npm script
