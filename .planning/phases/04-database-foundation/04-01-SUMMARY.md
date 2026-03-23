---
phase: 04-database-foundation
plan: 01
subsystem: database
tags: [supabase, postgres, rls, migrations, connections]

# Dependency graph
requires: []
provides:
  - connections table DDL with requester_id, recipient_id, type, status, created_at, updated_at
  - RLS policies (select, insert, update, delete) scoped to either connection party
  - updated_at trigger using existing update_updated_at_column() function
affects:
  - 05-connect-button
  - 06-settings-connections
  - 07-admin-connections

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration file per feature in supabase/migrations/ with sequential timestamp prefix"
    - "RLS: either-party policies using (auth.uid() = col_a or auth.uid() = col_b)"
    - "Reuse update_updated_at_column() trigger function across tables"

key-files:
  created:
    - supabase/migrations/20260339_add_connections.sql
  modified: []

key-decisions:
  - "unique(requester_id, recipient_id) prevents duplicate connection requests"
  - "type constrained to peer/mentorship/faculty — matches role-aware UI in Phase 5"
  - "status defaults to pending — insert-only by requester, update by either party"

patterns-established:
  - "Pattern: RLS either-party select/update/delete uses `auth.uid() = col OR auth.uid() = col` pattern"
  - "Pattern: Reuse update_updated_at_column() function — do not redefine in new migrations"

requirements-completed: [DB-01, DB-02, DB-03]

# Metrics
duration: 5min
completed: 2026-03-23
---

# Phase 04 Plan 01: Connections Table Migration Summary

**Connections table created in Supabase migration with peer/mentorship/faculty types, RLS policies for either-party access, and updated_at trigger — awaiting `npx supabase db push` to go live**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-23T11:10:00Z
- **Completed:** 2026-03-23T11:15:00Z
- **Tasks:** 1 of 2 automated (Task 2 is human-gated db push)
- **Files modified:** 1

## Accomplishments
- Created `supabase/migrations/20260339_add_connections.sql` with full table DDL
- RLS enabled with 4 policies covering select, insert, update, delete
- unique constraint on (requester_id, recipient_id) prevents duplicate requests
- Reused existing `update_updated_at_column()` trigger function

## Task Commits

Each task was committed atomically:

1. **Task 1: Create connections table migration file** - `f7520a0` (feat)
2. **Task 2: Push migration to Supabase** - human-gated checkpoint (no commit — user runs `npx supabase db push`)

**Plan metadata:** (added in final commit)

## Files Created/Modified
- `supabase/migrations/20260339_add_connections.sql` - Connections table DDL, 4 RLS policies, updated_at trigger

## Decisions Made
- type column constrained to ('peer', 'mentorship', 'faculty') — matches role-aware connect button logic in Phase 5
- status defaults to 'pending' so insert creates a pending request; either party can update (accept/decline)
- unique(requester_id, recipient_id) prevents duplicate outbound requests at DB level

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

**Task 2 requires manual database push:**

Run from project root:
```
npx supabase db push
```

Then verify in Supabase dashboard:
- `connections` table exists with columns: id, requester_id, recipient_id, type, status, created_at, updated_at
- RLS is enabled (shield icon visible)
- 4 policies present

## Next Phase Readiness
- Once `npx supabase db push` completes successfully, the connections table is live
- Phase 05 (connect-button) can wire ConnectButton.tsx and ConnectionsContext.tsx to real Supabase queries
- Phase 06 (settings-connections) can implement the Settings > Connections tabbed UI
- Phase 07 (admin-connections) can add the Connections tab to admin user detail view

---
*Phase: 04-database-foundation*
*Completed: 2026-03-23*
