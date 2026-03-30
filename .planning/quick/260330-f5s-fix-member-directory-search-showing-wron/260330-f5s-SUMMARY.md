---
phase: quick
plan: 260330-f5s
subsystem: members-directory
tags: [supabase, server-action, members, mock-data-removal]
dependency_graph:
  requires: [supabase/profiles table, getSupabaseService]
  provides: [fetchMembers server action, real member directory]
  affects: [app/members/page.tsx, app/members/[id]/page.tsx, lib/members-data.ts]
tech_stack:
  added: []
  patterns: [server-action-from-client-useEffect, supabase-service-role-query]
key_files:
  created:
    - lib/members-actions.ts
  modified:
    - lib/members-data.ts
    - app/members/page.tsx
    - app/members/[id]/page.tsx
decisions:
  - fetchMembers uses 'use server' directive without server-only package (not installed)
  - coordinates mapped to [0,0] — no lat/lng in profiles table; map markers simply won't pin
  - introduction field omitted from fetchMembers select — not present in supabase generated types
  - onboarding_completed=true filter excludes ghost/incomplete accounts from directory
metrics:
  duration: ~8 min
  completed: 2026-03-30
---

# Quick Task 260330-f5s: Fix Member Directory — Real Supabase Data

**One-liner:** Replaced 330-entry mock member array with a `fetchMembers` server action querying Supabase `profiles`, wiring all filters, search, map, and inline profile to real data.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create server action and update Member interface | 27aa2fe | lib/members-actions.ts, lib/members-data.ts |
| 2 | Wire page components to server action, remove static fallbacks | 144aeb0 | app/members/page.tsx, app/members/[id]/page.tsx |

## What Was Built

- **`lib/members-actions.ts`** — `'use server'` module exporting `fetchMembers()` that queries Supabase `profiles` with `onboarding_completed=true` filter, maps rows to `Member` interface, and returns computed `allDesignations` and `allTeachingStyles` arrays.
- **`lib/members-data.ts`** — stripped of 330 mock entries; retains only `MemberRole` type and `Member` interface exports used by MapPanel and other consumers.
- **`app/members/page.tsx`** — converted from static imports to `useEffect` + `fetchMembers` on mount; `allMembers`, `allDesignations`, `allTeachingStyles` are now state; loading states added for both desktop and mobile.
- **`app/members/[id]/page.tsx`** — removed static member fallback IIFE and `STATIC_ROLE_MAP`; now calls `notFound()` directly if Supabase returns no profile.

## Role Mapping Logic

`member_type` field takes precedence: `school` → `School`, `teacher` → `Teacher`, `student` → `Student`, `wellness_practitioner` → `Wellness Practitioner`. Falls back to `role` enum. Admin/moderator roles fall back to `Student` display role in directory (no dedicated display role for those).

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written with one minor adjustment:

**[Rule 2 - Missing field] `introduction` not selected in fetchMembers**
- **Found during:** Task 1 implementation
- **Issue:** `introduction` is not present in the Supabase generated types (`types/supabase.ts`), so selecting it would cause a TypeScript error
- **Fix:** Omitted `introduction` from the `fetchMembers` select; the field is still available on `Member` interface as optional, just never populated by the directory fetch (the `[id]/page.tsx` already selects it directly in its own query)
- **Impact:** None — introduction is only rendered in the inline profile/hero where the dedicated page query already fetches it

## Known Stubs

- `coordinates: [0, 0]` — profiles table has no lat/lng columns; map markers won't appear for real members until geocoding is added in a future plan
- `credits: { CE: 0, Community: 0, Karma: 0, Practice: 0 }` — credits system not yet wired to profiles

## Self-Check: PASSED

- lib/members-actions.ts: FOUND
- lib/members-data.ts (stripped): FOUND
- Commits 27aa2fe and 144aeb0: FOUND
- Build: PASSED (no TypeScript errors)
