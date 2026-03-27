---
phase: quick
plan: 260327-j1k
subsystem: frontend/navbar
tags: [auth, ux, navbar, skeleton, flash-fix]
dependency_graph:
  requires: []
  provides: [loading-aware-navbar]
  affects: [app/components/Header.tsx]
tech_stack:
  added: []
  patterns: [skeleton-loading, authLoading-state-flag]
key_files:
  modified:
    - app/components/Header.tsx
decisions:
  - "Remove email prefix fallback from userName — profile.full_name only, skeleton handles loading visual"
  - "authLoading stays true until getUser() AND profiles.select() both complete (for logged-in users)"
  - "onAuthStateChange listener left unchanged — no loading state needed for subsequent auth events"
metrics:
  duration: ~3min
  completed: 2026-03-27
  tasks_completed: 1
  tasks_total: 2
  files_modified: 1
---

# Quick Task 260327-j1k: Fix Navbar Authentication Flash on Page Load — Summary

Eliminated the flash of unauthenticated UI (Sign In / Join GOYA buttons) on page load for authenticated users, and prevented the email prefix from appearing as the display name during profile load.

## What Was Built

Added `authLoading` state to `Header.tsx` that remains `true` until the initial Supabase `getUser()` call and subsequent profile fetch both resolve. During this loading window, animated skeleton placeholders replace the auth area in both desktop and mobile layouts.

## Changes Made

**app/components/Header.tsx**
- Added `const [authLoading, setAuthLoading] = useState(true)`
- In `useEffect`, `setAuthLoading(false)` called after `profiles.select` resolves (logged-in branch) or immediately after `getUser()` returns null (logged-out branch)
- `userName` derivation simplified: `profile?.full_name ?? ''` (email prefix fallback removed)
- Desktop right-side: ternary changed from `isLoggedIn ? ... : ...` to `authLoading ? <skeletons> : isLoggedIn ? ... : ...`
- Mobile avatar/login: same three-branch pattern with skeleton circle
- Desktop nav Dashboard link: guarded with `!authLoading && isLoggedIn`
- Mobile nav overlay Dashboard link: same guard
- Mobile profile bottom sheet: guarded with `!authLoading && isLoggedIn`

## Deviations from Plan

None — plan executed exactly as written.

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add auth loading state and skeleton placeholders | 8c31667 |

## Status

Awaiting human verification at checkpoint (Task 2).

## Self-Check: PASSED

- File exists: app/components/Header.tsx — FOUND
- Commit 8c31667 — FOUND
