---
task_id: 260404-jhf
date: 04-04-2026
status: complete
---

# Quick Task: Fix Test User Slot Search Broken API Return

## Task Description

The test user slot search in Admin Settings was returning zero results. The root cause was `searchMembers(q, { role: 'admin' })` which only searched `full_name` (not email) and excluded the caller's own profile ID. A dedicated server action was needed.

## Solution

1. Added `searchProfilesForTestSlots(query)` to `app/actions/members.ts`:
   - Searches profiles by name OR email using a Supabase `.or()` ilike query
   - Returns `id, full_name, email, role, principal_trainer_school_id` inline
   - Admin/moderator only (role-gated via service client)

2. Updated `TestUsersTab.tsx`:
   - Swapped import to `searchProfilesForTestSlots`
   - Removed async secondary profile fetch in `handleSelect` (data comes inline now)
   - Dropdown now shows name + email in two-line layout

## Status

Complete. TypeScript compiles clean. Both commits on develop branch.
