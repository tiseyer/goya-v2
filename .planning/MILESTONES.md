# Milestones

## v1.18 User Profile Redesign (Shipped: 2026-04-02)

**Phases completed:** 4 phases (47-50), 7 plans
**Files changed:** 17 | **Lines:** +1,679 / -236

**Key accomplishments:**

- Foundation: migration (4 new profile columns + lineage fix), lib/members/ module with privacy helper (deriveProfileVisibility), PUBLIC_PROFILE_COLUMNS, own-profile detection, Promise.all data fetch
- ProfileHero: cover image with dark overlay, 120px avatar with white ring, name, role badge, intro text, location, language pills, action buttons, edit button, completion nudge
- ProfileSidebar: sticky sidebar with membership card, gold designation badges, connect/message buttons, social link icons, quick stats
- Content: ProfileBio, reusable ProfilePillSection, 4-role pill orchestrator (teacher/student/school/wellness), SchoolAffiliation, FacultyGrid, CommunitySection
- Media: ProfileVideo (YouTube facade with thumbnail + play click), ProfileMap (Mapbox GL JS, privacy-gated), events + courses carousels reusing dashboard components
- Privacy: server-side enforcement — no map/address for students or online-only profiles

---

## v1.17 Dashboard Redesign (Shipped: 2026-04-02)

**Phases completed:** 4 phases (43-46), 8 plans
**Files changed:** 28 | **Lines:** +1,388 / -1,953 (net reduction — old feed deleted)

**Key accomplishments:**

- Complete dashboard rebuild: deleted old community feed, rewrote page.tsx as async server component with Promise.all + 4-way role branching (Student, Teacher, School, Wellness Practitioner)
- Data infrastructure: lib/dashboard/queries.ts (5 fetch functions) + profileCompletion.ts (6-field weighted scorer handling JSONB empty arrays)
- 10 shared components: HorizontalCarousel (embla + snap-x), DashboardGreeting, PrimaryActionCard, ProfileCompletionCard, StatHero, TeacherCard, CourseCard, EventCard, ConnectionCard, FacultyCard
- Student dashboard: 3 carousels (teachers, courses, events) with style-tag matching and "Show all →" links
- Teacher + School dashboards: profile completion, stat heroes, CTAs, connections list, "View as School" toggle for school owners with school-specific layout
- Apple/Netflix aesthetic: large white space, minimal color, mobile-first responsive design

---

## v1.16 Admin Color Settings (Shipped: 2026-04-02)

**Phases completed:** 2 phases (41-42), 2 plans, 4 tasks
**Files changed:** 7 | **Lines added:** ~521

**Key accomplishments:**

- ThemeColorProvider server component reads brand_colors, role_colors, and maintenance_indicator_color from site_settings and injects 13 CSS variables on every page via layout.tsx
- ColorsTab admin settings page (361 lines) with 3 sections: Brand Colors (6 pickers), Role Colors (6 pickers), Maintenance Indicator (1 picker)
- Instant CSS variable preview on every color change before saving, with per-color reset and global Reset All
- Colors sidebar entry in admin Settings group linking to /admin/settings?tab=colors

---

## v1.14 School Owner System (Shipped: 2026-03-31)

**Phases completed:** 8 phases, 16 plans, 24 tasks

**Key accomplishments:**

- Database foundation: schools table extended with 21 columns, 3 new tables (school_designations, school_faculty, school_verification_documents), profiles extended, 15 RLS policies, TypeScript types regenerated
- School registration wizard at /schools/create: name/slug entry, 8 designation cards with EUR pricing, Stripe Checkout (subscription + signup fee), post-payment school creation via webhook
- 9-step school onboarding flow: basic info, online presence, video intro, teaching info, Google Places location, per-designation document uploads, faculty management, review & submit
- School Settings area at /schools/[slug]/settings: 8-section sidebar (General, Online Presence, Teaching Info, Location, Faculty, Designations, Documents, Subscription), name/slug re-review trigger, pending_review status banner
- Admin school management: inbox tab with designation badges and approve/reject workflow, school detail/review page with signed document URLs, approval/rejection emails via Resend
- Public school profile at /schools/[slug] with GOYA blue hero, designation badges, 2-column body, faculty section with member profile links; member directory school filter with SchoolCard component
- Faculty invitation system: Resend email invites for non-members, /register?school=[slug]&invite=[token] links, auto-link on registration (email/password and OAuth)
- Teacher entry points: dashboard sidebar widget, subscriptions callout, add-ons banner — all role-gated to teachers without a school

---

## v1.10 Member Courses (Shipped: 2026-03-31)

**Phases completed:** 6 phases (22-27), 31 requirements

**Key accomplishments:**

- Database foundation: course_type, created_by, status workflow (draft→pending→published/rejected), course_audit_log table, RLS per role, soft-delete
- Admin courses list: type badge (GOYA/Member), type filter, submitter info, extended status filter, soft-delete with restore, audit history timeline
- Admin inbox Courses tab: pending review queue with approve/reject workflow, rejection reason modal, badge count
- My Courses settings page: role-gated course CRUD for teachers/WPs/admins, status-aware actions, first-time info modal, inline create/edit form with gradient preview
- Public academy page: type filter (All/GOYA/Member), published-only enforcement
- Shared audit utility at lib/courses/audit.ts wired to all 10 course-changing code paths

---

## v1.9 Member Events (Shipped: 2026-03-31)

**Phases completed:** 6 phases (16-21), 31 requirements

**Key accomplishments:**

- Database foundation: event_type, created_by, status workflow (draft→pending→published/rejected), event_audit_log table, RLS per role
- Admin events list: type badge (GOYA/Member), type filter, submitter info for member events, extended status filter, audit history timeline
- Admin inbox Events tab (Tab 6): pending review queue with approve/reject workflow, rejection reason modal, badge count
- My Events settings page: role-gated event CRUD for teachers/WPs/admins, status-aware actions, first-time info modal, inline create/edit form
- Public events page: type filter (All/GOYA/Member) in sidebar and mobile, published-only enforcement
- Shared audit utility at lib/events/audit.ts wired to all 10 event-changing code paths

---

## v1.8 AI-Support-System (Shipped: 2026-03-30)

**Phases completed:** 4 phases, 12 plans, 4 tasks

**Key accomplishments:**

- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- One-liner:
- Status:
- 6 server actions + enabled_tools migration + daily cron cleanup for AI chatbot admin backend
- 5 new admin UI components completing Conversations, API Connections, and Support Tickets tabs
- Status:

---

## v1.7 API Settings Page (Shipped: 2026-03-27)

**Phases completed:** 3 phases (9-11), 4 plans, 19 requirements

**Key accomplishments:**

- Three-tab admin interface at `/admin/api-keys` (Own Keys, Third Party Keys, Endpoints)
- AES-256-GCM encrypted secrets manager with admin-only RLS, category filter, search, CRUD modals
- Auto-generated endpoint documentation tab displaying 52 API endpoints across 10 domain categories
- SECRETS_MASTER_KEY env var with server-side encryption service (lib/secrets/encryption.ts)
- 8 pre-populated placeholder entries for known third-party keys (Google OAuth, GA4, Clarity, Meta Pixel, Anthropic)

---

## v1.6 Open Gates (Shipped: 2026-03-27)

**Phases completed:** 8 phases, 20 plans, 27 tasks

**Key accomplishments:**

- One-liner:
- One-liner:
- One-liner:
- One-liner:
- lib/api/services/users.ts
- lib/api/services/users.ts (additions)
- Five-endpoint events API with paginated list (5 filters), create/update/delete with field validation, soft-delete via deleted_at, and audit logging on all write operations
- One-liner:
- Five-endpoint courses REST API with soft-delete support: migration, service layer, and route handlers following Phase 03 events pattern
- Enrollment sub-resources for courses: list, enroll with duplicate detection, and progress update with auto-completed_at timestamps against user_course_progress table
- 5 credits REST endpoints (list/create/detail/update-status/summary) with paginated filtering, field allowlist PATCH, and per-user approved-credit aggregation by type
- 5-endpoint verifications REST API over profiles table with is_verified auto-sync and audit logging for all write operations
- Three analytics REST endpoints wrapping computeFunnelMetrics + computeRevenueMetrics from local Supabase tables — no Stripe API calls, with auto time-series granularity selection
- Parallel-query engagement analytics (events/registrations/courses/enrollments) and credit submission statistics aggregated in JS, exposed via two authenticated GET endpoints with date filtering
- One-liner:
- One-liner:
- Admin settings CRUD over REST API — four endpoints reading/writing site_settings table, all enforcing admin permission with audit logging on writes
- Three incoming webhook POST endpoints (trigger, payment, notify) with typed validation, console logging, and audit trail — integration points for external automation tools like Make.com
- Admin CRUD UI for API keys with one-time raw key display, optimistic revoke, and usage stats table.
- Comprehensive API_DOCS.md (1958 lines, 49 endpoints, 10 resource categories) with auth, rate limiting, full request/response examples for every route in Phases 1-7

---

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
