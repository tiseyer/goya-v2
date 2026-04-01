# Quick Task: Fix Impersonation Data Queries

**Date:** 2026-03-30
**Status:** Complete (partial -- server components and API routes only)
**Plan:** 260330-naz

## Description

Updated all server-side user-facing pages and API routes to use `getEffectiveUserId()` and `getEffectiveClient()` so that admin impersonation shows the impersonated user's data instead of the admin's own data.

## Solution

Applied mechanical replacement across 8 files:
- 6 server component pages: teaching-hours, credits, community, upgrade, schools/create, members/[id]
- 2 API routes: avatar upload, flows/active

Pattern: Keep `supabase.auth.getUser()` for auth guard, use `getEffectiveUserId()` + `getEffectiveClient()` for all data queries.

## Not Fixed (Requires Architectural Change)

4 client components (dashboard, profile/settings, settings, messages) use browser-side Supabase client and cannot access the httpOnly impersonation cookie. These need conversion to server components or a new data-passing pattern.

## Commits

- `db791ea` - Server component fixes
- `f2e31a3` - API route fixes
