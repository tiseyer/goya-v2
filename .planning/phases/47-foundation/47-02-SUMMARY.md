---
phase: 47-foundation
plan: "02"
subsystem: members
tags: [privacy, data-fetching, auth, server-components, profile]
one_liner: "Privacy helper (deriveProfileVisibility), PUBLIC_PROFILE_COLUMNS constant, member query functions, and page.tsx rewrite with server-side auth + Promise.all parallel fetch"

dependency_graph:
  requires: [47-01]
  provides:
    - lib/members/constants.ts (PUBLIC_PROFILE_COLUMNS)
    - lib/members/profileVisibility.ts (deriveProfileVisibility, ProfileVisibility)
    - lib/members/queries.ts (fetchMemberEvents, fetchMemberCourses)
    - app/members/[id]/page.tsx (rewritten data layer)
  affects:
    - app/members/[id]/page.tsx

tech_stack:
  added: []
  patterns:
    - "PUBLIC_PROFILE_COLUMNS column allowlist pattern for service-role SELECTs"
    - "deriveProfileVisibility() server-side privacy gate"
    - "Promise.all for parallel profile-page data fetching"
    - "auth.getUser() (not getSession) for server-side own-profile detection"

key_files:
  created:
    - lib/members/constants.ts
    - lib/members/profileVisibility.ts
    - lib/members/queries.ts
  modified:
    - app/members/[id]/page.tsx

decisions:
  - "showAddress=true for all roles — city+country text is safe for all (user entered it themselves)"
  - "showMap=false for students and online-only profiles regardless of coordinate presence"
  - "profile cast uses 'as unknown as' to avoid TS generic type overlap error with Supabase client"
  - "profileRole falls back to 'student' (not null) to satisfy ConnectButton string type"
  - "memberEvents/memberCourses fetched but suppressed with void until Phases 48-50 render them"

metrics:
  duration_minutes: 3
  completed_date: "2026-04-01"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 47 Plan 02: Privacy Helper, Column Constant, Own-Profile Auth, Promise.all Summary

## What Was Built

Three new files in `lib/members/` establish the privacy and data-fetch architecture that Phases 48-50 build on top of:

**`lib/members/constants.ts`** — Exports `PUBLIC_PROFILE_COLUMNS`, an explicit column allowlist for service-role `SELECT` calls. Excludes `email`, `phone`, `certificate_url`, `certificate_is_official`, `other_org_registration`, `other_org_designations`, `wellness_regulatory_designations`, `wellness_designation_other`, `onboarding_completed`, and `onboarding_step`.

**`lib/members/profileVisibility.ts`** — Exports `deriveProfileVisibility()` and the `ProfileVisibility` interface. Runs server-side only. Returns:
- `showMap=false` for students (regardless of `practice_format` or coordinates)
- `showMap=false` for `practice_format='online'` (regardless of role)
- `showMap=true` for in_person/hybrid non-students with lat/lng set
- `showAddress=true` for all roles (city+country text is user-provided, safe for everyone)
- `showFullAddress=showMap` (precise coordinates only when map is shown)

**`lib/members/queries.ts`** — Exports `fetchMemberEvents(supabase, userId)` and `fetchMemberCourses(supabase, userId)`. Both filter by `created_by=userId` and `status=published`. Mirror the patterns from `lib/dashboard/queries.ts` and reuse the same `EventRow`/`CourseRow` types.

**`app/members/[id]/page.tsx`** — Data layer rewritten:
- `auth.getUser()` called after `params` resolution, before data fetch; derives `isOwnProfile = viewerId === profile.id`
- Profile `SELECT` uses `PUBLIC_PROFILE_COLUMNS` (no inline column list)
- `fetchAffiliatedSchools()` extracted into a local helper for parallel execution
- `Promise.all` fires schools, events, and courses concurrently after profile fetch
- `deriveProfileVisibility()` called server-side after profile resolves
- Hard-coded `isOwnProfile={false}` replaced with derived `isOwnProfile`
- JSX and CSS layout unchanged (visual redesign deferred to Phases 48-50)

## Commits

| Task | Commit | Message |
|------|--------|---------|
| Task 1 | c5dbb86 | feat(47-02): create lib/members/ module with constants, visibility helper, queries |
| Task 2 | 51859ed | feat(47-02): rewrite members profile page with auth, Promise.all, and visibility |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript type overlap error on profileData cast**
- **Found during:** Task 2 tsc check
- **Issue:** `profileData as { id: string; ... }` failed — Supabase generic returns `GenericStringError` type which doesn't overlap with the inline object type
- **Fix:** Changed to `profileData as unknown as { ... }` (double cast through unknown)
- **Files modified:** app/members/[id]/page.tsx

**2. [Rule 1 - Bug] profileRole prop type mismatch**
- **Found during:** Task 2 tsc check
- **Issue:** `ConnectButton.profileRole` expects `string` but `profile.role ?? null` produced `string | null`
- **Fix:** Changed fallback to `profile.role ?? 'student'` (sensible default matching original behavior)
- **Files modified:** app/members/[id]/page.tsx

## Known Stubs

None — `memberEvents`, `memberCourses`, and `visibility` are fetched and derived but suppressed with `void` until Phases 48-50 wire them to components. This is intentional: the data layer is ready; rendering will be added in subsequent plans.

## Self-Check: PASSED
