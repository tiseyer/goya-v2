---
phase: 57-auth-callback-middleware-verify-page
plan: "01"
subsystem: auth
tags: [device-auth, 2fa, middleware, auth-callback, cookies]
dependency_graph:
  requires: [lib/device/checkTrustedDevice.ts]
  provides: [device_pending_verification cookie flow, /verify-device redirect gate]
  affects: [app/auth/callback/route.ts, middleware.ts]
tech_stack:
  added: []
  patterns: [cookie-lock-pattern (mirrors password_reset_pending), session-cookie-forwarding]
key_files:
  modified:
    - app/auth/callback/route.ts
    - middleware.ts
decisions:
  - "Copy session cookies from existing response onto deviceRedirect so user has a session at /verify-device"
  - "DEVICE_VERIFICATION_ALLOWED defined at module level (alongside PUBLIC_PATHS etc.) for consistency"
  - "devicePendingVerification added to fast-path condition so middleware does not short-circuit for pending users"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_modified: 2
---

# Phase 57 Plan 01: Auth Callback + Middleware Device Lock Summary

**One-liner:** Device trust gate in auth callback sets `device_pending_verification` cookie on untrusted login; middleware lock enforces `/verify-device` redirect for all routes until verification completes.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Add device trust check to auth callback | c9bb3fd |
| 2 | Add device_pending_verification lock to middleware | 4e0cf1c |

## What Was Built

### Task 1 — Auth Callback (`app/auth/callback/route.ts`)

After `exchangeCodeForSession` succeeds and `getUser()` returns a user, the callback now:

1. Reads `goya_device_fp` cookie from the request
2. If fingerprint present: calls `checkTrustedDevice(user.id, fingerprint)`
3. If NOT trusted: creates a new `deviceRedirect` to `/verify-device`, copies all session cookies from the existing `response` onto it (so the user has a valid session at `/verify-device`), sets `device_pending_verification` cookie (`userId|fingerprint`, httpOnly, maxAge=600), and returns the redirect
4. If trusted OR no fingerprint: falls through to existing role/invite/audit logic unchanged

### Task 2 — Middleware (`middleware.ts`)

Two targeted changes:

1. `DEVICE_VERIFICATION_ALLOWED` constant added at module level (alongside `PUBLIC_PATHS`, `PROTECTED_PATHS`)
2. `devicePendingVerification` read from cookies alongside `passwordResetPending`; added to fast-path bypass condition
3. Lock block inserted after `password_reset_pending` block:
   - Cookie + session present, path not allowed: redirect to `/verify-device`
   - Cookie present, no session: clear cookie, redirect to `/sign-in`
   - Allowed paths: `/verify-device`, `/sign-in`, `/sign-out`, `/auth/callback`, `/api/device-verification/*`

## Decisions Made

- **Session cookie forwarding:** The auth callback builds the `response` object first (so Supabase's `setAll` writes session cookies onto it). When redirecting to `/verify-device`, a new `NextResponse.redirect` is created and session cookies are copied from `response` before returning — otherwise the user would have no session on the verify page.
- **Module-level constant:** `DEVICE_VERIFICATION_ALLOWED` placed at module level alongside existing path constants for consistency and readability.
- **user.id as profile_id:** `checkTrustedDevice` accepts `profileId` — confirmed `profiles.id = auth.uid()` in this project, so `user.id` is passed directly.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan modifies flow control only; no UI rendering or data display.

## Self-Check: PASSED

Files modified:
- FOUND: app/auth/callback/route.ts
- FOUND: middleware.ts

Commits:
- FOUND: c9bb3fd (feat(57-01): add device trust check to auth callback)
- FOUND: 4e0cf1c (feat(57-01): add device_pending_verification lock to middleware)
