---
phase: quick
plan: 260404-mma
subsystem: auth
tags: [password-reset, header, cookie, middleware, redirect]
dependency_graph:
  requires: []
  provides: [password-reset-lock-screen-ux, complete-reset-api]
  affects: [app/layout.tsx, app/reset-password/page.tsx, middleware.ts]
tech_stack:
  added: []
  patterns: [server-side-cookie-clearing, hard-redirect-after-auth-action]
key_files:
  created:
    - app/api/auth/complete-reset/route.ts
  modified:
    - app/layout.tsx
    - app/reset-password/page.tsx
    - docs/developer/authentication.md
    - activity/quick-tasks/quick-task_fix-password-reset-hide-header-redirect_04-04-2026.md
decisions:
  - "Use window.location.href (hard redirect) not router.push — ensures middleware receives a fresh HTTP request without stale password_reset_pending cookie"
  - "Clear cookie via /api/auth/complete-reset POST route handler (Set-Cookie header) not document.cookie — server-side clearing is reliable before redirect fires"
metrics:
  duration: ~15 minutes
  completed: "2026-04-04"
  tasks_completed: 3
  files_changed: 5
---

# Phase quick Plan 260404-mma: Fix Password Reset — Hide Header + Fix Redirect Summary

**One-liner:** Server-side cookie clearing via POST route + hard redirect fixes the password reset lock screen: logo-only header when locked, reliable redirect to dashboard after success.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Hide full header during password reset + create /api/auth/complete-reset route | 8630ab0 |
| 2 | Fix reset-password page: server-side cookie clearing + window.location.href redirect | 7a92726 |
| 3 | Activity log + docs update (authentication.md) + docs index | a0c47c6 |

## What Was Built

### Bug 1: Full navigation header visible during password reset

`app/layout.tsx` now reads the `password_reset_pending` cookie via `cookies()` from `next/headers`. When set, it renders a minimal header with only the GOYA logo instead of the full `<Header />`. Footer, chat widget (`ChatWidgetLoader`), and cookie consent (`CookieConsent`) are also suppressed — the reset page is intentionally self-contained.

### Bug 2: Redirect after successful password update never fired

Root cause: the old code used `document.cookie` to clear the lock cookie (client-side, no guarantee of timing) followed by `router.push('/dashboard')` (soft navigation — reuses the same request context, so middleware still saw the old cookie value and redirected back to `/reset-password`).

Fix:
1. New `app/api/auth/complete-reset/route.ts` — POST endpoint that verifies the user is authenticated, then sets `password_reset_pending=` with `maxAge: 0` in the response `Set-Cookie` header. The browser processes this before the redirect.
2. `app/reset-password/page.tsx` — after `supabase.auth.updateUser` succeeds, `await fetch('/api/auth/complete-reset', { method: 'POST' })`, then `window.location.href = '/dashboard'` after a 2-second delay. The hard reload forces a new HTTP request that middleware processes cleanly without the stale cookie.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `app/api/auth/complete-reset/route.ts` — exists
- `app/layout.tsx` — contains `isPasswordResetLocked` and minimal header
- `app/reset-password/page.tsx` — uses `fetch('/api/auth/complete-reset')` + `window.location.href`
- Commits 8630ab0, 7a92726, a0c47c6 — all present on develop
- TypeScript: 0 errors
