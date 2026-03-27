# Quick Task: Redesign Auth Pages with Brand Theme and Social Login

**Date:** 2026-03-27
**Status:** Complete

## Task Description

Redesign all authentication pages (sign-in, register, forgot-password) to use GOYA's light brand identity instead of the dark navy theme. Add Google and Apple social login buttons with OAuth callback handling.

## Solution

### Auth Page Redesign
- Replaced dark navy backgrounds (#1a2744, #1e2e56, #243560) with light surfaces (#f8f9fa, white cards)
- Replaced cyan accent (#2dd4bf) with brand primary blue (#345c83)
- Switched logo from GOYA Logo White.png to GOYA Logo Blue.png
- Applied h-screen overflow-hidden for exact viewport height, no scrolling
- Added Privacy Policy and Terms of Use links below each form card
- Added /sign-in and /forgot-password to hideNav and hideFooter in root layout

### Social Login
- Added Google and Apple OAuth buttons with SVG icons on sign-in and register pages
- Created /auth/callback route handler that exchanges OAuth code for session
- Callback checks onboarding state and redirects new users to onboarding
- Register flow passes selected role via query param to callback for metadata storage
- Added /auth/callback to PUBLIC_PATHS and MAINTENANCE_BYPASS_PATHS in middleware
- Created .env.local.example with OAuth provider placeholder variables

### Files Modified
- app/sign-in/page.tsx
- app/register/page.tsx
- app/forgot-password/page.tsx
- app/layout.tsx
- app/auth/callback/route.ts (new)
- middleware.ts
- .env.local.example (new)
