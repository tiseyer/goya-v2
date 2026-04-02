---
phase: 45-student-wp-dashboards
plan: "01"
subsystem: dashboard/student
tags: [dashboard, student, carousel, ui]
dependency_graph:
  requires: [44-01, 43-02]
  provides: [DashboardStudent, TeacherCard, CourseCard, EventCard]
  affects: [app/dashboard/page.tsx]
tech_stack:
  added: []
  patterns: [HorizontalCarousel, DashboardGreeting, embla-carousel-react]
key_files:
  created:
    - app/dashboard/components/TeacherCard.tsx
    - app/dashboard/components/CourseCard.tsx
    - app/dashboard/components/EventCard.tsx
  modified:
    - app/dashboard/components/DashboardStudent.tsx
    - docs/student/getting-started.md
    - docs/student/overview.md
    - public/docs/search-index.json
decisions:
  - "Teacher carousel uses connections filtered by role=teacher (no dedicated fetch query)"
  - "Empty carousels show Card variant=flat with CTA link"
  - "Apple aesthetic: py-8 space-y-8 spacing on outer wrapper"
metrics:
  duration: "~15 min"
  completed: "2026-04-01"
  tasks_completed: 2
  files_changed: 7
requirements: [STU-01, STU-02, STU-03, STU-04]
---

# Phase 45 Plan 01: Student Dashboard Full Layout Summary

**One-liner:** Student dashboard with greeting, 3 HorizontalCarousel sections (teachers, courses, events) using TeacherCard / CourseCard / EventCard, Apple aesthetic spacing, and contextual empty states.

## What Was Built

The `DashboardStudent` stub was replaced with the full student dashboard layout. Three card components (`TeacherCard`, `CourseCard`, `EventCard`) were restored from an orphan commit (0bbab8b) that was never merged to develop.

### DashboardStudent layout (top to bottom)

1. **DashboardGreeting** — `firstName` extracted from profile, `role="student"`, `subtitle="Ready to practice today?"`
2. **Teachers carousel** — Title "Teachers that might suit you", `showAllHref="/members?role=teacher"`. Populates from `connections` filtered to `role === 'teacher'`. Empty state prompts to browse the directory.
3. **Courses carousel** — Title "Courses you might enjoy", `showAllHref="/academy"`. Maps `courses[]` to `<CourseCard>`. Empty state links to `/academy`.
4. **Events carousel** — Title "Upcoming events", `showAllHref="/events"`. Maps `events[]` to `<EventCard>`. Empty state links to `/events`.

All sections wrapped in `PageContainer` with `py-8 space-y-8`.

### Card components

- **TeacherCard** — 64px avatar (initials fallback), name, teaching style pills (max 3 + overflow), location, links to `/directory/[username|id]`, `w-[280px] shrink-0 snap-start`
- **CourseCard** — featured image `h-36`, category color badge, title (line-clamp-2), duration, links to `/academy/[id]`, same sizing
- **EventCard** — date badge (month+day sidebar), title, format badge (Online/Hybrid/In Person), location, links to `/events/[slug|id]`, same sizing

## Requirements Addressed

| Requirement | Status |
|---|---|
| STU-01 — Student greeting with "Ready to practice today?" | Done |
| STU-02 — Teachers carousel with "Show all teachers" link | Done |
| STU-03 — Courses carousel with "Show all courses" link | Done |
| STU-04 — Events carousel with "Show all events" link | Done |

## Commits

| Hash | Message |
|---|---|
| `769bfd6` | feat(45-01): restore TeacherCard, CourseCard, EventCard from orphan commit |
| `6356e16` | feat(45-01): replace DashboardStudent stub with full layout (STU-01–STU-04) |
| `05020e1` | docs(45-01): update student docs to describe new dashboard carousel layout |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocker] Worktree was not rebased on develop**
- **Found during:** Task 1
- **Issue:** The worktree branch `worktree-agent-ae558d4d` was based on an old merge commit (7ae3880 / main@PR#5), predating all Phase 43/44 work. The `app/dashboard/components/` directory did not exist.
- **Fix:** Ran `git rebase origin/develop` to bring the worktree up to date with all Phase 43/44 commits before proceeding.
- **Files modified:** All Phase 43/44 files were made available via rebase.

### Scope Notes

- Teacher carousel uses `connections` filtered to `role === 'teacher'` as the data source, since `page.tsx` does not fetch a separate recommended-teachers list. This matches the plan's guidance in Task 2.

## Known Stubs

None — all three carousels render real data from `DashboardProps`. Empty states are shown when arrays are empty, not stub placeholders.

## Self-Check: PASSED

- `app/dashboard/components/DashboardStudent.tsx` — exists, 119 lines
- `app/dashboard/components/TeacherCard.tsx` — exists, 77 lines
- `app/dashboard/components/CourseCard.tsx` — exists, 69 lines
- `app/dashboard/components/EventCard.tsx` — exists, 55 lines
- Commits `769bfd6`, `6356e16` exist in git log
- `npx tsc --noEmit` passes with 0 errors
