# Quick Task: Fix profile route UUID/slug resolution and dropdown link

**Date:** 02-04-2026
**Status:** Done

## Task Description

Two related bugs:
1. Member profile pages at `/members/[username]` returned 404 because `page.tsx` only queried by UUID
2. Header dropdown "My Profile" linked to `/members/[uuid]` instead of `/members/[username]`

## Solution

**Profile page (`app/members/[id]/page.tsx`):**
- Added UUID regex test before querying Supabase
- UUID params: query `profiles WHERE id = param`
- Non-UUID params: query `profiles WHERE username = param`
- Changed `.single()` to `.maybeSingle()` for clean 404 on no match
- Fixed viewer-role guard comparison to use resolved `profile.id`

**Header (`app/components/Header.tsx`):**
- Added `userUsername` prop to `UserMenu` component
- Desktop "My Profile" link: `/members/${userUsername || userId}`
- Mobile bottom-sheet: same username-first with UUID fallback

**ImpersonationState (`lib/impersonation.ts`):**
- Added `username` field to `targetProfile` type
- Added `username` to profile fetch query in `getImpersonationState()`

## Commits

- `a6b3344` — fix(260402-jsp): support UUID and username routing on member profile page
- `da8697a` — fix(260402-jsp): use username instead of UUID for My Profile dropdown links
