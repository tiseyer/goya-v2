# Phase 6: Settings Connections & Inbox — Research

**Researched:** 2026-03-24
**Domain:** Next.js App Router settings pages, Supabase client-side data fetching, React tabs UI
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CONN-01 | Settings > Connections shows tabs: My Connections, My Mentors, My Mentees, My Faculty, My Schools (+ Principal Teacher tab for school owners) | Tab filtering from `connections` table by type + role; school ownership checked via `schools` table `owner_id` |
| CONN-02 | Each connection entry shows current status (pending sent / accepted) | `ConnRecord.status` in ConnectionsContext already models `pending_sent` and `accepted`; page reads from context |
| CONN-03 | User can remove an accepted connection | `connections` table has DELETE policy for either party; add `removeConnection` mutation to context |
| INBOX-01 | Settings > Inbox lists all incoming connection requests | `pending_received` status in ConnectionsContext; server-side query joins profiles for names/avatars |
| INBOX-02 | User can accept or decline each request from the inbox | `acceptRequest` / `declineRequest` already implemented in ConnectionsContext |
| INBOX-03 | Inbox can filter by type (all / peer / mentorship / faculty) | Client-side filter on `ConnRecord.type`; type values are `peer`, `mentorship`, `faculty` |
| INBOX-04 | Notification dropdown "View all" link points to `/settings/inbox` | Single `href` change in `app/components/Header.tsx` line 389 |
</phase_requirements>

---

## Summary

Phase 6 implements two placeholder settings pages into fully functional UIs. Both pages are client components that consume `ConnectionsContext` — the data layer is already complete from Phase 4.

The core work is: (1) add a `removeConnection` mutation to `ConnectionsContext`, (2) build Settings > Connections as a tabbed client page that reads from the context and filters by connection type and role, (3) build Settings > Inbox as a filterable list of incoming requests with accept/decline actions wired to the existing context mutations, and (4) change one `href` in Header.tsx from `/messages` to `/settings/inbox`.

The most significant design decision is how to populate `memberName` and `memberPhoto` on `ConnRecord` — the context currently loads these as empty strings (`memberName: ''`) for connections loaded from Supabase on mount. The pages need display names and avatars, requiring a Supabase join to `profiles` at load time. This join belongs in the ConnectionsContext initialisation effect, not in the page components.

**Primary recommendation:** Extend ConnectionsContext with a profiles join and `removeConnection` mutation in Plan 1. Build both settings pages in Plan 2.

---

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` found. Constraints sourced from `MEMORY.md` and observed project patterns:

- **Always run `npx supabase db push`** after creating a migration file (MEMORY.md)
- Client-side Supabase: use `lib/supabase.ts` (browser client) — never import `lib/supabaseServer.ts` from client components
- Server component Supabase: use `createSupabaseServerClient()` from `lib/supabaseServer.ts`
- Tech stack: Next.js 16 App Router, Tailwind CSS 4, Supabase — no new frameworks
- Design: follow existing design tokens from `globals.css`; match Admin Settings layout exactly
- UI components: use `app/components/ui/Button.tsx` (variants: `primary`, `secondary`, `danger`, `ghost`), `Badge.tsx`, `Card.tsx`
- Settings pages live at `app/settings/[section]/page.tsx` — plain `page.tsx` files, no route groups
- Settings layout uses `SettingsShell` — no changes to sidebar or layout required
- Test framework: Vitest + jsdom + `@testing-library/jest-dom`; config at `vitest.config.ts`; tests in `__tests__/`
- `vi.mock('next/navigation')` required in jsdom tests that use `useRouter` or `usePathname`

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | (project-installed) | Supabase browser client | Already used throughout; `lib/supabase.ts` is the import |
| React (Next.js 16) | 16 | Component rendering, state, hooks | Project baseline |
| Tailwind CSS 4 | 4 | Styling | Project baseline; all existing pages use it |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `app/components/ui/Button.tsx` | project | Primary interactive button | All interactive actions (accept, decline, remove) |
| `app/components/ui/Badge.tsx` | project | Status badges | Connection status display (pending, accepted) |
| `app/context/ConnectionsContext.tsx` | project | Connection state + mutations | Both settings pages read from and write to this context |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| ConnectionsContext (client) | Server component + server action | Context already loaded on every page; avoids double-fetch. Server-side would lose realtime notifications. |
| Client-side profile join in context | Dedicated server action per page | Context join is one extra select on mount; avoids prop-drilling profile data through pages |

**Installation:** No new packages required.

---

## Architecture Patterns

### Recommended Project Structure

```
app/settings/
├── connections/
│   └── page.tsx          # Tabbed connections page (client component)
├── inbox/
│   └── page.tsx          # Inbox page (client component)
app/context/
└── ConnectionsContext.tsx # Extended with profiles join + removeConnection
app/components/
└── Header.tsx            # "View all" href changed to /settings/inbox
```

### Pattern 1: Settings Page as Client Component

**What:** Settings pages use `'use client'` and `useConnections()` hook — consistent with `app/settings/page.tsx` (General) which also uses client-side Supabase directly.

**When to use:** When page data comes from a context that is already loaded globally (ConnectionsContext is mounted in ClientProviders).

**Example:**
```typescript
// app/settings/connections/page.tsx
'use client';
import { useConnections } from '@/app/context/ConnectionsContext';

export default function SettingsConnectionsPage() {
  const { connections, removeConnection } = useConnections();
  const [activeTab, setActiveTab] = useState('all');
  // filter connections by tab...
}
```

### Pattern 2: Tab Filtering by Connection Type + Role

**What:** Tabs map to connection types. The `role` field on `ConnRecord` (`requester` | `receiver`) combined with `type` determines which tab a connection belongs in.

Tab mapping:
| Tab label | Filter condition |
|-----------|-----------------|
| My Connections | `type === 'peer'` |
| My Mentors | `type === 'mentorship' && role === 'receiver'` (viewer is the mentee — they received the accepted connection from a teacher) |
| My Mentees | `type === 'mentorship' && role === 'requester'` (viewer is the teacher — they sent or received the mentorship request and it was accepted) |
| My Faculty | `type === 'faculty'` (school owner's view of accepted faculty) |
| My Schools | `type === 'faculty' && role === 'requester'` (teacher/WP applied to a school) |
| Principal Teacher | Only shown when viewer owns a school; `type === 'faculty' && role === 'receiver'` |

Note: "Principal Teacher" tab visibility requires checking if `auth.uid()` owns any row in `schools` table. This is a one-time query on mount, not a role check on `profiles.role`.

### Pattern 3: Supabase Profiles Join in ConnectionsContext

**What:** On initial load, join `connections` with `profiles` to get `full_name` and `avatar_url` for each other party.

**Current gap:** The existing `useEffect` in `ConnectionsContext` loads connections rows but leaves `memberName: ''` and `memberPhoto: ''` empty. The Settings pages need real names to display.

**Fix:** Use Supabase's embedded select syntax to join in one query:

```typescript
// In ConnectionsContext useEffect — replace the plain .select('*') call
supabase
  .from('connections')
  .select(`
    *,
    requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
    recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url)
  `)
  .or(`requester_id.eq.${supabaseUserId},recipient_id.eq.${supabaseUserId}`)
```

Then derive `memberName` from the joined profile record for the other party.

### Pattern 4: Inbox Filter Bar (Client-Side)

**What:** Filter state is local (`useState`) — no URL params needed. Filter buttons render above the list and set a `filterType` state: `'all' | 'peer' | 'mentorship' | 'faculty'`.

**Why client-side:** The full inbox is already in memory via ConnectionsContext. A URL-based filter would require a server round-trip with no benefit.

### Anti-Patterns to Avoid

- **Fetching connections again inside the page component:** ConnectionsContext already holds all connections. Don't call `supabase.from('connections').select(...)` again inside the page. Only add to the context what the context is missing.
- **Deriving "My Mentors" vs "My Mentees" from profile role:** Derive from `ConnRecord.role` (`requester` | `receiver`) — not from the viewer's `profiles.member_type`. The role field on ConnRecord is already set correctly by the context loader.
- **Removing connections via client-only state update:** The `removeConnection` action must call Supabase DELETE, not just update local state. The DELETE RLS policy (`participants can delete connections`) already permits this.
- **Using `useRouter` push for Manage School:** Already handled in ConnectButton. Settings pages don't need school routing logic.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Tab UI | Custom tab state machine | Simple `useState` + conditional rendering | Tabs are stateless per-render; no router-level tab state needed |
| Accept/Decline | Direct Supabase calls in page | `acceptRequest`/`declineRequest` from `useConnections()` | Already implemented, tested, handles optimistic update |
| Profile names in connection rows | Re-fetch profiles inside page | Add profiles join to ConnectionsContext initial load | Single source of truth; avoids N+1 fetches |
| Status badge | Custom span with hard-coded colors | `app/components/ui/Badge.tsx` | Consistent with rest of admin/settings UI |

**Key insight:** The data layer (Phase 4) and mutations (ConnectionsContext) are complete. Phase 6 is almost entirely UI work + one profiles join + one new `removeConnection` mutation.

---

## Common Pitfalls

### Pitfall 1: memberName is empty string for existing connections

**What goes wrong:** Settings > Connections renders connection rows with no names or avatars — just empty strings — because the `ConnectionsContext` initial load does `memberName: ''`.

**Why it happens:** Phase 4 only wired reads and writes, not the profiles join. The context loads the connection rows but doesn't join `profiles`.

**How to avoid:** Add the profiles embedded select to the Supabase query in `ConnectionsContext.tsx` as the first task in Plan 1.

**Warning signs:** If settings page renders but shows blank names, the join is missing.

---

### Pitfall 2: "Principal Teacher" tab shown to non-school-owners

**What goes wrong:** The Principal Teacher tab appears for all users, or doesn't appear for school owners.

**Why it happens:** There's no role field on `profiles` for "school owner" — ownership is encoded as `owner_id` on the `schools` table.

**How to avoid:** Query `schools` table on page mount: `supabase.from('schools').select('id').eq('owner_id', userId).limit(1)`. Show Principal Teacher tab only if this returns at least one row.

**Warning signs:** Tab appears for teachers with no schools, or doesn't appear for known school owners.

---

### Pitfall 3: My Mentors vs My Mentees tab confusion

**What goes wrong:** All mentorship connections appear in both tabs, or appear in the wrong one.

**Why it happens:** Filtering only on `type === 'mentorship'` without checking `role` shows the same entries in both tabs.

**How to avoid:** Filter by both `type` and `ConnRecord.role` (requester/receiver). A teacher who sent a mentorship request = requester = My Mentees tab. A student who received a mentorship offer acceptance = receiver = My Mentors tab.

---

### Pitfall 4: "View all messages" href change misses the text update

**What goes wrong:** The link href is updated to `/settings/inbox` but the visible text still says "View all messages".

**Why it happens:** INBOX-04 specifies "View all" as the new label, not "View all messages".

**How to avoid:** Update both `href` and `children` text on the `<Link>` in `Header.tsx` at line 388–394.

---

### Pitfall 5: removeConnection only updates local state

**What goes wrong:** Removing a connection clears it from the UI but it reappears on next page load because Supabase wasn't updated.

**Why it happens:** Copying the pattern of `declineRequest` (which does update Supabase) but forgetting the `.delete()` call.

**How to avoid:** `removeConnection` must call `supabase.from('connections').delete().eq('id', connectionId)` before updating local state. Mirror the `declineRequest` implementation pattern.

---

## Code Examples

Verified patterns from existing codebase:

### Loading connections with profiles join (Supabase embedded select)

```typescript
// Source: Supabase foreign key join syntax — verified from project migration schema
// connections table has: requester_id uuid references profiles(id), recipient_id uuid references profiles(id)
supabase
  .from('connections')
  .select(`
    *,
    requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
    recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url)
  `)
  .or(`requester_id.eq.${supabaseUserId},recipient_id.eq.${supabaseUserId}`)
```

### removeConnection mutation (mirrors declineRequest pattern)

```typescript
// Source: existing declineRequest in app/context/ConnectionsContext.tsx
const removeConnection = useCallback(async (connectionId: string, otherUserId: string) => {
  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('id', connectionId);

  if (!error) {
    setConnections(prev => {
      const { [otherUserId]: _removed, ...rest } = prev;
      return rest;
    });
  }
}, []);
```

### Tab bar pattern (matches existing settings page style)

```typescript
// Source: app/settings/page.tsx pattern — bg-white card, border-b tab strip
const TABS = ['All', 'My Mentors', 'My Mentees', 'My Faculty', 'My Schools'];

<div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm">
  <div className="flex border-b border-[#E5E7EB] overflow-x-auto">
    {TABS.map(tab => (
      <button
        key={tab}
        onClick={() => setActiveTab(tab)}
        className={[
          'px-4 py-3 text-sm font-medium whitespace-nowrap transition-colors',
          activeTab === tab
            ? 'border-b-2 border-primary text-primary'
            : 'text-slate-500 hover:text-primary-dark',
        ].join(' ')}
      >
        {tab}
      </button>
    ))}
  </div>
  {/* Tab content */}
</div>
```

### Header "View all" link update

```typescript
// Source: app/components/Header.tsx lines 388–394 (current)
// BEFORE:
<Link href="/messages" onClick={() => setOpen(false)} ...>
  View all messages →
</Link>

// AFTER:
<Link href="/settings/inbox" onClick={() => setOpen(false)} ...>
  View all →
</Link>
```

### Check if viewer owns a school (for Principal Teacher tab)

```typescript
// Source: Phase 05 decision — "School ownership check uses owner_id only"
const { data: ownedSchools } = await supabase
  .from('schools')
  .select('id')
  .eq('owner_id', supabaseUserId)
  .limit(1);

const isSchoolOwner = (ownedSchools?.length ?? 0) > 0;
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage-backed ConnectionsContext | Supabase-backed ConnectionsContext | Phase 4 | Settings pages can now read real connection data |
| Placeholder "Coming Soon" pages | Full implementation | Phase 6 (this phase) | Users can manage connections and inbox |
| Profile page ConnectButton (role-aware) | Extended with type stored on ConnRecord | Phase 5 | Type filter in connections tabs works correctly |

---

## Open Questions

1. **Mentor/Mentee tab direction for teachers**
   - What we know: A teacher who *receives* a student's mentorship request = the student's mentor (My Mentees from teacher's view). A student who is accepted = sees the teacher under My Mentors.
   - What's unclear: A teacher who *requests* mentorship from a more senior teacher — which tab does that appear in from the teacher's view?
   - Recommendation: Follow the `ConnRecord.role` logic strictly — `requester` means you initiated the connection → you see the result in "My Mentees" (you're the mentor), `receiver` means someone requested you → you see it in "My Mentors" (they mentor you). This may produce unintuitive results in edge cases but is consistent with the data model.

2. **Empty states for each tab**
   - What we know: Each tab will sometimes have zero connections.
   - Recommendation: Show a simple empty state card per tab ("No [tab label] yet") — don't skip this, it's important for user trust.

---

## Environment Availability

Step 2.6: SKIPPED — Phase 6 is purely code changes. No new external tools, services, CLIs, runtimes, or databases. Supabase is already connected and the connections table is live.

---

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom + @testing-library/jest-dom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run __tests__/` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CONN-01 | Connections page tabs render correctly | unit | `npx vitest run __tests__/settings-connections.test.tsx` | ❌ Wave 0 |
| CONN-02 | Connection entry shows status badge | unit | `npx vitest run __tests__/settings-connections.test.tsx` | ❌ Wave 0 |
| CONN-03 | removeConnection calls Supabase delete + updates state | unit | `npx vitest run __tests__/connections-context.test.tsx` | ✅ (extend) |
| INBOX-01 | Inbox lists pending_received connections | unit | `npx vitest run __tests__/settings-inbox.test.tsx` | ❌ Wave 0 |
| INBOX-02 | Accept/decline actions wired | unit | `npx vitest run __tests__/settings-inbox.test.tsx` | ❌ Wave 0 |
| INBOX-03 | Filter buttons narrow inbox list | unit | `npx vitest run __tests__/settings-inbox.test.tsx` | ❌ Wave 0 |
| INBOX-04 | Header "View all" href = /settings/inbox | unit | `npx vitest run __tests__/header-inbox-link.test.tsx` | ❌ Wave 0 |

### Sampling Rate

- **Per task commit:** `npx vitest run __tests__/`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `__tests__/settings-connections.test.tsx` — covers CONN-01, CONN-02
- [ ] `__tests__/settings-inbox.test.tsx` — covers INBOX-01, INBOX-02, INBOX-03
- [ ] `__tests__/header-inbox-link.test.tsx` — covers INBOX-04

*(Existing `__tests__/connections-context.test.tsx` must be extended to cover CONN-03 `removeConnection` mutation.)*

---

## Sources

### Primary (HIGH confidence)

- Codebase audit — `app/context/ConnectionsContext.tsx` (full read, verified)
- Codebase audit — `app/settings/connections/page.tsx` (placeholder confirmed)
- Codebase audit — `app/settings/inbox/page.tsx` (placeholder confirmed)
- Codebase audit — `app/settings/components/SettingsShell.tsx` (nav structure confirmed)
- Codebase audit — `app/components/Header.tsx` (line 388–394: current "View all messages" href confirmed)
- Codebase audit — `supabase/migrations/20260339_add_connections.sql` (schema + RLS policies confirmed)
- Codebase audit — `supabase/migrations/20260335_add_schools.sql` (schools table, `owner_id` confirmed)
- Codebase audit — `app/components/ConnectButton.tsx` (ROLE_PAIR_MAP, ConnRecord.type, ConnRecord.role usage)
- Codebase audit — `app/settings/page.tsx` (General page as client component reference pattern)
- Codebase audit — `app/settings/subscriptions/page.tsx` (server component reference pattern)

### Secondary (MEDIUM confidence)

- Phase 4 RESEARCH.md and decisions in STATE.md — confirmed ConnectionsContext Supabase migration complete
- Phase 5 decisions — confirmed `type` stored on ConnRecord, `role` field set correctly, school ownership via `owner_id` only

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all libraries are project-installed and in active use
- Architecture: HIGH — page structure confirmed from codebase; tab logic derived from migration schema and ConnRecord shape
- Pitfalls: HIGH — identified from direct code inspection, not speculation
- Profiles join: HIGH — Supabase embedded select is the standard pattern; foreign key names derivable from migration

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable codebase, no fast-moving dependencies)
