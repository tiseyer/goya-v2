---
phase: quick
plan: 260404-kfe
subsystem: auth
tags: [security, password-reset, middleware, cookie]
dependency_graph:
  requires: []
  provides: [password-reset-lock]
  affects: [middleware, auth-callback, reset-password-page]
tech_stack:
  added: []
  patterns: [cookie-based-lock, middleware-enforcement]
key_files:
  created: []
  modified:
    - app/auth/callback/route.ts
    - middleware.ts
    - app/reset-password/page.tsx
decisions:
  - "Cookie is NOT httpOnly so client-side JS can clear it after successful password update — acceptable since value is a non-sensitive boolean flag"
  - "passwordResetPending is read before the middleware fast-path to prevent public routes from bypassing the lock"
  - "Post-success redirect changed from /sign-in to /dashboard since user is already authenticated"
metrics:
  duration: "~5 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260404-kfe: Lock User to Reset-Password Page Until New Password Is Set

**One-liner:** Cookie-based recovery flow lock — sets `password_reset_pending` in auth callback, enforces redirect in middleware, clears on successful password update.

## What Was Done

Security fix for the password reset flow. After clicking a password reset email link, the user is fully authenticated but previously could navigate away from `/reset-password` to `/dashboard` without ever setting a new password.

The fix uses a `password_reset_pending` cookie as a lock mechanism across three files:

1. **`app/auth/callback/route.ts`** — Sets `password_reset_pending=true` (10 minute maxAge, not httpOnly) when the recovery callback redirects to `/reset-password`.

2. **`middleware.ts`** — Two changes:
   - Reads `passwordResetPending` before the fast-path early return, so public routes (like `/events`) don't bypass the lock.
   - After user is fetched, redirects any route except `/reset-password` back to `/reset-password` when cookie is set and user is authenticated. If cookie is set but no session exists, clears the stale cookie and redirects to `/sign-in`.

3. **`app/reset-password/page.tsx`** — After successful `supabase.auth.updateUser()`, clears the cookie client-side via `document.cookie`, redirects to `/dashboard` instead of `/sign-in`, and updates the success message accordingly.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 98a95ad | Set cookie in callback, enforce in middleware |
| 2 | 6a2d178 | Clear cookie and redirect to dashboard on success |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `app/auth/callback/route.ts` — modified, contains `password_reset_pending` ✓
- `middleware.ts` — modified, contains `password_reset_pending` ✓
- `app/reset-password/page.tsx` — modified, contains `password_reset_pending` ✓
- TypeScript: `npx tsc --noEmit` passes with 0 errors ✓
- Commits 98a95ad and 6a2d178 exist ✓
