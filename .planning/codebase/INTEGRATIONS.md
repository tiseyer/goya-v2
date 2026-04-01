# Integrations

**Analysis Date:** 2026-03-23

## External APIs & Services

### Mapbox
- **Purpose:** Interactive maps (likely for event locations or member geography)
- **SDK:** `mapbox-gl` 3.20.0
- **Env var:** `NEXT_PUBLIC_MAPBOX_TOKEN` (inferred — standard Mapbox pattern)
- **Usage:** Client-side map rendering in browser components

### Vercel Analytics
- **Purpose:** Page view and web analytics
- **SDK:** `@vercel/analytics` 2.0.1
- **Env vars:** None required (auto-detected on Vercel)
- **Usage:** Injected at app level

### i.pravatar.cc
- **Purpose:** Placeholder avatar images during development
- **Usage:** Allowed as a remote image pattern in `next.config.ts`; not a production dependency

## Authentication

**Provider:** Supabase Auth (built into Supabase)

**Strategy:** Cookie-based sessions (not localStorage) via `@supabase/ssr`

**Implementation:**
- Browser client: `lib/supabase.ts` — `createBrowserClient` from `@supabase/ssr`
- Server components: `lib/supabaseServer.ts` — `createSupabaseServerClient()` and `createSupabaseServerActionClient()`
- Middleware: `middleware.ts` — `createServerClient` with cookie get/set for session refresh on every request

**Role system:**
- Roles stored in `profiles.role` column: `member`, `moderator`, `admin`
- Onboarding gate: `profiles.onboarding_completed` boolean
- Middleware enforces role-based access to `/admin` and onboarding completion for `/dashboard`, `/profile`, `/connections`

**Impersonation:**
- Admin-only feature using cookies: `goya_impersonating` and `goya_impersonation_log_id`
- Security enforced in middleware: strips impersonation cookies if session user is not admin
- Server action at `app/actions/impersonation.ts`

**Auth routes:**
- Sign in: `/sign-in`
- Sign up: `/sign-up`
- Register: `/register`
- Forgot password: `/forgot-password`
- Reset password: `/reset-password`
- Logout route: `app/logout/route.ts`
- Auth callback: `app/auth/` directory

## Database

**Provider:** Supabase (PostgreSQL)

**Client library:** `@supabase/supabase-js` 2.95.2 + `@supabase/ssr` 0.8.0

**Env vars:**
- `NEXT_PUBLIC_SUPABASE_URL` — Supabase project URL (public)
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` — Anon/public key (public)
- `SUPABASE_SERVICE_ROLE_KEY` — Service role key (server-only, bypasses RLS)

**Client patterns:**
- `lib/supabase.ts` — Browser client (anon key, cookie session)
- `lib/supabaseServer.ts` — Server component client (read-only cookies)
- `lib/supabaseServer.ts` `createSupabaseServerActionClient()` — Server action client (can set cookies)
- `lib/supabase/service.ts` — Admin client (service role key, bypasses RLS)
- `lib/supabase/getEffectiveUserId.ts` — Resolves impersonation to effective user ID

**Schema management:**
- Migration files in `supabase/migrations/`
- Schema baseline at `supabase/schema.sql`
- Seed data at `supabase/seed.sql`
- Deploy command: `npx supabase db push`

**Key tables (inferred from codebase):**
- `profiles` — User profiles with `role`, `onboarding_completed`, `verification_status`, `email`
- `email_log` — Sent email audit log (`recipient`, `subject`, `template_name`, `status`, `error_message`)
- `email_templates` — Admin-editable email templates (`template_key`, `subject`, `html_content`, `is_active`)
- `site_settings` — Key-value site config including maintenance mode settings
- `impersonation_log` — Admin impersonation audit trail

**Maintenance mode:**
- Stored in `site_settings` table with keys: `maintenance_mode_enabled`, `maintenance_mode_scheduled`, `maintenance_start_utc`, `maintenance_end_utc`
- Queried directly via Supabase REST API in middleware with 60-second TTL cache (module-level, edge-compatible)

## Email

**Provider:** Resend

**SDK:** `resend` 6.9.4

**Env vars:**
- `RESEND_API_KEY` — Resend API key (server-only)

**From address:** `hello@globalonlineyogaassociation.org`
**Reply-to:** `member@globalonlineyogaassociation.org`

**Implementation files:**
- `lib/email/client.ts` — Resend client initialization (lazy, fails at call time not build time)
- `lib/email/send.ts` — Two send functions:
  - `sendEmail()` — Deprecated, renders React Email component to HTML then sends
  - `sendEmailFromTemplate()` — Current pattern, fetches template from `email_templates` DB table, performs `{{variable}}` substitution, wraps in layout, sends via Resend
- `lib/email/wrapper.ts` — HTML email layout wrapper
- `lib/email/defaults.ts` — Fallback template content when DB template has no `html_content`
- `lib/email/variables.ts` — Template variable definitions

**Template system:**
- Templates are stored in and editable from the admin panel at `/admin/email-templates`
- Template keys correspond to trigger events (e.g., `welcome`, `verification-approved`, `verification-rejected`, `onboarding-complete`, `admin_digest`)
- All sends are logged to `email_log` table (fire-and-forget)

**API trigger routes:**
- `app/api/email/welcome/route.ts`
- `app/api/email/verification-approved/route.ts`
- `app/api/email/verification-rejected/route.ts`
- `app/api/email/onboarding-complete/route.ts`

## Payments

Not detected. No payment processor SDK (Stripe, etc.) found in `package.json`.

Note: The app has `app/checkout/` and `app/order-confirmation/` routes and an `app/admin/products/` section and `app/addons/` — payment integration may be planned or implemented differently.

## Storage

**File storage:** Supabase Storage (likely — avatar upload endpoint at `app/api/avatar/route.ts`)

No dedicated file storage SDK beyond Supabase client detected.

## Analytics & Monitoring

**Analytics:** Vercel Analytics (`@vercel/analytics` 2.0.1) — automatic page view tracking on Vercel

**Error tracking:** Not detected (no Sentry, Datadog, etc.)

**Logging:** `console.log` / `console.error` with `[cron]`, `[email]` prefixes for structured log scanning in Vercel logs

## Scheduled Jobs (Cron)

**Platform:** Vercel Cron Jobs (configured in `vercel.json`)

**Jobs:**
- `/api/cron/credits-expiring` — Runs daily at 08:00 UTC. Placeholder for credits expiration logic (not yet fully implemented).
- `/api/cron/admin-digest` — Runs every Monday at 08:00 UTC. Queries pending verifications, sends digest email to all admin users via `sendEmailFromTemplate()`.

**Security:** All cron routes verify `Authorization: Bearer ${CRON_SECRET}` header.

**Env var:** `CRON_SECRET` — Shared secret set in Vercel project settings.

## Other Integrations

**Tiptap Rich Text Editor** (`@tiptap/react` 3.20.4)
- Used for creating/editing content (likely course content, event descriptions, or messaging)
- Extensions: color, link, placeholder, text-align, text-style, underline, starter-kit

**Supabase Realtime** (via `@supabase/supabase-js`)
- Used in messaging system (`lib/messaging.ts`) — user-to-user messaging with likely realtime subscriptions

---

*Integration audit: 2026-03-23*
