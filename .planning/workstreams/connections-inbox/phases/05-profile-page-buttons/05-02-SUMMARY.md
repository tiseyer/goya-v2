---
phase: 05-profile-page-buttons
plan: 02
subsystem: ui
tags: [react, typescript, nextjs, supabase, server-component, connect-button]

# Dependency graph
requires:
  - phase: 05-01
    provides: Role-aware ConnectButton with viewerRole/profileRole/isOwnProfile/isOwnSchool props
  - phase: 04-database-foundation
    provides: connections table, profiles table with member_type/role columns, schools table with owner_id
provides:
  - MemberProfilePage wired with viewer profile fetch and school ownership check
  - viewerRole derived from viewer's profiles.member_type ?? profiles.role ?? 'student'
  - isOwnSchool from schools.owner_id conditional query (only fires for school profiles)
  - ConnectButton receives all four role-aware props from server component
affects: [connections-settings, settings-inbox, admin-user-detail]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Conditional Supabase query: viewer profile fetch guarded by currentUserId null check
    - Conditional school ownership check: guarded by role === 'school' && currentUserId
    - maybeSingle() for ownership check to avoid error on no-match

key-files:
  created: []
  modified:
    - app/members/[id]/page.tsx (viewer profile fetch, school ownership, ConnectButton prop pass-through)

key-decisions:
  - "viewerRole fallback chain matches profileRole: member_type ?? role ?? 'student' for consistency"
  - "School ownership check uses owner_id only (no profile_id join needed) — viewer owns any school = show Manage School"
  - "isOwnProfile derived server-side as profile.id === currentUserId for consistency with ConnectionsSection pattern"

patterns-established:
  - "Conditional Supabase query pattern: ternary on currentUserId before await for auth-gated queries"
  - "School ownership guard: if (role === 'school' && currentUserId) before schools query — avoids unnecessary DB calls"

requirements-completed: [PROF-01, PROF-02, PROF-03, PROF-04]

# Metrics
duration: 8min
completed: 2026-03-23
---

# Phase 05 Plan 02: Profile Page Buttons Summary

**MemberProfilePage server component wired with viewer profile fetch and school ownership check — all four PROF role-aware ConnectButton props now flow from Supabase to UI**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-03-23T22:00:00Z
- **Completed:** 2026-03-23T22:08:00Z
- **Tasks:** 2 (1 auto + 1 human-verify, both complete)
- **Files modified:** 1

## Accomplishments

- Viewer profile fetch added to MemberProfilePage: conditional Supabase query on `currentUserId`, derives `viewerRole` from `member_type ?? role ?? 'student'`
- School ownership check added: `schools.owner_id` query only fires when `role === 'school' && currentUserId` — no unnecessary DB round-trips
- ConnectButton now receives all 4 new props: `viewerRole`, `profileRole`, `isOwnProfile`, `isOwnSchool`
- Full data flow complete: Supabase profiles + schools tables → server component → role-aware ConnectButton UI
- All 18 connect-button tests pass; pre-existing `app/page.test.tsx` failures remain out-of-scope

## Task Commits

1. **Task 1: Wire viewer profile fetch, school ownership check, and new ConnectButton props** — `6ef375c` (feat)
2. **Task 2: Verify role-aware connect buttons in browser** — human-approved (checkpoint, no code commit)

## Files Created/Modified

- `app/members/[id]/page.tsx` — Added viewerProfile fetch (lines 35-46), isOwnSchool check (lines 105-114), updated ConnectButton JSX with 4 new props (lines 312-315)

## Decisions Made

- Used `member_type ?? role ?? 'student'` fallback chain for both viewerRole and profileRole for consistency — same pattern already used in the component
- School ownership check queries `schools.owner_id === currentUserId` without joining to profile — sufficient for v1.1 because teacher owns one school, and the check is "does viewer own any school AND is this a school profile"
- `maybeSingle()` used for school ownership to return null (not error) when no school owned

## Deviations from Plan

None — plan executed exactly as written. The plan's action block mapped exactly to the current file structure after the git merge from develop.

## Issues Encountered

The worktree `worktree-agent-ad7db2db` was at `main@07b2d79` (before Plan 01 work). Fast-forward merged `develop` to bring in 05-01 commits before executing 05-02. This is expected worktree initialization behavior, not a deviation.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- All four PROF requirements are fully wired and human-verified across role combinations
- Phase 5 is complete (2/2 plans done)
- Phase 6 can proceed with Settings > Connections implementation

## Known Stubs

None — all data flows are wired. The four new ConnectButton props are populated from real Supabase queries (viewer profile and school ownership).

## Self-Check: PASSED

- FOUND: `app/members/[id]/page.tsx` — modified with all 3 additions
- FOUND commit: `6ef375c` (feat: wire viewer profile fetch, school ownership check, and new ConnectButton props)
- Acceptance criteria verified:
  - `viewerProfile` variable declaration: FOUND (line 36)
  - `.from('profiles').select('member_type, role').eq('id', currentUserId)`: FOUND (lines 38-41)
  - `const viewerRole = viewerProfile`: FOUND (line 44)
  - `viewerProfile.member_type ?? viewerProfile.role ?? 'student'`: FOUND (line 45)
  - `let isOwnSchool = false`: FOUND (line 106)
  - `.from('schools').select('id').eq('owner_id', currentUserId)`: FOUND (lines 109-111)
  - `maybeSingle()`: FOUND (line 112)
  - `if (role === 'school' && currentUserId)`: FOUND (line 107)
  - `viewerRole={viewerRole}`: FOUND (line 312)
  - `profileRole={role}`: FOUND (line 313)
  - `isOwnProfile={profile.id === currentUserId}`: FOUND (line 314)
  - `isOwnSchool={isOwnSchool}`: FOUND (line 315)
  - `npx vitest run __tests__/connect-button.test.tsx` exits 0: CONFIRMED (18/18 pass)

---
*Phase: 05-profile-page-buttons*
*Completed: 2026-03-23*
