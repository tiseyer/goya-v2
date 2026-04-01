# Research Summary — Flow Builder

**Project:** GOYA v2 Flow Builder
**Domain:** In-app interactive flow engine (onboarding wizards, surveys, announcements, banners)
**Researched:** 2026-03-27
**Confidence:** HIGH

---

## Executive Summary

The GOYA flow builder is a self-contained dynamic flow engine layered onto the existing Next.js 16 + Supabase platform. It replaces hardcoded onboarding routes with a data-driven system where admins create multi-step flows (text inputs, choices, ratings), configure when they appear (conditions + triggers), how they appear (5 display types: modal, fullscreen, banner, notification, slideout), and what happens when users complete them (actions: save to profile, redirect, send email). Reference products are Typeform (element UX), Appcues/Userflow (display types, conditions), and Formsort (condition operators and branching logic). The correct architecture is five independent subsystems — Schema, Admin Builder, Flow Player, Actions Engine, Analytics — with no circular dependencies, built in that order.

The recommended approach adds exactly 4 new packages to the existing stack (`zustand`, `zod`, `react-hook-form + @hookform/resolvers`, `motion`). The existing `@dnd-kit/*` handles all drag-drop in the admin editor. JSONB is correct for step elements and conditions — it is schema-flexible and data-driven — but requires a `schema_version` field from day one and a GIN index on the conditions column to avoid full table scans on every page load. The flow player mounts globally via `ClientProviders.tsx` and queries the server-side condition evaluator on each page load; conditions are always evaluated server-side and never exposed to the client.

The two highest risks are (1) JSONB schema drift without a version field causing silent data corruption after any element type change, and (2) the onboarding migration in the final phase breaking users who are mid-progress on the old hardcoded routes. Both are fully preventable with upfront discipline: add `schema_version: 1` to every JSONB object at schema creation, and run the migration in phases — new users first, old routes behind a flag until all in-progress users have finished.

---

## Key Findings

### Recommended Stack

The existing stack already includes everything needed for drag-drop (`@dnd-kit/*`), styling (`tailwindcss`), charts (`recharts`), auth (`@supabase/ssr`, `@supabase/supabase-js`), and icons (`lucide-react`). No upgrades needed to any existing package. Four new packages are required:

**New dependencies to install:**
```bash
npm install zustand zod react-hook-form @hookform/resolvers motion
```

**Core technologies:**
- `zustand@^5.0.12` — shared editor state (selected step, canvas history, unsaved flag) across deeply nested admin builder components; 1.2KB, no boilerplate, works with React 19
- `zod@^4.3.6` — runtime validation of JSONB element shapes at API boundary; also validates condition schemas in the evaluator; Zod 4 is 57% smaller than v3
- `react-hook-form@^7.72.0` + `@hookform/resolvers@^5.2.2` — element properties panel forms; avoids per-keystroke re-renders; auto-detects Zod v4
- `motion@^12.x` — exit animations for flow player display types; `AnimatePresence` is the only reliable way to animate React component unmounting; scoped to player only, not admin builder

**Do not add:** `react-flow/xyflow` (node graph, wrong shape for sequential flows), `shadcn/ui` or `@radix-ui/*` (creates parallel component system), `react-beautiful-dnd` (deprecated), `react-query` (unnecessary — player data fetched once SSR, admin saves on explicit action).

See [STACK.md](./STACK.md) for full rationale.

---

### Expected Features

The MVP scope is well-defined based on Typeform, Appcues, Userflow, and Formsort analysis.

**Must have (table stakes) — v1.0:**
- Multi-step sequential flows with linear navigation
- Element types: `statement`, `short_text`, `long_text`, `single_choice`, `multiple_choice`, `yes_no`, `rating`
- All 5 display types: `fullscreen`, `modal`, `slideout`, `banner`, `notification`
- Triggers: `page_load`, `login`, `delay`, `manual`
- Conditions: `user_role`, `onboarding_completed`, `flow_not_completed`, `page_url`
- Actions: `save_to_profile`, `redirect_url`, `mark_onboarding_complete`, `dismiss_flow`
- Per-user response storage + completion tracking ("don't show again")
- Flow active/inactive toggle
- Admin preview mode
- Analytics: completion rate, step drop-off, response distribution

**Should have (differentiators) — include in v1.0:**
- Conditional branching (answer-based step routing) — needed for role-selection onboarding
- `profile_incomplete` trigger condition — high-value GOYA-specific use case
- Priority ordering for multiple concurrent flows
- Per-user flow management in admin (reset, skip, force-complete)

**Defer to v2:**
- `picture_choice`, `nps`, `dropdown` element types
- `stripe_checkout` action (redirect_url covers v1.0 case)
- `trigger_flow` action (circular dependency, complex)
- `send_kit_email` action (build last — graceful fallback)
- `scroll`, `exit_intent`, `element_click` triggers
- `subscription_status` condition
- A/B testing, flow versioning, real-time collaboration, i18n, public embed

**Anti-features (never build these into the v1.0 surface):** A/B testing, revision history, webhook-triggered flows, AI-generated questions, video response recording.

See [FEATURES.md](./FEATURES.md) for full element, display, trigger, condition, and action inventories.

---

### Architecture Approach

The flow builder integrates via three modification points in existing files (`AdminShell.tsx` NAV_ITEMS, `ClientProviders.tsx` provider wrapper, `app/onboarding/layout.tsx` redirect check in Phase 7 only) and is otherwise entirely new files. All condition evaluation runs server-side in Route Handlers — never in Client Components. The flow player mounts globally so it can appear on any authenticated page.

**Major components:**
1. **Database schema** (5 tables) — `flows`, `flow_steps`, `flow_responses`, `flow_completions`, `flow_events`; all JSONB with `schema_version`; GIN index on conditions; partial unique index on `(user_id, flow_id) WHERE status = 'in_progress'`
2. **Service layer** — `lib/api/services/flows.ts` (admin CRUD), `lib/api/services/flow-engine.ts` (condition evaluation, response recording, actions dispatch), `lib/integrations/kitcom.ts`
3. **Admin Builder UI** — `app/admin/flows/` pages + `FlowBuilderCanvas` (dnd-kit), `StepEditor`, `ConditionsBuilder`, `FlowPreview`; Zustand store manages editor state
4. **Flow Player** — `FlowPlayerProvider` (mounted in ClientProviders), `FlowPlayer`, 5 display components, element components; Motion handles enter/exit animations
5. **Analytics** — `flow_events` recording in respond handler, analytics service, admin dashboard page (reuses Recharts)

**Build order (strict dependency chain):** Schema (Phase 1) → Service Layer + Admin API Routes (Phase 2) → Admin Builder UI (Phase 3) → Flow Engine + User API Routes (Phase 4) → Flow Player UI (Phase 5) → Analytics (Phase 6) → Onboarding Migration (Phase 7). Phases 3 and 5 can run in parallel once Phase 2 is complete.

See [ARCHITECTURE.md](./ARCHITECTURE.md) for full component inventory, data flow diagrams, and modification table.

---

### Critical Pitfalls

1. **JSONB without `schema_version` field** — any element type change silently breaks old records; add `schema_version: 1` to all JSONB objects in Phase 1, never skip; write a `migrateElement(raw)` function that upgrades shapes at read time

2. **No GIN index on `flows.conditions`** — condition evaluator queries all active flows on every page load; without the index this becomes a full table scan at 100+ flows; add `CREATE INDEX flows_conditions_gin ON flows USING GIN (conditions)` in the Phase 1 migration

3. **Actions firing on step re-visit (duplicate emails, Stripe charges)** — when users navigate back and forward, step completion events fire twice; create a `flow_action_executions` table with `(flow_run_id, step_id, action_type)` unique key and check it before every action dispatch; use deterministic Stripe idempotency keys

4. **Onboarding migration breaking mid-progress users** — don't remove `app/onboarding/` routes in the same deploy; Phase 7 must be phased: new users to flow player first, old routes behind a feature flag, query `onboarding_status = 'in_progress'` before removing old routes

5. **Branch logic infinite loops** — admin can accidentally create a cycle; implement DFS cycle detection in the save API (`POST /api/admin/flows/:id` rejects graphs with cycles with HTTP 422); add a 200-step traversal limit in the player as a safety net

**Also watch for:** dnd-kit touch/scroll conflict on tablet (use dedicated drag handle with `touch-action: none`, `TouchSensor` with 250ms activation delay); flow player state lost on browser refresh (persist to `flow_runs` at each step completion, not just on finish); conditions JSONB leaking to client (never return `flows.conditions` in player API responses); z-index conflicts between flow player overlays and AdminShell (use `ReactDOM.createPortal` for modal/fullscreen display types).

See [PITFALLS.md](./PITFALLS.md) for full pitfall list with phase warnings table.

---

## Implications for Roadmap

Based on research, the architecture's strict dependency chain maps directly to 7 phases:

### Phase 1: Database Schema
**Rationale:** Everything else depends on the schema. Zero app code can be written until tables exist. Schema decisions (JSONB versioning, GIN index, partial unique index) are hard to add retroactively.
**Delivers:** 5 tables with RLS, indexes, and JSONB versioning foundation
**Avoids:** Pitfalls 1 (JSONB schema version), 2 (GIN index), 9 (concurrent run unique index)
**Research flag:** Standard Supabase migration pattern — no phase research needed

### Phase 2: Service Layer + Admin API Routes
**Rationale:** Admin CRUD API must exist before any UI can be built. Testable with curl/Postman before committing to UI work. Cycle detection logic belongs here in the save path.
**Delivers:** `/api/admin/flows/` routes, `flows.ts` service, Kit.com integration wrapper
**Avoids:** Pitfall 3 (cycle detection in save API)
**Research flag:** Standard pattern — follows existing `lib/api/services/` conventions exactly

### Phase 3: Admin Builder UI
**Rationale:** No user-facing risk. Admin-only surface can be iterated freely. Unlocks content creation so flows can be seeded before the player ships.
**Delivers:** `app/admin/flows/` pages, `FlowBuilderCanvas` (dnd-kit), `StepEditor`, `ConditionsBuilder`, `FlowPreview`; Zustand store
**Uses:** `zustand`, `react-hook-form`, `zod`, `@dnd-kit/*` (already installed)
**Avoids:** Pitfall 6 (dnd-kit touch sensor — must use dedicated drag handle from the start)
**Research flag:** Standard — well-documented dnd-kit sortable patterns

### Phase 4: Flow Engine + User API Routes
**Rationale:** The most complex phase. Condition evaluator, response recording, and actions dispatch logic lives here. Must be solid before the player UI is built on top of it.
**Delivers:** `flow-engine.ts`, `/api/flows/active`, `/api/flows/[id]/respond`, `/api/flows/[id]/dismiss`; `flow_runs` with resume-on-refresh
**Avoids:** Pitfalls 2 (condition query performance), 4 (actions idempotency), 8 (state lost on refresh), 9 (concurrent runs), 10 (conditions not exposed to client), 11 (type coercion in evaluator)
**Research flag:** Needs careful design review — actions idempotency pattern and condition evaluator type safety are non-trivial

### Phase 5: Flow Player UI
**Rationale:** Can only be built once Phase 4 APIs exist. Phases 3 and 5 can run in parallel (different engineers or sequential sprints) once Phase 2 is done.
**Delivers:** `FlowPlayerProvider`, `FlowPlayer`, 5 display components, element components, `ClientProviders.tsx` modification
**Uses:** `motion` for AnimatePresence on display type transitions
**Avoids:** Pitfall 14 (z-index — use `createPortal` for modal/fullscreen)
**Research flag:** Standard React component patterns — no phase research needed

### Phase 6: Analytics
**Rationale:** Event recording can be wired into the Phase 4 respond handler (additive change). Admin dashboard depends on Phase 3 patterns for layout. Analytics does not block any other phase.
**Delivers:** `flow_events` recording, analytics service, admin analytics dashboard page (Recharts)
**Avoids:** Pitfall 13 (double-counted step views — unique constraint on first-visit events)
**Research flag:** Standard — follows existing Recharts dashboard patterns

### Phase 7: Onboarding Migration
**Rationale:** Must come last. Touches existing production paths. Requires all previous phases to be stable. Phased cutover prevents user disruption.
**Delivers:** 3 seed flow templates (student, teacher, wellness onboarding), `app/onboarding/layout.tsx` redirect modification
**Avoids:** Pitfall 5 (migration breaks in-progress users — phased rollout required)
**Research flag:** Needs explicit pre-deploy check: `SELECT count(*) FROM users WHERE onboarding_status = 'in_progress'`

---

### Phase Ordering Rationale

- Schema-first is mandatory: JSONB versioning and index decisions made retroactively create migration debt
- Service layer before UI prevents building UIs on unstable contracts
- Admin builder before player: admins need to create flows before users can run them; also keeps early phases admin-only with zero user risk
- Actions engine in Phase 4, not Phase 5: actions must execute server-side in the API layer, not in UI components
- Analytics after core engine: `flow_events` recording is additive to the respond handler; no blocking dependency
- Onboarding migration last: the highest-risk phase (touches existing production paths), must be gated on all previous phases being stable

---

### Research Flags

Phases needing deeper research during planning:
- **Phase 4 (Flow Engine):** Actions idempotency table design and condition evaluator type safety require careful spec before implementation; consider a spike on the `flow_action_executions` table schema before writing Phase 4 plan

Phases with well-documented patterns (skip research-phase):
- **Phase 1 (Schema):** Standard Supabase migration pattern, JSONB indexing is documented
- **Phase 2 (Service Layer):** Follows existing `lib/api/services/` conventions exactly
- **Phase 3 (Admin Builder):** dnd-kit sortable is well-documented; Zustand store patterns are standard
- **Phase 5 (Player UI):** React component patterns + Motion AnimatePresence are standard
- **Phase 6 (Analytics):** Recharts + existing dashboard patterns

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All packages verified via npm; existing packages confirmed at correct versions; new package choices verified for React 19 + Next.js 16 compatibility |
| Features | HIGH | Element types verified against Typeform official docs; display types consistent across Appcues, Intercom, Userflow; condition patterns confirmed in Formsort docs |
| Architecture | HIGH | Integration points based on direct codebase inspection of existing files; build order derived from strict dependency analysis |
| Pitfalls | HIGH | JSONB pitfalls from PostgreSQL/EDB engineering sources; dnd-kit pitfalls from confirmed GitHub issues #272 and #435; Stripe idempotency from official Stripe docs |

**Overall confidence:** HIGH

### Gaps to Address

- **Kit.com tag idempotency:** Kit's tag endpoint behavior on duplicate requests needs verification during Phase 4 implementation — confirm whether the API is upsert-safe or requires a pre-check
- **`flow_runs` schema:** PITFALLS.md calls for `flow_runs` with `current_step_id` and `completed_step_ids[]` for resume-on-refresh, but this table is not in ARCHITECTURE.md's table list — Phase 4 planning must reconcile this and add `flow_runs` to the schema (or fold the data into `flow_responses`)
- **`session_count` trigger implementation:** The trigger type is listed as "Standard" priority but the mechanism for counting sessions is not defined — needs a decision on whether to use an existing sessions table or add tracking
- **Condition evaluator caching strategy:** ARCHITECTURE.md suggests localStorage caching with 5-minute TTL; PITFALLS.md suggests 30-second server-side cache — these need to be reconciled in Phase 4 design

---

## Sources

### Primary (HIGH confidence — official docs and direct codebase inspection)
- Codebase inspection: `app/admin/layout.tsx`, `AdminShell.tsx`, `app/onboarding/layout.tsx`, `lib/api/handler.ts`, `lib/api/services/users.ts`, `app/components/ClientProviders.tsx`, `supabase/migrations/`
- [Typeform Question Types](https://help.typeform.com/hc/en-us/articles/360051789692-Question-types)
- [Formsort Conditions and Logic](https://docs.formsort.com/conditions-and-logic)
- [Motion (formerly Framer Motion) docs](https://motion.dev/docs/react)
- [Zustand v5](https://www.npmjs.com/package/zustand) / [Zod v4](https://zod.dev/v4)
- [dnd-kit Touch Sensor](https://docs.dndkit.com/api-documentation/sensors/touch)
- [Stripe Idempotent Requests](https://docs.stripe.com/api/idempotent_requests)
- [Supabase RLS Performance](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)

### Secondary (MEDIUM confidence — community and product docs)
- [Appcues Flow Building](https://www.appcues.com/university/appcues-basics/flow-building)
- [Userflow Flow Builder Basics](https://help.userflow.com/docs/flow-builder-basics)
- [Userflow Analytics](https://help.userflow.com/docs/analytics)
- [dnd-kit issue #272](https://github.com/clauderic/dnd-kit/issues/272), [issue #435](https://github.com/clauderic/dnd-kit/issues/435)

### Tertiary (MEDIUM — engineering analysis and pattern inference)
- [Heap: When To Avoid JSONB](https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema)
- [EDB: PostgreSQL anti-patterns](https://www.enterprisedb.com/blog/postgresql-anti-patterns-unnecessary-jsonhstore-dynamic-columns)

---

*Research completed: 2026-03-27*
*Ready for roadmap: yes*
