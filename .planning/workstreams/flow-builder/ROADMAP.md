# Roadmap: Flow Builder v1.0

## Overview

Build the complete flow builder system from database schema through admin editor, user-facing player, actions engine, analytics, and onboarding migration. Phases follow a strict dependency chain: schema first, then the service layer that all UI depends on, then admin builder (content creation), then the flow engine (user-facing evaluation and actions), then the player UI, then analytics, then onboarding migration last (highest risk, touches production paths). All 44 v1 requirements are mapped.

## Phases

- [ ] **Phase 1: Database Schema** — 5 tables, RLS policies, GIN index, JSONB versioning, birthday column
- [ ] **Phase 2: Service Layer + Admin API Routes** — Admin CRUD services, condition evaluator stub, cycle detection, Kit.com integration wrapper
- [ ] **Phase 3: Admin Flow Builder UI** — Flow list page, three-panel editor, drag-drop, conditions builder, preview mode
- [ ] **Phase 4: Flow Engine + Actions Engine** — Server-side condition evaluation, all 5 action types, idempotency table, user API routes
- [ ] **Phase 5: Flow Player UI** — All 5 display types, element renderers, Typeform-style choices, progress persistence, global mount
- [ ] **Phase 6: Analytics + User Management** — Event recording, analytics dashboard, per-user flow admin on user edit page
- [ ] **Phase 7: Onboarding Migration** — 3 seed templates, phased cutover, hardcoded onboarding removal

## Phase Details

### Phase 1: Database Schema
**Goal**: All flow data structures exist in Supabase with correct constraints, indexes, and access policies — no data model decisions need to be revisited
**Depends on**: Nothing (first phase)
**Requirements**: SCHEMA-01, SCHEMA-02, SCHEMA-03, SCHEMA-04, SCHEMA-05, SCHEMA-06, SCHEMA-07
**Success Criteria** (what must be TRUE):
  1. Admin can create a flow record with all required fields (name, description, status, priority, display type, trigger, frequency, conditions) via Supabase directly
  2. Flow steps with jsonb `elements` arrays and branches can be inserted and queried without data loss
  3. User responses and per-element answers can be stored and retrieved with start/complete timestamps and last-step resumability
  4. Analytics events (shown, started, step_completed, completed, skipped, dismissed) can be recorded against user and step references
  5. RLS policies block non-admin users from writing flow or step records, and users can only read/write their own flow_responses
**Plans:** 2 plans
Plans:
- [ ] 01-01-PLAN.md — Core tables, indexes, birthday column, and triggers (SCHEMA-01 through SCHEMA-06)
- [ ] 01-02-PLAN.md — RLS policies for all 5 flow tables (SCHEMA-07)

### Phase 2: Service Layer + Admin API Routes
**Goal**: All admin flow operations are available as tested API endpoints — the UI can be built against stable, validated contracts
**Depends on**: Phase 1
**Requirements**: None (API foundation consumed by Phase 3 ADMIN requirements)
**Success Criteria** (what must be TRUE):
  1. Admin can create, read, update, and delete flows and steps via `POST/GET/PATCH/DELETE /api/admin/flows/` routes
  2. Saving a flow with a branch cycle returns HTTP 422 with a cycle-detected error message
  3. Kit.com tag endpoint is callable and returns graceful fallback response when `KITCOM_API_KEY` is absent
  4. All admin routes reject unauthenticated requests and non-admin/moderator sessions
**Plans**: TBD

### Phase 3: Admin Flow Builder UI
**Goal**: Admins can create, configure, and preview any flow entirely from the admin panel without writing code
**Depends on**: Phase 2
**Requirements**: ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06, ADMIN-07, ADMIN-08, ADMIN-09, ADMIN-10, ADMIN-11, ADMIN-12, ADMIN-13, ADMIN-14, ADMIN-15
**Success Criteria** (what must be TRUE):
  1. Admin can view all flows in a tabbed list (Active, Draft, Paused, Archived, Templates) with status badges, condition summaries, and completion stats
  2. Admin can drag-and-drop flows to reorder priority and use create, duplicate, pause/activate, and archive actions from the list page
  3. Admin can open a flow in the three-panel editor, add and reorder steps in the sidebar, add elements to a step from a type picker, and configure element properties including profile field mapping
  4. Admin can enable branching on single_choice elements and assign a target step per answer option
  5. Admin can configure step-level actions and flow-level settings (display type, trigger, frequency, conditions) via the chip-based conditions builder
  6. Admin can enter preview mode and see the flow rendered as a user would, with all display types, navigation, and no data saved
**Plans**: TBD
**UI hint**: yes

### Phase 4: Flow Engine + Actions Engine
**Goal**: The server correctly identifies which flow a user should see, records their responses step by step, and executes all configured actions without duplication
**Depends on**: Phase 2
**Requirements**: PLAYER-09, ACTION-01, ACTION-02, ACTION-03, ACTION-04, ACTION-05
**Success Criteria** (what must be TRUE):
  1. `GET /api/flows/active` returns the highest-priority flow whose conditions match the current user — conditions are evaluated server-side and the `conditions` JSONB is never included in the response payload
  2. Submitting a step response via `POST /api/flows/[id]/respond` records the answer, advances the user's position, and executes all configured step actions
  3. Navigating back and forward through steps does not re-fire actions (idempotency table prevents duplicate emails, Stripe charges, and Kit.com tags)
  4. `save_to_profile` correctly upserts mapped element values to the profiles table
  5. `stripe_checkout` creates a Stripe checkout session; `kit_tag` posts to Kit.com with graceful fallback; `trigger_flow` queues the next flow for the user
**Plans**: TBD

### Phase 5: Flow Player UI
**Goal**: Users see the correct flow on authenticated pages, rendered in the right display type with full navigation and persistence
**Depends on**: Phase 4
**Requirements**: PLAYER-01, PLAYER-02, PLAYER-03, PLAYER-04, PLAYER-05, PLAYER-06, PLAYER-07, PLAYER-08
**Success Criteria** (what must be TRUE):
  1. Active flows appear in the correct display type: modal (with optional dismiss), fullscreen (no dismiss), top/bottom banner (fixed bar with CTA and close), or notification (slide-in from top-right)
  2. Modal and fullscreen flows show a progress bar, back/next navigation, and block step advancement when required fields are empty
  3. Choice elements render as Typeform-style pill/card buttons — not native radio or checkbox inputs
  4. All element types render correctly: text inputs, dropdowns, image upload, info text blocks, images, and video embeds
  5. Closing the browser and reopening resumes the flow from the last completed step — progress is not lost on refresh
**Plans**: TBD
**UI hint**: yes

### Phase 6: Analytics + User Management
**Goal**: Admins can measure flow performance and control any user's flow state without needing a developer
**Depends on**: Phase 4
**Requirements**: ANALYTICS-01, ANALYTICS-02, ANALYTICS-03, USERMGMT-01, USERMGMT-02, USERMGMT-03
**Success Criteria** (what must be TRUE):
  1. Admin can view per-flow analytics showing shown, started, completed, skipped, and dismissed counts plus completion rate
  2. Admin can see a step drop-off chart that shows how many users reached each step of a flow
  3. Analytics can be filtered by time range (today, yesterday, this week, this month, this year, custom range)
  4. Admin can view a user's flow interactions (status, started_at, completed_at) on the user edit page
  5. Admin can reset a user's flow response to force re-display, or force-assign a flow to a user as complete
**Plans**: TBD
**UI hint**: yes

### Phase 7: Onboarding Migration
**Goal**: All new users go through the flow player for onboarding and the hardcoded onboarding system is fully removed — no in-progress users are disrupted
**Depends on**: Phase 5, Phase 6
**Requirements**: MIGRATE-01, MIGRATE-02, MIGRATE-03
**Success Criteria** (what must be TRUE):
  1. Three flow templates exist in the database (Student, Teacher, Wellness Practitioner) with all existing onboarding questions mapped to flow elements, correct profile field mappings, role conditions, login trigger, once frequency, and non-dismissible modal display
  2. New users who register are shown the correct onboarding flow via the flow player — the hardcoded `app/onboarding/` route is not triggered for new accounts
  3. The hardcoded onboarding routes (`app/onboarding/`), middleware redirects, and role-branched wizard pages are fully removed from the codebase with no 404s or broken references
**Plans**: TBD

## Progress

**Execution Order:** Phases 1 → 2 → 3 → 4 → 5 → 6 → 7 (Phase 3 and Phase 4 can proceed in parallel once Phase 2 is complete)

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Schema | 0/2 | Planning complete | - |
| 2. Service Layer + Admin API Routes | 0/? | Not started | - |
| 3. Admin Flow Builder UI | 0/? | Not started | - |
| 4. Flow Engine + Actions Engine | 0/? | Not started | - |
| 5. Flow Player UI | 0/? | Not started | - |
| 6. Analytics + User Management | 0/? | Not started | - |
| 7. Onboarding Migration | 0/? | Not started | - |
