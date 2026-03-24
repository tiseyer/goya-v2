---
phase: 01-dropdown-refactor
plan: "01"
subsystem: navigation
tags: [header, dropdown, settings, navigation, mobile, desktop]
dependency_graph:
  requires: []
  provides: [settings-entry-point-all-roles]
  affects: [app/components/Header.tsx]
tech_stack:
  added: []
  patterns: [role-branched-conditional-rendering]
key_files:
  created: []
  modified:
    - app/components/Header.tsx
decisions:
  - "Settings entry grouped in same divider section as Admin Settings for admin/moderator users (not a separate divider)"
  - "Regular user Settings placed in its own border-t divider section after menuItems, before School/Logout"
  - "Mobile menu uses role checks via profile?.role (existing pattern) — no new props needed"
metrics:
  duration: ~12 minutes
  completed_date: "2026-03-23"
  tasks_completed: 2
  tasks_total: 3
  files_modified: 1
requirements_satisfied:
  - NAV-01
  - NAV-02
  - NAV-03
  - NAV-04
  - NAV-05
status: awaiting-checkpoint
---

# Phase 1 Plan 01: Dropdown Refactor Summary

**One-liner:** Role-branched Settings entry added to both desktop and mobile profile dropdowns; Profile Settings and Subscriptions entries removed from Header.tsx.

## What Was Built

Modified `app/components/Header.tsx` to:

1. **Desktop UserMenu** — removed `Profile Settings` and `Subscriptions` from the `menuItems` array. Added a combined Settings + Admin Settings block (admin/moderator, same `border-t` divider) and a separate Settings-only block (regular users, own `border-t` divider).

2. **Mobile menu** — removed `Profile Settings` and `Subscriptions` from the inline items array. Added Settings + Admin Settings for admin/moderator roles (using `<>` fragment inside existing conditional) and a separate Settings link for regular users.

**Result:** 4 `href="/settings"` links in the file (2 desktop, 2 mobile) — one per role branch per view.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Refactor desktop UserMenu dropdown | 080591f | app/components/Header.tsx |
| 2 | Refactor mobile menu | bad1a8a | app/components/Header.tsx |
| 3 | Verify dropdown behavior across roles | — | Awaiting human checkpoint |

## Deviations from Plan

None — plan executed exactly as written for Tasks 1 and 2.

**Pre-existing ESLint issues** (out of scope, not introduced by this plan):
- Lines 263, 774, 775, 813, 827: pre-existing `react-hooks/set-state-in-effect` and `@typescript-eslint/no-explicit-any` errors in unrelated parts of Header.tsx. Logged to deferred-items.

## Known Stubs

None — this plan only modifies navigation links. The `/settings` destination will 404 until Phase 2 builds the Settings shell. This is expected and documented in the plan.

## Status

Plan paused at Task 3 (human-verify checkpoint). Human verification of dropdown behavior in browser required before marking complete.

## Self-Check: PASSED

- `app/components/Header.tsx` exists and modified: FOUND
- Commit `080591f` (Task 1): FOUND
- Commit `bad1a8a` (Task 2): FOUND
- `grep -c "Profile Settings" app/components/Header.tsx` = 0: PASSED
- `grep -c "Subscriptions" app/components/Header.tsx` = 0: PASSED
- `grep -c "href=\"/settings\"" app/components/Header.tsx` = 4: PASSED
