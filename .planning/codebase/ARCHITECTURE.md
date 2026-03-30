# Architecture

**Analysis Date:** 2026-03-23

## Pattern Overview

**Overall:** Layered monolith with Next.js App Router

**Key Characteristics:**
- `app/` pages are Server Components by default; data is fetched at request time directly from Supabase
- `lib/` provides shared data-access functions, typed Supabase clients, domain types, and email utilities
- `middleware.ts` runs at the Edge and is the single source of truth for routing security (auth, onboarding gating, maintenance mode, impersonation cookie validation)
- No dedicated API layer — data mutations happen via Server Actions (`app/*/actions.ts`) or direct Supabase client calls from client components
- Database schema is managed through Supabase CLI migrations in `supabase/migrations/`

## Layers

**Edge Layer:**
- Purpose: Request interception, routing security, session refresh
- Location: `middleware.ts`
- Contains: Auth enforcement, maintenance mode (60s TTL in-memory module-level cache), onboarding gating, role checks, impersonation cookie validation
- Depends on: `@supabase/ssr`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Used by: Every request matching `/((?!_next/static|_next/image|favicon\.ico|images/|api/).*)`

**Page Layer:**
- Purpose: Route rendering — Server Components fetch data, Client Components handle interaction
- Location: `app/*/page.tsx`, `app/*/layout.tsx`
- Contains: Page-scoped components, server-side data fetching, route-level auth redundancy
- Depends on: `lib/` helpers, Supabase server clients
- Used by: Next.js routing engine

**Data Access Layer:**
- Purpose: Typed, reusable Supabase query functions grouped by domain
- Location: `lib/feed.ts`, `lib/messaging.ts`, `lib/credits.ts`, `lib/connections-data.ts`, `lib/members-data.ts`, `lib/events-data.ts`, `lib/academy-data.ts`, `lib/addons-data.ts`
- Contains: Domain-specific query and mutation functions
- Depends on: Browser or server Supabase client depending on execution context
- Used by: Server Components, Client Components, API route handlers

**Infrastructure Layer:**
- Purpose: Supabase client initialization, email dispatch, utility functions
- Location: `lib/supabase.ts`, `lib/supabaseServer.ts`, `lib/supabase/service.ts`, `lib/supabase/getEffectiveUserId.ts`, `lib/email/`
- Contains: Three distinct Supabase client types, Resend email wrapper, impersonation helpers
- Depends on: `@supabase/ssr`, `@supabase/supabase-js`, `resend`
- Used by: All other layers

**API Route Layer:**
- Purpose: Cron-triggered jobs and event-driven email-send endpoints
- Location: `app/api/`
- Contains: `avatar/route.ts` (avatar proxy), `cron/credits-expiring/route.ts` (daily 08:00 UTC), `cron/admin-digest/route.ts` (weekly Monday 08:00 UTC), `email/onboarding-complete/`, `email/verification-approved/`, `email/verification-rejected/`, `email/welcome/`
- Depends on: `lib/email/send.ts`, `lib/supabase/service.ts`
- Used by: Vercel Cron (crons), internal callers for email routes

**Client State Layer:**
- Purpose: Global client-side state that persists across navigation
- Location: `app/context/CartContext.tsx`, `app/context/ConnectionsContext.tsx`, `app/context/ImpersonationContext.tsx`
- Contains: React Context providers wrapping the full application
- Depends on: `localStorage` for persistence, browser Supabase client for Realtime subscriptions
- Used by: Any client component needing cart, connections, or impersonation state

**Server Actions Layer:**
- Purpose: Form submissions and mutations from client components that require server execution
- Location: `app/auth/actions.ts`, `app/actions/impersonation.ts`, `app/actions/email-templates.ts`, `app/profile/settings/actions.ts`, `app/credits/actions.ts`, `app/academy/[id]/actions.ts`, `app/academy/[id]/lesson/actions.ts`, `app/onboarding/lib/submitOnboardingAction.ts`
- Contains: `'use server'` functions called directly from Client Components or forms
- Depends on: `createSupabaseServerActionClient` (mutable-cookie client), service client for privileged ops
- Used by: Client Components and form elements

## Supabase Client Types

Three distinct clients serve different execution contexts:

**Browser client** (`lib/supabase.ts`):
- Created with `createBrowserClient` from `@supabase/ssr`
- Exported as singleton `supabase`
- Used in: Client components, `lib/feed.ts`, `lib/messaging.ts`
- Sessions stored in cookies (not localStorage) for SSR compatibility

**Server Component client** (`lib/supabaseServer.ts` → `createSupabaseServerClient`):
- Created with `createServerClient`, read-only cookie access (`setAll` is a no-op)
- Instantiated per-request in Server Components and layouts
- Used in: `app/admin/layout.tsx`, `app/*/page.tsx` server data fetching

**Server Action client** (`lib/supabaseServer.ts` → `createSupabaseServerActionClient`):
- Created with `createServerClient`, mutable cookie access
- Required for auth operations that set session cookies
- Used in: `app/auth/actions.ts`

**Service Role client** (`lib/supabase/service.ts`):
- Created with `createClient` using `SUPABASE_SERVICE_ROLE_KEY`
- Bypasses Row-Level Security — admin and email operations only
- Used in: `lib/impersonation.ts`, `lib/email/send.ts`

## Data Flow

**Authenticated page request:**
1. Request hits Edge middleware (`middleware.ts`)
2. Maintenance check runs first (cached 60s via module-level `maintenanceCache` — no Supabase client needed on cache hit)
3. If protected path: Supabase client created, `supabase.auth.getUser()` called
4. Role and onboarding status checked against `profiles` table if path requires it
5. Next.js routes to `page.tsx` (Server Component)
6. Server Component calls `createSupabaseServerClient()` and queries Supabase
7. HTML rendered server-side; client components hydrate with data passed as props

**Server Action (sign-in):**
1. Form at `/sign-in` or `/login` submits to `app/auth/actions.ts`
2. `createSupabaseServerActionClient()` called to get mutable-cookie client
3. `supabase.auth.signInWithPassword()` sets session cookies
4. Onboarding status checked; `redirect()` called to `/onboarding` or `/welcome`

**Email send:**
1. Cron job or user action calls `app/api/email/*/route.ts`
2. Route handler calls `sendEmailFromTemplate()` from `lib/email/send.ts`
3. Template fetched from `email_templates` DB table by `template_key`
4. `{{variable}}` placeholders substituted in subject and HTML content via `lib/email/variables.ts`
5. `wrapInEmailLayout()` (`lib/email/wrapper.ts`) wraps content in base HTML shell
6. Sent via Resend SDK; result logged to `email_log` table (fire-and-forget)

**Realtime (messaging / notifications):**
1. Client component creates Supabase channel via browser client (`lib/supabase.ts`)
2. `postgres_changes` subscription on `notifications` or `messages` table filtered by `user_id`
3. Supabase pushes INSERT events in real time
4. Local React state updated; connection notifications also persisted to `localStorage`

**Impersonation:**
1. Admin sets `goya_impersonating` cookie via action in `app/actions/impersonation.ts`
2. `app/layout.tsx` calls `getImpersonationState()` from `lib/impersonation.ts` on every render
3. Service client fetches both admin and target `profiles` rows (bypasses RLS)
4. `ImpersonationProvider` (`app/context/ImpersonationContext.tsx`) passes state to all client components
5. Middleware validates cookie on every request — clears and redirects if session user is not admin
6. `getEffectiveUserId()` in `lib/supabase/getEffectiveUserId.ts` returns impersonated ID for data operations

## Entry Points

**Root Layout:**
- Location: `app/layout.tsx`
- Triggers: Every page request
- Responsibilities: Geist font setup, analytics scripts (GA4 + Microsoft Clarity, DB-controlled via `site_settings`, 1-hour revalidation), `ClientProviders` wrapper, `Header`/`Footer` conditional rendering, impersonation state fetch

**Middleware:**
- Location: `middleware.ts`
- Triggers: Every request matching non-static paths
- Responsibilities: Maintenance mode (instant bypass for cached hits), auth gating with `?next=` redirect, onboarding gating, admin role enforcement, impersonation cookie security

**Admin Layout:**
- Location: `app/admin/layout.tsx`
- Triggers: Any `/admin/*` request
- Responsibilities: Server-side role verification (redundant to middleware as defence-in-depth), renders `AdminShell`

**Onboarding Flow:**
- Location: `app/onboarding/page.tsx`, steps in `app/onboarding/steps/`
- Triggers: Unauthenticated member completing registration
- Responsibilities: Multi-step wizard with role-branching steps (`Step_T_*` for teachers, `Step_S_*` for students, `Step_W_*` for wellness practitioners); progress tracked in `profiles.onboarding_step`

## Authentication & Role System

**Roles** (defined in `lib/types.ts`):
- `student`, `teacher`, `wellness_practitioner` — member roles, require onboarding completion
- `moderator` — can access `/admin`, bypasses onboarding gate
- `admin` — full access, can impersonate any user, can access admin settings

**Onboarding gate:** Paths `/dashboard`, `/profile`, `/connections` require `profiles.onboarding_completed = true`. Middleware redirects to `/onboarding` if not. Admins and moderators bypass this gate (unless `onboarding_preview_mode` cookie is set).

**Public paths:** `/events`, `/academy`, `/register`, `/sign-in`, `/login`, `/forgot-password`, `/reset-password` — no auth required. All static assets and `/api/*` routes also bypass middleware entirely.

## Error Handling

**Strategy:** Throw on unexpected errors; return `{ success: false, error }` objects for expected failures.

**Patterns:**
- Supabase query errors: `if (error) throw error` in `lib/` data functions
- Email send: returns `{ success: false, error }`, never throws — callers must check
- API routes: return `Response.json({ error: '...' }, { status: 4xx/5xx })`
- Server Actions: call `redirect()` with error query param (e.g., `/login?error=...`) or return error objects
- Client components: local `error` state, rendered as inline error messages

## Cross-Cutting Concerns

**Logging:** `console.log` / `console.error` with `[email]` prefix for email operations. No structured logging service.

**Validation:** Client-side form validation only. Server-side validation is implicit via Supabase column constraints and RLS policies. No shared validation library.

**Authentication:** Cookie-based sessions via `@supabase/ssr`. Middleware handles session refresh on every protected request.

**Analytics:** GA4 and Microsoft Clarity, enabled/disabled via `site_settings` DB table (`analytics_enabled` key, `ga4_measurement_id`, `clarity_project_id`). Settings cached 1 hour in root layout via `next: { revalidate: 3600 }`. Vercel Analytics always active via `@vercel/analytics`.

**Maintenance Mode:** Controlled via `site_settings` DB rows (`maintenance_mode_enabled`, `maintenance_mode_scheduled`, `maintenance_start_utc`, `maintenance_end_utc`). Edge middleware caches settings for 60 seconds using a module-level variable. Admins and moderators bypass maintenance mode.

**Vercel Cron Jobs:**
- `GET /api/cron/credits-expiring` — runs daily at 08:00 UTC
- `GET /api/cron/admin-digest` — runs weekly on Monday at 08:00 UTC
- Both verify `Authorization: Bearer {CRON_SECRET}` header

---

*Architecture analysis: 2026-03-23*
