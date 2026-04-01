---
phase: 29-interest-and-entry-points
plan: 01
subsystem: ui
tags: [react, nextjs, tailwind, teacher, school, cta]

# Dependency graph
requires:
  - phase: 28-database-foundation
    provides: principal_trainer_school_id column on profiles, schools table with principal_trainer_id

provides:
  - SchoolRegistrationCTA component with sidebar/callout/banner variants
  - Dashboard right sidebar school widget for teachers without a school
  - Subscriptions page school callout below membership card
  - Add-ons page school banner above product grid

affects:
  - 30-school-registration-flow
  - any phase adding teacher-specific dashboard widgets

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Pure presentational CTA component with variant prop for reuse across multiple surfaces"
    - "Role+school-ownership gating at the render site (parent determines visibility, component is dumb)"

key-files:
  created:
    - app/components/SchoolRegistrationCTA.tsx
    - docs/teacher/school-registration.md
  modified:
    - app/dashboard/page.tsx
    - app/settings/subscriptions/page.tsx
    - app/addons/page.tsx

key-decisions:
  - "CTA gated on member_type==='teacher' (dashboard) and role==='teacher' (server pages) — role column on profiles IS the member type"
  - "principal_trainer_school_id used on dashboard (client) vs isSchoolOwner computed server-side on subscriptions/addons — avoids extra DB query"
  - "Single reusable component with variant prop rather than three separate components"

patterns-established:
  - "Variant-prop pattern: pass variant to a single component instead of creating per-surface copies"
  - "Dashboard client component gates on profile?.member_type; server components gate on profile.role"

requirements-completed: [INT-01, INT-02, INT-03, INT-04]

# Metrics
duration: 4min
completed: 2026-03-31
---

# Phase 29 Plan 01: Interest & Entry Points Summary

**Three teacher-targeted school registration CTAs (sidebar widget, subscriptions callout, add-ons banner) linking to /schools/create, all gated on teacher role + no school ownership**

## Performance

- **Duration:** ~4 min
- **Started:** 2026-03-31T12:09:43Z
- **Completed:** 2026-03-31T12:13:57Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created `SchoolRegistrationCTA` reusable component with sidebar, callout, and banner visual variants
- Added school registration widget to dashboard right sidebar (client component, gated on `member_type === 'teacher'`)
- Added callout below membership card on subscriptions page and banner above product grid on add-ons page
- All three CTAs link to `/schools/create` and are invisible to non-teachers and school-owning teachers
- Created teacher docs file and regenerated search index per CLAUDE.md requirements

## Task Commits

1. **Task 1: Create SchoolRegistrationCTA component and add to dashboard** - `51874f8` (feat)
2. **Task 2: Add CTA to subscriptions and add-ons pages** - `b3e7163` (feat)

## Files Created/Modified

- `app/components/SchoolRegistrationCTA.tsx` - Reusable CTA with sidebar/callout/banner variants, all linking to /schools/create
- `app/dashboard/page.tsx` - Added member_type + principal_trainer_school_id to ProfileData, renders sidebar CTA conditionally
- `app/settings/subscriptions/page.tsx` - Renders callout CTA after BOX 1 for teachers without school
- `app/addons/page.tsx` - Renders banner CTA between PageHero and toolbar for teachers without school
- `docs/teacher/school-registration.md` - Teacher documentation for school registration entry points

## Decisions Made

- Dashboard uses `member_type === 'teacher'` from profile select (`*`) since it's a client component already fetching all profile columns; server pages use `role === 'teacher'` which is the same field
- Used existing `principal_trainer_school_id` (client) and `isSchoolOwner` / `ownsSchool` (server pages already computed these) — no additional DB queries required
- Single component with variant prop keeps the three surface implementations DRY

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- SchoolRegistrationCTA links to `/schools/create` — this route will be built in Phase 30 (school registration flow)
- Teacher gating logic is consistent with the gating that will be used throughout the school owner system

---
*Phase: 29-interest-and-entry-points*
*Completed: 2026-03-31*
