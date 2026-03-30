---
phase: 06-settings-connections-inbox
plan: "01"
subsystem: connections-context
tags: [connections, supabase, profiles, context, react]
dependency_graph:
  requires: [04-database-foundation, 05-profile-page-buttons]
  provides: [profiles-join-in-context, removeConnection-mutation]
  affects: [app/settings/connections/page.tsx, app/settings/inbox/page.tsx]
tech_stack:
  added: []
  patterns: [supabase-embedded-select, useCallback-mutation]
key_files:
  created: []
  modified:
    - app/context/ConnectionsContext.tsx
    - __tests__/connections-context.test.tsx
decisions:
  - "Profiles join belongs in ConnectionsContext initial load (not in page components) — single source of truth, avoids N+1 fetches"
  - "removeConnection mirrors declineRequest pattern — DELETE from Supabase then remove from local state map"
  - "otherProfile derived from row.recipient when viewer is requester, row.requester when viewer is receiver"
metrics:
  duration: ~5 min
  completed: "2026-03-24T01:13:25Z"
  tasks_completed: 2
  files_modified: 2
---

# Phase 06 Plan 01: ConnectionsContext Profiles Join + removeConnection Summary

Profiles join added to ConnectionsContext initial load with removeConnection mutation — member names and avatars now populated from Supabase on mount.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add profiles join to initial load and removeConnection mutation | 2e06ce0 | app/context/ConnectionsContext.tsx |
| 2 | Extend connection context tests for profiles join and removeConnection | a1bdf26 | __tests__/connections-context.test.tsx |

## What Was Built

### Profiles Join in Initial Load

Replaced `.select('*')` with an embedded select joining `profiles` via foreign key aliases:

```typescript
.select(`
  *,
  requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
  recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url)
`)
```

`memberName` and `memberPhoto` are now populated from `otherProfile?.full_name` and `otherProfile?.avatar_url`, where `otherProfile` is derived based on whether the viewer is the requester or recipient.

### removeConnection Mutation

Added to `ConnectionsContextType` interface, implemented as a `useCallback`, and included in the Provider value:

```typescript
const removeConnection = useCallback(async (connectionId: string, otherUserId: string) => {
  const { error } = await supabase.from('connections').delete().eq('id', connectionId);
  if (!error) {
    setConnections(prev => {
      const { [otherUserId]: _removed, ...rest } = prev;
      return rest;
    });
  }
}, []);
```

### Tests Extended

9 tests total (5 existing + 4 new), all passing:
- Profiles join foreign key aliases present
- `removeConnection` with `.delete()` call present
- `removeConnection` in Provider value object
- `removeConnection` in `ConnectionsContextType` interface

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Profiles join in context, not pages | Avoids double-fetches; ConnectionsContext is already the single source of truth for connection state |
| Mirror declineRequest pattern for removeConnection | Consistent mutation shape; DELETE policy already permits either party to delete |
| otherProfile derived by requester_id comparison | Clean derivation matching existing role calculation logic on same loop iteration |

## Verification

```
npx vitest run __tests__/connections-context.test.tsx — 9/9 tests passing
grep "removeConnection" app/context/ConnectionsContext.tsx — 3 matches (interface, impl, value)
grep "profiles!" app/context/ConnectionsContext.tsx — 2 matches (requester + recipient fkeys)
```

## Deviations from Plan

### Worktree Base Rebase

**Found during:** Pre-task setup
**Issue:** Worktree `worktree-agent-a08f3a36` was based on the old `main` branch (07b2d79) without Phase 4/5 changes. The plan referenced 231-line Supabase-backed ConnectionsContext but the worktree had the old 267-line localStorage version.
**Fix:** Rebased `worktree-agent-a08f3a36` onto `develop` to pull in all Phase 4/5 changes before applying plan changes.
**Rule:** Rule 3 (blocking issue — wrong base version would have produced incorrect code)

## Known Stubs

None — all data fields (`memberName`, `memberPhoto`) are now populated from real profiles data via Supabase join.

## Self-Check: PASSED

- [x] `app/context/ConnectionsContext.tsx` contains `profiles!connections_requester_id_fkey`
- [x] `app/context/ConnectionsContext.tsx` contains `removeConnection` (3 occurrences)
- [x] `__tests__/connections-context.test.tsx` contains 9 tests
- [x] Commits 2e06ce0 and a1bdf26 exist
- [x] All 9 tests pass
