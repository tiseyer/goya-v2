---
phase: quick
plan: 260403-bpe
subsystem: dashboard-ui
tags: [ui, dashboard, hero, cleanup, standardization]
dependency_graph:
  requires: []
  provides: [PageHero used in all 4 dashboard layouts]
  affects: [app/dashboard/components/, app/components/PageHero.tsx]
tech_stack:
  added: []
  patterns: [PageHero reuse across dashboard layouts]
key_files:
  created: []
  modified:
    - app/dashboard/components/DashboardStudent.tsx
    - app/dashboard/components/DashboardTeacher.tsx
    - app/dashboard/components/DashboardWellness.tsx
    - app/dashboard/components/DashboardSchool.tsx
    - app/components/PageHero.tsx
  deleted:
    - app/dashboard/components/DashboardGreeting.tsx
decisions:
  - DashboardSchool uses school name not firstName so title is "Welcome, {schoolName}." rather than "Good {time}, {schoolName}." — school names are not personal names so time-of-day greeting feels awkward
metrics:
  duration: ~10 minutes
  completed: 2026-04-03
  tasks_completed: 2
  files_changed: 5
---

# Quick Task 260403-bpe: Standardize Page Hero Sections with Reusable PageHero

**One-liner:** Replaced inline DashboardGreeting component with full-width PageHero (variant=dark) across all 4 dashboard layouts, deleted the old component, and audited the codebase for remaining adoption candidates.

## Tasks Completed

### Task 1: Replace DashboardGreeting with PageHero in all 4 dashboard layouts

**Commit:** cbae423

Updated all 4 dashboard layout components to use `PageHero` with `variant="dark"`:

| Component | Pill | Title | Subtitle |
|-----------|------|-------|----------|
| DashboardStudent | "Student" | `Good {time}, {firstName}.` | "Ready to practice today?" |
| DashboardTeacher | "Teacher" | `Good {time}, {firstName}.` | "What will you teach today?" |
| DashboardWellness | "Wellness Practitioner" | `Good {time}, {firstName}.` | "Ready to support your clients?" |
| DashboardSchool | "School Owner" | `Welcome, {schoolName}.` | "Manage your school and students." |

Pattern applied: `PageHero` sits outside and before `PageContainer` in each layout's JSX tree. `getTimeOfDay()` is imported from `./utils` in each file (already a `'use client'` module). All `DashboardGreeting` imports and JSX usage removed.

### Task 2: Audit and cleanup

**Commit:** 7ddf829

- Deleted `app/dashboard/components/DashboardGreeting.tsx` — confirmed zero remaining imports before deletion.
- `app/dashboard/components/utils.tsx` retained — still imported by all 4 dashboard files for `getTimeOfDay()`.
- Added TODO comment block to `app/components/PageHero.tsx` listing 3 adoption candidates found via codebase audit.

## Adoption Candidates Logged in PageHero.tsx

| Page | Pattern Found |
|------|--------------|
| `app/about/page.tsx` | Hand-rolled dark hero `bg-[#1a2744]` with pill badge, `text-4xl/5xl/6xl` heading |
| `app/standards/page.tsx` | Same hand-rolled dark hero pattern with pill and `text-4xl/5xl` heading |
| `app/credits/page.tsx` | Inline page header div with `text-2xl sm:text-3xl font-bold` (light pattern) |

## Deviations from Plan

### Decision: DashboardSchool title uses "Welcome, {schoolName}." not "Good {time}, {schoolName}."

- **Found during:** Task 1
- **Reason:** School names are organizational names (e.g., "Cedar Ridge School"), not personal names. "Good morning, Cedar Ridge School." reads awkwardly. "Welcome, Cedar Ridge School." is more appropriate for an organization.
- **Impact:** Consistent with plan intent — greeting still personalized to the entity, just without time-of-day for the school case.

## Known Stubs

None — all 4 dashboard layouts wire live data (profile.full_name, school.name) through existing prop types unchanged.

## Verification

- `npx tsc --noEmit` passes (only pre-existing `.next/dev/types` artifact error unrelated to this work)
- `grep -r "DashboardGreeting" app/` returns no results
- All 4 `Dashboard*.tsx` files contain `<PageHero` with `variant="dark"`
- `PageHero.tsx` contains TODO comment listing 3 adoption candidates

## Self-Check: PASSED

- [x] `app/dashboard/components/DashboardStudent.tsx` — contains PageHero, no DashboardGreeting
- [x] `app/dashboard/components/DashboardTeacher.tsx` — contains PageHero, no DashboardGreeting
- [x] `app/dashboard/components/DashboardWellness.tsx` — contains PageHero, no DashboardGreeting
- [x] `app/dashboard/components/DashboardSchool.tsx` — contains PageHero, no DashboardGreeting
- [x] `app/dashboard/components/DashboardGreeting.tsx` — deleted
- [x] `app/components/PageHero.tsx` — contains TODO adoption candidates comment
- [x] Commit cbae423 exists
- [x] Commit 7ddf829 exists
