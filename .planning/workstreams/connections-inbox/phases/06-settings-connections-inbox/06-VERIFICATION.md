---
phase: 06-settings-connections-inbox
verified: 2026-03-24T08:35:00Z
status: human_needed
score: 6/6 must-haves verified
human_verification:
  - test: "Verify Settings > Connections tabs render and filter correctly"
    expected: "Tabs My Connections, My Mentors, My Mentees, My Faculty, My Schools appear; Principal Teacher tab appears only for school owners; clicking each tab shows correctly filtered connections; Remove button appears only on accepted connections"
    why_human: "Tab rendering, conditional tab display based on school ownership DB query, and filter correctness require a live browser session with test data in the connections table"
  - test: "Verify Settings > Inbox accept and decline actions work end-to-end"
    expected: "Pending incoming requests appear in the list; clicking Accept transitions the connection to accepted and removes it from the inbox; clicking Decline removes the request; filter buttons narrow the list by type"
    why_human: "Accept/decline mutations write to Supabase and update local state — requires live data and a logged-in user with pending_received connections"
  - test: "Verify Header notification dropdown View all link navigates to /settings/inbox"
    expected: "Notification bell opens dropdown; footer link reads 'View all'; clicking it navigates to /settings/inbox without a 404"
    why_human: "Link target and navigation require a running browser session"
---

# Phase 6: Settings Connections & Inbox Verification Report

**Phase Goal:** Users can manage their full connections and incoming requests from Settings
**Verified:** 2026-03-24T08:35:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Settings > Connections shows tabs: My Connections (peer), My Mentors, My Mentees, My Faculty, My Schools (+ Principal Teacher for school owners) | VERIFIED | `app/settings/connections/page.tsx` defines all 5 TABS constants plus PRINCIPAL_TAB, conditionally appended via `isSchoolOwner` state; tab filter logic maps each key to correct type/role predicate |
| 2 | Each connection entry shows member name, avatar, status badge, and Remove button for accepted connections | VERIFIED | Rows render `conn.memberName`, `conn.memberPhoto`, `<Badge>` with status, and a `<Button variant="ghost">Remove</Button>` gated on `conn.status === 'accepted'` |
| 3 | Settings > Inbox lists all incoming connection requests | VERIFIED | `app/settings/inbox/page.tsx` filters `connections` for `status === 'pending_received'` and renders each with name, photo, type badge |
| 4 | User can accept or decline each request from Inbox | VERIFIED | Each row has Accept (`variant="primary"`) and Decline (`variant="ghost"`) buttons wired to `acceptRequest(conn.connectionId, conn.memberId)` and `declineRequest(conn.connectionId, conn.memberId)` from `useConnections()` |
| 5 | Inbox requests can be filtered by type (all / peer / mentorship / faculty) | VERIFIED | FILTER_OPTIONS constant defines all four keys; `filterType` state gates `.filter(conn => filterType === 'all' \|\| conn.type === filterType)` on the incoming list |
| 6 | Notification dropdown "View all" link points to `/settings/inbox` | VERIFIED | `app/components/Header.tsx` line 389: `href="/settings/inbox"`, line 393: `View all →`; `href="/messages"` confirmed absent |

**Score:** 6/6 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/context/ConnectionsContext.tsx` | Profiles join in initial load + removeConnection mutation | VERIFIED | 252 lines; profiles join via `profiles!connections_requester_id_fkey` and `profiles!connections_recipient_id_fkey`; `removeConnection` in interface (line 39), implementation (line 208), and provider value (line 237) |
| `app/settings/connections/page.tsx` | Tabbed connections management page | VERIFIED | 113 lines; `'use client'`; imports `useConnections`; all 5 tab labels + Principal Teacher; filter logic for all 6 tab keys; status badges; remove button |
| `app/settings/inbox/page.tsx` | Inbox page with accept/decline and type filter | VERIFIED | 89 lines; `'use client'`; imports `useConnections`; `pending_received` filter; 4 FILTER_OPTIONS; Accept and Decline buttons wired |
| `app/components/Header.tsx` | Updated View all link | VERIFIED | `href="/settings/inbox"` present; `View all →` text present; `href="/messages"` absent |
| `__tests__/connections-context.test.tsx` | Tests for profiles join and removeConnection | VERIFIED | 9 tests — 5 existing + 4 new covering profiles join, removeConnection presence, provider value, and interface |
| `__tests__/settings-connections.test.tsx` | Tests for connections page | VERIFIED | 9 source-level tests all passing |
| `__tests__/settings-inbox.test.tsx` | Tests for inbox page | VERIFIED | 6 source-level tests all passing |
| `__tests__/header-inbox-link.test.tsx` | Test for header link update | VERIFIED | 2 tests: link target is /settings/inbox; text is "View all" not "View all messages" |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/settings/connections/page.tsx` | `app/context/ConnectionsContext.tsx` | `useConnections()` hook | WIRED | `const { connections, removeConnection } = useConnections()` at line 19 |
| `app/settings/inbox/page.tsx` | `app/context/ConnectionsContext.tsx` | `useConnections()` hook — acceptRequest, declineRequest | WIRED | `const { connections, acceptRequest, declineRequest } = useConnections()` at line 15 |
| `app/components/Header.tsx` | `/settings/inbox` | Link href | WIRED | `href="/settings/inbox"` confirmed at line 389 |
| `app/context/ConnectionsContext.tsx` | `profiles` table via Supabase join | embedded select with foreign key aliases | WIRED | `profiles!connections_requester_id_fkey` and `profiles!connections_recipient_id_fkey` in select string at lines 68-69 |
| `app/context/ConnectionsContext.tsx` | `connections` table DELETE | removeConnection mutation | WIRED | `.delete().eq('id', connectionId)` at lines 210-212; local state updated on success |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|--------------------|--------|
| `app/settings/connections/page.tsx` | `connections` from `useConnections()` | Supabase `connections` table with profiles join in `ConnectionsContext` initial load | Yes — query at lines 64-95 of ConnectionsContext fetches all connections for the auth user, joining requester and recipient profiles | FLOWING |
| `app/settings/inbox/page.tsx` | `connections` from `useConnections()` | Same ConnectionsContext; filtered to `pending_received` | Yes — same Supabase query; `incoming` derived by filtering local state | FLOWING |
| `app/context/ConnectionsContext.tsx` | `memberName`, `memberPhoto` | `profiles!connections_requester_id_fkey` / `profiles!connections_recipient_id_fkey` joins | Yes — `otherProfile?.full_name` and `otherProfile?.avatar_url` used at lines 87-88; falls back to empty string only if profile row is missing | FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| ConnectionsContext exports useConnections | `grep "export function useConnections" app/context/ConnectionsContext.tsx` | Match found at line 247 | PASS |
| removeConnection in provider value | `grep "removeConnection" app/context/ConnectionsContext.tsx` | 4 matches (interface line 39, implementation line 208, value line 237, type annotation) | PASS |
| connections page is not a placeholder | `grep "Coming Soon" app/settings/connections/page.tsx` | No match | PASS |
| inbox page is not a placeholder | `grep "Coming Soon" app/settings/inbox/page.tsx` | No match | PASS |
| All 26 phase tests pass | `npx vitest run __tests__/connections-context.test.tsx __tests__/settings-connections.test.tsx __tests__/settings-inbox.test.tsx __tests__/header-inbox-link.test.tsx` | 26 tests pass (reported as 81 including worktree duplicates; 26 in main project) | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| CONN-01 | 06-02-PLAN.md | User can view connections in tabs: My Connections, My Mentors, My Mentees, My Faculty, My Schools (+ Principal Teacher for school owners) | SATISFIED | All 5 tabs defined in TABS constant; PRINCIPAL_TAB conditionally appended; filter logic maps each key to correct type+role predicate |
| CONN-02 | 06-01-PLAN.md, 06-02-PLAN.md | Each connection entry shows current status (pending sent / accepted) | SATISFIED | Badge renders `'Connected'` for `accepted`, `'Pending'` for `pending_sent`, `'Incoming'` for `pending_received` |
| CONN-03 | 06-01-PLAN.md, 06-02-PLAN.md | User can remove an accepted connection | SATISFIED | Remove button gated on `conn.status === 'accepted'`; calls `removeConnection(conn.connectionId, conn.memberId)` from context; context calls `.delete()` on Supabase |
| INBOX-01 | 06-02-PLAN.md | User can view all incoming connection requests (peer, mentorship, faculty) in a list | SATISFIED | Inbox page filters connections by `status === 'pending_received'` and renders all types |
| INBOX-02 | 06-02-PLAN.md | User can accept or decline each request from the inbox | SATISFIED | Accept and Decline buttons wired to `acceptRequest` and `declineRequest` from ConnectionsContext |
| INBOX-03 | 06-02-PLAN.md | User can filter requests by type (all / peer / mentorship / faculty) | SATISFIED | FILTER_OPTIONS defines all four keys; filterType state narrows `incoming` array |
| INBOX-04 | 06-02-PLAN.md | Notification dropdown link updated to `/settings/inbox` | SATISFIED | Header.tsx line 389: `href="/settings/inbox"`, line 393: `View all →`; old `href="/messages"` absent |

All 7 phase 6 requirements satisfied. No orphaned requirements.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `app/context/ConnectionsContext.tsx` | 118-119 | `fromName: 'Member'` and `fromPhoto` hardcoded in realtime notification handler | Info | Realtime notifications show placeholder name and a random Lego avatar — this only affects the notification bell popup for new real-time events, not the connections list which uses the profiles join. Not a blocker for phase 6 goals. |

No blockers. The hardcoded notification values are a known pre-existing limitation in the realtime subscriber, not introduced by phase 6, and do not affect the connections management or inbox pages.

### Human Verification Required

#### 1. Settings > Connections Tabbed View

**Test:** Log in as any user and navigate to Settings > Connections. Click through each tab.
**Expected:** My Connections shows only peer-type connections; My Mentors shows mentorship connections where viewer is receiver; My Mentees shows mentorship where viewer is requester; My Faculty shows all faculty; My Schools shows faculty where viewer is requester; For a school-owning account, Principal Teacher tab appears and shows faculty where viewer is receiver; each entry shows name, avatar, status badge; accepted connections show a Remove button; clicking Remove removes the entry.
**Why human:** Tab rendering, conditional Principal Teacher tab, and filter correctness require live Supabase data and an authenticated browser session.

#### 2. Settings > Inbox Accept and Decline

**Test:** Log in as a user who has incoming connection requests (pending_received). Navigate to Settings > Inbox.
**Expected:** Pending requests appear in the list with sender name, avatar, and type badge; Accept button transitions the connection to accepted and removes it from the inbox list; Decline button removes the request; filter buttons (All / Peer / Mentorship / Faculty) correctly narrow the visible requests.
**Why human:** Mutations write to Supabase and update local state in real time — requires live data and a second test account to send requests from.

#### 3. Header Notification Dropdown Link

**Test:** Click the notification bell icon in the header. Locate the footer link of the dropdown.
**Expected:** Link text reads "View all" (not "View all messages"); clicking it navigates to /settings/inbox without a 404 or redirect error.
**Why human:** Navigation target and absence of routing errors require a running browser session.

### Gaps Summary

No gaps found. All 6 observable truths are VERIFIED, all 8 required artifacts exist and are substantive and wired, all 5 key links are WIRED, all 7 requirements (CONN-01 through INBOX-04) are SATISFIED, and all 26 phase tests pass. Three items requiring live browser verification are flagged above as human verification steps (standard for UI phases).

---

_Verified: 2026-03-24T08:35:00Z_
_Verifier: Claude (gsd-verifier)_
