# GOYA v2

## What This Is

GOYA v2 is a professional community platform for yoga and wellness practitioners — teachers, students, and wellness practitioners. Members can connect with peers, attend events, complete CPD-accredited courses, track credits, and manage their professional profile and subscriptions through a unified settings section. Admins manage the community through a full-featured admin panel.

## Core Value

Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## Active Milestones

### v1.1 Connections & Inbox (`connections-inbox` workstream)

**Goal:** Replace the localStorage-backed connection system with a real Supabase backend and build the full Connections & Inbox UX.

**Target features:**
- DB layer: connections table with types (peer/mentorship/faculty), RLS policies, migrations
- Wire ConnectButton + ConnectionsContext to real Supabase (replace localStorage)
- ✅ Role-aware profile buttons: Request Mentorship (student→teacher), Apply as Faculty (teacher→school), Manage School (school owner) — Validated in Phase 05: profile-page-buttons
- Settings > Connections: tabbed view (My Connections, My Mentors, My Mentees, My Faculty, My Schools) with status + remove actions
- Settings > Inbox: full connection request inbox (accept/decline, filter by type); header "View all" links here
- Admin > User detail: Connections tab to view/manage any user's connections

### v1.2 Stripe Admin & Shop (`stripe-admin` workstream)

**Goal:** Build a full bidirectional Stripe sync and Shop admin section with Products, Orders, Coupons, and Analytics.

**Target features:**
- DB foundation: 5 Supabase tables mirroring Stripe entities (products, prices, orders, coupons, redemptions) + GOYA-specific fields
- Webhook processing: 12+ Stripe event types with reliable retry logic
- AdminShell "Shop" nav dropdown: Orders, Products, Coupons, Analytics
- Shop > Products: table, CRUD, drag-and-drop ordering, bulk actions, visibility logic (show/hide by owned products)
- Shop > Orders: Stripe payment intents & subscriptions view, refund/cancel, timeline, customer journey
- Shop > Coupons: create/manage, manual user assignment, usage history, bidirectional Stripe sync
- Shop > Analytics: user funnel + revenue metrics (ARR), split by role, CSV export, interactive charts

## Current State

**As of v1.0 (2026-03-23):** User Settings milestone shipped. Settings are now accessible from the profile dropdown for all user types via a sidebar-navigated shell at `/settings`, with General (profile form), Subscriptions (live membership data), Connections (placeholder), and Inbox (placeholder) pages.

**Phase 09 complete (2026-03-23):** Stripe SDK infrastructure in place — server-only singleton at `lib/stripe/client.ts` and webhook route handler at `app/api/webhooks/stripe/route.ts` with HMAC signature verification. 7 unit tests passing.

**Phase 10 complete (2026-03-24):** All 15 Stripe event types handled with idempotent upserts. 6 handler files, dispatch switch with 23505 dedup, Vercel Cron for deferred events (`*/5 * * * *`), and admin sync endpoint with cursor pagination. 47 unit tests passing.

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
- ✓ Settings > Inbox is a placeholder page — v1.0

### Active

<!-- v1.1 Connections & Inbox milestone -->

### Out of Scope

- Connections settings implementation — in progress in v1.1
- Inbox settings implementation — in progress in v1.1
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

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-24 — Phase 10 complete: webhook handlers + initial sync (47 tests)*
