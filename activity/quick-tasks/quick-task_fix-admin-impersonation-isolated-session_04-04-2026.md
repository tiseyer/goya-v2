# Quick Task: Fix Admin Impersonation Isolated Session

**Date:** 2026-04-04
**Task ID:** 260404-phe
**Status:** Complete

## Task Description

Admin Quick Switch was opening the raw Supabase `action_link` URL in a new tab. This triggered Supabase's default auth callback flow which exchanged the magic link via shared browser session cookies, overwriting the admin's session in both tabs — both ended up logged in as the target user.

## Solution

1. Changed `app/api/admin/impersonate/route.ts` (POST) to return `{ token: hashed_token }` instead of `{ url: action_link }`.
2. Created `app/admin/impersonate/route.ts` (GET) — a Route Handler that calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })` with cookie writes scoped to the redirect response only, isolating the session to the new tab.
3. Updated `handleQuickSwitch` in `app/components/Header.tsx` to open `/admin/impersonate?token=XXX` instead of the raw Supabase URL.

## Key Pattern

Uses the same request/response cookie isolation pattern as `app/auth/callback/route.ts` — `createServerClient` with `setAll` writing onto the response object, not the shared `next/headers` cookie store.

## Commits

- `bf08be9` — feat(quick-260404-phe): return hashed_token from impersonate API instead of raw URL
- `dedc9d8` — feat(quick-260404-phe): isolated session exchange route + Header Quick Switch wiring
