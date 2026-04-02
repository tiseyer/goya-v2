---
phase: 45-student-wp-dashboards
plan: "02"
subsystem: dashboard
tags: [dashboard, wellness-practitioner, ui, carousels]
dependency_graph:
  requires: [phase-44-shared-ui-components]
  provides: [wp-dashboard-layout, connection-card, faculty-card, event-card]
  affects: [app/dashboard]
tech_stack:
  added: []
  patterns: [role-based-dashboard, horizontal-carousel, cta-grid]
key_files:
  created:
    - app/dashboard/components/ConnectionCard.tsx
    - app/dashboard/components/FacultyCard.tsx
    - app/dashboard/components/EventCard.tsx
  modified:
    - app/dashboard/components/DashboardWellness.tsx
key_decisions:
  - "EventCard restored from orphan commit 0bbab8b alongside ConnectionCard/FacultyCard (284bde1) to unblock plan"
  - "StatHero value=null renders em-dash placeholder; real analytics deferred per REQUIREMENTS.md"
  - "CTA hrefs use /settings/my-events and /settings/my-courses (both verified to exist)"
metrics:
  duration_minutes: 10
  completed_date: "2026-04-02"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 4
---

# Phase 45 Plan 02: Wellness Practitioner Dashboard Layout Summary

**One-liner:** Full WP dashboard with greeting, profile completion nudge, profile-views stat hero, 2 CTA cards, connections carousel, and events carousel using Phase 44 shared components.

## What Was Built

The `DashboardWellness` stub was replaced with a fully assembled dashboard. Three card components (`ConnectionCard`, `FacultyCard`, `EventCard`) were restored from orphan git commits to the develop branch.

### WP Dashboard Sections (top to bottom)

1. `DashboardGreeting` — "Good [time], [name]." + "Wellness Practitioner" purple badge, "Welcome back." subtitle
2. `ProfileCompletionCard` — auto-hidden at 100%; shows progress bar + missing-field checklist below
3. `StatHero` wrapped in a flat `Card` — "— people viewed your profile this week" (em-dash placeholder)
4. `grid grid-cols-1 sm:grid-cols-2` CTA grid — "Share your next event" + "Add a course or session"
5. `HorizontalCarousel` "Teachers and schools near you" — maps `connections` to `ConnectionCard` items; "Explore directory ->" → /members
6. `HorizontalCarousel` "Upcoming events" — maps `events` to `EventCard` items; "Show all events ->" → /events

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1: Restore cards | a5c3bd2 | ConnectionCard, FacultyCard, EventCard from orphan commits |
| Task 2: WP layout | f7c999d | Replace DashboardWellness stub with full layout |

## Deviations from Plan

### Auto-added (Rule 2)

**1. [Rule 2 - Missing] Restored EventCard.tsx alongside ConnectionCard/FacultyCard**
- **Found during:** Task 1
- **Issue:** Plan noted EventCard "may not exist yet" on develop; it was absent
- **Fix:** Restored from orphan commit 0bbab8b per plan's own fallback instruction
- **Files modified:** app/dashboard/components/EventCard.tsx
- **Commit:** a5c3bd2

No other deviations — plan executed exactly as written for all other items.

## Known Stubs

- `StatHero value={null}` in DashboardWellness — intentional placeholder (em-dash). Real analytics deferred per REQUIREMENTS.md Out of Scope. This does not prevent the plan's goal; the layout is complete and functional.

## Self-Check: PASSED

- FOUND: app/dashboard/components/DashboardWellness.tsx
- FOUND: app/dashboard/components/ConnectionCard.tsx
- FOUND: app/dashboard/components/FacultyCard.tsx
- FOUND: app/dashboard/components/EventCard.tsx
- FOUND commit: a5c3bd2
- FOUND commit: f7c999d
