# Quick Task: Fix Password Reset — Hide Header + Fix Redirect

**Date:** 2026-04-04
**Status:** Complete

## Description

Fixed two bugs in the password reset lock screen:

1. **Header visible during reset** — When password_reset_pending cookie is set, the full navigation header (Dashboard, Members, Events, etc.) was visible even though all links redirected back to /reset-password. Now renders a minimal header with only the GOYA logo.

2. **Redirect not working after password update** — After successfully setting a new password, the page showed "Redirecting you to your dashboard..." but never redirected. Root cause: client-side cookie clearing + router.push (soft navigation) caused a race condition with middleware still seeing the old cookie. Fixed by clearing cookie server-side via new /api/auth/complete-reset route, then using window.location.href (hard redirect).

## Solution

- `app/layout.tsx` — Reads password_reset_pending cookie via cookies() from next/headers, renders minimal logo-only header when set. Also hides footer, chat widget, and cookie consent during password reset flow.
- `app/api/auth/complete-reset/route.ts` — New POST endpoint that verifies the user is authenticated, then clears the cookie via Set-Cookie response header.
- `app/reset-password/page.tsx` — Calls /api/auth/complete-reset after updateUser succeeds, waits for response, then hard redirects via window.location.href. Removed useRouter import (no longer needed).

## Commits

- `feat(quick-260404-mma): hide full header during password reset + add complete-reset API route`
- `fix(quick-260404-mma): use server-side cookie clearing + hard redirect after password reset`
