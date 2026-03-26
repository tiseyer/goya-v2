# Milestones

## v1.3 Subscriptions & Teacher Upgrade (Shipped: 2026-03-26)

**Phases completed:** 7 phases (14–20), 10 plans, 29 requirements
**Files changed:** 60 | **Lines added:** ~4,800
**Timeline:** 2026-03-24 → 2026-03-26 (3 days)

**Key accomplishments:**

- Subscriptions page with real Stripe data: base membership, additional subs, school membership, designations with soft-delete, Customer Portal ("Verwalten" button)
- Multi-step /upgrade page: info → certificate upload (Supabase Storage) → Stripe delayed capture checkout (capture_method: "manual")
- Admin inbox Teacher Upgrades tab: approve captures payment + creates subscription + changes role; reject cancels payment intent
- Upgrade CTA for students/WPs with pending state handling (hides CTA when request is pending)
- Supabase schema: upgrade_requests and user_designations tables with RLS
- Fixed 3 crashing admin pages (orders pagination, analytics NaN safety, audit-log service role) + admin/moderator role display bug

---

## v1.2 Stripe Admin & Shop (Shipped: 2026-03-24)

**Phases completed:** 6 phases (8–13), 17 plans, 47 tasks
**Files changed:** 90 | **Lines added:** 12,325
**Timeline:** 2026-03-23 → 2026-03-24 (2 days)
**Requirements:** 37/37 satisfied | **Audit:** tech_debt (5 low-severity items)

**Key accomplishments:**

- Supabase DB foundation: 5 Stripe mirror tables + webhook_events idempotency table + bridge columns, all with admin/moderator RLS
- Stripe SDK singleton (server-only) + webhook endpoint with HMAC signature verification + 15 event type handlers with idempotent upserts
- Shop admin section: Products (dnd-kit sortable, CRUD, price immutability, visibility rules), Orders (filters, refund/cancel, event timeline, customer journey), Coupons (create/edit, manual assignment, redemption history)
- Analytics dashboard: funnel + revenue metrics (ARR with subscription dedup), role-split filtering, Recharts charts, CSV export — all from local Supabase tables (zero Stripe API calls at page load)
- Collapsible Shop nav group in AdminShell sidebar with Orders, Products, Coupons, Analytics child links
- 126 unit tests across metrics, CSV, handlers, SDK, and server actions

---

## v1.1 Connections & Inbox (Shipped: 2026-03-24)

**Phases completed:** 4 phases, 8 plans, 12 tasks

**Key accomplishments:**

- Connections table with peer/mentorship/faculty types, RLS either-party policies, and updated_at trigger — migration committed and pushed live to Supabase
- ConnectionsContext rewritten from localStorage to Supabase — bidirectional query, duplicate guard, realtime notifications preserved, Wave 0 tests pass
- Role-aware ConnectButton with ROLE_PAIR_MAP lookup, type-aware pending-sent labels, Button component migration, and 20-test vitest suite covering all PROF requirements
- MemberProfilePage server component wired with viewer profile fetch and school ownership check — all four PROF role-aware ConnectButton props now flow from Supabase to UI
- Tabbed connections management page and inbox with accept/decline, type filter, and notification dropdown linked to /settings/inbox — replacing all "Coming Soon" placeholders
- Admin Connections tab on user detail page with service-role fetch, remove action, and URL-param tab navigation

---

## v1.0 User Settings (Shipped: 2026-03-23)

**Phases completed:** 3 phases, 4 plans, 5 tasks

**Key accomplishments:**

- Role-branched Settings entry added to desktop + mobile dropdowns; Profile Settings and Subscriptions removed
- Collapsible sidebar-navigated settings shell at /settings mirroring AdminShell with 4 routes and auth guard
- Full profile settings form migrated to Settings > General with impersonation-safe server action
- Server-side Subscriptions page (live DB data) + polished Coming Soon placeholders for Connections and Inbox

---
