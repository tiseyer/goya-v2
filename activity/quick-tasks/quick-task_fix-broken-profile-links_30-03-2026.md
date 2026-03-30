# Quick Task: Fix Broken Profile Links

**Date:** 30-03-2026
**Status:** Done

## Task Description

All profile links across the app (`/members/{id}`) were returning 404 errors. Three link sources were affected: the Header dropdown "My Profile" link, the Messages page "View Profile" link, and the Member Directory "View Full Profile" link.

## Root Cause

`app/members/[id]/page.tsx` used `createSupabaseServerClient()` (anon key + user session) for the profiles SELECT query. The `setAll` handler in this client is a no-op (Server Components cannot set cookies), so when the JWT token expires it cannot be refreshed. The Supabase client then operates as the `anon` role, which is blocked by the RLS policy `"Profiles are viewable by authenticated users"`. The query returns null, triggering `notFound()`.

## Solution

Replaced `createSupabaseServerClient()` with `getSupabaseService()` (service role) for the profile data fetch in `app/members/[id]/page.tsx`. The middleware already enforces that `/members/*` requires authentication, so the service role bypass is safe. Also fixed a TypeScript TS18048 error on nullable array length comparisons in the same file.

## Files Changed

- `app/members/[id]/page.tsx` — use service role client, fix TS18048

## Commit

- `ceddbd1` — fix(260330-ngh): use service role client on /members/[id] to prevent RLS false 404
