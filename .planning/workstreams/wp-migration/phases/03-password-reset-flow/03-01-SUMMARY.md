---
phase: 03-password-reset-flow
plan: "01"
subsystem: auth-middleware
status: complete
tags: [middleware, auth, password-reset, migration, next-js]
dependency_graph:
  requires: [02-02]
  provides: [password-reset-interception, set-password-page]
  affects: [middleware.ts, all-authenticated-routes]
tech_stack:
  added: []
  patterns: [supabase-server-action, next-middleware-redirect, consolidated-profile-query]
key_files:
  created:
    - app/account/set-password/actions.ts
    - app/account/set-password/page.tsx
  modified:
    - middleware.ts
decisions:
  - Consolidated three conditional profile queries into one upfront fetch for all authenticated users, adding requires_password_reset alongside onboarding_completed and role
  - Password reset check runs before onboarding check — migrated users must set password before they can complete onboarding
  - set-password page is exempt from redirect via isSetPasswordPage guard — no redirect loop
  - No navigation links on set-password page — user must set password or sign out manually
metrics:
  duration: ~8m
  completed: 2026-03-27
  tasks_complete: 3
  tasks_total: 3
  files_created: 2
  files_modified: 1
---

# Phase 03 Plan 01: Password Reset Flow Summary

Password reset interception for migrated WordPress users — middleware redirects flagged users to /account/set-password, where they set a real password before accessing the app.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add password reset interception to middleware | 6116d52 | middleware.ts |
| 2 | Create server action and set-password page | a85d0bf | app/account/set-password/actions.ts, app/account/set-password/page.tsx |
| 3 | Verify password reset flow end-to-end | (checkpoint) | Human-verified: approved |

## What Was Built

### Task 1 — Middleware changes (middleware.ts)

- Added `/account/set-password` to `PUBLIC_PATHS` (unauthenticated users get normal auth redirect, not loop)
- Added `/account/set-password` to `MAINTENANCE_BYPASS_PATHS` (flagged users can set password during maintenance)
- Consolidated two conditional profile queries (`onboarding_completed, role` and `role` for admin) into a single upfront query that now also fetches `requires_password_reset` for ALL authenticated users
- Password reset interception runs immediately after profile fetch and before onboarding checks: users with `requires_password_reset: true` are redirected to `/account/set-password` unless already on that page

### Task 2 — New files

**`app/account/set-password/actions.ts`** — `setNewPassword` server action:
- Validates password (min 8 chars, must match confirmation)
- Verifies user session via `supabase.auth.getUser()`
- Updates Supabase auth password via `supabase.auth.updateUser({ password })`
- Clears `requires_password_reset` flag on the profiles table
- Redirects to `/` on success (middleware then sends to /dashboard)
- Returns `{ error: string }` on validation/update failure

**`app/account/set-password/page.tsx`** — GOYA-branded set-password UI:
- Matches sign-in page styling exactly: centered card, `bg-[#f8f9fa]`, `max-w-md`, `bg-[#345c83]` brand color
- GOYA logo without Link wrapper (no escape route)
- "Welcome to GOYA" / "Please set a new password to continue" messaging
- Two password fields (New Password, Confirm Password) with inline error display
- Client-side form submission calling the server action
- Loading state disables button and shows "Setting password..."

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Single upfront profile query for all auth users | Avoids 2-3 separate conditional queries per request; reduces DB round trips |
| Password reset before onboarding in middleware order | Migrated users can't meaningfully onboard without setting a real password first |
| Redirect to `/` after password set (not `/dashboard`) | Middleware handles `/` → `/dashboard` redirect, also ensures onboarding check runs naturally |
| No nav links on set-password page | Forced flow — user must set password or sign out. No escape except manual sign-out |

## Deviations from Plan

None — plan executed exactly as written. The consolidation of profile queries was explicitly specified in the plan's APPROACH section.

## Known Stubs

None — all data is wired. The `requires_password_reset` flag is read from the live profiles table and the server action updates both Supabase auth and the profile flag.

## Self-Check: PASSED

All files exist, all commits verified, human verification approved.
