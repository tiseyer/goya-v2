# Phase 7: Admin Connections Tab - Research

**Researched:** 2026-03-24
**Domain:** Next.js App Router admin page — tabs, server component data fetch, service role Supabase, client action (delete)
**Confidence:** HIGH

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| ADM-01 | Admin can view any user's connections in a Connections tab on the user detail page | `getSupabaseService()` bypasses RLS to fetch any user's connections; server component pattern established in impersonation-log page |
| ADM-02 | Admin can remove any connection from the user's Connections tab | Client component button calls `supabase` (anon) with service-role bypass via a Server Action, mirroring the `ResetOnboardingButton` pattern — OR a new `RemoveConnectionButton` client component calling a server action |
</phase_requirements>

---

## Summary

Phase 7 adds a Connections tab to the existing admin user detail page at `app/admin/users/[id]/page.tsx`. The page is currently a single-panel server component with no tabs. The Connections tab must list all connections for the viewed user (bypassing RLS because the admin is not one of the connection parties) and allow removing any connection.

The project already has every building block needed: `getSupabaseService()` at `lib/supabase/service.ts` for RLS bypass, `ResetOnboardingButton` as the template for confirm-then-delete client components, and `Badge` + `Button` UI components. The connections table schema is fully understood from Phase 4.

The key architectural decision is how to wire tabs into the existing page. The page currently has no tab UI at all — the planner must introduce a tab switcher. Since the page is a server component, tabs should be implemented with URL search params (`?tab=connections`) rather than client state, so deep-links work and no extra client bundle is needed. The connections list fetches at server render time and the remove action uses a Server Action from a small client component.

**Primary recommendation:** Add a tab bar to the user detail page using URL search params (`?tab=connections`), fetch connections server-side using `getSupabaseService()`, and implement remove via a `RemoveConnectionButton` client component calling a Server Action that uses `getSupabaseService()` to bypass RLS.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@supabase/ssr` | already installed | SSR-safe Supabase client | Project standard |
| `@supabase/supabase-js` | already installed | Service role client (via `createClient`) | Used in `lib/supabase/service.ts` |
| Next.js App Router | 16 (project) | Server components, Server Actions | Project standard |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `app/components/ui/Button` | project | Confirm/remove button | All interactive buttons |
| `app/components/ui/Badge` | project | Status/type labels | Connection status and type display |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| URL search param tabs | `useState` tabs in a client component | URL params give deep-links and server rendering; client state requires converting the whole page to `'use client'` which loses SSR data fetching |
| Server Action for delete | Direct Supabase call in client component using service role | Server Actions keep service role key server-side only; client component with service role would leak the key |

**Installation:** No new packages required — all dependencies are already installed.

---

## Architecture Patterns

### Recommended Project Structure
```
app/admin/users/[id]/
├── page.tsx                    # Server component — fetch profile + connections, render tabs
├── ResetOnboardingButton.tsx   # Existing client component (no change)
└── RemoveConnectionButton.tsx  # New client component — confirm + server action delete
app/actions/
└── adminConnections.ts         # New server action — removeConnectionAsAdmin
```

### Pattern 1: URL Search Param Tabs in a Server Component

**What:** Tab state is stored in `searchParams.tab`. The server component reads it, fetches the appropriate data, and renders the tab content. No client JS needed for the tab itself.

**When to use:** When tab content requires server-side data and the page is already a server component.

**Example:**
```typescript
// Source: Next.js App Router docs — searchParams in async server components
export default async function AdminUserDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id } = await params;
  const { tab = 'overview' } = await searchParams;
  // ...
}
```

### Pattern 2: Service Role Fetch to Bypass RLS

**What:** Use `getSupabaseService()` (already at `lib/supabase/service.ts`) to fetch rows that the authenticated admin would not be able to see with the anon client due to RLS.

**When to use:** Admin pages that need to read/write data belonging to other users. The RLS policies on `connections` only allow `requester_id` or `recipient_id` — an admin querying another user's connections would get 0 rows without service role.

**Example:**
```typescript
// Source: app/admin/impersonation-log/page.tsx — established pattern in this project
import { getSupabaseService } from '@/lib/supabase/service'

const { data: connections } = await (getSupabaseService() as any)
  .from('connections')
  .select(`
    id, type, status, created_at,
    requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
    recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url)
  `)
  .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
  .order('created_at', { ascending: false })
```

### Pattern 3: Client Component Action Button with Server Action

**What:** A small `'use client'` component manages confirm/loading state. On confirm it calls a Server Action that performs the privileged delete using `getSupabaseService()`.

**When to use:** Destructive operations that need a confirmation step and require service role access. Mirrors the existing `ResetOnboardingButton` pattern.

**Example:**
```typescript
// app/actions/adminConnections.ts
'use server'
import { getSupabaseService } from '@/lib/supabase/service'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'

export async function removeConnectionAsAdmin(connectionId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')
  // Guard: verify caller is admin/moderator
  const { data: profile } = await supabase.from('profiles').select('role').eq('id', user.id).single()
  if (!['admin', 'moderator'].includes(profile?.role ?? '')) redirect('/')

  await (getSupabaseService() as any).from('connections').delete().eq('id', connectionId)
}
```

### Pattern 4: Tab Bar HTML (no external library)

The existing settings connections page (`app/settings/connections/page.tsx`) renders tab buttons with:
- Active: `border-b-2 border-primary text-primary`
- Inactive: `text-slate-500 hover:text-primary-dark`

For URL-param tabs, render these as `<Link>` with `href={?tab=X}` rather than `<button onClick>`.

### Anti-Patterns to Avoid

- **Don't use `supabase` (anon browser client) to fetch connections for another user.** RLS will silently return 0 rows — this is a correctness bug, not an error.
- **Don't expose `getSupabaseService()` in a client component.** Service role key must stay server-side only.
- **Don't reuse `ConnectionsContext` for the admin view.** That context is scoped to the logged-in user's own connections.
- **Don't convert `app/admin/users/[id]/page.tsx` to a client component.** It fetches profile data server-side; converting it to client would break that fetch or require a client-side refetch.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| RLS bypass | Custom middleware | `getSupabaseService()` at `lib/supabase/service.ts` | Already exists, lazy-initialized, tested |
| Tab UI | Custom tab library | Inline button/link pattern from `settings/connections/page.tsx` | Matches existing design system exactly |
| Confirm dialog | Modal component | Inline confirm state in `RemoveConnectionButton` | Matches `ResetOnboardingButton` pattern |
| Admin role check in Server Action | Separate auth util | Inline check with `createSupabaseServerClient()` | Pattern used across admin server actions |

---

## Common Pitfalls

### Pitfall 1: RLS silently returns empty data
**What goes wrong:** Developer uses the session-scoped `createSupabaseServerClient()` to query connections for the viewed user. The admin is not `requester_id` or `recipient_id`, so RLS returns 0 rows with no error — the Connections tab appears empty for every user.
**Why it happens:** Supabase RLS filters silently (no 403, just empty results) when the policy predicate is false.
**How to avoid:** Always use `getSupabaseService()` when the admin queries data owned by a different user.
**Warning signs:** Connections tab shows "No connections" even for users known to have connections.

### Pitfall 2: `searchParams` must be awaited in Next.js 16
**What goes wrong:** Accessing `searchParams.tab` without `await` — Next.js 16 makes both `params` and `searchParams` async Promises in App Router server components.
**Why it happens:** Breaking change introduced in Next.js 15/16.
**How to avoid:** Declare `searchParams: Promise<{ tab?: string }>` in props type and `const { tab } = await searchParams`.
**Warning signs:** TypeScript error: "Property 'tab' does not exist on type 'Promise<...>'".

### Pitfall 3: Server Action without admin guard
**What goes wrong:** A Server Action that removes a connection only checks authentication (user is logged in) but not authorization (user is admin). Any authenticated user who discovers the action endpoint can remove connections.
**Why it happens:** Forgetting the second check after `getUser()`.
**How to avoid:** Always verify `profile.role` is `admin` or `moderator` in every admin Server Action before performing the privileged operation.
**Warning signs:** Action file has `getUser()` but no role check.

### Pitfall 4: `revalidatePath` needed after Server Action
**What goes wrong:** Admin removes a connection via the Server Action, but the page still shows the connection because the server component's cached data is stale.
**Why it happens:** Server Actions don't automatically revalidate the current page.
**How to avoid:** Call `revalidatePath('/admin/users/[id]', 'page')` inside the Server Action after the delete, OR call `router.refresh()` from the client component (the `ResetOnboardingButton` pattern uses `router.refresh()`).
**Warning signs:** Connection row remains visible after "Remove" succeeds.

---

## Code Examples

Verified patterns from project codebase:

### Connections query with profiles join (adapted for admin)
```typescript
// Source: app/context/ConnectionsContext.tsx — established join pattern
const { data: connections } = await (getSupabaseService() as any)
  .from('connections')
  .select(`
    id, type, status, created_at,
    requester:profiles!connections_requester_id_fkey(id, full_name, avatar_url),
    recipient:profiles!connections_recipient_id_fkey(id, full_name, avatar_url)
  `)
  .or(`requester_id.eq.${userId},recipient_id.eq.${userId}`)
  .order('created_at', { ascending: false })
```

### Tab bar with URL search params (adapted from settings connections page)
```tsx
// Source: app/settings/connections/page.tsx — tab button styling
const TABS = ['overview', 'connections'] as const
// Render as Link for URL-param tabs:
<Link
  href={`/admin/users/${id}?tab=${tab}`}
  className={activeTab === tab ? 'border-b-2 border-primary text-primary ...' : 'text-slate-500 ...'}
>
  {label}
</Link>
```

### RemoveConnectionButton shape (mirrors ResetOnboardingButton)
```tsx
// Source: app/admin/users/[id]/ResetOnboardingButton.tsx — confirm pattern
'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { removeConnectionAsAdmin } from '@/app/actions/adminConnections'
import Button from '@/app/components/ui/Button'

export default function RemoveConnectionButton({ connectionId }: { connectionId: string }) {
  const router = useRouter()
  const [confirming, setConfirming] = useState(false)
  const [loading, setLoading] = useState(false)

  async function handleRemove() {
    setLoading(true)
    await removeConnectionAsAdmin(connectionId)
    setLoading(false)
    setConfirming(false)
    router.refresh()
  }
  // ...
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `params` as sync prop | `params` as `Promise<{ id: string }>` | Next.js 15+ | Must `await params` in server components |
| `searchParams` as sync prop | `searchParams` as `Promise<{ tab?: string }>` | Next.js 15+ | Must `await searchParams` |

---

## Environment Availability

Step 2.6: SKIPPED — no external dependencies beyond existing project stack. All dependencies (Supabase, Next.js, service role key) are already in use in the project.

---

## Validation Architecture

`nyquist_validation` is not explicitly set to false in `.planning/config.json` — treated as enabled.

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest + jsdom |
| Config file | `vitest.config.ts` |
| Quick run command | `npx vitest run` |
| Full suite command | `npx vitest run` |

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| ADM-01 | Admin user detail shows Connections tab with connection list | manual-only | — (browser verification) | N/A |
| ADM-02 | Admin can remove a connection via Remove button | manual-only | — (browser verification) | N/A |

**Manual-only justification:** Both requirements are UI/interaction features in a server-rendered admin page that requires auth + role. Integration tests would need a test Supabase instance with admin credentials. The project's existing test suite covers pure logic units (handlers, context mutations) — admin page rendering is verified by human browser check, consistent with Phase 6 approach.

### Wave 0 Gaps
None — no new test files needed. The phase creates one server component, one client component, and one server action. No pure-logic units that warrant unit tests.

---

## Sources

### Primary (HIGH confidence)
- `app/admin/users/[id]/page.tsx` — existing user detail page structure (no tabs, server component, `createSupabaseServerClient`)
- `app/admin/users/[id]/ResetOnboardingButton.tsx` — confirm+action client component pattern
- `app/admin/impersonation-log/page.tsx` — `getSupabaseService()` usage in admin server component
- `lib/supabase/service.ts` — service role client implementation
- `supabase/migrations/20260339_add_connections.sql` — authoritative connections schema and RLS policies
- `app/context/ConnectionsContext.tsx` — profiles join query syntax for connections
- `app/settings/connections/page.tsx` — tab bar styling pattern

### Secondary (MEDIUM confidence)
- Next.js App Router docs pattern: `params` and `searchParams` as Promises in Next.js 15+ (verified by existing `page.tsx` using `await params`)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — all components already exist in codebase
- Architecture: HIGH — every pattern has a direct project precedent
- Pitfalls: HIGH — RLS silent empty and searchParams async are verified project concerns

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (stable stack, no fast-moving dependencies)
