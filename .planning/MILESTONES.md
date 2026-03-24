# Milestones

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
