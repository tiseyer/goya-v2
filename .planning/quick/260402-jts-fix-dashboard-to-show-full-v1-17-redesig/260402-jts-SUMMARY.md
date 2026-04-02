---
phase: quick
plan: 260402-jts
subsystem: dashboard
tags: [student-dashboard, carousels, teacher-card, ui]
one_liner: "Restored full v1.17 student dashboard with TeacherCard and 3 horizontal carousels (teachers, courses, events)"
dependency_graph:
  requires: []
  provides: [TeacherCard component, DashboardStudent carousel layout]
  affects: [app/dashboard/components/DashboardStudent.tsx]
tech_stack:
  added: []
  patterns: [HorizontalCarousel with emptyState, TeacherCard for carousel display]
key_files:
  created:
    - app/dashboard/components/TeacherCard.tsx
  modified:
    - app/dashboard/components/DashboardStudent.tsx
decisions:
  - teacherConnections filtered by role=teacher from AcceptedConnection.profile.role
  - teaching_styles and location passed as null (not available on ConnectionProfile — future enhancement)
metrics:
  duration: "~10 minutes"
  completed: "2026-04-02"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260402-jts: Fix Dashboard to Show Full v1.17 Redesign — Summary

**One-liner:** Restored full v1.17 student dashboard with TeacherCard and 3 horizontal carousels (teachers, courses, events)

## What Was Done

The student dashboard was showing a stub layout (3 stat cards via StubSection components) instead of the carousel layout built in Phase 45. The root cause was that the Phase 45 worktree commits were never merged to develop. CourseCard and EventCard had been recreated by later phases, but TeacherCard was still missing and DashboardStudent had never been updated.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TeacherCard component | 17b17ff | app/dashboard/components/TeacherCard.tsx |
| 2 | Replace DashboardStudent stub with full carousel layout | 555da57 | app/dashboard/components/DashboardStudent.tsx |

## What Was Built

### TeacherCard (new)
- Accepts `teacher` prop with id, full_name, avatar_url, teaching_styles, location, username
- Renders 64px avatar with initials fallback
- Shows up to 3 teaching style pills with "+N more" overflow
- Shows location with "Online" fallback
- Links to `/directory/${username ?? id}`
- `w-[280px] shrink-0 snap-start` sizing matches CourseCard/EventCard

### DashboardStudent (replaced)
- Removed StubSection, getTimeOfDay from ./utils
- Added DashboardGreeting with role="student", subtitle="Ready to practice today?"
- Teachers carousel: filters connections by role=teacher, maps to TeacherCard
- Courses carousel: maps courses to CourseCard
- Events carousel: maps events to EventCard
- Each carousel has a contextual empty state with CTA link

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `teaching_styles: null` — TeacherCard receives null for teaching_styles because ConnectionProfile does not carry this field. The teaching style pills section simply does not render when null. A future enhancement could enrich the connection profile query to include teaching_styles.
- `location: null` — Same reason; "Online" fallback renders instead.

These stubs do not prevent the plan's goal from being achieved. The carousel is functional with name, avatar, and directory link.

## Self-Check: PASSED

- [x] `app/dashboard/components/TeacherCard.tsx` exists — FOUND
- [x] `app/dashboard/components/DashboardStudent.tsx` updated — FOUND
- [x] Commit 17b17ff exists — FOUND
- [x] Commit 555da57 exists — FOUND
- [x] `npx tsc --noEmit` (source files) — 0 errors
- [x] `grep -c "HorizontalCarousel" DashboardStudent.tsx` — 7 (3 open + 3 close + 1 import)
- [x] `grep -c "StubSection" DashboardStudent.tsx` — 0
