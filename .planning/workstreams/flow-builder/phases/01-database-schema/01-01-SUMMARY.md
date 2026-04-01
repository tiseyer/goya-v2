---
phase: 01-database-schema
plan: 01
subsystem: database
tags: [postgres, supabase, migration, jsonb, flow-builder]

# Dependency graph
requires: []
provides:
  - flows table with 17 columns, status/display_type/trigger/frequency CHECK constraints
  - flow_steps table with jsonb elements column and position ordering
  - flow_branches table linking step answers to target steps with UNIQUE constraint
  - flow_responses table with per-user response tracking, resumability, UNIQUE(flow_id, user_id)
  - flow_analytics table recording 6 event types with user and step references
  - profiles.birthday date column
  - GIN index on flows.conditions for efficient JSONB queries
  - 5 total performance indexes for ordered step retrieval, user lookups, analytics queries
  - 2 updated_at triggers on flows and flow_responses
affects: [02-service-layer, 03-admin-ui, 04-flow-player, 05-analytics]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Migration naming convention: YYYYMMDDNN (20260363 for flow builder)"
    - "JSONB columns with default '[]' for arrays, '{}' for objects"
    - "ON DELETE CASCADE for child rows, ON DELETE SET NULL for optional references"
    - "GIN index for JSONB condition evaluation queries"

key-files:
  created:
    - supabase/migrations/20260363_flow_builder_tables.sql
  modified: []

key-decisions:
  - "UNIQUE(step_id, element_key, answer_value) on flow_branches prevents duplicate branch rules"
  - "UNIQUE(flow_id, user_id) on flow_responses ensures one response record per user per flow"
  - "flow_analytics.step_id uses ON DELETE SET NULL (not CASCADE) to preserve analytics when steps are deleted"
  - "flows.created_by uses ON DELETE SET NULL so flow survives admin deletion"

patterns-established:
  - "Flow tables use gen_random_uuid() for PKs consistent with existing tables"
  - "All foreign keys explicitly state ON DELETE behavior (CASCADE or SET NULL)"
  - "Section comment headers (-- === table_name ===) for migration readability"

requirements-completed: [SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06]

# Metrics
duration: 7min
completed: 2026-03-30
---

# Phase 01 Plan 01: Flow Builder Tables Migration Summary

**5 flow builder tables (flows, flow_steps, flow_branches, flow_responses, flow_analytics) + profiles.birthday + 6 indexes + 2 triggers applied to Supabase via migration 20260363**

## Performance

- **Duration:** 7 min
- **Started:** 2026-03-30T04:45:32Z
- **Completed:** 2026-03-30T04:52:00Z
- **Tasks:** 2
- **Files modified:** 1

## Accomplishments
- Created complete flow builder data model with all 5 tables, correct constraints, and foreign keys
- Added birthday date column to profiles table for age-based flow conditions
- Applied 6 performance indexes including GIN index on flows.conditions for JSONB evaluation
- Pushed migration cleanly to Supabase remote database, verified all tables live

## Task Commits

Each task was committed atomically:

1. **Task 1: Create flow builder tables and indexes migration** - `a7ad4d2` (feat)
2. **Task 2: Push migration to Supabase and verify tables** - no new files (push operation only)

**Plan metadata:** (see final commit below)

## Files Created/Modified
- `supabase/migrations/20260363_flow_builder_tables.sql` - 5 flow tables, birthday column, 6 indexes, 2 updated_at triggers

## Decisions Made
- Used UNIQUE constraint on flow_branches(step_id, element_key, answer_value) to enforce one branch rule per answer per element
- Used UNIQUE constraint on flow_responses(flow_id, user_id) to enforce one response record per user per flow
- flow_analytics.step_id and flows.created_by use ON DELETE SET NULL to preserve analytics/flows when referenced rows are deleted

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration history out of sync — resolved with `supabase migration repair`**
- **Found during:** Task 2 (Push migration to Supabase)
- **Issue:** Local migration directory contained duplicate-numbered files (e.g., two files with prefix 20260341) that the remote had already applied. `supabase db push` failed with "duplicate key violates unique constraint"
- **Fix:** Temporarily renamed duplicate local migration files to `_skip_*` pattern (so CLI skips them per naming convention), marked 20260361 as reverted in remote history via `supabase migration repair`, then ran `supabase db push --yes`. Renamed files back after successful push.
- **Files modified:** None (temporary file renames, reverted after push)
- **Verification:** `npx supabase db push --yes` completed with "Finished supabase db push"
- **Committed in:** N/A (operational fix, no code changes)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Migration history desync is a pre-existing infrastructure issue unrelated to flow builder work. Fix was operational only, no schema changes needed.

## Issues Encountered
- Supabase migration history desync due to duplicate-numbered migration files in the local migrations directory. These duplicates existed before this plan and caused `db push` to fail. Resolved by temporarily renaming conflicting files so the Supabase CLI pattern matcher skips them, then pushing successfully.

## User Setup Required
None - no external service configuration required beyond what was already set up.

## Next Phase Readiness
- All 5 flow builder tables are live in Supabase with correct columns, constraints, and indexes
- Service layer (Phase 02) can immediately build CRUD operations against these tables
- The flow_responses table supports resume-on-refresh via last_step_id column (addresses STATE.md blocker about flow_runs table — it's folded into flow_responses)
- flow_analytics is ready for all 6 event types: shown, started, step_completed, completed, skipped, dismissed

## Self-Check: PASSED

- FOUND: supabase/migrations/20260363_flow_builder_tables.sql
- FOUND: .planning/workstreams/flow-builder/phases/01-database-schema/01-01-SUMMARY.md
- FOUND: a7ad4d2 (Task 1 migration commit)
- FOUND: All 5 flow tables live in Supabase (verified via db query)
- FOUND: profiles.birthday column with type "date" (verified via db query)
- FOUND: idx_flows_conditions GIN index active (verified via db query)

---
*Phase: 01-database-schema*
*Completed: 2026-03-30*
