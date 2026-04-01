---
title: Architecture
audience: ["developer"]
section: developer
order: 2
last_updated: "2026-03-31"
---

# Architecture

## Table of Contents

- [Folder Tree](#folder-tree)
- [app/ — Pages and API Routes](#app--pages-and-api-routes)
- [lib/ — Server-Side Utilities](#lib--server-side-utilities)
- [supabase/ — Database](#supabase--database)
- [Key Patterns](#key-patterns)
  - [Server Components by Default](#server-components-by-default)
  - [Server Actions for Mutations](#server-actions-for-mutations)
  - [PageContainer Layout Standard](#pagecontainer-layout-standard)
  - [Role-Based Routing](#role-based-routing)
  - [AdminShell and SettingsShell](#adminshell-and-settingsshell)

---

## Folder Tree

```
GOYA v2/
├── app/                          # Next.js App Router root
│   ├── layout.tsx                # Root layout (fonts, providers, analytics)
│   ├── page.tsx                  # Homepage (redirects authed users → /dashboard)
│   ├── globals.css               # Tailwind base styles
│   │
│   ├── admin/                    # Admin section (role-gated: admin | moderator)
│   │   ├── layout.tsx            # Verifies role, renders AdminShell sidebar
│   │   ├── components/
│   │   │   └── AdminShell.tsx    # Sidebar nav for admin section
│   │   ├── dashboard/
│   │   ├── users/
│   │   ├── events/
│   │   ├── courses/
│   │   ├── products/
│   │   ├── shop/
│   │   ├── credits/
│   │   ├── inbox/                # Verification + course approval queue
│   │   ├── email-templates/
│   │   ├── settings/
│   │   ├── chatbot/
│   │   ├── flows/                # Onboarding flow builder
│   │   ├── media/                # Media library
│   │   ├── audit-log/
│   │   ├── analytics/
│   │   ├── api-keys/
│   │   ├── impersonation-log/
│   │   └── migration/            # WordPress import tool
│   │
│   ├── settings/                 # Member settings (auth-gated)
│   │   ├── layout.tsx            # Verifies auth, renders SettingsShell sidebar
│   │   ├── components/
│   │   │   └── SettingsShell.tsx
│   │   ├── page.tsx              # Profile settings
│   │   ├── connections/
│   │   ├── help/
│   │   ├── inbox/
│   │   ├── my-courses/
│   │   ├── my-events/
│   │   └── subscriptions/
│   │
│   ├── api/                      # Route Handlers
│   │   ├── v1/                   # Public REST API (API-key authenticated)
│   │   │   ├── users/
│   │   │   ├── events/
│   │   │   ├── courses/
│   │   │   ├── credits/
│   │   │   ├── addons/
│   │   │   ├── analytics/
│   │   │   └── webhooks/
│   │   ├── webhooks/
│   │   │   └── stripe/route.ts   # Stripe webhook receiver
│   │   ├── admin/                # Internal admin APIs
│   │   ├── chatbot/              # AI chatbot endpoints
│   │   ├── cron/                 # Vercel cron job handlers
│   │   ├── avatar/route.ts       # Avatar upload
│   │   ├── me/route.ts           # Current user info
│   │   └── email/                # Email trigger endpoints
│   │
│   ├── dashboard/                # Member dashboard (auth-gated)
│   ├── academy/                  # Course library (public browse, gated play)
│   ├── events/                   # Event listings (public)
│   ├── members/[id]/             # Public member profiles
│   ├── profile/                  # Own profile page
│   ├── credits/                  # CE credits tracker
│   ├── teaching-hours/           # Teaching hours log
│   ├── schools/                  # Schools directory
│   ├── community/                # Community feed
│   ├── connections/              # Member connections
│   ├── messages/                 # Direct messaging
│   ├── upgrade/                  # WP upgrade + designation flow
│   ├── checkout/                 # Stripe checkout
│   ├── cart/
│   ├── addons/
│   │
│   ├── auth/callback/            # Supabase OAuth callback
│   ├── sign-in/ login/           # Auth pages
│   ├── register/                 # New member registration
│   ├── forgot-password/
│   ├── reset-password/
│   ├── account/set-password/     # Force-reset for migrated users
│   ├── maintenance/              # Maintenance mode splash
│   │
│   ├── about/ community/ standards/ privacy/ terms/
│   └── components/               # Shared UI components
│       └── ui/
│           └── PageContainer.tsx # Width standard (max-w-7xl)
│
├── lib/                          # Server-side utilities
│   ├── supabase.ts               # Browser client (createBrowserClient)
│   ├── supabaseServer.ts         # Server client (createServerClient + cookies)
│   ├── supabase/
│   │   └── service.ts            # Service role client (bypasses RLS)
│   ├── stripe/
│   │   ├── client.ts             # Singleton Stripe SDK (server-only)
│   │   └── handlers/             # One file per webhook event category
│   ├── email/
│   │   ├── client.ts             # Resend singleton
│   │   ├── send.ts               # sendEmail() and sendEmailFromTemplate()
│   │   ├── wrapper.ts            # HTML email shell template
│   │   ├── defaults.ts           # Fallback template content
│   │   └── variables.ts          # Template variable helpers
│   ├── api/
│   │   ├── handler.ts            # createApiHandler() factory
│   │   ├── middleware.ts         # validateApiKey(), rateLimit(), requirePermission()
│   │   ├── response.ts           # successResponse(), errorResponse()
│   │   └── services/             # Business logic for v1 API
│   ├── chatbot/                  # AI chatbot logic
│   ├── secrets/                  # Encrypted secrets store
│   ├── impersonation.ts          # Admin impersonation state
│   ├── audit.ts                  # Audit log writer
│   ├── credits.ts                # Credit calculation helpers
│   ├── flows/                    # Flow builder runtime
│   ├── media/                    # Media library helpers
│   └── analytics/                # Analytics data queries
│
├── supabase/
│   └── migrations/               # SQL migration files (chronological)
│
├── types/
│   └── supabase.ts               # Generated database types
│
├── middleware.ts                  # Next.js middleware (auth, maintenance, impersonation)
├── vercel.json                    # Cron job definitions
└── vitest.config.ts
```

---

## app/ — Pages and API Routes

The App Router uses the filesystem for routing. Every `page.tsx` is a route; every `route.ts` is an API endpoint.

**Route groups** are not used. Access control is enforced through layout-level server checks and the middleware.

**Dynamic segments** follow Next.js conventions: `[id]` for a single param, `[...slug]` for catch-all.

---

## lib/ — Server-Side Utilities

`lib/` is **server-side only**. Nothing in `lib/` imports `'use client'` code.

Key modules:

| Module | Purpose |
|---|---|
| `supabase.ts` | Browser Supabase client (session in cookies via `@supabase/ssr`) |
| `supabaseServer.ts` | Server Supabase client for Server Components and Server Actions |
| `supabase/service.ts` | Service role client — bypasses RLS; use only when necessary |
| `stripe/client.ts` | Lazy singleton Stripe instance (imports `server-only`) |
| `email/send.ts` | `sendEmailFromTemplate()` — DB-driven templates via Resend |
| `api/middleware.ts` | `validateApiKey()`, `rateLimit()`, `requirePermission()` |
| `impersonation.ts` | Read/write admin impersonation cookie state |
| `audit.ts` | Append rows to `audit_log` table |
| `secrets/` | AES-encrypted secrets stored in the `admin_secrets` table |

---

## supabase/ — Database

All schema changes live in `supabase/migrations/` as numbered SQL files. There is no ORM — queries use the Supabase JS client with the generated `types/supabase.ts` types for type safety.

After adding or pulling a migration file, run:

```bash
npx supabase db push
```

---

## Key Patterns

### Server Components by Default

Every `page.tsx` and `layout.tsx` is a React Server Component unless it begins with `'use client'`. Data fetching happens inline using `await supabase.from(...).select(...)` — no useEffect, no loading states for initial data.

```tsx
// app/dashboard/page.tsx — Server Component
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export default async function DashboardPage() {
  const supabase = await createSupabaseServerClient()
  const { data: profile } = await supabase.from('profiles').select('*').single()
  return <div>{profile?.full_name}</div>
}
```

Client Components are added at the leaf level for interactive UI (forms, modals, charts).

---

### Server Actions for Mutations

All create/update/delete operations use Server Actions, not client-side API calls. Server Actions are defined in `actions.ts` files co-located with their page or in `lib/`.

```tsx
// app/settings/actions.ts
'use server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function updateProfile(formData: FormData) {
  const supabase = await createSupabaseServerClient()
  // ... mutation
}
```

---

### PageContainer Layout Standard

Every page content section wraps its content in `PageContainer` to enforce the `max-w-7xl` (1280px) width standard.

```tsx
import PageContainer from '@/app/components/ui/PageContainer'

// Full-bleed background with contained content:
<section className="bg-slate-50">
  <PageContainer className="py-16">
    <h1>Content here</h1>
  </PageContainer>
</section>
```

Never hardcode `max-width`, `mx-auto`, or horizontal padding directly on page elements.

---

### Role-Based Routing

Roles are stored in `profiles.role`. Valid values: `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin`.

Access control happens at two layers:

1. **Middleware** (`middleware.ts`): Blocks unauthenticated users from protected paths. Enforces maintenance mode. Validates impersonation cookie integrity.
2. **Layout-level server check**: `app/admin/layout.tsx` re-verifies the role server-side and redirects if insufficient. This is the authoritative gate — middleware alone is not sufficient because it runs on Edge (no full DB access).

---

### AdminShell and SettingsShell

`AdminShell` and `SettingsShell` are server-rendered sidebar layout components that receive `children` from the active page.

- `app/admin/layout.tsx` verifies role, then renders `<AdminShell>{children}</AdminShell>`
- `app/settings/layout.tsx` verifies auth, then renders `<SettingsShell userRole={...}>{children}</SettingsShell>`

To add a new admin section: create the page under `app/admin/your-section/page.tsx`, then add the nav link inside `AdminShell.tsx`.

---

## See Also

- [database-schema.md](./database-schema.md) — Full table reference
- [authentication.md](./authentication.md) — Auth flow and role enforcement details
- [contributing.md](./contributing.md) — How to add new pages
