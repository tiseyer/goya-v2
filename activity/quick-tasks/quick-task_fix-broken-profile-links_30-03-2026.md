# Quick Task: Fix Broken Profile Links

**Date:** 2026-03-30
**Quick ID:** 260330-ngh
**Status:** Complete

## Description

The "My Profile" link in the user dropdown, "View Profile" in messages, and "Full Profile" in the member directory all led to 404 pages.

## Root Cause

`app/members/[id]/page.tsx` used `createSupabaseServerClient()` (anon key with no-op `setAll`). When JWT expires, the client can't refresh tokens in a Server Component, so Supabase falls back to `anon` role. RLS only grants SELECT to `authenticated`, causing null result and `notFound()` — 404.

## Solution

Replaced `createSupabaseServerClient()` with `getSupabaseService()` (service role, bypasses RLS) for the profile SELECT query. Safe because middleware already enforces authentication on `/members/*` routes. Also fixed TypeScript TS18048 warnings on nullable array length comparisons.

## Commits

- `ceddbd1` — fix(260330-ngh): use service role client on /members/[id] to prevent RLS false 404
