---
phase: 28-database-foundation
plan: "02"
subsystem: database
tags: [postgres, supabase, rls, typescript, types]

# Dependency graph
requires:
  - "28-01 (schema tables with RLS enabled)"
provides:
  - "RLS policies on school_designations (5 policies: public/owner/admin)"
  - "RLS policies on school_faculty (6 policies: public/owner-CRUD/admin)"
  - "RLS policies on school_verification_documents (4 policies: owner/admin, no public SELECT)"
  - "Regenerated types/supabase.ts with all new school owner system tables and columns"
affects:
  - "29-interest-entry-points"
  - "30-school-registration-flow"
  - "31-school-onboarding-flow"
  - "32-school-settings"
  - "33-admin-school-management"
  - "34-public-school-profile"
  - "35-faculty-invitations"

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "RLS owner subquery pattern: EXISTS (SELECT 1 FROM schools WHERE id = school_id AND owner_id = auth.uid())"
    - "Admin check: EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))"
    - "Private-by-default for sensitive documents: school_verification_documents has NO public SELECT"
    - "Supabase Management API for SQL execution when CLI migration history is out of sync (same as plan 28-01)"

key-files:
  created:
    - "supabase/migrations/20260377_school_rls_policies.sql"
  modified:
    - "types/supabase.ts"
    - "docs/developer/database-schema.md"
    - "public/docs/search-index.json"

key-decisions:
  - "Created new migration 20260377_school_rls_policies.sql rather than appending to 20260376 (schema already applied remotely)"
  - "Used Supabase Management API for SQL execution (migration history still out of sync from plan 28-01)"
  - "Pre-existing tsc errors in test files (connect-button.test.tsx, page.test.tsx) are unrelated to schema changes — not blocking"

# Metrics
duration: 3min
completed: "2026-03-31"
---

# Phase 28 Plan 02: RLS Policies and TypeScript Types Summary

**RLS access control policies for school_designations, school_faculty, and school_verification_documents (15 policies total), plus regenerated TypeScript types including all new school owner system tables and columns**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-31T11:53:56Z
- **Completed:** 2026-03-31T11:56:56Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Created `20260377_school_rls_policies.sql` with 15 RLS policies: 5 for school_designations, 6 for school_faculty, 4 for school_verification_documents
- Applied policies via Supabase Management API; verified 15 rows in pg_policies query
- school_verification_documents intentionally has NO public SELECT — private documents only visible to owner and admins
- Regenerated `types/supabase.ts` — all new tables (school_designations, school_faculty, school_verification_documents) and new columns (onboarding_completed, short_bio, video_platform, location_lat, practice_styles, cover_image_url, principal_trainer_school_id, faculty_school_ids) present
- Updated developer docs RLS summary table to accurately reflect public read access on school_designations and school_faculty for approved schools

## Task Commits

1. **Task 1: Add RLS policies for new school tables** - `bc104ea` (feat)
2. **Task 2: Regenerate TypeScript types and verify compilation** - `501a44d` (feat)
3. **Task 2 docs: Update RLS policy table in database-schema.md** - `c37076c` (docs)

## Files Created/Modified

- `supabase/migrations/20260377_school_rls_policies.sql` — 15 RLS policies for the 3 new school tables (85 lines)
- `types/supabase.ts` — Regenerated with 254 new lines adding school owner system types
- `docs/developer/database-schema.md` — Updated RLS policy summary table for school tables
- `public/docs/search-index.json` — Regenerated (44 entries)

## Decisions Made

- New migration file `20260377_school_rls_policies.sql` created for RLS policies rather than appending to 20260376, since that migration was already applied remotely via the Management API in plan 28-01
- `npx supabase db push` failed again (same migration history sync issue as plan 28-01) — used Management API directly with SUPABASE_ACCESS_TOKEN, then `npx supabase migration repair --status applied 20260377`
- Pre-existing TypeScript errors in test files (connect-button.test.tsx, page.test.tsx) are from before this milestone and not caused by schema changes

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npx supabase db push` failed due to migration history conflict**
- **Found during:** Task 1 (migration push)
- **Issue:** Same migration history sync issue as plan 28-01 — remote has diverged from local tracking
- **Fix:** Executed SQL via Supabase Management API (`api.supabase.com/v1/projects/snddprncgilpctgvjukr/database/query`), then marked as applied via `npx supabase migration repair --status applied 20260377`
- **Files modified:** None (database state change only)
- **Verification:** API query confirmed 15 policies in pg_policies for the 3 tables

**2. [Rule 1 - Bug] Inaccurate RLS policy summary in docs**
- **Found during:** Task 2 (docs update check)
- **Issue:** `database-schema.md` showed "No access" for anonymous on school_designations and school_faculty, but the actual RLS policies grant public SELECT for approved schools
- **Fix:** Updated RLS summary table to show "Read (approved schools only)" for both tables
- **Files modified:** `docs/developer/database-schema.md`
- **Committed in:** `c37076c`

---

**Total deviations:** 2 auto-fixed (1 blocking, 1 bug)
**Impact on plan:** Both resolved without scope changes. All 15 policies applied as specified.

## RLS Policy Summary

| Table | Policy Count | Public Read | Owner Access | Admin Access |
|-------|-------------|-------------|--------------|--------------|
| `school_designations` | 5 | Approved schools only | View/Insert/Update own | Full CRUD |
| `school_faculty` | 6 | Approved schools only | View/Insert/Update/Delete own | Full CRUD |
| `school_verification_documents` | 4 | None (private) | View/Insert/Update own | Full CRUD |

## Issues Encountered

- Migration history sync remains unresolved — the Supabase CLI cannot push migrations. This is a pre-existing state from plan 28-01 (multiple `_skip_*` files and remote-local timestamp mismatch). Not a blocker since the Management API workaround is reliable and well-established.

## User Setup Required

None.

## Next Phase Readiness

- All 7 schema requirements (DB-01 through DB-07) are met
- RLS policies are live on all 3 new tables — downstream phases can safely query school data
- TypeScript types are current — all new tables and columns are typed
- Phase 29 (Interest & Entry Points) can proceed

## Self-Check: PASSED

- `supabase/migrations/20260377_school_rls_policies.sql` — FOUND
- `.planning/phases/28-database-foundation/28-02-SUMMARY.md` — FOUND
- Commit `bc104ea` — FOUND
- Commit `501a44d` — FOUND
- Commit `c37076c` — FOUND
- Remote DB: 15 RLS policies for school_designations/school_faculty/school_verification_documents — VERIFIED
- `types/supabase.ts` contains school_designations, school_faculty, school_verification_documents — VERIFIED

---
*Phase: 28-database-foundation*
*Completed: 2026-03-31*
