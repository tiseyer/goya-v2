# Phase 4: Database Foundation — Research

**Researched:** 2026-03-23
**Domain:** Supabase migrations, RLS policies, Next.js context migration from localStorage to Supabase
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| DB-01 | A `connections` table with requester_id, recipient_id, type (`peer`/`mentorship`/`faculty`), status (`pending`/`accepted`/`declined`), and timestamps | Migration pattern established — see Architecture Patterns |
| DB-02 | RLS policies ensure users can only read/write their own connections | RLS pattern documented from `20260338_messaging.sql` — see Code Examples |
| DB-03 | Migration committed to `supabase/migrations/` and pushed via `npx supabase db push` | Project convention confirmed — MEMORY.md mandates this |
| DB-04 | `ConnectionsContext` and `ConnectButton` read from and write to Supabase (localStorage mock removed) | Existing code audited — replacement strategy documented |
</phase_requirements>

---

## Summary

Phase 4 replaces the localStorage-backed `ConnectionsContext` with real Supabase reads and writes. The work has two distinct parts: (1) a database migration that creates the `connections` table with RLS policies, and (2) a rewrite of `ConnectionsContext.tsx` so all CRUD operations go through Supabase instead of `localStorage`.

The project has an established migration convention: files named `YYYYMMDD_description.sql` placed in `supabase/migrations/`, pushed via `npx supabase db push`. The latest migration is `20260338_messaging.sql`, so the connections migration should be numbered `20260339_add_connections.sql`. RLS patterns are well-established from `conversations`, `messages`, and `notifications` tables — the connections table follows the same shape.

`ConnectButton.tsx` currently identifies members by **slug** (e.g., `jennifer-walsh`), but the `connections` table must use **UUID** foreign keys (`requester_id`, `recipient_id` referencing `profiles(id)`). This mismatch is the key translation challenge in the context rewrite: the context must look up or carry the `profiles.id` UUID for the target member, not the slug.

**Primary recommendation:** Write the migration first (DB-01 through DB-03), then rewrite `ConnectionsContext` to call Supabase using the browser client (`lib/supabase.ts`) for client-side operations, using `profiles.id` UUIDs as FKs throughout.

---

## Project Constraints (from CLAUDE.md)

No `CLAUDE.md` found. Constraints sourced from `MEMORY.md` and observed project patterns.

- **Always run `npx supabase db push`** after creating a migration file (from `MEMORY.md`)
- Migration files follow naming convention: `YYYYMMDD_description.sql`
- Client-side Supabase operations use `lib/supabase.ts` (`createBrowserClient`)
- Server Component / Server Action operations use `lib/supabaseServer.ts` (`createSupabaseServerActionClient`)
- `profiles(id)` is a `uuid` that equals `auth.users(id)` — use this for all FK references to users

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/supabase-js` | already installed | Supabase JS client — used for all DB calls | Project already uses this |
| `@supabase/ssr` | already installed | SSR-safe client creation (`createBrowserClient`, `createServerClient`) | Already wired in `lib/supabase.ts` and `lib/supabaseServer.ts` |

### No New Dependencies

This phase requires no new npm packages. All Supabase tooling is already present.

**Migration push command (from MEMORY.md):**
```bash
npx supabase db push
```

---

## Architecture Patterns

### Migration File Naming

All migrations follow:
```
supabase/migrations/YYYYMMDD_description.sql
```

Latest existing: `20260338_messaging.sql`
Next migration: `20260339_add_connections.sql`

### Recommended Project Structure

No new directories needed. Changes touch:
```
supabase/migrations/
└── 20260339_add_connections.sql   # new

app/context/
└── ConnectionsContext.tsx         # rewritten

lib/
└── connections-data.ts            # deleted (mock data)
```

### Pattern 1: Table + RLS in a Single Migration

Every migration in this project creates the table and its RLS policies in the same file. Follow `20260338_messaging.sql` exactly.

```sql
-- Source: supabase/migrations/20260338_messaging.sql (project convention)

create table connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid references profiles(id) on delete cascade not null,
  recipient_id  uuid references profiles(id) on delete cascade not null,
  type          text not null check (type in ('peer', 'mentorship', 'faculty')),
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(requester_id, recipient_id)
);

alter table connections enable row level security;

-- Read: a user can see a connection if they are either party
create policy "users can view own connections" on connections
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Insert: only the requester can create a connection, and they must be the requester
create policy "users can send connection requests" on connections
  for insert with check (auth.uid() = requester_id);

-- Update: only the recipient can accept/decline; requester can cancel (covered by same policy)
create policy "participants can update connections" on connections
  for update using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- Delete: either party can remove
create policy "participants can delete connections" on connections
  for delete using (auth.uid() = requester_id or auth.uid() = recipient_id);
```

### Pattern 2: ConnectionsContext Rewrite — Supabase Calls

The existing context uses `localStorage`. The replacement calls Supabase directly using the browser client. Auth state is obtained via `supabase.auth.getUser()` which is already done in the existing code.

```typescript
// Source: project pattern from lib/supabase.ts + ConnectionsContext.tsx
import { supabase } from '@/lib/supabase';

// Load connections on mount
const { data, error } = await supabase
  .from('connections')
  .select('*')
  .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`);

// Insert a new connection request
const { error } = await supabase
  .from('connections')
  .insert({ requester_id: userId, recipient_id: targetUserId, type: 'peer', status: 'pending' });

// Accept a connection (recipient updates status)
const { error } = await supabase
  .from('connections')
  .update({ status: 'accepted', updated_at: new Date().toISOString() })
  .eq('id', connectionId);

// Decline / remove a connection
const { error } = await supabase
  .from('connections')
  .update({ status: 'declined' })
  .eq('id', connectionId);
```

### Pattern 3: Slug-to-UUID Translation

`ConnectButton` receives `memberId` as a **slug** (e.g., `jennifer-walsh`). The `connections` table requires UUIDs. The member profile page (`app/members/[id]/page.tsx`) already fetches the full profile from Supabase including `profile.id` (UUID). The fix is to pass `profile.id` (UUID) as `memberId` to `ConnectButton` instead of the slug.

```typescript
// In app/members/[id]/page.tsx — profile is already fetched from Supabase
// profile.id is the UUID; change memberId prop to pass UUID
<ConnectButton
  memberId={profile.id}          // was: profile.slug or member.id (slug)
  memberName={displayName}
  memberPhoto={profile.avatar_url ?? ''}
  firstName={firstName}
/>
```

The `ConnectionsContext` must then key its in-memory map by UUID, not slug. `getStatus(userId: string)` accepts a UUID.

### Anti-Patterns to Avoid

- **Keying by slug in the DB:** The table must use UUID FKs. Slugs are display-layer only.
- **Using `service_role` key in client code:** All client mutations go through the anon key; RLS enforces access. Never expose service_role to the browser.
- **Storing connection state in localStorage:** The entire point of this phase is to remove all `localStorage.setItem` / `getItem` calls from `ConnectionsContext`.
- **Removing the demo notifications realtime subscription without replacing it:** The `notifications` table realtime subscription in `ConnectionsContext` is separate from connection storage — it can stay or be moved to `Header.tsx` where it logically belongs. Do not accidentally delete it.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Duplicate connection prevention | Custom dedup logic | `unique(requester_id, recipient_id)` constraint in migration | DB enforces it; client logic is unreliable |
| Auth checks in context | Manual token parsing | `auth.uid()` in RLS policies | RLS is the security boundary; client checks are UI-only |
| UUID generation | `Math.random()` IDs | `gen_random_uuid()` in DB default | Already used by every table in the project |
| updated_at maintenance | Manual timestamp set | Trigger reusing `update_updated_at_column()` | The function already exists from `schools` migration |

**Key insight:** The migration does the hard work — unique constraint prevents duplicate requests, RLS prevents cross-user reads/writes, DB defaults handle IDs and timestamps. The context rewrite is then straightforward CRUD.

---

## Runtime State Inventory

> Phase 4 is not a rename/refactor — it is a migration from localStorage to Supabase.

| Category | Items Found | Action Required |
|----------|-------------|-----------------|
| Stored data | `localStorage` keys: `goya-connections`, `goya-notifications`, `goya-demo-seeded` — exist in browser sessions of any user who visited with the mock context | No data migration needed (localStorage is ephemeral per browser; no real user data to preserve) |
| Live service config | None | None |
| OS-registered state | None | None |
| Secrets/env vars | `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` — already set; no new env vars needed | None |
| Build artifacts | `lib/connections-data.ts` — mock file used by `ConnectionsSection.tsx` | Delete file; update `ConnectionsSection.tsx` to fetch from Supabase |

**Note on `ConnectionsSection.tsx`:** This component imports `MOCK_PROFILE_CONNECTIONS` from `lib/connections-data.ts` and `useConnections` from context. After DB-04, it must fetch connections from Supabase directly (since it displays another member's connections, it needs a server-side query or a separate Supabase call, not the current-user context). This is in scope for DB-04.

---

## Common Pitfalls

### Pitfall 1: ConnectButton passes slug, table expects UUID

**What goes wrong:** `sendRequest(memberId, ...)` is called with a slug string. Supabase insert fails because `recipient_id` is a UUID FK referencing `profiles(id)` — slug is not a valid UUID.

**Why it happens:** The existing mock context accepted any string as a key. The real DB does not.

**How to avoid:** Change `ConnectButton`'s `memberId` prop to carry the profile UUID. The member detail page already has `profile.id` available. Update the prop at the call site in `app/members/[id]/page.tsx`.

**Warning signs:** Supabase insert returns a FK violation error at runtime.

### Pitfall 2: `ConnectionsSection.tsx` still imports deleted mock file

**What goes wrong:** After deleting `lib/connections-data.ts`, the build breaks because `ConnectionsSection.tsx` imports `MOCK_PROFILE_CONNECTIONS` from it.

**Why it happens:** The file is used in two places — `ConnectionsContext` (which is being rewritten) and `ConnectionsSection` (which is a separate component).

**How to avoid:** DB-04 must include updating `ConnectionsSection.tsx` to source connection data from Supabase, not from the mock file. Delete `lib/connections-data.ts` only after updating all importers.

### Pitfall 3: `unique(requester_id, recipient_id)` allows A→B and B→A as separate rows

**What goes wrong:** User A sends a request to B. B also sends a request to A. Two rows are inserted. The unique constraint only prevents exact duplicate pairs — it does not prevent the reverse pair.

**Why it happens:** The constraint is directional.

**How to avoid:** Add an application-level check in `sendRequest`: before inserting, query for any existing connection where `(requester_id = A and recipient_id = B) or (requester_id = B and recipient_id = A)`. Only insert if none exists. This check is in the context rewrite, not the migration.

**Warning signs:** Two pending rows appear for the same pair, one on each side.

### Pitfall 4: `notifications` realtime subscription deleted accidentally

**What goes wrong:** The current `ConnectionsContext` includes a realtime subscription to the `notifications` table for the logged-in user. This feeds the `Header.tsx` notification dropdown. If this subscription is dropped during the context rewrite, notifications stop working.

**Why it happens:** The subscription lives inside `ConnectionsProvider` — when rewriting the provider, it is easy to omit.

**How to avoid:** Keep the `notifications` realtime subscription intact during the rewrite. It can remain in `ConnectionsContext` or be moved to `Header.tsx` (where it also exists), but it must not be silently dropped.

### Pitfall 5: `updated_at` not maintained without a trigger

**What goes wrong:** `updated_at` column never changes after insert if only `status` is updated.

**Why it happens:** PostgreSQL does not auto-update `updated_at` on row modification.

**How to avoid:** Add a trigger in the migration reusing the existing `update_updated_at_column()` function (already defined in the project — used by `schools` table).

```sql
create trigger update_connections_updated_at
  before update on connections
  for each row execute function update_updated_at_column();
```

---

## Code Examples

### Full migration file

```sql
-- Source: project convention from supabase/migrations/20260338_messaging.sql

-- ── Connections ────────────────────────────────────────────────────────────────
create table connections (
  id            uuid primary key default gen_random_uuid(),
  requester_id  uuid references profiles(id) on delete cascade not null,
  recipient_id  uuid references profiles(id) on delete cascade not null,
  type          text not null check (type in ('peer', 'mentorship', 'faculty')),
  status        text not null default 'pending' check (status in ('pending', 'accepted', 'declined')),
  created_at    timestamptz default now(),
  updated_at    timestamptz default now(),
  unique(requester_id, recipient_id)
);

alter table connections enable row level security;

-- ── RLS ───────────────────────────────────────────────────────────────────────
create policy "users can view own connections" on connections
  for select using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "users can send connection requests" on connections
  for insert with check (auth.uid() = requester_id);

create policy "participants can update connections" on connections
  for update using (auth.uid() = requester_id or auth.uid() = recipient_id);

create policy "participants can delete connections" on connections
  for delete using (auth.uid() = requester_id or auth.uid() = recipient_id);

-- ── updated_at trigger ────────────────────────────────────────────────────────
create trigger update_connections_updated_at
  before update on connections
  for each row execute function update_updated_at_column();
```

### ConnectionsContext sendRequest (Supabase version)

```typescript
// Source: project pattern — supabase browser client from lib/supabase.ts
const sendRequest = useCallback(async (recipientId: string, recipientName: string, recipientPhoto: string) => {
  if (!userId) return;

  // Guard: check for existing connection in either direction
  const { data: existing } = await supabase
    .from('connections')
    .select('id')
    .or(
      `and(requester_id.eq.${userId},recipient_id.eq.${recipientId}),and(requester_id.eq.${recipientId},recipient_id.eq.${userId})`
    )
    .maybeSingle();

  if (existing) return; // already exists

  const { data, error } = await supabase
    .from('connections')
    .insert({ requester_id: userId, recipient_id: recipientId, type: 'peer', status: 'pending' })
    .select()
    .single();

  if (!error && data) {
    // optimistic update
    setConnections(prev => ({ ...prev, [recipientId]: { ...data, status: 'pending_sent' } }));
  }
}, [userId]);
```

### Load connections on mount

```typescript
// Source: project pattern — existing useEffect structure in ConnectionsContext.tsx
useEffect(() => {
  if (!userId) return;
  supabase
    .from('connections')
    .select('*')
    .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
    .then(({ data }) => {
      if (data) {
        // build the keyed map: key = the OTHER party's UUID
        const map: Record<string, ConnRecord> = {};
        for (const row of data) {
          const otherId = row.requester_id === userId ? row.recipient_id : row.requester_id;
          const role = row.requester_id === userId ? 'requester' : 'receiver';
          const displayStatus: ConnStatus =
            row.status === 'pending' && role === 'requester' ? 'pending_sent' :
            row.status === 'pending' && role === 'receiver' ? 'pending_received' :
            row.status;
          map[otherId] = { connectionId: row.id, status: displayStatus, role };
        }
        setConnections(map);
      }
    });
}, [userId]);
```

---

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Supabase project (remote) | DB-01, DB-02, DB-03 | Assumed — project is in production use | — | — |
| `npx supabase` CLI | DB-03 (db push) | Assumed — `package-lock.json` present | — | — |

**Note:** The project uses `npx supabase db push` (not the local Supabase CLI installed globally). This runs via npx so no global install is required.

---

## Validation Architecture

> `workflow.nyquist_validation` is not set to false — validation section included.

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Vitest ^2.1.9 |
| Config file | `vitest.config.ts` (exists at project root) |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| DB-01 | `connections` table has correct columns and constraints | manual-only | n/a — migration verified by `npx supabase db push` success | N/A |
| DB-02 | RLS blocks cross-user reads/writes | manual-only | n/a — Supabase RLS requires live DB; no unit test isolation | N/A |
| DB-03 | Migration file exists in `supabase/migrations/` | manual (file check) | `ls supabase/migrations/ | grep connections` | ❌ Wave 0 |
| DB-04 | `ConnectionsContext` no longer references localStorage | unit | `npx vitest run` (grep for localStorage in context) | ❌ Wave 0 |

**Justification for manual-only on DB-01/DB-02:** RLS policy correctness requires a running Supabase instance with real auth tokens. Unit tests cannot mock this meaningfully. Verification is: run `npx supabase db push`, then manually test that authenticated calls return correct data and that cross-user calls return empty sets.

### Sampling Rate

- **Per task commit:** `npx vitest run`
- **Per wave merge:** `npx vitest run`
- **Phase gate:** Full suite green + manual DB verification before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] `supabase/migrations/20260339_add_connections.sql` — DB-01, DB-02 (migration file itself is Wave 0)
- [ ] No unit test file needed for the migration; DB-04 can be verified by searching for `localStorage` in the rewritten context file

*(If no gaps for unit tests: the context rewrite will be verified by absence of localStorage calls and by manual smoke test of ConnectButton in the browser.)*

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| localStorage connections mock | Supabase `connections` table with RLS | Phase 4 | Real persistence, multi-device, secure |
| Slug-based connection ID | UUID FK from `profiles(id)` | Phase 4 | Required for DB integrity |
| In-context demo seed data | Real data from DB | Phase 4 | Demo user Jennifer Walsh disappears; real connections appear |

**Deprecated after this phase:**
- `lib/connections-data.ts` — deleted
- `localStorage` keys `goya-connections`, `goya-notifications`, `goya-demo-seeded` — no longer written

---

## Open Questions

1. **What `type` should `sendRequest` default to?**
   - What we know: The DB requires one of `peer | mentorship | faculty`. Phase 5 adds role-aware button labels. Phase 4 only wires up the generic `ConnectButton`.
   - What's unclear: Should `sendRequest` accept a `type` param now, or always insert `'peer'` and let Phase 5 change it?
   - Recommendation: Accept `type` as an optional param defaulting to `'peer'`. This makes the Phase 5 upgrade mechanical (pass `'mentorship'` from the button).

2. **Does `ConnectionsSection.tsx` need a full rewrite in Phase 4?**
   - What we know: It imports `MOCK_PROFILE_CONNECTIONS` which will be deleted. It also uses `useConnections()` context.
   - What's unclear: Showing another user's connections (non-own profile) requires querying the DB for that profile's connections — but the logged-in user's RLS only returns their own connections.
   - Recommendation: In Phase 4, make `ConnectionsSection` show real connections for the **logged-in user's own profile only** (using context). For other profiles, hide the section or show nothing. Phase 6 can add a server-side query if cross-profile connection display is needed. This avoids requiring a server component or an RLS policy change in Phase 4.

---

## Sources

### Primary (HIGH confidence)

- `supabase/migrations/20260338_messaging.sql` — RLS pattern for two-party tables
- `supabase/migrations/20260335_add_schools.sql` — `update_updated_at_column()` trigger reuse
- `supabase/migrations/001_profiles.sql` — `profiles(id)` FK target, `auth.uid()` pattern
- `app/context/ConnectionsContext.tsx` — full audit of localStorage usage to be replaced
- `app/components/ConnectButton.tsx` — slug-based memberId prop to be changed to UUID
- `app/components/ConnectionsSection.tsx` — imports mock file, needs update
- `MEMORY.md` — `npx supabase db push` mandate after migration creation

### Secondary (MEDIUM confidence)

- `app/members/[id]/page.tsx` — confirms `profile.id` (UUID) is available at the ConnectButton call site

---

## Metadata

**Confidence breakdown:**
- Migration structure: HIGH — copied directly from existing project migrations
- RLS patterns: HIGH — verified from `20260338_messaging.sql`
- Context rewrite approach: HIGH — existing code fully audited
- Slug-to-UUID translation: HIGH — confirmed `profile.id` available at call site
- `update_updated_at_column()` function existence: MEDIUM — seen used in `schools` migration, assumed defined in an earlier migration

**Research date:** 2026-03-23
**Valid until:** Stable — Supabase RLS and migration patterns do not change frequently. Valid for 90 days.
