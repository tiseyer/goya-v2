# Quick Task: Fix Navbar Auth Flash

**Date:** 2026-03-27
**Status:** Complete (awaiting human visual verification)
**Task ID:** 260327-j1k

## Task Description

Fix two visual glitches in the navbar during authentication state resolution:
1. Flash of "Sign In" / "Join GOYA" buttons visible for ~500ms on page load before auth resolves for logged-in users
2. Email prefix (e.g. "till.seyer") appearing briefly as display name before profile loads

## Solution

Added `authLoading` state to `Header.tsx` initialized to `true`. The state is set to `false` only after the initial `supabase.auth.getUser()` call completes — including the subsequent `profiles.select()` fetch for logged-in users.

During the loading window, animated skeleton pulse placeholders replace the auth area in both desktop (`w-20 h-8 rounded-lg` + `w-8 h-8 rounded-full`) and mobile (`w-8 h-8 rounded-full`) layouts.

`userName` derivation simplified from `profile?.full_name ?? user?.email?.split('@')[0] ?? ''` to `profile?.full_name ?? ''` to prevent email prefix from ever showing.

Dashboard link and mobile profile sheet also guarded behind `!authLoading && isLoggedIn`.

## Files Modified

- `app/components/Header.tsx`

## Commit

`8c31667` — fix(260327-j1k): add auth loading skeleton to navbar to prevent flash
