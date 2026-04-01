---
phase: quick
plan: 260327-jbs
subsystem: auth-ui
tags: [auth, ui-redesign, social-login, oauth, branding]
dependency_graph:
  requires: [supabase-auth]
  provides: [social-login-oauth, branded-auth-pages]
  affects: [sign-in, register, forgot-password, middleware, layout]
tech_stack:
  added: []
  patterns: [supabase-oauth, auth-callback-route]
key_files:
  created:
    - app/auth/callback/route.ts
    - .env.local.example
    - activity/quick-tasks/quick-task_redesign-auth-pages-brand-social-login_27-03-2026.md
  modified:
    - app/sign-in/page.tsx
    - app/register/page.tsx
    - app/forgot-password/page.tsx
    - app/layout.tsx
    - middleware.ts
decisions:
  - Used Supabase signInWithOAuth for social login (no new packages needed)
  - OAuth callback checks onboarding state to route new social users through onboarding
  - Register flow passes role via query param to callback for user metadata storage
metrics:
  duration: 422s
  completed: 2026-03-27
---

# Quick Task 260327-jbs: Redesign Auth Pages with Brand Theme and Social Login Summary

Replaced dark navy theme with GOYA light brand identity on all auth pages and added Google/Apple social login via Supabase OAuth with callback routing.

## Task Results

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Redesign auth pages to GOYA brand theme and fix root layout | 94937d0 | Done |
| 2 | Add Google and Apple social login with OAuth callback | d20e03f | Done |

## What Was Built

### Auth Page Redesign (Task 1)
- All three auth pages (sign-in, register, forgot-password) converted from dark navy to light brand theme
- Background: #f8f9fa (surface-muted), cards: white with subtle border and shadow-sm
- All accent colors changed from cyan (#2dd4bf) to brand blue (#345c83)
- Logo switched from GOYA Logo White.png to GOYA Logo Blue.png
- Pages use h-screen overflow-hidden for exact viewport height with no scrolling
- Privacy Policy and Terms of Use links added below each form card
- Root layout updated: /sign-in and /forgot-password added to hideNav and hideFooter conditions
- Register page: step indicator, role cards, checkmarks, success step all use brand blue
- Select dropdown options no longer have dark background class

### Social Login (Task 2)
- Google and Apple OAuth buttons added to sign-in page above email/password form with "or" divider
- Google and Apple OAuth buttons added to register page Step 2 above name/email fields with "or" divider
- OAuth callback route at /auth/callback exchanges code for session via Supabase
- Callback checks onboarding_state and redirects incomplete users to /onboarding
- Register flow passes selected role via query param; callback stores it in user metadata
- /auth/callback added to PUBLIC_PATHS and MAINTENANCE_BYPASS_PATHS in middleware
- .env.local.example created with Google and Apple OAuth placeholder variables
- Standard multi-color Google "G" SVG and Apple logo SVG used for social buttons

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None. Social login buttons call supabase.auth.signInWithOAuth which is a real Supabase SDK method. OAuth providers (Google, Apple) need to be configured in the Supabase Dashboard with credentials from .env.local.example for the flow to work end-to-end.

## Self-Check: PASSED

All 8 files verified present. Both task commits (94937d0, d20e03f) confirmed in git log.
