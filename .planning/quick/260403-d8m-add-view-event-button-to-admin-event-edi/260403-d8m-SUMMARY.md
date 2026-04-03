---
phase: quick
plan: 260403-d8m
subsystem: admin-events
tags: [admin, events, ui, navigation]
dependency_graph:
  requires: []
  provides: [view-event-button-edit-page]
  affects: [admin-event-edit-ux]
tech_stack:
  added: []
  patterns: [anchor-new-tab, conditional-render-edit-mode]
key_files:
  created: []
  modified:
    - app/admin/events/[id]/edit/page.tsx
    - app/admin/events/components/EventForm.tsx
decisions:
  - Used plain <a> tag instead of Next.js Link for new-tab navigation (cross-route-section)
  - Used isEdit && event?.id guard to hide button on create form
metrics:
  duration: "5 minutes"
  completed: "2026-04-03"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260403-d8m: Add View Event Button to Admin Event Edit Page Summary

**One-liner:** Two "View Event" anchor buttons added to admin event edit page — top-right of heading and bottom-right of action bar — opening /events/{id} in a new tab.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add View Event button next to Edit Event heading | db7091b | app/admin/events/[id]/edit/page.tsx |
| 2 | Add View Event button next to Save/Cancel in EventForm | ce3078b | app/admin/events/components/EventForm.tsx |

## What Was Built

### Task 1 — Heading button (page.tsx)

The `<div className="mb-6">` heading container was converted to a flex row with `justify-between`. A plain `<a>` element with `target="_blank"` and `rel="noopener noreferrer"` was added on the right side, linking to `/events/${id}`. Styled as an outline button matching the Cancel button style, with an external-link SVG icon.

### Task 2 — Action bar button (EventForm.tsx)

A conditional block `{isEdit && event?.id && (...)}` was added after the Cancel `<Link>` in the actions div. The `<a>` tag uses `ml-auto` to push it to the right, visually grouping Save+Cancel together while isolating View Event. Only renders in edit mode — not on the create event form.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check

- [x] `app/admin/events/[id]/edit/page.tsx` modified — FOUND
- [x] `app/admin/events/components/EventForm.tsx` modified — FOUND
- [x] Commit db7091b — FOUND
- [x] Commit ce3078b — FOUND
- [x] TypeScript: only pre-existing unrelated error (schools settings page type), no new errors introduced

## Self-Check: PASSED
