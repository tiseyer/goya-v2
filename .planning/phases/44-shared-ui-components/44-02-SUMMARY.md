---
phase: 44-shared-ui-components
plan: 02
subsystem: dashboard-components
tags: [cards, carousel, ui-components, dashboard]
dependency_graph:
  requires: [43-02]
  provides: [TeacherCard, CourseCard, EventCard, ConnectionCard, FacultyCard]
  affects: [45-role-dashboards, 46-role-dashboards]
tech_stack:
  added: []
  patterns: [next/image with fill+sizes for responsive images, initials fallback for missing avatars, server components for all cards]
key_files:
  created:
    - app/dashboard/components/TeacherCard.tsx
    - app/dashboard/components/CourseCard.tsx
    - app/dashboard/components/EventCard.tsx
    - app/dashboard/components/ConnectionCard.tsx
    - app/dashboard/components/FacultyCard.tsx
  modified: []
decisions:
  - "Used Link wrapping entire card (not an inner button) so keyboard/screen reader navigation works correctly"
  - "FacultyCard renders a non-linked div wrapper when profile is null (invited-only faculty) rather than a broken href"
  - "EventCard uses toLocaleDateString for month label to stay locale-aware while remaining a server component"
metrics:
  duration: "~8 minutes"
  completed: "2026-04-02"
  tasks_completed: 2
  files_created: 5
  files_modified: 0
---

# Phase 44 Plan 02: Card Components Summary

Five carousel-ready card components built for the GOYA dashboard: TeacherCard, CourseCard, EventCard, ConnectionCard, FacultyCard — each fixed at 280px with carousel snap classes.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create TeacherCard, CourseCard, EventCard | 0bbab8b | TeacherCard.tsx, CourseCard.tsx, EventCard.tsx |
| 2 | Create ConnectionCard and FacultyCard | 284bde1 | ConnectionCard.tsx, FacultyCard.tsx |

## What Was Built

### TeacherCard (`app/dashboard/components/TeacherCard.tsx`)
- 64px round avatar with initials fallback (slate circle, first letter)
- Name (truncated), teaching style pills (max 3 shown, "+N more" overflow badge)
- Location or "Online" if null
- Full card is a `<Link>` to `/directory/[username|id]`

### CourseCard (`app/dashboard/components/CourseCard.tsx`)
- Featured image at `h-36` with `object-cover`; gradient placeholder if no `image_url`
- Category badge with dynamic color from `course_categories.color` (hex + 20 opacity)
- Title (2-line clamp), formatted duration (Xh Ym / X min / hidden if null)
- Full card links to `/academy/[id]`

### EventCard (`app/dashboard/components/EventCard.tsx`)
- Date badge on left: 3-letter uppercase month in brand primary color, large bold day number
- Title (2-line clamp), format badge (Online=blue, Hybrid=purple, In Person=green)
- Location shown below badge when not online
- Full card links to `/events/[slug|id]`

### ConnectionCard (`app/dashboard/components/ConnectionCard.tsx`)
- 48px avatar with initials fallback
- Name (truncated), role badge with role-specific colors (student=blue, teacher=emerald, wellness=purple, default=slate)
- Role label capitalizes and replaces underscores with spaces
- Full card links to `/directory/[username|id]`

### FacultyCard (`app/dashboard/components/FacultyCard.tsx`)
- 48px avatar with initials fallback
- Name, position text (or "Faculty Member" if null)
- "Principal Trainer" amber badge when `is_principal_trainer` is true
- When `profile` is null (invited but no member yet): shows "Invited" badge, renders as plain div (no link)
- When `profile` exists: full card links to `/directory/[id]`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all cards receive typed props and render real data. No hardcoded placeholders.

## Self-Check: PASSED

Files verified:
- `app/dashboard/components/TeacherCard.tsx` — FOUND
- `app/dashboard/components/CourseCard.tsx` — FOUND
- `app/dashboard/components/EventCard.tsx` — FOUND
- `app/dashboard/components/ConnectionCard.tsx` — FOUND
- `app/dashboard/components/FacultyCard.tsx` — FOUND

Commits verified:
- `0bbab8b` — FOUND (Task 1)
- `284bde1` — FOUND (Task 2)

TypeScript: `npx tsc --noEmit` passes (only pre-existing unrelated error in `.next/dev/types/validator.ts` for a missing school settings page type — not introduced by this plan).
