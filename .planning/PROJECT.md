# GOYA v2

## What This Is

GOYA v2 is a professional community platform for yoga and wellness practitioners — teachers, students, and wellness practitioners. Members can connect with peers, attend events, complete CPD-accredited courses, track credits, and manage their professional profile and subscriptions through a unified settings section. Teachers can register their yoga school on GOYA with designation-based Stripe subscriptions, complete a 9-step onboarding flow, and manage their school through a dedicated settings area — schools go live after admin verification with a public profile page and member directory integration. Members and visitors can chat with Mattea, an AI-powered support chatbot that answers questions using FAQ knowledge and platform data, with automatic escalation to human support. Admins manage the community through a full-featured admin panel with a comprehensive Shop section, chatbot configuration, FAQ management, conversation review, support ticket handling, and school registration review. External services can programmatically access and manage all entities through a secure, documented REST API.

## Core Value

Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## Current State

**As of v1.14 (2026-03-31):** School Owner System milestone shipped. Teachers can register their yoga school on GOYA: select designations → pay via Stripe (€40/year + €99 signup per designation) → complete 9-step onboarding → admin review → public school profile. Schools have a dedicated settings area, admin inbox approve/reject workflow with Resend emails, public profile at /schools/[slug] with designation badges, and faculty invitation system with auto-link on registration.

**Previous v1.10 (2026-03-31):** Member Courses milestone shipped. Teachers, WPs, and admins can submit courses via My Courses settings page. Courses go through draft→pending_review→published/rejected workflow. Admin inbox has Courses tab for approve/reject. Public academy has GOYA/Member type filter. Full audit logging via shared utility covering all 10 code paths.

**Previous v1.9 (2026-03-31):** Member Events milestone shipped. Teachers, wellness practitioners, and admins can submit events via My Events settings page. Events go through draft→pending_review→published/rejected workflow. Admin inbox has Events tab for approve/reject. Public calendar has GOYA/Member type filter. Full audit logging via shared utility covering all 10 code paths.

**Previous v1.8 (2026-03-30):** AI-Support-System milestone shipped. Mattea AI chatbot with streaming responses (OpenAI/Anthropic), encrypted third-party key management (AES-256-GCM), FAQ knowledge base with admin CRUD, floating chat widget on all public pages (380x560px desktop, fullscreen mobile), guest and authenticated session persistence, escalation-to-human workflow with support tickets in admin inbox, conversations viewer, and toggleable API tool connections. Admin chatbot configuration at `/admin/chatbot` with 4 tabs. Guest session cleanup via daily cron.

Previous: v1.6 Open Gates REST API, v1.3 Subscriptions & Teacher Upgrade, v1.2 Stripe Admin & Shop, v1.1 Connections & Inbox, v1.0 User Settings.

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

<!-- v1.8 AI-Support-System milestone -->
- ✓ Encrypted secrets with AES-256-GCM, AI Providers CRUD with provider/model selection — v1.8
- ✓ General third-party keys CRUD with category filter (Auth, Analytics, Payments, Other) — v1.8
- ✓ Floating chat widget on public pages (380x560px desktop, fullscreen mobile) — v1.8
- ✓ Chat persistence for logged-in users (user_id) and guests (anonymous cookie ID) — v1.8
- ✓ Guest chat expiry with configurable retention and daily cleanup cron — v1.8
- ✓ Admin chatbot config at /admin/chatbot: name, avatar, active toggle, AI key selector, system prompt — v1.8
- ✓ FAQ knowledge base with CRUD, published/draft status, inline editing — v1.8
- ✓ Conversations viewer with filters (all/logged-in/guests/escalated) — v1.8
- ✓ API Connections tab with toggleable tools (Events, Teachers, Courses, FAQ) — v1.8
- ✓ Support tickets tab in admin inbox with escalation from chatbot — v1.8
- ✓ AI backend route with OpenAI/Anthropic streaming, FAQ context injection — v1.8
- ✓ Escalation detection (keyword, repeated failures) with support ticket creation — v1.8
- ✓ Rate limiting for chatbot API (20 messages/session/hour) — v1.8

<!-- v1.9 Member Events milestone -->
- ✓ Events table extended with event_type, created_by, status workflow, rejection_reason — v1.9
- ✓ event_audit_log table with full lifecycle tracking — v1.9
- ✓ RLS policies: member insert/read/update own events, moderator approve/reject, admin full access — v1.9
- ✓ Admin events table: type badge, type filter, submitter info, extended status filter — v1.9
- ✓ Admin event edit page: audit history timeline (admin only) — v1.9
- ✓ Admin inbox Events tab with pending review queue, approve/reject workflow, badge count — v1.9
- ✓ My Events settings page: role-gated CRUD for teachers/WPs/admins with submission workflow — v1.9
- ✓ Public events page type filter: All/GOYA/Member with published-only enforcement — v1.9
- ✓ Shared audit utility (lib/events/audit.ts) covering all 10 event-changing code paths — v1.9

<!-- v1.10 Member Courses milestone -->
- ✓ Courses table extended with course_type, created_by, status workflow, rejection_reason, deleted_at — v1.10
- ✓ course_audit_log table with full lifecycle tracking — v1.10
- ✓ RLS policies: member insert/read/update own courses, moderator approve/reject, admin full access — v1.10
- ✓ Admin courses table: type badge, type filter, submitter info, extended status filter, soft-delete + restore — v1.10
- ✓ Admin course edit page: audit history timeline (admin only) — v1.10
- ✓ Admin inbox Courses tab with pending review queue, approve/reject workflow, badge count — v1.10
- ✓ My Courses settings page: role-gated CRUD for teachers/WPs/admins with submission workflow — v1.10
- ✓ Public academy page type filter: All/GOYA/Member with published-only enforcement — v1.10
- ✓ Shared audit utility (lib/courses/audit.ts) covering all 10 course-changing code paths — v1.10

<!-- v1.14 School Owner System milestone -->
- ✓ Schools table extended with 21 columns, 3 new tables, profiles extended, 15 RLS policies — v1.14
- ✓ Teacher entry points: dashboard widget, subscriptions callout, add-ons banner for school registration — v1.14
- ✓ School registration wizard: name/slug, 8 designation cards with EUR pricing, Stripe Checkout — v1.14
- ✓ 9-step school onboarding flow: bio, presence, video, teaching info, location, documents, faculty, review — v1.14
- ✓ School Settings at /schools/[slug]/settings: 8-section sidebar with all CRUD operations — v1.14
- ✓ Admin school management: inbox tab with designations, detail/review page, approve/reject with emails — v1.14
- ✓ Public school profile at /schools/[slug] with hero, designation badges, faculty, directory integration — v1.14
- ✓ Faculty invitation system: Resend email invites, auto-link on registration — v1.14

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
| AES-256-GCM for third-party key encryption | Industry-standard authenticated encryption, Node.js crypto built-in | ✓ lib/secrets/encryption.ts — v1.8 |
| Direct OpenAI/Anthropic SDKs (not AI Gateway) | Admin controls own keys, no gateway dependency | ✓ chat-service.ts — v1.8 |
| UUID cookie for guest chat sessions | Simple, no Supabase anon auth needed | ✓ goya_chat_session cookie — v1.8 |
| FAQ as XML block in system prompt (not pgvector RAG) | Simple concatenation sufficient for <100 items | ✓ FAQ injection — v1.8 |
| In-memory rate limiter for chatbot | Matches REST API pattern, sufficient for single-instance | ✓ 20/session/hour — v1.8 |
| Single-row chatbot_config table | Upsert pattern, all config in one place | ✓ chatbot_config — v1.8 |

## Parallel Workstream: v1.11 Media Library

**Workstream:** `media-library` (runs in parallel to v1.10 Member Courses)
**Goal:** Central media management system — every file uploaded anywhere on the platform gets tracked in `media_items`, with a full admin library and a read-only member view.

**Target features:**
- Database schema: media_items, media_folders tables with role-based RLS
- Instrument all existing upload flows (avatars, events, certificates, schools, chatbot, feed) to write to media_items
- Admin Media Library: three-panel layout (folder tree, grid/list, detail panel) with upload, search, filters
- Member Media page in Settings: read-only view of own uploads
- Folder management for admins/mods (create, rename, reorder, delete)
- Search, skeleton states, animations, mobile responsiveness

**Artifacts:** `.planning/workstreams/media-library/`

## Parallel Workstream: v1.12 Documentation System

**Workstream:** `documentation-system`
**Goal:** Comprehensive documentation system with Markdown files as single source of truth, admin 3-column viewer, role-filtered user help viewer, full-text search, Mattea chatbot integration with role-scoped doc access, and automatic update rules in CLAUDE.md.

**Target features:**
- Markdown documentation files covering all features by audience (admin, moderator, teacher, student, developer)
- Admin documentation viewer at `/admin/docs` — 3-column layout (filtered nav, content, on-page TOC)
- User-facing help viewer at `/settings/help` with role-filtered content
- Full-text client-side search with JSON index and Cmd+K modal
- Mattea chatbot enhanced with role-scoped documentation context injection
- CLAUDE.md automation rules for keeping docs current after every task

**Artifacts:** `.planning/workstreams/documentation-system/`

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each milestone** (via `/gsd:complete-milestone`):
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---
*Last updated: 2026-03-31 after v1.14 School Owner System milestone shipped*
