# Quick Task 260331-sbq: Fix avatar migration script resumability

**Status:** Complete
**Date:** 2026-03-31

## What was done

Fixed pagination bug in `scripts/migrate-wp-avatars.ts` `migrateAvatars()` function.

**Root cause:** The script used `offset += batchSize` to paginate through profiles. But when a profile is successfully migrated, its `avatar_url` changes from a WordPress URL to a Supabase URL, causing it to drop out of the `.like('avatar_url', '%members.globalonlineyogaassociation.org%')` WHERE clause. Incrementing the offset then skipped unmigrated profiles that shifted into lower positions.

**Fix:** Always query from `range(0, batchSize - 1)`. Since migrated profiles are automatically excluded by the WHERE clause, the next batch naturally starts with the first unmigrated profile. Removed the `offset` variable and related references.

## Files changed

- `scripts/migrate-wp-avatars.ts` — Removed offset-based pagination, always query from position 0
