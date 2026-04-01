# Quick Task 260331-sbq: Fix avatar migration script resumability

## Task 1: Fix pagination bug in migrateAvatars()

- **files:** scripts/migrate-wp-avatars.ts
- **action:** Remove offset-based pagination. Always query from offset 0 since migrated profiles drop out of the WHERE clause filter. Remove stale `offset` variable and references.
- **verify:** `npx tsc --noEmit` — no new errors in migrate-wp-avatars.ts
- **done:** Script correctly skips already-migrated profiles on re-run
