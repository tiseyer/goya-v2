---
phase: 06-settings-connections-inbox
plan: "02"
subsystem: ui
tags: [connections, inbox, react, supabase, settings, next.js]

requires:
  - phase: 06-01
    provides: ConnectionsContext with profiles join, removeConnection, Supabase-backed acceptRequest/declineRequest
  - phase: 04-database-foundation
    provides: connections table with type/status columns and RLS policies
provides:
  - Tabbed Settings > Connections page (My Connections, My Mentors, My Mentees, My Faculty, My Schools, Principal Teacher for school owners)
  - Settings > Inbox page with accept/decline actions and type filter bar
  - Header notification dropdown link updated to /settings/inbox
affects: [07-admin-connections, manual-verification]

tech-stack:
  added: []
  patterns: [client-component-with-context-hook, tab-filtering-by-type-and-role, conditional-tab-for-role]

key-files:
  created:
    - app/settings/connections/page.tsx
    - app/settings/inbox/page.tsx
    - __tests__/settings-connections.test.tsx
    - __tests__/settings-inbox.test.tsx
    - __tests__/header-inbox-link.test.tsx
  modified:
    - app/components/Header.tsx

key-decisions:
  - "Connections page uses tab key + filter logic to split peer/mentorship/faculty connections by role — single filter function avoids duplication"
  - "Schools tab shows faculty where viewer is requester (teacher applied to school); Principal Teacher tab shows faculty where viewer is receiver (school owner's view)"
  - "Header link text changed from 'View all messages' to 'View all' to reflect inbox scope (connection requests, not messages)"

patterns-established:
  - "Pattern: Conditional tab append — build base TABS array, spread it, conditionally push PRINCIPAL_TAB based on isSchoolOwner state"
  - "Pattern: Filter chain — first filter by status, then filter by type — separate .filter() calls for clarity"

requirements-completed: [CONN-01, CONN-02, CONN-03, INBOX-01, INBOX-02, INBOX-03, INBOX-04]

duration: ~10min
completed: "2026-03-24"
---

# Phase 06 Plan 02: Settings Connections + Inbox pages with tabbed filtering, accept/decline, and updated Header link

**Tabbed connections management page and inbox with accept/decline, type filter, and notification dropdown linked to /settings/inbox — replacing all "Coming Soon" placeholders**

## Performance

- **Duration:** ~10 min
- **Started:** 2026-03-24T08:17:00Z
- **Completed:** 2026-03-24T08:21:31Z
- **Tasks:** 2 of 3 (awaiting human-verify checkpoint)
- **Files modified:** 6

## Accomplishments

- Settings > Connections page: tabbed view (My Connections/Mentors/Mentees/Faculty/Schools + Principal Teacher for school owners), status badges, Remove button for accepted connections
- Settings > Inbox page: pending_received filter, type filter bar (All/Peer/Mentorship/Faculty), Accept and Decline actions wired to ConnectionsContext
- Header notification dropdown "View all messages →" replaced with "View all →" linking to /settings/inbox
- 17 vitest tests across 3 test files — all passing

## Task Commits

1. **Task 1: Settings > Connections page with tabs, status badges, and remove action** - `192697b` (feat)
2. **Task 2: Settings > Inbox page with accept/decline and type filter, update Header link** - `98062bb` (feat)
3. **Task 3: human-verify checkpoint** — awaiting user verification

## Files Created/Modified

- `app/settings/connections/page.tsx` — Full tabbed connections management page with school owner detection
- `app/settings/inbox/page.tsx` — Inbox page with pending_received filter, type filter bar, accept/decline actions
- `app/components/Header.tsx` — Notification dropdown footer link updated to /settings/inbox with "View all" text
- `__tests__/settings-connections.test.tsx` — 9 source-level tests for connections page
- `__tests__/settings-inbox.test.tsx` — 6 source-level tests for inbox page
- `__tests__/header-inbox-link.test.tsx` — 2 source-level tests for header link update

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Schools vs Principal Teacher tab split by role | Teacher who applied to schools (requester) sees "My Schools"; school owner viewing applicants (receiver) sees "Principal Teacher" — role determines perspective |
| Filter chain: status first, then type | Inbox always shows only pending_received; connections page already filters by tab — clean separation of concerns |
| Header text → "View all" | The dropdown contains connection requests, not messages; "View all messages" was misleading |

## Deviations from Plan

### Worktree Base Rebase

**Found during:** Pre-task setup
**Issue:** Worktree `worktree-agent-a6fff8cb` was based on old `main` branch (07b2d79) without Phase 6 Plan 01 changes. The ConnectionsContext did not have `removeConnection`, `type` field on ConnRecord, or `memberId` — all needed for Plan 02 implementation.
**Fix:** Rebased `worktree-agent-a6fff8cb` onto `develop` to pull in Plan 01 changes before implementing.
**Rule:** Rule 3 (blocking issue — wrong base would produce incorrect code referencing unavailable context properties)

## Known Stubs

None — all data is wired through ConnectionsContext which reads from Supabase. Empty states (no connections yet) are intentional UI states, not stubs.

## Self-Check: PASSED

- [x] `app/settings/connections/page.tsx` exists and contains `'use client'`, `useConnections`, `removeConnection`, all 5 tab labels, `isSchoolOwner`
- [x] `app/settings/inbox/page.tsx` exists and contains `'use client'`, `useConnections`, `pending_received`, `acceptRequest`, `declineRequest`
- [x] `app/components/Header.tsx` contains `/settings/inbox` and does NOT contain `href="/messages"` or `View all messages`
- [x] Commits 192697b and 98062bb exist
- [x] 17/17 tests pass across 3 test files

## Next Phase Readiness

- Awaiting Task 3 human-verify checkpoint — user must visually verify in browser
- After approval: Phase 06 complete, Phase 07 (Admin connections tab) can begin
- All placeholder "Coming Soon" content has been replaced

---
*Phase: 06-settings-connections-inbox*
*Completed: 2026-03-24*
