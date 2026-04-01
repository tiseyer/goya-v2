# Quick Task: Fix Member Directory Hardcap & Filters

**Date:** 2026-03-30
**Status:** Complete
**Quick ID:** 260330-nij

## Description
The Member Directory at `/members` was limited to 1000 users due to Supabase PostgREST's default row limit. Additionally, the Designation and Style filter sections showed labels but no interactive filter options.

## Solution
1. Implemented paginated Supabase fetching using `.range()` to retrieve all ~5,800 members in batches of 1000
2. Added `.filter(Boolean)` to strip empty strings from designation and teaching style arrays, ensuring clean filter chip rendering
3. Both fixes applied to `lib/members-actions.ts`
