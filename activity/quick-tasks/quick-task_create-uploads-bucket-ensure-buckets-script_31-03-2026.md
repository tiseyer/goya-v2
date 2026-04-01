---
task_id: 260331-s4z
date: 2026-03-31
status: complete
---

# Quick Task: Create uploads bucket and ensure-buckets setup script

## Task Description

The `uploads` Supabase Storage bucket was missing, blocking `npm run avatars:migrate` from uploading GOYA logos. This task creates an idempotent `scripts/ensure-buckets.ts` script and adds `npm run buckets:ensure` to package.json.

## Status

Complete.

## Solution

- Created `scripts/ensure-buckets.ts`: uses the same dotenv/service-role pattern as `migrate-wp-avatars.ts`. Iterates over three buckets (`avatars` public, `uploads` public, `school-documents` private), calls `supabase.storage.createBucket()`, handles "already exists" errors gracefully, exits with code 1 on any real failure.
- Added `"buckets:ensure": "tsx scripts/ensure-buckets.ts"` to `package.json`.
- Ran `npm run buckets:ensure`: created the `uploads` bucket; `avatars` and `school-documents` already existed.
- Commit: `9b9277b`
