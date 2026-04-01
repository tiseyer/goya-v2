# Quick Task: Fix Impersonation Data Queries

**Date:** 2026-03-30
**Status:** Complete
**Quick ID:** 260330-naz

## Description

Fixed the admin "Switch To" (impersonation) feature so that ALL data across the platform reflects the impersonated user's perspective, not the admin's.

## Solution

- Updated 6 server-side files (Server Components + API routes) to use `getEffectiveUserId()` + `getEffectiveClient()` instead of `supabase.auth.getUser()` + `user.id`
- Created `/api/me` route for client components to fetch effective user profile server-side
- Updated 4 client components to use `useImpersonation()` context + `/api/me` when impersonating
- 11 files total (10 modified, 1 new)
