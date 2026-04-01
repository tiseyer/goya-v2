# Quick Task: Fix Member Directory — Real Supabase Data

**Date:** 2026-03-30
**Task ID:** 260330-f5s
**Status:** COMPLETE

## Task Description

The /members directory page was showing 330 hardcoded fake members from `lib/members-data.ts` instead of real registered users. Search, filtering, and the map all operated on mock data (names like "Jennifer Walsh"), making the directory completely non-functional for real users.

## Solution

1. **Created `lib/members-actions.ts`** — a `'use server'` module with `fetchMembers()` that:
   - Queries Supabase `profiles` table using the service role client
   - Filters to `onboarding_completed = true` (skips ghost accounts)
   - Maps profile rows to the existing `Member` interface
   - Returns members plus computed `allDesignations` and `allTeachingStyles` arrays for filter chips

2. **Stripped `lib/members-data.ts`** — removed all 330 mock entries, kept only the `MemberRole` type and `Member` interface that other components depend on

3. **Updated `app/members/page.tsx`** — replaced static imports with `useEffect` + `fetchMembers` on mount; added `loading` state and loading UI for desktop/mobile

4. **Updated `app/members/[id]/page.tsx`** — removed static member fallback IIFE; now calls `notFound()` directly when Supabase returns no profile

## Result

- Member directory now shows real registered users from Supabase
- All filters (search, role, country, designation, style) operate on real data
- Build passes with no TypeScript errors
- Commits: 27aa2fe, 144aeb0
