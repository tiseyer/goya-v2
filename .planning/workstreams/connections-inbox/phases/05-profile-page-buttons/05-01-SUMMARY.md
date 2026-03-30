---
phase: 05-profile-page-buttons
plan: 01
subsystem: ui
tags: [react, typescript, tailwind, testing-library, vitest, connectbutton]

# Dependency graph
requires:
  - phase: 04-database-foundation
    provides: connections table with type column (peer/mentorship/faculty)
provides:
  - Role-aware ConnectButton using ROLE_PAIR_MAP lookup (student:teacher, teacher:school, wellness_practitioner:school)
  - ConnRecord.type field populated from Supabase load and optimistic updates
  - Pending-sent labels that reflect connection type (Request Sent / Mentorship Requested / Application Sent)
  - All inline <button> elements migrated to shared Button component
  - Comprehensive unit test suite for all role-pair combinations and pending states
affects: [05-02-plan, profile-page-integration, connections-settings]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - ROLE_PAIR_MAP: lookup table const outside component for role-pair to CTA label+type mapping
    - PENDING_SENT_LABEL: separate lookup table for pending state type-to-label translation
    - TDD (RED then GREEN): tests committed first as failing, then implementation makes them pass

key-files:
  created:
    - __tests__/connect-button.test.tsx (comprehensive role-aware unit tests)
  modified:
    - app/components/ConnectButton.tsx (fully rewritten with role-pair logic and Button migration)
    - app/context/ConnectionsContext.tsx (type field added to ConnRecord)

key-decisions:
  - "ROLE_PAIR_MAP as module-level const: enables exhaustive lookup without switch/if chains, easily extended"
  - "vi.mock('next/navigation') required alongside ConnectionsContext mock — useRouter must be mocked in jsdom"
  - "type field added directly to ConnRecord (not derived) to persist across optimistic updates and Supabase loads"

patterns-established:
  - "Role-pair CTA: use ROLE_PAIR_MAP[viewerRole:profileRole] with peer fallback for unknown pairs"
  - "Pending-sent labels: store type on ConnRecord, look up in PENDING_SENT_LABEL at render time"
  - "Button migration: all inline <button> replaced with shared Button from app/components/ui/Button.tsx"

requirements-completed: [PROF-01, PROF-02, PROF-03, PROF-04]

# Metrics
duration: 12min
completed: 2026-03-23
---

# Phase 05 Plan 01: Profile Page Buttons Summary

**Role-aware ConnectButton with ROLE_PAIR_MAP lookup, type-aware pending-sent labels, Button component migration, and 20-test vitest suite covering all PROF requirements**

## Performance

- **Duration:** ~12 min
- **Started:** 2026-03-23T21:52:00Z
- **Completed:** 2026-03-23T21:54:00Z
- **Tasks:** 2 (TDD RED + GREEN)
- **Files modified:** 3

## Accomplishments

- ConnRecord now carries `type: 'peer' | 'mentorship' | 'faculty'` populated from Supabase and optimistic updates
- ConnectButton rewritten with ROLE_PAIR_MAP: student+teacher=Request Mentorship, teacher|wellness_practitioner+school=Apply as Faculty, default=Connect with {firstName}
- All 4 PROF requirements implemented: role-aware CTA (PROF-01/02), Manage School (PROF-03), peer connect (PROF-04)
- Type-aware pending-sent labels: peer=Request Sent, mentorship=Mentorship Requested, faculty=Application Sent
- All 7 inline `<button>` elements replaced with shared Button component; no hardcoded hex colors remain
- 20-test vitest suite: 18 new role/state tests + 2 existing UUID/slug tests — all passing

## Task Commits

1. **Task 1: Add type field to ConnRecord + failing unit tests (TDD RED)** — `c917c80` (test)
2. **Task 2: Rewrite ConnectButton + fix next/navigation mock (TDD GREEN)** — `668b134` (feat)

## Files Created/Modified

- `app/components/ConnectButton.tsx` — Fully rewritten: ROLE_PAIR_MAP, PENDING_SENT_LABEL, Button import, new props (viewerRole, profileRole, isOwnProfile, isOwnSchool)
- `app/context/ConnectionsContext.tsx` — ConnRecord.type field added; populated in Supabase load and sendRequest optimistic update
- `__tests__/connect-button.test.tsx` — 20 tests covering all role pairs, pending states, accept/decline, connected, own-profile null

## Decisions Made

- Used ROLE_PAIR_MAP as module-level const: enables O(1) role lookup, easily extended for new role pairs, avoids nested conditionals
- `vi.mock('next/navigation')` added to tests: useRouter() throws in jsdom without it; auto-fixed as Rule 3 (blocking)
- `type` stored on ConnRecord (not derived from role at render time): preserves type across the connection lifecycle, including after Supabase reload

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Added next/navigation mock to test file**
- **Found during:** Task 2 (Rewrite ConnectButton — TDD GREEN phase)
- **Issue:** ConnectButton now uses `useRouter()` from `next/navigation`; jsdom test environment throws "invariant: You cannot use this router without a Next.js router" without a mock
- **Fix:** Added `vi.mock('next/navigation', () => ({ useRouter: () => ({ push: mockPush }) }))` to the test file
- **Files modified:** `__tests__/connect-button.test.tsx`
- **Verification:** All 20 tests pass
- **Committed in:** `668b134` (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** Necessary for test environment correctness. No scope creep.

## Issues Encountered

The TypeScript type annotation on `mockGetStatus` using conditional infer was overly complex and unnecessary — simplified to a plain `vi.fn()` with no type annotation. No functional impact.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- ConnectButton is role-aware and ready for integration into profile pages (Plan 05-02)
- ConnRecord.type field is live — Settings > Connections and Settings > Inbox can display type-specific labels in Phase 6
- All PROF requirements are client-side complete; Plan 05-02 will wire them into actual profile page layouts

## Known Stubs

None — all data flows are wired. ConnectButton receives viewerRole and profileRole as props; callers (profile pages) must supply correct values — this is the concern of Plan 05-02.

## Self-Check: PASSED

- FOUND: `app/components/ConnectButton.tsx`
- FOUND: `app/context/ConnectionsContext.tsx`
- FOUND: `__tests__/connect-button.test.tsx`
- FOUND: `.planning/workstreams/connections-inbox/phases/05-profile-page-buttons/05-01-SUMMARY.md`
- FOUND commit: `c917c80` (test: TDD RED)
- FOUND commit: `668b134` (feat: TDD GREEN)

---
*Phase: 05-profile-page-buttons*
*Completed: 2026-03-23*
