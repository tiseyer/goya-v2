# Codebase Structure

**Analysis Date:** 2026-03-23

## Directory Layout

```
goya-v2/
├── app/                    # Next.js App Router — all pages, layouts, API routes
│   ├── (route pages)/      # Feature routes (see Directory Purposes below)
│   ├── admin/              # Admin panel — users, events, courses, credits, settings
│   ├── api/                # API routes: avatar proxy, cron jobs, email triggers
│   ├── components/         # Shared layout components (Header, Footer, etc.)
│   ├── context/            # React Context providers (Cart, Connections, Impersonation)
│   ├── onboarding/         # Multi-step onboarding wizard with role-branched steps
│   └── layout.tsx          # Root layout (fonts, analytics, ClientProviders)
├── lib/                    # Shared backend utilities and data access
│   ├── email/              # Resend client, send function, template wrapper, defaults
│   ├── supabase/           # Service client, getEffectiveUserId helper
│   ├── supabase.ts         # Browser Supabase client singleton
│   ├── supabaseServer.ts   # Server Component + Server Action Supabase clients
│   ├── types.ts            # All shared TypeScript types and interfaces
│   ├── impersonation.ts    # Admin impersonation state fetch (service client)
│   ├── feed.ts             # Community feed queries/mutations
│   ├── messaging.ts        # Direct messaging queries/mutations
│   ├── credits.ts          # Credits system queries
│   ├── connections-data.ts # Member connections queries
│   ├── members-data.ts     # Member directory queries
│   ├── events-data.ts      # Events queries
│   ├── academy-data.ts     # Courses/academy queries
│   └── addons-data.ts      # Add-ons/products queries
├── supabase/               # Supabase CLI project
│   ├── migrations/         # Sequential SQL migration files
│   ├── schema.sql          # Full schema snapshot
│   └── seed.sql            # Seed data
├── public/                 # Static assets
│   └── images/             # Logos, product badge images
├── test/                   # Test setup files
│   └── setup.ts            # Vitest global setup
├── middleware.ts            # Edge middleware (auth, maintenance, impersonation)
├── next.config.ts           # Next.js configuration
├── vercel.json              # Vercel cron job definitions
├── vitest.config.ts         # Test runner configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Dependencies and scripts
```

## Directory Purposes

**`app/` (route pages):**
Each subdirectory is a Next.js route segment. Convention: `page.tsx` is always a Server Component. Client-only components within that route are sibling files with `'use client'` at the top.

Key member-facing routes:
- `app/dashboard/` — Community feed (posts, likes, comments)
- `app/members/` — Member directory with map panel; `app/members/[id]/` is a public profile
- `app/events/` — Event listing; `app/events/[id]/` is event detail
- `app/academy/` — Course listing; `app/academy/[id]/` is course detail with lesson
- `app/credits/` — CPD credits submission and history
- `app/messages/` — Direct messaging interface
- `app/community/` — Community landing page
- `app/addons/` — Add-on products listing and detail pages
- `app/cart/` and `app/checkout/` — E-commerce cart and checkout
- `app/profile/settings/` — Profile settings with Server Action
- `app/schools/` — School creation and settings
- `app/welcome/` — Post-onboarding welcome screen

Auth routes:
- `app/sign-in/` and `app/login/` — Sign-in pages (both exist)
- `app/register/` — Registration
- `app/forgot-password/` and `app/reset-password/` — Password recovery
- `app/logout/route.ts` — Sign-out route handler
- `app/auth/actions.ts` — Server Actions for sign-in/sign-out/sign-up

Static content routes:
- `app/about/`, `app/privacy/`, `app/terms/`, `app/code-of-conduct/`, `app/code-of-ethics/`, `app/standards/`

**`app/admin/`:**
Full admin panel. Every sub-route requires `admin` or `moderator` role (enforced by both middleware and `app/admin/layout.tsx`).
- `users/` — User list with filters, pagination, per-user detail
- `events/` — Event CRUD with `new/` and `[id]/edit/`
- `courses/` — Course CRUD with `new/` and `[id]/edit/`
- `credits/` — CPD credit requirements management
- `verification/` — Member verification queue
- `inbox/` — School registration submissions
- `products/` — Product visibility management
- `settings/` — Site settings and email template list
- `email-templates/[key]/` — Individual email template editor
- `impersonation-log/` — Audit log for admin impersonation sessions
- `dashboard/` — Admin dashboard overview
- `components/AdminShell.tsx` — Admin sidebar shell component

**`app/api/`:**
- `avatar/route.ts` — Proxies Supabase Storage avatar URLs to avoid exposing storage URLs directly
- `cron/credits-expiring/route.ts` — Sends expiry reminder emails; triggered daily 08:00 UTC
- `cron/admin-digest/route.ts` — Sends weekly admin digest email; triggered Monday 08:00 UTC
- `email/onboarding-complete/route.ts` — Sends onboarding complete email
- `email/verification-approved/route.ts` — Sends verification approval email
- `email/verification-rejected/route.ts` — Sends verification rejection email
- `email/welcome/route.ts` — Sends welcome email

**`app/components/`:**
Shared layout components used across multiple pages. All are Client Components unless noted.
- `Header.tsx` — Main navigation with auth state, mobile menu, cart badge
- `Footer.tsx` — Site footer
- `ClientProviders.tsx` — Wraps app with all React Context providers (Cart, Connections, Impersonation)
- `ImpersonationBanner.tsx` — Top banner shown when admin is impersonating a user
- `ConnectButton.tsx` — Reusable connect/disconnect button for member profiles
- `ConnectionsSection.tsx` — Connections list section for member profiles
- `MessageButton.tsx` — Opens direct message thread with a member
- `MiniCart.tsx` — Inline cart preview in header
- `PageHero.tsx` — Reusable hero banner component for content pages
- `GOYABadge.tsx` — GOYA membership badge display component

**`app/context/`:**
- `CartContext.tsx` — Cart state; persisted to `localStorage`; provides `addToCart`, `removeFromCart`, `clearCart`
- `ConnectionsContext.tsx` — Connections state with Realtime subscription for live notifications
- `ImpersonationContext.tsx` — Exposes impersonation state (admin identity + target identity) to all client components

**`app/onboarding/`:**
Multi-step wizard. Steps are role-branched:
- `steps/Step_T_*` — Teacher-specific steps
- `steps/Step_S_*` — Student-specific steps
- `steps/Step_W_*` — Wellness practitioner-specific steps
- `steps/Step_*` (no suffix) — Shared steps shown to all roles
- `components/` — Generic step primitives (`OnboardingStep`, `OnboardingShell`, `OnboardingProvider`) and input components (`inputs/`)
- `hooks/useOnboardingProgress.ts` — Tracks and persists step progress
- `lib/steps.ts` — Step registry / routing logic
- `lib/submitOnboarding.ts` — Client-side submit helper
- `lib/submitOnboardingAction.ts` — Server Action for final submission

**`app/actions/`:**
Top-level Server Actions not co-located with a specific page:
- `impersonation.ts` — Start/stop impersonation, log to `impersonation_log` table
- `email-templates.ts` — Admin CRUD for email templates in DB

**`lib/email/`:**
- `client.ts` — Resend SDK client singleton
- `send.ts` — `sendEmailFromTemplate(templateKey, to, variables)` — main email dispatch function
- `defaults.ts` — Default from-address and reply-to values
- `variables.ts` — `{{variable}}` substitution logic
- `wrapper.ts` — `wrapInEmailLayout()` — wraps template HTML in base email shell

**`lib/supabase/`:**
- `service.ts` — Service role client (bypasses RLS); import as `createServiceClient()`
- `getEffectiveUserId.ts` — Returns impersonated user ID if admin is impersonating, otherwise real user ID

**`supabase/migrations/`:**
Sequential SQL files. Naming: `YYYYMMDD_description.sql` for new migrations. Two legacy files use `NNN_description.sql` format (`001_profiles.sql`, `002_profile_fields.sql`). Always run `npx supabase db push` after adding a migration file.

**`public/images/`:**
- `products/` — Badge and designation images referenced by product records in the DB
- Logo files: `GOYA Logo Black.png`, `GOYA Logo Blue.png`, `GOYA Logo White.png`, `GOYA Logo Short.png`, `Favicon.png`

## Key File Locations

**Entry Points:**
- `app/layout.tsx` — Root layout, runs on every request
- `middleware.ts` — Edge middleware, runs before every non-static request
- `app/page.tsx` — Public homepage

**Configuration:**
- `next.config.ts` — Next.js configuration
- `vercel.json` — Cron job schedule definitions
- `tsconfig.json` — TypeScript paths and compiler options
- `vitest.config.ts` — Test runner config
- `eslint.config.mjs` — ESLint config

**Core Logic:**
- `lib/types.ts` — All shared types (Profile, Event, Course, Message, etc.)
- `lib/supabase.ts` — Browser Supabase client
- `lib/supabaseServer.ts` — Server Supabase clients
- `lib/impersonation.ts` — Impersonation state helper
- `lib/email/send.ts` — Email send function

**Data Access:**
- `lib/feed.ts` — Feed posts, likes, comments
- `lib/messaging.ts` — Conversations and messages
- `lib/members-data.ts` — Member directory and profiles
- `lib/events-data.ts` — Events
- `lib/academy-data.ts` — Courses and lessons
- `lib/credits.ts` — CPD credits
- `lib/connections-data.ts` — Member connections
- `lib/addons-data.ts` — Products and add-ons

**Database:**
- `supabase/migrations/` — All schema migrations
- `supabase/schema.sql` — Current full schema snapshot
- `supabase/seed.sql` — Seed data

## Naming Conventions

**Files:**
- React components: `PascalCase.tsx` (e.g., `AdminShell.tsx`, `FeedPostCard.tsx`)
- Pages and layouts: `page.tsx`, `layout.tsx` (Next.js convention, always lowercase)
- Route handlers: `route.ts` (Next.js convention)
- Server Actions: `actions.ts` (co-located with the feature)
- Data access modules: `kebab-case-data.ts` (e.g., `members-data.ts`, `academy-data.ts`)
- Utility modules: `camelCase.ts` (e.g., `impersonation.ts`, `productVisibility.ts`)
- Onboarding steps: `Step_ROLE_Description.tsx` (e.g., `Step_T_Bio.tsx`, `Step_S_Languages.tsx`)

**Directories:**
- Route segments: `kebab-case` (Next.js convention, e.g., `forgot-password/`, `order-confirmation/`)
- Dynamic segments: `[id]` (Next.js convention)
- Component groupings: `components/` within a feature directory
- Step inputs: `inputs/` within `app/onboarding/components/`

## Where to Add New Code

**New member-facing page:**
- Route: `app/[feature-name]/page.tsx` (Server Component)
- Client sub-components: `app/[feature-name]/ComponentName.tsx` (add `'use client'` if needed)
- Server Actions: `app/[feature-name]/actions.ts`

**New admin page:**
- Route: `app/admin/[feature]/page.tsx`
- Client components: `app/admin/[feature]/ComponentName.tsx`
- Follows same Server/Client split pattern

**New shared layout component:**
- Implementation: `app/components/ComponentName.tsx`

**New data access function:**
- If it fits an existing domain: add to the matching `lib/*-data.ts` or `lib/*.ts` file
- If it's a new domain: create `lib/[domain]-data.ts`
- Use `lib/supabase.ts` (browser) for client-side calls; `createSupabaseServerClient()` for server-side

**New email template:**
- Register the template in the `email_templates` DB table (via admin panel at `/admin/email-templates`)
- Add a trigger route at `app/api/email/[template-name]/route.ts`
- Call `sendEmailFromTemplate(templateKey, to, variables)` from `lib/email/send.ts`

**New API route (non-email):**
- Implementation: `app/api/[feature]/route.ts`
- Note: API routes bypass middleware entirely (excluded from matcher)

**New Vercel cron job:**
- Add route: `app/api/cron/[job-name]/route.ts`
- Add entry to `vercel.json` `crons` array with path and schedule
- Always verify `Authorization: Bearer ${process.env.CRON_SECRET}` in the handler

**New database migration:**
- Create: `supabase/migrations/YYYYMMDD_description.sql`
- Apply: `npx supabase db push`
- Update `supabase/schema.sql` snapshot if desired

**New React Context:**
- Implementation: `app/context/ContextName.tsx`
- Register provider in `app/components/ClientProviders.tsx`

**Shared TypeScript types:**
- All types go in `lib/types.ts` — do not scatter types across feature files

## Special Directories

**`supabase/.migration_backup/`:**
- Purpose: Backup copies of renamed/superseded migration files
- Generated: No (manually managed)
- Committed: Yes

**`supabase/.temp/`:**
- Purpose: Supabase CLI runtime metadata (project ref, version pins)
- Generated: Yes (Supabase CLI)
- Committed: Yes (contains project ref needed for `db push`)

**`.planning/`:**
- Purpose: GSD planning documents and codebase analysis
- Generated: By GSD tooling
- Committed: Yes

**`.claude/`:**
- Purpose: Claude worktrees and session context
- Generated: By Claude Code
- Committed: Partially (worktree refs)

---

*Structure analysis: 2026-03-23*
