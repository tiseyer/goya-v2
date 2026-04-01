# Quick Task: Fix "use server" export error in admin media actions

**Status:** Complete
**Date:** 2026-03-31

## Task

Build error: `app/admin/media/actions.ts` exported a const object (`MEDIA_BUCKETS`) from a "use server" file, which only allows async function exports.

## Solution

Extracted `MEDIA_BUCKETS` and `BucketKey` type to `app/admin/media/constants.ts`. Updated 3 files to import from the new location.
