---
phase: quick
plan: 260404-phe
subsystem: admin
tags: [impersonation, auth, session-isolation, quick-switch]
tech-stack:
  added: []
  patterns: [request/response cookie isolation, verifyOtp token exchange]
key-files:
  created:
    - app/admin/impersonate/route.ts
  modified:
    - app/api/admin/impersonate/route.ts
    - app/components/Header.tsx
decisions:
  - Use app/admin/impersonate/route.ts (not the pages router) with createServerClient + response-scoped cookie writes to isolate session to the new tab
  - Do not use createSupabaseServerClient from lib/supabaseServer.ts — that helper reads/writes from next/headers shared cookie store which would affect all tabs
metrics:
  duration: 10m
  completed: "2026-04-04"
  tasks_completed: 2
  files_modified: 3
---

# Quick Task 260404-phe: Fix Admin Impersonation Isolated Session Summary

**One-liner:** Server-side token exchange route isolates Quick Switch session to new tab using verifyOtp + response-scoped cookie writes, preventing admin session overwrite.

## What Was Done

The admin Quick Switch feature was opening the raw Supabase `action_link` URL in a new tab. Because that URL triggers Supabase's default OAuth callback flow, it exchanged the magic link code via shared browser cookies — overwriting the admin's session in both tabs simultaneously.

**Fix:**
1. `app/api/admin/impersonate/route.ts` (POST) now returns `{ token: hashed_token }` instead of `{ url: action_link }`. The `hashed_token` is used for server-side OTP verification and avoids exposing the full redirect URL to the client.
2. New `app/admin/impersonate/route.ts` (GET) is a Route Handler that:
   - Reads `?token=` from the URL
   - Creates a `createServerClient` with cookie handlers that write onto the redirect response only (same isolation pattern as `app/auth/callback/route.ts`)
   - Calls `supabase.auth.verifyOtp({ token_hash, type: 'magiclink' })`
   - Returns the redirect response to `/dashboard` — session cookies are scoped to this response and therefore only this tab
3. `handleQuickSwitch` in `app/components/Header.tsx` now opens `/admin/impersonate?token=XXX` instead of `data.url`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Update API route to return hashed_token | bf08be9 | app/api/admin/impersonate/route.ts |
| 2 | Create token exchange route + update Header | dedc9d8 | app/admin/impersonate/route.ts, app/components/Header.tsx |

## Deviations from Plan

None — plan executed exactly as written.

## Verification

- TypeScript: Only pre-existing `input-otp` type errors in `app/verify-device/` (unrelated to this plan). Zero new errors introduced.
- Manual verification required: Log in as admin, click Quick Switch, confirm new tab shows target user's dashboard while admin tab remains as admin.

## Self-Check: PASSED

- `app/admin/impersonate/route.ts` — FOUND
- `app/api/admin/impersonate/route.ts` — FOUND (modified)
- `app/components/Header.tsx` — FOUND (modified)
- Commit bf08be9 — FOUND
- Commit dedc9d8 — FOUND
