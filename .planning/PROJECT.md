# GOYA v2

## What This Is

GOYA v2 is a professional community platform for yoga and wellness practitioners — teachers, students, and wellness practitioners. Members can connect with peers, attend events, complete CPD-accredited courses, track credits, and manage their professional profile and subscriptions through a unified settings section. Admins manage the community through a full-featured admin panel with a comprehensive Shop section for products, orders, coupons, and analytics powered by bidirectional Stripe integration. External services can programmatically access and manage all entities through a secure, documented REST API.

## Core Value

Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## Current State

**As of v1.6 (2026-03-27):** Open Gates REST API milestone shipped. Complete REST API at `/api/v1/` with 49 endpoints across 10 resource categories (users, events, courses, credits, verifications, analytics, add-ons, admin settings, webhooks, health). API key authentication with SHA-256 hashing, sliding-window rate limiting (100/min), and three permission levels (read/write/admin). Admin API key management page at `/admin/api-keys`. Comprehensive API_DOCS.md (1,958 lines).

Previous: v1.3 Subscriptions & Teacher Upgrade, v1.2 Stripe Admin & Shop, v1.1 Connections & Inbox, v1.0 User Settings.

## Requirements

### Validated

<!-- Features shipped in GOYA v2 before GSD tracking began — inferred from codebase. -->

- ✓ User authentication (sign-up, sign-in, forgot/reset password, session management)
- ✓ Role-branched onboarding wizard (teacher, student, wellness practitioner paths)
- ✓ Member profiles with avatar, bio, and public profile pages
- ✓ Community dashboard with feed, posts, likes, and comments
- ✓ Member directory with map panel and connection system
- ✓ Direct messaging between members
- ✓ Events listing and detail pages
- ✓ Academy with courses, lessons, and progress tracking
- ✓ CPD credits submission and history
- ✓ Add-ons and products with cart and checkout
- ✓ Schools creation and settings
- ✓ Profile settings (name, avatar, bio)
- ✓ Subscriptions page
- ✓ Admin panel: users, events, courses, credits, verification queue, inbox, products, site settings, email templates
- ✓ Admin impersonation with audit log
- ✓ Email system with DB-driven templates and Resend delivery
- ✓ Maintenance mode (edge-cached, admin bypass)
- ✓ Analytics (GA4, Microsoft Clarity, Vercel Analytics — DB-controlled)
- ✓ Vercel cron jobs (credits expiry, admin digest)

<!-- v1.0 User Settings milestone -->
- ✓ User can access Settings from the profile dropdown (all user types) — v1.0
- ✓ Admin/Moderator sees "Settings" directly above "Admin Settings" in dropdown — v1.0
- ✓ Regular users see "Settings" between the two dropdown dividers — v1.0
- ✓ Settings page has sidebar layout matching Admin Settings — v1.0
- ✓ Settings > General shows existing profile settings content — v1.0
- ✓ Settings > Subscriptions shows existing subscriptions content — v1.0
- ✓ Settings > Connections is a placeholder page — v1.0

<!-- v1.1 Connections & Inbox milestone -->
- ✓ Connections table with peer/mentorship/faculty types, RLS policies, migration — v1.1
- ✓ ConnectionsContext and ConnectButton backed by real Supabase (localStorage removed) — v1.1
- ✓ Role-aware ConnectButton: Request Mentorship, Apply as Faculty, Manage School, Connect — v1.1
- ✓ Settings > Connections: tabbed view with status badges and remove action — v1.1
- ✓ Settings > Inbox: accept/decline incoming requests with type filter — v1.1
- ✓ Header notification "View all" links to /settings/inbox — v1.1
- ✓ Admin Connections tab on user detail page with service-role fetch and remove action — v1.1

<!-- v1.2 Stripe Admin & Shop milestone -->
- ✓ 5 Stripe mirror tables with admin/moderator RLS and webhook idempotency — v1.2
- ✓ Server-only Stripe SDK singleton and webhook endpoint with signature verification — v1.2
- ✓ 15 Stripe event type handlers with idempotent upserts and admin sync — v1.2
- ✓ Shop nav group in AdminShell sidebar (Orders, Products, Coupons, Analytics) — v1.2
- ✓ Products admin: table, CRUD, drag-drop reorder, price change, visibility rules — v1.2
- ✓ Orders admin: filters/search, detail with timeline, refund/cancel actions — v1.2
- ✓ Coupons admin: create/edit, manual assignment, redemption history — v1.2
- ✓ Analytics dashboard: funnel + revenue metrics, role filter, Recharts charts, CSV export — v1.2

<!-- v1.3 Subscriptions & Teacher Upgrade milestone -->
- ✓ Admin/moderator role display fix — never show "Guest" on Subscriptions page — v1.3
- ✓ Subscriptions page with real Stripe data: memberships, designations, school, Customer Portal — v1.3
- ✓ Upgrade CTA for students/WPs with pending state handling — v1.3
- ✓ Multi-step /upgrade page: certificate upload + Stripe delayed capture checkout — v1.3
- ✓ Admin inbox Teacher Upgrades tab with approve/reject workflow — v1.3
- ✓ upgrade_requests and user_designations tables with RLS — v1.3
- ✓ Fixed 3 crashing admin pages (orders, analytics, audit-log) — v1.3

<!-- v1.6 Open Gates REST API milestone -->
- ✓ API key auth with SHA-256 hashing, rate limiting, permission levels — v1.6
- ✓ Users API: list, detail, update, credits/certifications/verifications sub-resources — v1.6
- ✓ Events API: CRUD + registrations with spot tracking — v1.6
- ✓ Courses API: CRUD + enrollments with progress tracking — v1.6
- ✓ Credits API: CRUD + summary aggregation by type — v1.6
- ✓ Verifications API: CRUD over profiles table with auto-sync — v1.6
- ✓ Analytics API: overview, memberships, revenue, engagement, credits — v1.6
- ✓ Add-ons API: CRUD + user assignments — v1.6
- ✓ Admin settings API: list/update with admin-only permission — v1.6
- ✓ Incoming webhooks API: trigger, payment, notify endpoints — v1.6
- ✓ Admin API key management page with create/revoke UI — v1.6
- ✓ API_DOCS.md documenting all 49 endpoints — v1.6

## Current Milestone: v1.7 API Settings Page

**Goal:** Extend `/admin/api-keys` into a three-tab admin interface for own API keys, encrypted third-party secrets, and auto-generated endpoint documentation.

**Target features:**
- Move existing API key management into "Own Keys" tab
- Encrypted secrets manager for third-party API keys (AES-256, Supabase-stored, CRUD with categories)
- Auto-generated endpoint documentation from `/app/api/**` route scanning

### Active

- [ ] Three-tab interface at `/admin/api-keys` (Own Keys, Third Party Keys, Endpoints)
- [ ] Encrypted secrets table in Supabase with admin-only RLS
- [ ] Server-side encryption/decryption service using SECRETS_MASTER_KEY
- [ ] CRUD API routes for secrets management
- [ ] Secrets admin UI with category filter, search, masked values
- [ ] Auto-scanned endpoint documentation (~49 endpoints) grouped by domain
- [ ] SECRETS_MASTER_KEY added to .env.local.example with generation instructions

### Out of Scope

- Notification preferences — out of scope for settings MVP
- Account deletion in settings — high-risk operation, deferred
- Password change in settings — handled via forgot-password flow

## Context

- Next.js 16 App Router, TypeScript, Tailwind CSS 4, Supabase (auth + DB), Vercel
- Settings shell at `app/settings/` uses SettingsShell component mirroring AdminShell
- Profile settings migrated from `app/profile/settings/` → `app/settings/`
- Design tokens live in `globals.css`; UI components in `app/components/ui/`
- Role system: `student`, `teacher`, `wellness_practitioner` (regular), `moderator`, `admin`

## Constraints

- **Tech Stack**: Next.js 16 App Router, Tailwind CSS 4, Supabase SSR — no new frameworks
- **Design**: Follow existing design tokens from `globals.css` and components from `app/components/ui/`; match Admin Settings layout exactly
- **Routing**: Settings live at `app/settings/` — `app/profile/settings/` content has been migrated

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Mirror Admin Settings sidebar pattern | Consistency across admin/user experiences | ✓ SettingsShell mirrors AdminShell — v1.0 |
| `app/settings/` as root route | Clean separation from profile pages | ✓ Implemented — v1.0 |
| Connections + Inbox as placeholders | Scope control — full implementation in v1.1+ | ✓ Polished Coming Soon pages — v1.0 |
| Exact match for General nav item | Avoid General being active on all sub-routes | ✓ `pathname === '/settings'` — v1.0 |
| Separate localStorage key for settings sidebar | Independent collapse state from admin sidebar | ✓ `settings-sidebar-collapsed` — v1.0 |
| No role check in settings layout | Settings is for all authenticated users, unlike admin | ✓ Auth-only guard — v1.0 |
| unique(requester_id, recipient_id) constraint | Prevents duplicate connection requests at DB level | ✓ Enforced — v1.1 |
| ROLE_PAIR_MAP for connect button labels | O(1) role lookup, easily extensible for new role pairs | ✓ ConnectButton — v1.1 |
| Profiles join in ConnectionsContext | Single source of truth, avoids N+1 fetches on pages | ✓ Context load — v1.1 |
| getSupabaseService() for admin connections | RLS restricts to requester/recipient; admin needs service role | ✓ Admin tab — v1.1 |
| URL search param tabs for admin detail | Deep-linkable, server-rendered tab content | ✓ ?tab=connections — v1.1 |
| Supabase as cache, Stripe as source of truth | Write-partitioning prevents webhook loops | ✓ Implemented — v1.2 |
| Async webhook processing via Vercel Cron | Avoid blocking webhook responses for complex side-effects | ✓ pending_cron status + cron route — v1.2 |
| Recharts 3.8.0 locked version | 3.7.x has React 19 blank-chart regression | ✓ Analytics charts — v1.2 |
| Pure computation functions for analytics | Testable, reusable metrics without DB coupling | ✓ 42 unit tests — v1.2 |
| No Stripe API calls on analytics page | Compute from local Supabase tables for speed and rate limit safety | ✓ Analytics page — v1.2 |
| Per-route auth composition for API | middleware.ts excludes /api/ — each handler calls validateApiKey + rateLimit explicitly | ✓ All API routes — v1.6 |
| In-memory rate limiting with sliding window | Simple, no external deps — sufficient for single-instance deployment | ✓ 100/min per key — v1.6 |
| Service layer in lib/api/services/ | Business logic separated from route handlers | ✓ 8 service files — v1.6 |
| Soft-delete for events and courses | Preserve data integrity — deleted_at timestamp pattern | ✓ Events + courses — v1.6 |
| as any cast on Supabase client for API | Tables not in generated types — consistent with existing patterns | ✓ All service files — v1.6 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-27 after v1.7 API Settings Page milestone started*
