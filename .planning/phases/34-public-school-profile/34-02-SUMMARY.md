---
phase: 34-public-school-profile
plan: "02"
subsystem: member-directory
tags: [schools, member-directory, filtering, supabase]
dependency_graph:
  requires: []
  provides: [school-cards-in-directory, school-filter-in-members-page]
  affects: [app/members/page.tsx, lib/members-data.ts, lib/members-actions.ts]
tech_stack:
  added: [lib/members-actions.ts]
  patterns: [server-action-data-fetch, client-side-merge, conditional-card-rendering]
key_files:
  created:
    - lib/members-actions.ts
  modified:
    - app/members/page.tsx
    - lib/members-data.ts
decisions:
  - Fetch schools client-side on mount (page is 'use client') and merge with static member data
  - Deduplicate by owner_id so school owners who are also in profiles don't appear twice
  - SchoolCard navigates directly to /schools/[slug] rather than opening inline panel
  - CompactCard updated to conditionally render as Link for school members
metrics:
  duration: "5 minutes"
  completed: "2026-03-31"
  tasks_completed: 2
  files_changed: 3
---

# Phase 34 Plan 02: School Directory Integration Summary

**One-liner:** Approved schools appear in the member directory as distinct SchoolCard entries with logo, designation badges, and direct link to /schools/[slug].

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend fetchMembers to include approved schools | f083563 | lib/members-data.ts, lib/members-actions.ts |
| 2 | Add SchoolCard component and wire school clicks | e987ef5 | app/members/page.tsx |

## What Was Built

### lib/members-data.ts
Added two optional fields to the `Member` interface:
- `slug?: string` — used for `/schools/[slug]` navigation
- `schoolDesignations?: string[]` — designation badges (e.g. CYS200, CMS)

### lib/members-actions.ts (new file)
Server action `fetchSchoolMembers()` that:
1. Queries `schools` table for `status='approved'` rows
2. Fetches associated `school_designations` records
3. Groups designations by school_id
4. Maps each school to the `Member` format with `role='School'`

### app/members/page.tsx
- `SchoolCard` component: logo (rounded-xl), school name, purple "School" badge, location, designation pills (up to 3 + "+N more"), bio excerpt, "View School" footer — wrapped in Link to `/schools/[slug]`
- `CompactCard` refactored: conditionally renders as `Link` for school members, `button` for regular members
- Page loads school members on mount via `useEffect` + `fetchSchoolMembers`
- `allMembers` memo merges static member list with dynamically loaded schools
- Both desktop grid and mobile grid use conditional rendering: `SchoolCard` for `role === 'School' && slug`, `FullCard` otherwise
- Member counts updated to use `allMembers.length`

## Deviations from Plan

### Auto-fix: No `members-actions.ts` existed
- **Found during:** Task 1
- **Issue:** Plan referenced updating `lib/members-actions.ts` but the file did not exist
- **Fix:** Created the file as a new server action module with `fetchSchoolMembers` (plan described a `fetchMembers` that included school logic; adapted to a standalone `fetchSchoolMembers` since the page uses static data and can't easily swap to a fully server-side fetch)
- **Commit:** f083563

### Auto-fix: Duplicate Tailwind class names in SchoolCard badge
- **Found during:** Task 2
- **Issue:** Copy from plan spec left both `bg-primary/10 text-primary border-primary/20` and `bg-[#4E87A0]/10 text-[#4E87A0] border-[#4E87A0]/20` on the same element
- **Fix:** Removed the non-functional `primary` CSS variable references, kept concrete hex classes
- **Commit:** e987ef5

## Known Stubs

None — school data is wired to Supabase. If no approved schools exist the directory shows only static members (graceful fallback).

## Self-Check: PASSED
