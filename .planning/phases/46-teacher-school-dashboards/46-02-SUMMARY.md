---
phase: 46-teacher-school-dashboards
plan: "02"
subsystem: dashboard
tags: [school-dashboard, school-view, faculty, connections, ui]
dependency_graph:
  requires: []
  provides: [school-dashboard-layout]
  affects: [app/dashboard]
tech_stack:
  added: []
  patterns: [compose-shared-components, list-with-empty-state]
key_files:
  created: []
  modified:
    - app/dashboard/components/DashboardSchool.tsx
decisions:
  - "School name used as greeting firstName to give the dashboard a school-owner framing"
  - "ProfileCompletionCard reuses teacher scoring for now — school-specific scoring deferred"
  - "Faculty and student lists rendered as vertical flex lists (not carousels) per context decision"
  - "Width override via Tailwind arbitrary variant [&>a]:w-full to make 280px-wide cards fill the list"
metrics:
  duration_minutes: 8
  completed_date: "2026-04-02"
  tasks_completed: 1
  tasks_total: 1
  files_changed: 1
---

# Phase 46 Plan 02: DashboardSchool — Full School Layout Summary

Replaced the DashboardSchool stub with a fully assembled school-view dashboard: school-name greeting with amber "School" badge, "View as Teacher" toggle pill, profile completion card, stat hero placeholder, two school-specific CTAs, and vertical lists for faculty (max 5) and enrolled students (max 5).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Replace DashboardSchool stub with full layout | 122fde0 | app/dashboard/components/DashboardSchool.tsx |

## Deviations from Plan

### Auto-fixed Issues

None - plan executed exactly as written.

## Known Stubs

- **StatHero value={null}** — `app/dashboard/components/DashboardSchool.tsx` line ~68. Renders "—" placeholder. School discovery analytics not yet wired to a real data source. Intentional per plan (SCH-03 specifies placeholder dash).

## Self-Check: PASSED

- [x] `app/dashboard/components/DashboardSchool.tsx` exists and has 150+ lines
- [x] Commit 122fde0 exists in git log
- [x] DashboardGreeting with role="school" and school.name present
- [x] "View as Teacher" link to /dashboard present
- [x] ProfileCompletionCard rendered when score < 100
- [x] StatHero with value={null} and school discovery label present
- [x] Two PrimaryActionCards (courses + designations) present
- [x] faculty.slice(0, 5) with FacultyCard and "Manage faculty" link present
- [x] connections.slice(0, 5) with ConnectionCard and "View all" link present
- [x] No StubSection references remain
- [x] tsc --noEmit passes (one pre-existing unrelated error in .next/dev/types/)
