# Quick Task 260331-n9o: Fix "use server" export error in admin media actions

**Status:** Complete
**Date:** 2026-03-31

## Problem

`app/admin/media/actions.ts` has `'use server'` at the top but exported `MEDIA_BUCKETS` (a const array/object). Next.js "use server" files can only export async functions.

## Solution

1. Created `app/admin/media/constants.ts` — moved `MEDIA_BUCKETS` and `BucketKey` type there
2. Updated `actions.ts` — imports `MEDIA_BUCKETS` from `./constants` instead of exporting it
3. Updated `MediaPageClient.tsx` — imports `MEDIA_BUCKETS` from `./constants`
4. Updated `FolderSidebar.tsx` — imports `MEDIA_BUCKETS` from `./constants`

## Verification

- No "use server" export errors in tsc output
- All remaining tsc errors are pre-existing (missing module declarations)
