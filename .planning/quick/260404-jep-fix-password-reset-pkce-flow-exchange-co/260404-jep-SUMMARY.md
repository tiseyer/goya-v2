---
phase: quick
plan: 260404-jep
subsystem: auth
tags: [auth, password-reset, pkce, supabase]
key-files:
  modified:
    - app/forgot-password/page.tsx
    - app/reset-password/page.tsx
  deleted:
    - app/reset-password/page 2.tsx
decisions:
  - Route all password reset links through /auth/callback for server-side PKCE code exchange
  - reset-password page uses getSession() + onAuthStateChange instead of client-side exchangeCodeForSession
metrics:
  duration: ~5 minutes
  completed: 2026-04-04
  tasks: 1
  files: 3
---

# Quick Task 260404-jep: Fix Password Reset PKCE Flow Summary

**One-liner:** Server-side PKCE code exchange via /auth/callback fixes "Link expired or invalid" on valid reset links.

## What Was Done

The password reset flow was broken because `resetPasswordForEmail` stores a PKCE `code_verifier` in browser storage during the request. When the email link was opened (possibly in a different tab or session), the client-side `exchangeCodeForSession(code)` on `/reset-password` would fail — there was no `code_verifier` to pair with the server's `code_challenge`.

**Root cause:** Client-side code exchange requires the `code_verifier` from the exact browser session that initiated the request. Email links open in fresh contexts where this is unavailable.

**Fix:** Route the email redirect through the existing server-side `/auth/callback` route, which exchanges the code without needing a client-side `code_verifier` (server-side auth clients use a different PKCE handling path).

## Changes

### app/forgot-password/page.tsx
Changed `redirectTo` from `/reset-password` to `/auth/callback?next=/reset-password`. Supabase now builds the email link pointing to the callback handler first.

### app/reset-password/page.tsx
- Removed `exchangeCodeForSession` call entirely
- Added `getSession()` check — session is already established when arriving from `/auth/callback`
- Kept `onAuthStateChange(PASSWORD_RECOVERY)` listener as a fallback
- Added safety-net redirect: if a `?code=` param somehow lands on this page directly (old bookmarks, cached emails), it redirects through `/auth/callback` automatically
- Removed the 3-second timeout hack — replaced with deterministic session check

### Deleted
- `app/reset-password/page 2.tsx` — accidental duplicate, removed

## Deviations from Plan

None — plan executed exactly as written. The `/auth/callback` route required no changes (already handled `next` param correctly).

## Verification

- `npx tsc --noEmit`: 0 errors
- `forgot-password` references `/auth/callback` in `redirectTo`
- `reset-password` does NOT call `exchangeCodeForSession`
- `reset-password` checks `getSession()` for existing session

## Self-Check: PASSED

- Modified files committed at ecb6a4b
- Duplicate file deleted and committed
- TypeScript clean

## Awaiting

Human verification: test the full reset flow end-to-end (request reset -> click email link -> set new password -> sign in).
