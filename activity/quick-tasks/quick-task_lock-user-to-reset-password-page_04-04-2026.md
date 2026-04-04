# Quick Task: Lock User to Reset-Password Page Until New Password Set

**Date:** 04-04-2026
**Status:** Done

## Task Description

Security fix for the password reset flow. After clicking a password reset email link, the user is fully authenticated but could previously navigate away from `/reset-password` to `/dashboard` or any other route without ever changing their password.

## Solution

Implemented a cookie-based lock mechanism across three files:

1. **`app/auth/callback/route.ts`** — Sets a `password_reset_pending=true` cookie (10 minute maxAge, not httpOnly so the client can clear it) whenever the recovery callback redirects to `/reset-password`.

2. **`middleware.ts`** — Reads the cookie before the fast-path early return (preventing public routes from bypassing the lock), then after user is fetched: redirects any non-`/reset-password` route back to `/reset-password` when cookie is set and user is authenticated; clears stale cookie and redirects to `/sign-in` if cookie exists but no session.

3. **`app/reset-password/page.tsx`** — After successful password update: clears the cookie client-side, redirects to `/dashboard` (user is already authenticated — no need to go through `/sign-in`), and updates the success message.

## Commits

- `98a95ad` — Set cookie in callback, enforce in middleware
- `6a2d178` — Clear cookie and redirect to dashboard on success
