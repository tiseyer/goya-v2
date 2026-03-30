# Architecture: Flow Builder Integration

**Project:** GOYA v2 — Flow Builder Workstream
**Researched:** 2026-03-27
**Context:** Adding dynamic flow engine to existing Next.js 16 + Supabase + Tailwind CSS 4 app

---

## System Overview

The flow builder is five separate subsystems that must integrate cleanly with the existing codebase:

1. **Schema** — Supabase tables + RLS
2. **Admin Builder UI** — drag-drop editor inside AdminShell
3. **Flow Player** — user-facing renderer (overlay/fullscreen/banner)
4. **Actions Engine** — server-side effects triggered by step completions
5. **Analytics** — event recording and admin dashboard

These subsystems share no circular dependencies. Build order must respect: Schema → Service Layer → API Routes → UI (admin builder and user player in parallel once APIs exist).

---

## Integration with Existing Architecture

### AdminShell Pattern

The admin builder UI follows the existing pattern exactly:

- New route: `app/admin/flows/` — page and subpages
- `AdminLayout` at `app/admin/layout.tsx` already enforces `admin | moderator` role-gate via `createSupabaseServerClient`. No changes needed there.
- `AdminShell.tsx` NAV_ITEMS array gets one new entry for "Flows" — this is the only modification to existing admin files.
- The builder canvas (`FlowBuilderCanvas`) is a `'use client'` component nested under the server-rendered admin page, consistent with how other admin pages (events, courses) work.

### API Route Pattern

Existing pattern: `app/api/admin/[resource]/route.ts` uses `createApiHandler` from `lib/api/handler.ts` with thin handlers delegating to service functions in `lib/api/services/`.

Flow builder follows this exactly:

- Admin: `app/api/admin/flows/route.ts`, `app/api/admin/flows/[id]/route.ts`, `app/api/admin/flows/[id]/steps/route.ts`
- User: `app/api/flows/route.ts` (fetches eligible flow for current user), `app/api/flows/[id]/respond/route.ts` (records step response)
- Services: `lib/api/services/flows.ts` (admin CRUD), `lib/api/services/flow-engine.ts` (condition evaluation, response recording)

User-facing routes use `createSupabaseServerClient` for SSR auth, not the API key middleware (which is for external API consumers). Admin routes follow existing pattern with `createSupabaseServerClient` for session-based admin auth — the existing admin API routes (`app/api/admin/users/`) don't actually use the API key middleware either; they rely on session cookies via Supabase SSR.

### Supabase / RLS Pattern

Migrations follow the pattern in `supabase/migrations/`: uuid PKs with `gen_random_uuid()`, `timestamptz` with `DEFAULT now()`, `ON DELETE CASCADE` for child tables, RLS enabled on every table, indexes on all foreign keys and frequently filtered columns.

### External Integrations

- Kit.com: `KITCOM_API_KEY` env var already exists. Actions engine calls Kit.com API via a new `lib/integrations/kitcom.ts` module — no new env vars needed, follows the graceful-fallback pattern already used.
- Email: `lib/email/send.ts` already handles transactional email. Actions engine calls it directly.
- Stripe: `lib/stripe/` already exists. Checkout action generates a Stripe Checkout session URL and returns it as a redirect action.

---

## New Components Needed

### Database (all new)

| Table | Purpose |
|-------|---------|
| `flows` | Flow metadata, conditions JSONB, trigger type, display type, priority |
| `flow_steps` | Ordered steps per flow, elements JSONB, branch_logic JSONB |
| `flow_responses` | Per-user step responses, JSONB answers |
| `flow_completions` | Per-user flow completion records |
| `flow_events` | Analytics events (viewed, started, step_viewed, step_completed, completed, dismissed) |

### Service Layer (all new)

| File | Responsibility |
|------|---------------|
| `lib/api/services/flows.ts` | Admin CRUD for flows and steps |
| `lib/api/services/flow-engine.ts` | `getActiveFlowForUser()`, condition evaluation, response recording |
| `lib/integrations/kitcom.ts` | Kit.com subscriber/tag API wrapper |

### API Routes (all new)

| Route | Methods | Auth |
|-------|---------|------|
| `app/api/admin/flows/route.ts` | GET, POST | Session (admin/mod) |
| `app/api/admin/flows/[id]/route.ts` | GET, PATCH, DELETE | Session (admin/mod) |
| `app/api/admin/flows/[id]/steps/route.ts` | GET, POST, PATCH | Session (admin/mod) |
| `app/api/admin/flows/[id]/analytics/route.ts` | GET | Session (admin/mod) |
| `app/api/flows/active/route.ts` | GET | Session (any authenticated user) |
| `app/api/flows/[id]/respond/route.ts` | POST | Session (any authenticated user) |
| `app/api/flows/[id]/dismiss/route.ts` | POST | Session (any authenticated user) |

### Admin UI (all new, inside `app/admin/flows/`)

| Component | Type | Purpose |
|-----------|------|---------|
| `app/admin/flows/page.tsx` | Server Component | Flow list page |
| `app/admin/flows/[id]/page.tsx` | Server Component | Builder shell, loads flow |
| `app/admin/flows/[id]/FlowBuilderCanvas.tsx` | Client Component | Drag-drop step editor using @dnd-kit/core |
| `app/admin/flows/[id]/StepEditor.tsx` | Client Component | Edit elements, branch logic for selected step |
| `app/admin/flows/[id]/ConditionsBuilder.tsx` | Client Component | Visual condition rule builder |
| `app/admin/flows/[id]/FlowPreview.tsx` | Client Component | Preview mode using FlowPlayer component |
| `app/admin/flows/analytics/page.tsx` | Server Component | Analytics dashboard |
| `app/admin/flows/[id]/users/page.tsx` | Server Component | Per-user flow status |

### User-Facing Player (all new)

| Component | Type | Purpose |
|-----------|------|---------|
| `app/components/flows/FlowPlayerProvider.tsx` | Client Component | Context + state machine for active flow |
| `app/components/flows/FlowPlayer.tsx` | Client Component | Step renderer, dispatches to display type |
| `app/components/flows/displays/ModalDisplay.tsx` | Client Component | Modal overlay display type |
| `app/components/flows/displays/FullscreenDisplay.tsx` | Client Component | Full-page takeover |
| `app/components/flows/displays/BannerDisplay.tsx` | Client Component | Top/bottom banner |
| `app/components/flows/displays/NotificationDisplay.tsx` | Client Component | Toast-style notification |
| `app/components/flows/displays/SideDrawerDisplay.tsx` | Client Component | Slide-in panel |
| `app/components/flows/elements/ChoiceElement.tsx` | Client Component | Pill/card choice (Typeform-style) |
| `app/components/flows/elements/TextInputElement.tsx` | Client Component | Free text input |
| `app/components/flows/elements/TextElement.tsx` | Client Component | Display-only text/markdown |
| `app/components/flows/elements/ImageElement.tsx` | Client Component | Image display |
| `app/components/flows/elements/ButtonElement.tsx` | Client Component | CTA button |

### Onboarding Migration (modifications to existing)

| Change | Type | Notes |
|--------|------|-------|
| `app/onboarding/layout.tsx` | Modify | Add check: if flow engine has active flow for this user, redirect to flow player |
| `app/components/ClientProviders.tsx` | Modify | Mount `FlowPlayerProvider` so it can detect eligible flows on any page |
| Seed migration | New | 3 SQL seed files creating flow/step records for student, teacher, wellness onboarding |

---

## Data Flow

### Admin Creates a Flow

```
Admin fills FlowBuilderCanvas
  → POST /api/admin/flows (create flow record)
  → POST /api/admin/flows/[id]/steps (create/reorder steps)
  → Each step's elements stored as JSONB in flow_steps.elements
  → Branch conditions stored as JSONB in flow_steps.branch_logic
  → Trigger + display config stored on flows record
```

### User Encounters a Flow

```
ClientProviders mounts FlowPlayerProvider (client component, runs on every authenticated page)
  → FlowPlayerProvider calls GET /api/flows/active on mount
  → Server action in flow-engine.ts:
      1. getUser() from Supabase session
      2. Query flows with matching trigger, ordered by priority
      3. Evaluate conditions server-side (role, onboarding_status, subscription_status, profile_completeness)
      4. Check flow_completions — skip already-completed flows
      5. Return first eligible flow + first step
  → FlowPlayerProvider receives flow data, renders FlowPlayer in correct display type
  → User completes step → POST /api/flows/[id]/respond
      1. Record to flow_responses
      2. Record to flow_events (step_completed)
      3. Evaluate branch_logic to determine next step
      4. If all steps done: execute actions, record flow_completions, record flow_events (completed)
      5. Return {next_step | complete, actions[]}
  → Client executes non-redirect actions (show next step), follows redirect actions
```

### Actions Engine (server-side, in flow-engine.ts)

Actions are evaluated in `POST /api/flows/[id]/respond` when a step completes or the flow completes. Each action in `flow_steps.elements` or `flows.completion_actions` JSONB array describes one effect:

| Action Type | Execution |
|-------------|-----------|
| `save_profile` | UPDATE profiles SET [field] = [value] WHERE id = user_id |
| `send_email` | Call `lib/email/send.ts` with template + variables |
| `kit_subscribe` | Call `lib/integrations/kitcom.ts` — add tag or subscribe |
| `stripe_checkout` | Generate Stripe Checkout session URL, return as redirect action |
| `redirect` | Return redirect URL to client |
| `trigger_flow` | Insert a flow_override record or set next eligible flow in session |

---

## Component Boundaries

```
app/admin/layout.tsx (Server — auth gate, unchanged)
└── AdminShell.tsx (Client — modified: add Flows nav item)
    └── app/admin/flows/page.tsx (Server — list flows)
    └── app/admin/flows/[id]/page.tsx (Server — load flow data)
        └── FlowBuilderCanvas.tsx (Client — @dnd-kit drag-drop)
            └── StepEditor.tsx (Client)
            └── ConditionsBuilder.tsx (Client)
            └── FlowPreview.tsx (Client) → renders FlowPlayer in preview mode

app/components/ClientProviders.tsx (Client — modified: add FlowPlayerProvider)
└── FlowPlayerProvider.tsx (Client — fetches active flow, holds state)
    └── FlowPlayer.tsx (Client — renders step in correct display type)
        └── ModalDisplay / FullscreenDisplay / BannerDisplay / etc.
            └── ChoiceElement / TextInputElement / etc.
```

Server Components fetch initial data. Client Components own all interactive state. The flow engine condition evaluation always runs server-side (in Route Handler, never in Client Component).

---

## Modifications to Existing Files

These are the only existing files that need changes:

| File | Change | Risk |
|------|--------|------|
| `app/admin/components/AdminShell.tsx` | Add "Flows" entry to NAV_ITEMS array | Low — additive only |
| `app/components/ClientProviders.tsx` | Wrap children with `FlowPlayerProvider` | Low — additive wrapper |
| `app/onboarding/layout.tsx` | Add flow redirect check (Phase 7 only) | Medium — touches existing onboarding gate logic |

All other changes are new files only.

---

## Suggested Build Order

Build order is driven by dependencies: schema must exist before services, services before API routes, API routes before UI.

### Phase 1: Database Schema
Create migration with all five tables, RLS policies, indexes. No app code yet. Test with Supabase Studio. Unblocks everything else.

### Phase 2: Service Layer + Admin API Routes
`lib/api/services/flows.ts` (CRUD) and `app/api/admin/flows/` routes. No UI yet. Enables API testing with curl/Postman. Admin analytics route can wait until Phase 5.

### Phase 3: Admin Builder UI
`app/admin/flows/` pages, `FlowBuilderCanvas`, `StepEditor`, `ConditionsBuilder`. Depends on Phase 2 APIs. No user-facing impact. Can be iterated safely.

### Phase 4: Flow Engine + User API Routes
`lib/api/services/flow-engine.ts` (condition evaluation, response recording, actions engine) and `app/api/flows/` routes. Depends on Phase 1 schema. This is the most complex phase — condition evaluation logic and action dispatch.

### Phase 5: Flow Player UI
`FlowPlayerProvider`, `FlowPlayer`, all display types, all element types, `ClientProviders.tsx` modification. Depends on Phase 4 APIs. Phases 3 and 5 can run in parallel once Phase 2 is done.

### Phase 6: Analytics
`flow_events` recording (can be added to Phase 4 respond handler), analytics service, analytics admin page. Depends on Phase 4 (events must be recording). Admin dashboard depends on Phase 3 patterns.

### Phase 7: Onboarding Migration
Seed flows replacing hardcoded onboarding, `app/onboarding/layout.tsx` modification. Depends on all previous phases. Last because it touches existing production paths.

---

## Architecture Decisions

| Decision | Rationale |
|----------|-----------|
| JSONB for step elements and conditions | Element types vary (choice, text, image, button). Rigid columns would require schema changes per new element type. JSONB allows the engine to be data-driven. |
| Condition evaluation server-side only | Prevents client-side bypass. All `getActiveFlowForUser` logic lives in Route Handler, never exposed to browser. |
| `FlowPlayerProvider` in ClientProviders | Flows need to render on any authenticated page (triggered by login, page load, delay). Mounting in the global client provider tree is the correct insertion point — consistent with how existing providers work. |
| Separate `flow_events` table | Analytics queries (funnel drop-off, completion rate) are aggregate queries that should not block user-facing response recording. Separate table allows independent indexing. |
| @dnd-kit/core for builder | Already specified in PROJECT.md constraints. Library is maintained, tree-shakeable, and works inside Next.js Client Components without SSR issues. |
| Actions execute server-side on respond | Prevents client-side spoofing of profile writes, Kit.com calls, or Stripe sessions. The client receives a `{next_step, actions}` payload and only executes non-sensitive display actions (show next step, follow redirect URL). |
| Priority as integer, lower = higher priority | Simple integer sort. Drag-to-reorder in admin updates integers. Consistent with how similar systems (Intercom, Appcues) handle flow priority. |

---

## Pitfalls Specific to This Integration

### FlowPlayerProvider mount timing
The provider mounts on every authenticated page load and fires a network request to `/api/flows/active`. This adds latency to every page if implemented naively. Mitigation: cache the "no active flow" response in localStorage with a short TTL (5 minutes), skip the API call if cache is fresh.

### Onboarding redirect collision
The existing `app/onboarding/layout.tsx` already has a preview mode check using a cookie. Phase 7 adds a flow-engine redirect. These must be composed carefully — flow-engine redirect should only fire if the user is not already in onboarding, and preview mode must be respected. Don't merge these checks.

### RLS on flow_responses
Users must be able to write their own responses but not read others. Admins need full read access. Write the RLS policy as: INSERT allowed when `auth.uid() = user_id`; SELECT allowed when `auth.uid() = user_id` OR role is admin/moderator (via service role for admin API routes).

### @dnd-kit in Next.js App Router
@dnd-kit requires a DOM environment. The `FlowBuilderCanvas` must be `'use client'` and should not be imported in Server Components. Dynamic import with `{ ssr: false }` is not needed if the file already has `'use client'` — but the parent server component must not attempt to import it without the client boundary.

### Branch logic infinite loop guard
Flow engine must detect cycles in branch_logic before executing. A step that branches back to itself or to a previous step creates an infinite loop. Guard: enforce maximum step traversal count (e.g., 50 steps) and return an error if exceeded, rather than silently looping.

---

## Sources

- Codebase inspection: `app/admin/layout.tsx`, `app/admin/components/AdminShell.tsx`, `app/onboarding/layout.tsx`, `app/onboarding/page.tsx`, `app/onboarding/lib/steps.ts`, `lib/api/handler.ts`, `lib/api/middleware.ts`, `lib/api/services/users.ts`, `supabase/migrations/20260358_chat_sessions_messages.sql`, `app/components/ClientProviders.tsx` (structure), `lib/email/`, `lib/analytics/`
- PROJECT.md for constraints and key decisions
- Confidence: HIGH for integration points (based on direct codebase reading); MEDIUM for actions engine ordering (based on patterns from similar systems)
