---
phase: 18-admin-inbox-teacher-upgrades
plan: 02
subsystem: admin-ui
tags: [admin, inbox, teacher-upgrade, next.js, react, tailwind]

# Dependency graph
requires:
  - phase: 18-01
    provides: approveUpgradeRequest and rejectUpgradeRequest server actions
  - phase: 08-db-foundation
    provides: upgrade_requests table, profiles table
provides:
  - TeacherUpgradesTab client component with Pending/Approved/Rejected sub-tabs
  - Updated inbox page with URL-param tab switching and Teacher Upgrades data fetch
affects: []

# Tech tracking
tech-stack:
  added: []
  patterns:
    - URL search param driven tab switching in Next.js server component (searchParams prop)
    - Service role client for joined profile query on upgrade_requests
    - (supabase as any) cast for untyped upgrade_requests table

key-files:
  created:
    - app/admin/inbox/TeacherUpgradesTab.tsx
  modified:
    - app/admin/inbox/page.tsx

key-decisions:
  - "URL search param tab switching (tab=schools|upgrades) over client-side state — server component, deep-linkable"
  - "getSupabaseService() for upgrade_requests join — service role required; consistent with admin pattern"
  - "(supabase as any) cast for upgrade_requests — not in generated types; consistent with codebase pattern"

patterns-established:
  - "Client component sub-tab switching via useState + filter — no URL params needed for nested sub-tabs"

requirements-completed: [ADM-01, ADM-02, ADM-05]

# Metrics
duration: 8min
completed: 2026-03-26
---

# Phase 18 Plan 02: Admin Inbox Teacher Upgrades Tab Summary

**Teacher Upgrades UI in admin inbox: sub-tabbed request cards with approve/reject actions wired to Phase 18-01 server actions**

## Performance

- **Duration:** 8 min
- **Started:** 2026-03-26T07:44:39Z
- **Completed:** 2026-03-26T07:52:09Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `TeacherUpgradesTab.tsx`: client component with Pending/Approved/Rejected sub-tabs, pending badge count, request cards showing user name/email/role/member-since, certificate download links, payment intent ID + $39.00 label, submission date, approve/reject buttons, inline rejection reason input
- Updated `page.tsx`: added `searchParams`-driven top-level tab switching, `getSupabaseService()` fetch for `upgrade_requests` joined with profiles, two Link-based tab buttons with pending badge counts, conditional rendering of either tab

## Task Commits

1. **Task 1: Create TeacherUpgradesTab.tsx client component** - `8ebb77c` (feat)
2. **Task 2: Update inbox page with Teacher Upgrades tab and data fetch** - `506fdd8` (feat)

## Files Created/Modified

- `app/admin/inbox/TeacherUpgradesTab.tsx` — New client component: sub-tabs, request cards, approve/reject handlers calling Plan 18-01 server actions
- `app/admin/inbox/page.tsx` — Updated: URL-param tab switching, upgrade_requests data fetch, two-tab navigation with badge counts

## Decisions Made

- URL search param tab switching (`tab=schools|upgrades`) chosen over client-side state — server component, deep-linkable, consistent with admin user detail page pattern
- `getSupabaseService()` for `upgrade_requests` join query — RLS restricts regular client; service role required for admin queries; consistent with codebase pattern
- `(supabase as any)` cast for `upgrade_requests` — table not in generated Supabase types; consistent with how other untyped tables are handled throughout the codebase

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None.

## Known Stubs

None — all data is wired to real Supabase queries and server actions.

## Next Phase Readiness

- Phase 18 is complete: both server actions (18-01) and the admin UI (18-02) are implemented
- No blockers for v1.3 milestone completion

## Self-Check: PASSED

- FOUND: app/admin/inbox/TeacherUpgradesTab.tsx
- FOUND: app/admin/inbox/page.tsx
- FOUND commit: 8ebb77c feat(18-02): create TeacherUpgradesTab client component
- FOUND commit: 506fdd8 feat(18-02): update inbox page with Teacher Upgrades tab and data fetch

---
*Phase: 18-admin-inbox-teacher-upgrades*
*Completed: 2026-03-26*
