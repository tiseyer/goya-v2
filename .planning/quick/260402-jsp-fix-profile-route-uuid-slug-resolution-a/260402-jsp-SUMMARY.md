---
task: 260402-jsp
title: Fix profile route UUID/slug resolution and dropdown link
date: 2026-04-02
status: complete
commits:
  - a6b3344
  - da8697a
files_modified:
  - app/members/[id]/page.tsx
  - app/components/Header.tsx
  - lib/impersonation.ts
---

# 260402-jsp: Fix profile route UUID/slug resolution and dropdown link

## Summary

Profile pages now resolve both UUID params and username/slug params, and the Header dropdown "My Profile" link navigates to `/members/[username]` with a UUID fallback.

## Issues Fixed

### Issue 1: Profile route UUID/slug dual resolution

**Problem:** `app/members/[id]/page.tsx` queried `profiles` by `id` (UUID) only. Directory links using `/members/[username]` (e.g. `/members/jennifer-walsh`) returned 404.

**Fix:** Added UUID regex detection before the Supabase query. UUID params query by `id`; all other params query by `username`. Changed `.single()` to `.maybeSingle()` for clean 404 handling. Also corrected the viewer-role guard to compare `viewerId` against the resolved `profile.id` (not the raw `id` param which could be a username string).

Also added `username: string | null` to the inline profile type cast since it was already in `PUBLIC_PROFILE_COLUMNS` but missing from the local type annotation.

### Issue 2: Header dropdown "My Profile" uses username

**Problem:** `UserMenu` linked to `/members/${userId}` (UUID), and the mobile bottom-sheet linked to `/members/${profile?.id}`. Both bypassed the username-based routing.

**Fix:**
- Added `userUsername?: string | null` prop to `UserMenu`
- Desktop menu item now uses `/members/${userUsername || userId}` — falls back to UUID if username is null
- Mobile bottom-sheet link uses `username || id` pattern for both own profile and impersonated profile
- Extended `ImpersonationState.targetProfile` type in `lib/impersonation.ts` to include `username: string | null`
- Updated the `getImpersonationState()` query to fetch `username` from the `profiles` table

## Deviations

None — plan executed exactly as written.

## TypeScript

`npx tsc --noEmit` passed with no errors introduced by these changes. (One pre-existing unrelated error in `.next/dev/types/validator.ts` for a missing school settings page type was not introduced by this task.)
