---
title: Authentication
audience: ["developer"]
section: developer
order: 5
last_updated: "2026-04-04"
---

# Authentication

GOYA v2 uses Supabase Auth for all session management. Authentication state is stored in cookies (not `localStorage`) via the `@supabase/ssr` package, making it available to both Server Components and middleware.

## Table of Contents

- [Supabase Auth Flow](#supabase-auth-flow)
- [Supabase Client Variants](#supabase-client-variants)
- [Session Management in Middleware](#session-management-in-middleware)
- [Role System](#role-system)
- [Checking Roles in Code](#checking-roles-in-code)
- [Admin Impersonation](#admin-impersonation)
- [Password Reset Lock Screen](#password-reset-lock-screen)
- [Migrated Users — Password Reset Gate](#migrated-users--password-reset-gate)
- [Maintenance Mode](#maintenance-mode)

---

## Supabase Auth Flow

1. User submits credentials on `/sign-in` or `/register`.
2. Supabase issues a JWT access token + refresh token, stored as HTTP-only cookies (`sb-*`).
3. The `@supabase/ssr` browser client (`lib/supabase.ts`) reads these cookies automatically.
4. On each request, middleware calls `supabase.auth.getUser()` which validates the token (and silently refreshes it via `setAll` cookie callback).
5. Downstream Server Components call `createSupabaseServerClient()` which reads the same cookies from the request.

Password reset for invited or migrated members goes through `/forgot-password` → `/reset-password` (Supabase magic link flow).

---

## Supabase Client Variants

Three clients exist for different contexts:

| File | When to use |
|---|---|
| `lib/supabase.ts` | Client Components — `createBrowserClient`, session in cookies |
| `lib/supabaseServer.ts` | Server Components and Server Actions — `createServerClient` with cookie store |
| `lib/supabase/service.ts` | Service role — bypasses RLS entirely. Use only for admin operations that legitimately need to read or write any row. |

**Never import `lib/supabase/service.ts` from Client Components.** The service role key must never reach the browser.

```tsx
// Server Component
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function Page() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  // ...
}
```

---

## Session Management in Middleware

`middleware.ts` runs on every request that matches the config matcher (everything except static assets and API routes).

Key responsibilities:

1. **Session refresh** — Creates a `createServerClient` with cookie read/write callbacks. The `setAll` callback writes updated auth cookies back to the response, keeping the session alive without requiring a page reload.
2. **Route protection** — Redirects unauthenticated users trying to access `/dashboard`, `/admin`, `/profile`, `/connections`, or `/members`.
3. **Admin path enforcement** — After session check, reads `profiles.role` and redirects non-admin/moderator users away from `/admin`.
4. **Maintenance mode** — Fetches `site_settings` (with a 60-second module-level cache) and redirects non-admin users to `/maintenance`.
5. **Impersonation cookie validation** — If `goya_impersonating` cookie exists, verifies the real session user is an admin. Clears the cookie and redirects if not.

**Performance note:** The middleware short-circuits early for public routes when maintenance is off, avoiding a full Supabase round-trip on every request.

---

## Role System

Roles are stored in `profiles.role`. The role is set at registration and can be updated by admins.

| Role | Description |
|---|---|
| `student` | Default role for new registrations |
| `teacher` | Yoga teacher with verified credentials |
| `wellness_practitioner` | WP designation holder |
| `moderator` | Staff — can manage most content, cannot access all admin features |
| `admin` | Full access — can manage settings, roles, impersonate users |

Helper function in the database:

```sql
-- Returns true if the current auth.uid() is admin or moderator
SELECT public.is_admin();
```

This function is used in RLS policies throughout the schema.

---

## Checking Roles in Code

**In a Server Component or Server Action:**

```tsx
import { createSupabaseServerClient } from '@/lib/supabaseServer'

const supabase = await createSupabaseServerClient()
const { data: { user } } = await supabase.auth.getUser()

const { data: profile } = await supabase
  .from('profiles')
  .select('role')
  .eq('id', user!.id)
  .single()

const isAdmin = profile?.role === 'admin'
const isAdminOrMod = ['admin', 'moderator'].includes(profile?.role ?? '')
```

**In a layout (authoritative gate pattern):**

```tsx
// app/admin/layout.tsx
import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function AdminLayout({ children }) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles').select('role').eq('id', user.id).single()

  if (!['admin', 'moderator'].includes(profile?.role ?? '')) {
    redirect('/')
  }

  return <AdminShell>{children}</AdminShell>
}
```

The middleware check is a first pass for UX. The layout check is the security gate — never rely on middleware alone for admin gating.

---

## Admin Impersonation

Admins can view the platform as any member without knowing their password. The mechanism:

1. Admin visits `/admin/users/[id]` and clicks "Impersonate".
2. A Server Action writes a `goya_impersonating` cookie (value = target user ID) and a `goya_impersonation_log_id` cookie.
3. A log row is inserted into `impersonation_log`.
4. The admin's own session remains active — only the displayed data changes.
5. Server Components that render member-specific data call `getImpersonationState()` from `lib/impersonation.ts` to resolve the effective user ID.
6. On "End Impersonation", both cookies are cleared and the log row is updated with `ended_at`.

**Security:** Middleware validates the impersonation cookie on every request. If the real session user's role is not `admin`, the cookies are deleted and the user is redirected.

```tsx
// lib/impersonation.ts — resolving the effective user
import { getImpersonationState } from '@/lib/impersonation'

const state = await getImpersonationState()
const effectiveUserId = state.isImpersonating
  ? state.targetUserId
  : currentUser.id
```

---

## Password Reset Lock Screen

When a user clicks a Supabase password-reset magic link, the `/auth/callback` route sets a `password_reset_pending=true` cookie. Middleware detects this cookie and locks the user to `/reset-password` on every request until the cookie is cleared.

**Header behavior:** `app/layout.tsx` reads the `password_reset_pending` cookie (via `cookies()` from `next/headers`). When set, the full navigation header is replaced with a minimal header showing only the GOYA logo. Footer, chat widget, and cookie consent are also hidden — the page is intentionally self-contained.

**After successful password update:**

1. `app/reset-password/page.tsx` calls `supabase.auth.updateUser({ password })`.
2. On success, it POSTs to `/api/auth/complete-reset` — a Route Handler that verifies the user is authenticated, then sets `password_reset_pending=` with `maxAge: 0` via a `Set-Cookie` response header. This clears the cookie server-side before the redirect.
3. The page then does a hard redirect via `window.location.href = '/dashboard'` (not `router.push`). The hard redirect forces a new HTTP request, so middleware reads the fresh cookies without the stale `password_reset_pending` value.

**Why not `router.push` or `document.cookie`?** Client-side navigation (soft redirect) reuses the existing request context. Middleware may still see the old cookie value in flight, causing an infinite redirect loop back to `/reset-password`. A hard redirect guarantees a clean request.

**Files:**
- `app/layout.tsx` — reads cookie, conditionally renders minimal logo-only header
- `app/api/auth/complete-reset/route.ts` — POST endpoint that clears cookie via `Set-Cookie`
- `app/reset-password/page.tsx` — calls complete-reset then `window.location.href`

---

## Migrated Users — Password Reset Gate

Members imported from the legacy WordPress platform have `profiles.requires_password_reset = true`. Middleware intercepts every request for these users and redirects to `/account/set-password` until they set a new password, at which point the flag is cleared.

---

## Maintenance Mode

Controlled via `site_settings` keys:

| Key | Value | Effect |
|---|---|---|
| `maintenance_mode_enabled` | `"true"` | Immediate maintenance |
| `maintenance_mode_scheduled` | `"true"` | Scheduled window |
| `maintenance_start_utc` | ISO datetime | Start of scheduled window |
| `maintenance_end_utc` | ISO datetime | End of scheduled window |

During maintenance, all non-admin users are redirected to `/maintenance`. Admins and moderators pass through.

The settings are fetched with a 60-second module-level cache in middleware to avoid hitting the DB on every request.

---

## See Also

- [architecture.md](./architecture.md) — Middleware and layout-level role checks
- [database-schema.md](./database-schema.md) — `profiles` table and `impersonation_log`
- [deployment.md](./deployment.md) — Required environment variables for auth
