---
phase: quick-260404-jhf
plan: 01
subsystem: admin-settings
tags: [search, test-users, server-action, bug-fix]
dependency_graph:
  requires: []
  provides: [searchProfilesForTestSlots]
  affects: [app/admin/settings/components/TestUsersTab.tsx, app/actions/members.ts]
tech_stack:
  added: []
  patterns: [server-action, supabase-service-client, or-ilike-query]
key_files:
  created: []
  modified:
    - app/actions/members.ts
    - app/admin/settings/components/TestUsersTab.tsx
decisions:
  - Dedicated server action instead of patching searchMembers — avoids breaking InstructorPicker/OrganizerPicker consumers
  - Secondary profile fetch on select removed — search result now carries role + school data inline
metrics:
  duration: ~5 minutes
  completed: "2026-04-04T07:37:16Z"
  tasks_completed: 2
  files_modified: 2
---

# Quick Task 260404-jhf: Fix Test User Slot Search Broken API Return

**One-liner:** Dedicated `searchProfilesForTestSlots` action searches profiles by name OR email with role data inline, replacing broken `searchMembers({role:'admin'})` that only matched `full_name`.

## What Was Done

### Task 1 — Add `searchProfilesForTestSlots` server action
Added to `app/actions/members.ts`:
- Searches `profiles` by `full_name.ilike.%q%` OR `email.ilike.%q%` in a single query
- Returns `id, full_name, email, role, principal_trainer_school_id` — no secondary fetch needed
- Role-gates to admin/moderator via service client check
- Does not exclude caller's own ID (admin may self-assign)
- Exports `TestSlotSearchResult` interface

### Task 2 — Update TestUsersTab
Updated `app/admin/settings/components/TestUsersTab.tsx`:
- Import swapped from `searchMembers` to `searchProfilesForTestSlots + TestSlotSearchResult`
- Local `SearchResult` interface removed (replaced by imported type)
- `results` state typed as `TestSlotSearchResult[]`
- `handleSelect` made synchronous — no longer does secondary Supabase profile fetch
- Dropdown result buttons now show name (bold) + email (grey, xs) in two-line layout

## Root Cause

`searchMembers(q, { role: 'admin' })` set `callerRole = 'admin'` which triggered the privileged path, but that path only did `.ilike('full_name', searchTerm)` and excluded the caller's own ID. Email search was not supported. The fix is a purpose-built action that does what the UI actually needs.

## Commits

| # | Hash | Message |
|---|------|---------|
| 1 | 7a2b4dc | feat(quick-260404-jhf): add searchProfilesForTestSlots server action |
| 2 | fa86608 | feat(quick-260404-jhf): use searchProfilesForTestSlots in TestUsersTab, show email in results |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `app/actions/members.ts` modified and committed at 7a2b4dc
- `app/admin/settings/components/TestUsersTab.tsx` modified and committed at fa86608
- `npx tsc --noEmit` passes with zero errors
