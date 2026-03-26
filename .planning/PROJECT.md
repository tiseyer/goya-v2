# GOYA v2

## What This Is

GOYA v2 is a professional community platform for yoga and wellness practitioners — teachers, students, and wellness practitioners. Members can connect with peers, attend events, complete CPD-accredited courses, track credits, and manage their professional profile and subscriptions through a unified settings section. Admins manage the community through a full-featured admin panel with a comprehensive Shop section for products, orders, coupons, and analytics powered by bidirectional Stripe integration.

## Core Value

Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## Current State

**As of v1.3 (2026-03-26):** Subscriptions & Teacher Upgrade milestone shipped. Live Stripe integration on Subscriptions page (memberships, designations with soft-delete, Customer Portal). Multi-step teacher upgrade flow with certificate upload, Stripe delayed capture, and admin approve/reject inbox. Fixed 3 crashing admin pages.
- Supabase schema: upgrade_requests, user_designations tables
- Fix 3 crashing admin pages (/admin/shop/orders, /admin/shop/analytics, /admin/audit-log) + add Create Product button

## Current State

**As of v1.2 (2026-03-24):** Stripe Admin & Shop milestone shipped. Full bidirectional Stripe integration with 5 mirror tables, webhook processing for 15 event types, and complete Shop admin section:
- **Products**: dnd-kit sortable table, CRUD with Stripe sync, price immutability handling, visibility rules (show-to/don't-show-to)
- **Orders**: filters/search/bulk actions, detail with event timeline, refund (full/partial), subscription cancel (schedule/immediate), customer journey
- **Coupons**: create/edit with Stripe sync, manual assignment, role/product restrictions, redemption history
- **Analytics**: funnel + revenue metrics (ARR with subscription dedup), role-split filtering, Recharts charts, CSV export — all from local Supabase tables
- 126 unit tests, 37/37 requirements satisfied

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

### Active

(No active milestone — next milestone to be defined)

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

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-26 after v1.3 milestone*
