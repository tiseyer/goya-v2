---
phase: 07-onboarding-migration
plan: 02
subsystem: onboarding-removal
tags: [middleware, cleanup, onboarding, flow-builder]
dependency_graph:
  requires: [07-01]
  provides: [clean-codebase-no-hardcoded-onboarding]
  affects: [middleware.ts, app/auth/, app/admin/dashboard/, app/layout.tsx, app/community/]
tech_stack:
  added: []
  patterns: [flow-player-as-sole-onboarding-mechanism]
key_files:
  modified:
    - middleware.ts
    - app/auth/callback/route.ts
    - app/auth/actions.ts
    - app/admin/dashboard/page.tsx
    - app/layout.tsx
    - app/components/CookieConsent.tsx
    - app/community/page.tsx
  deleted:
    - app/onboarding/ (entire directory — layout, page, components, steps, hooks, lib)
    - app/admin/dashboard/AdminOnboardingTest.tsx
decisions:
  - "Removed onboarding_state table references from auth/callback and auth/actions — legacy table not used in new flow system"
  - "community/page.tsx onboarding_state redirect removed — page no longer gates on onboarding completion"
  - "ResetOnboardingButton.tsx preserved — resets profile.onboarding_completed field which is still a flow condition"
  - "app/api/email/onboarding-complete/route.ts preserved — email still useful for flow send_email actions"
  - "onboarding_completed profile column references in analytics/members queries preserved — DB column still exists and is a valid flow condition"
  - "app/schools/create/onboarding/ not deleted — it is school registration flow, not user onboarding"
metrics:
  duration: 12min
  completed: 2026-03-27
  tasks_completed: 2
  files_modified: 7
  files_deleted: 40+
requirements_met: [MIGRATE-03]
---

# Phase 07 Plan 02: Remove Hardcoded Onboarding System Summary

Removed the entire hardcoded onboarding system. Flow player is now the sole onboarding mechanism. Middleware no longer redirects to /onboarding, the app/onboarding/ directory is deleted, and all references to the old route are cleaned up.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Remove middleware onboarding redirects | cd31784 | middleware.ts |
| 2 | Delete app/onboarding/ and clean up references | 6ca7366 | 7 files modified, ~40 deleted |

## What Was Built

**Task 1 — Middleware cleanup:**
- Removed `/onboarding` from `PROTECTED_PATHS`
- Removed `ONBOARDING_GATED_PATHS` array entirely
- Removed `isOnboardingPath` variable and its fast-path reference
- Removed entire onboarding redirect block (was lines 206-232)
- Removed `onboarding_completed` from profile SELECT query in middleware
- Removed `onboarding_preview_mode` cookie check
- Password reset interception and admin role check preserved and intact

**Task 2 — Directory deletion and reference cleanup:**
- Deleted `app/onboarding/` entirely (layout, page, components/, steps/, hooks/, lib/)
- Deleted `app/admin/dashboard/AdminOnboardingTest.tsx`
- `app/auth/callback/route.ts`: removed `onboarding_state` table query + redirect to `/onboarding`, now redirects to `/dashboard`
- `app/auth/actions.ts`: removed `onboarding_state` check and redirect to `/onboarding`, now redirects to `/dashboard`
- `app/admin/dashboard/page.tsx`: removed AdminOnboardingTest import and System section rendering it
- `app/layout.tsx`: removed `/onboarding` from `hideNav` and `hideFooter` path lists
- `app/components/CookieConsent.tsx`: removed `/onboarding` from excluded routes array
- `app/community/page.tsx`: removed `onboarding_state` redirect block

## Decisions Made

- `ResetOnboardingButton.tsx` preserved — it resets `profile.onboarding_completed` which is a valid flow condition, not a route reference
- `app/api/email/onboarding-complete/route.ts` preserved — useful for future `send_email` flow actions
- `app/schools/create/onboarding/` not deleted — it is the school registration wizard, completely unrelated to user onboarding flows
- Analytics files referencing `onboarding_completed` preserved — DB column still valid, used as a flow condition in the condition evaluator
- `onboarding_state` table references in `auth/callback` and `auth/actions` were legacy code from a pre-migration table that no longer serves a purpose

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing] Removed onboarding_state table references from auth/callback and auth/actions**
- **Found during:** Task 2
- **Issue:** `app/auth/callback/route.ts` and `app/auth/actions.ts` both queried a legacy `onboarding_state` table (distinct from the `profiles.onboarding_completed` column) and redirected to `/onboarding`. These were not mentioned in the plan's check list.
- **Fix:** Removed the entire `onboarding_state` query block from both files. Auth callback now only stores role metadata if present, then redirects to `/dashboard`. `signIn` action now redirects directly to `/dashboard`.
- **Files modified:** `app/auth/callback/route.ts`, `app/auth/actions.ts`
- **Commits:** 6ca7366

**2. [Rule 2 - Missing] Removed onboarding redirect from community/page.tsx**
- **Found during:** Task 2 grep scan
- **Issue:** `app/community/page.tsx` redirected to `/onboarding` via `onboarding_state` query — route no longer exists
- **Fix:** Removed the entire block. Page no longer gates on onboarding status (middleware or flow player handles that).
- **Files modified:** `app/community/page.tsx`
- **Commits:** 6ca7366

## Known Stubs

None. All cleanup is complete and functional.

## Self-Check: PASSED

- `app/onboarding/` directory: does not exist
- `middleware.ts` commit cd31784: exists
- Task 2 commit 6ca7366: exists
- No `from.*app/onboarding` imports in app/ or lib/
- No `ONBOARDING_GATED_PATHS` or `isOnboardingPath` in middleware.ts
- TypeScript errors in `.next/` cache are stale build artifacts — cleared on next `next build`
- Pre-existing TypeScript errors (test runner types, Stripe VERSION) are unrelated to this plan
