---
phase: 04-database-foundation
plan: 02
subsystem: connections
tags: [supabase, context, react, connections, localStorage-removal, wave0-tests]

# Dependency graph
requires:
  - 04-01 (connections table must exist in Supabase)
provides:
  - ConnectionsContext backed by Supabase connections table (no localStorage)
  - ConnectButton using UUID-keyed context
  - ConnectionsSection showing real connections for own profile only
  - Wave 0 source-level tests for ConnectionsContext and ConnectButton
affects:
  - 05-connect-button
  - 06-settings-connections
  - 07-admin-connections

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Supabase or() filter for bidirectional queries: .or('requester_id.eq.X,recipient_id.eq.X')"
    - "Bidirectional duplicate check with .maybeSingle() before insert"
    - "Wave 0 source-level assertion tests: readFileSync + string assertions to verify rewrite requirements"
    - "isOwnProfile prop pattern for conditional ConnectionsSection rendering"
    - "createSupabaseServerClient in server component for auth-gated currentUserId"

key-files:
  created:
    - __tests__/connections-context.test.tsx
    - __tests__/connect-button.test.tsx
  modified:
    - app/context/ConnectionsContext.tsx
    - app/components/ConnectButton.tsx
    - app/components/ConnectionsSection.tsx
    - app/members/[id]/page.tsx
    - vitest.config.ts
  deleted:
    - lib/connections-data.ts

key-decisions:
  - "ConnectionsSection returns null for other profiles — Phase 6 will add server-side query for cross-profile connections"
  - "sendRequest has optional type param defaulting to peer — prepares for Phase 5 role-aware types"
  - "vitest.config.ts needs @ alias to match tsconfig paths — added as Rule 1 auto-fix"

patterns-established:
  - "Pattern: bidirectional Supabase query using .or('col_a.eq.X,col_b.eq.X') for both-party connection fetching"
  - "Pattern: Wave 0 source-level tests using readFileSync for static analysis assertions"

requirements-completed: [DB-04]

# Metrics
duration: ~35min
completed: 2026-03-23
---

# Phase 04 Plan 02: Supabase ConnectionsContext Rewrite Summary

**ConnectionsContext rewritten from localStorage to Supabase — bidirectional query, duplicate guard, realtime notifications preserved, Wave 0 tests pass**

## Performance

- **Duration:** ~35 min
- **Started:** 2026-03-23T11:05:00Z
- **Completed:** 2026-03-23T11:39:52Z
- **Tasks:** 3 of 3 complete
- **Files modified:** 5, created: 2, deleted: 1

## Accomplishments

- Created Wave 0 source-level test stubs (`__tests__/connections-context.test.tsx`, `__tests__/connect-button.test.tsx`) — 7 assertions total, all green
- Rewrote `ConnectionsContext.tsx` completely: removed all localStorage helpers (loadFromLS, saveToLS, LS_* constants), removed demo seed data (buildDemoSeed, DEMO_CONN_ID), added Supabase load-on-mount with bidirectional `.or()` query
- `sendRequest` now inserts to Supabase `connections` table with bidirectional duplicate guard (`.maybeSingle()`)
- `acceptRequest` and `declineRequest` now update Supabase, then update local state
- Notifications realtime subscription (`postgres_changes` on `notifications` table) preserved unchanged
- `ConnRecord.memberSlug` renamed to `memberId` (stores UUID)
- `sendRequest` gains optional `type` param (peer/mentorship/faculty, defaults to peer) for Phase 5 readiness
- `ConnectButton.tsx`: comment updated to correctly document `memberId` as UUID
- `ConnectionsSection.tsx`: removed `MOCK_PROFILE_CONNECTIONS` and static `members-data` dependency; simplified to render accepted connections from context for own profile only
- `app/members/[id]/page.tsx`: added `createSupabaseServerClient` auth to get `currentUserId`; `ConnectionsSection` now receives `isOwnProfile={member.id === currentUserId}`
- `lib/connections-data.ts`: deleted — no longer imported anywhere
- `vitest.config.ts`: added `@` path alias to resolve tsconfig `paths` setting (Rule 1 auto-fix)

## Task Commits

| Task | Description | Commit |
|------|-------------|--------|
| Task 0 | Wave 0 test stubs | `0e7a277` |
| Task 1 | Rewrite ConnectionsContext to Supabase | `faa2151` |
| Task 2 | ConnectButton comment, ConnectionsSection rewrite, call site fix, delete mock data | `0d093ca` |

## Files Created/Modified

- `__tests__/connections-context.test.tsx` — 5 source-level assertions verifying Supabase rewrite
- `__tests__/connect-button.test.tsx` — 2 assertions verifying UUID comment
- `app/context/ConnectionsContext.tsx` — Complete Supabase rewrite (149 lines removed, 110 added)
- `app/components/ConnectButton.tsx` — Comment updated to UUID
- `app/components/ConnectionsSection.tsx` — Removed mock data, simplified to own-profile context rendering
- `app/members/[id]/page.tsx` — Added auth, isOwnProfile prop
- `vitest.config.ts` — Added @ path alias
- `lib/connections-data.ts` — Deleted

## Decisions Made

- `ConnectionsSection` returns null for profiles other than own — Phase 6 will add server-side query for cross-profile connections display
- Optional `type` param on `sendRequest` (defaults to `peer`) prepares for Phase 5 role-aware connection types
- `vitest.config.ts` @ alias added as a blocking auto-fix since `app/page.test.tsx` couldn't resolve `@/lib/supabaseServer`

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed @ path alias missing from vitest.config.ts**
- **Found during:** Task 2 verification (`npx vitest run`)
- **Issue:** `app/page.test.tsx` failed with "Failed to resolve import @/lib/supabaseServer" — vitest.config.ts had no resolve.alias matching the tsconfig `@/*` path
- **Fix:** Added `resolve.alias: { '@': path.resolve(__dirname, '.') }` to vitest.config.ts
- **Files modified:** `vitest.config.ts`
- **Commit:** `0d093ca`

## Known Stubs

None — ConnectionsSection renders from real context data; memberName/memberPhoto fields in ConnRecord start empty on load (populated by sendRequest). This is expected behavior for Phase 4; Phase 5/6 will add profile enrichment by joining with the profiles table.

## Deferred Issues

**app/page.test.tsx — Pre-existing test failure**
- The test asserts "Logged in as" text which no longer appears in the landing page (the page was refactored to a public marketing page)
- This is a pre-existing issue unrelated to this plan's changes
- Logged to `deferred-items.md` in phase directory
- Fix: update or remove `app/page.test.tsx` to match current landing page behavior

## Next Phase Readiness

- ConnectionsContext is fully Supabase-backed — Phase 5 (role-aware connect button) can add role checks and update the `type` parameter
- Settings > Connections (Phase 6) can read from context's `connections` map
- Admin Connections tab (Phase 7) can use server-side Supabase queries to view any user's connections

---
*Phase: 04-database-foundation*
*Completed: 2026-03-23*
