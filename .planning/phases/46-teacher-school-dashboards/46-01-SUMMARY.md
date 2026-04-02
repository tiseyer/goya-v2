---
phase: 46-teacher-school-dashboards
plan: "01"
subsystem: dashboard
tags: [teacher, dashboard, ui, connections, completion]
dependency_graph:
  requires: []
  provides: [teacher-dashboard-layout]
  affects: [app/dashboard/page.tsx]
tech_stack:
  added: []
  patterns: [layout-composition, conditional-rendering, slice-for-preview-list]
key_files:
  created: []
  modified:
    - app/dashboard/components/DashboardTeacher.tsx
decisions:
  - "ConnectionCard fixed-width override via [&>a]:w-full [&>a]:block wrapper — avoids modifying the card component used in carousels elsewhere"
  - "View as School toggle rendered as its own div below greeting so spacing is independent of isSchoolOwner state"
  - "Empty connections state links to /members to drive discovery"
metrics:
  duration: "5m"
  completed: "2026-04-02"
  tasks_completed: 1
  files_modified: 1
---

# Phase 46 Plan 01: DashboardTeacher Full Layout Summary

**One-liner:** Teacher dashboard with greeting + Teacher badge, View as School pill toggle, profile completion card, profile-views stat hero, two CTAs, and a 3-item connections list with empty state.

## What Was Built

Replaced the `DashboardTeacher.tsx` stub with a fully composed layout matching the DashboardWellness pattern.

**Sections (top to bottom):**
1. `DashboardGreeting` — firstName from profile.full_name, role="teacher", subtitle="Welcome back." — renders "Good [time], [name]." with emerald Teacher badge
2. View as School pill — amber pill link to `/dashboard?view=school`, conditionally rendered only when `isSchoolOwner` is true
3. `ProfileCompletionCard` — receives `completion` prop, auto-hides at 100%
4. `StatHero` — value={null} renders em-dash placeholder, label="people viewed your profile this week", wrapped in `Card variant="flat" padding="lg"`
5. Two `PrimaryActionCard`s in `grid grid-cols-1 sm:grid-cols-2 gap-4` — "Share your next event" → /settings/my-events, "Add a course link" → /settings/my-courses
6. Recent connections section — header row with "Recent connections" h2 + "View all connections" link to /settings/connections; `connections.slice(0, 3)` rendered as `ConnectionCard` list; empty state with link to /members

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `StatHero value={null}` — profile view count is a known placeholder (em-dash). A future plan will wire real analytics data.

## Self-Check: PASSED

- `app/dashboard/components/DashboardTeacher.tsx` exists and has 97 lines (well above 60-line minimum)
- Commit 2d887cf exists
- `grep -c "StubSection"` → 0
- `grep -c "DashboardGreeting"` → 2 (import + usage)
- `grep -c "ProfileCompletionCard"` → 2
- `grep -c "StatHero"` → 2
- `grep -c "PrimaryActionCard"` → 3 (import + 2 usages)
- `grep -c "ConnectionCard"` → 2
- `grep -c "view=school"` → 1
- `grep -c "View all connections"` → 1
- `npx tsc --noEmit` → only pre-existing unrelated error in `.next/` generated types (not caused by this plan)
