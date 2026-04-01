---
phase: quick
plan: 260330-jew
subsystem: auth
tags: [oauth, google, apple, supabase-auth]
metrics:
  duration: ~3 min
  completed: 2026-03-30
---

# Quick Task 260330-jew: Verify Google + Apple OAuth Configuration

**One-liner:** Verified OAuth implementation is correct — no code changes needed. Dashboard redirect URL allow-list is the only remaining setup step.

## Findings

| Check | Status | Detail |
|-------|--------|--------|
| OAuth buttons (sign-in) | PASS | Google + Apple call `signInWithOAuth` with dynamic `redirectTo` |
| OAuth buttons (register) | PASS | Same, with `?role=${role}` appended for onboarding |
| Redirect URL pattern | PASS | Uses `window.location.origin/auth/callback` — works across all environments |
| Callback route | PASS | `app/auth/callback/route.ts` exchanges code, stores role, checks onboarding |
| Middleware whitelist | PASS | `/auth/callback` in PUBLIC_PATHS array |
| `onboarding_state` table | PASS | Exists with `onboarding_complete` field, queried correctly in callback |
| DB state | INFO | All 5805 users are email-only — no OAuth users yet |

## Action Required (Dashboard, not code)

Add these to **Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**:

- `https://goya-v2-git-develop-tiseyers-projects.vercel.app/auth/callback`
- `https://your-production-domain.com/auth/callback`
- `http://localhost:3000/auth/callback`

Without these, Supabase rejects the OAuth redirect even though the code is correct.

## No Code Changes

The OAuth implementation across sign-in, register, and callback is already correct.
