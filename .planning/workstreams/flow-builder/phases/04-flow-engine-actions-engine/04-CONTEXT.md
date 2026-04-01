# Phase 4: Flow Engine + Actions Engine - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Server correctly identifies which flow a user should see, records their responses step by step, and executes all configured actions without duplication. Includes condition evaluator, response recording with resumability, all 8 action types with idempotency, and user-facing API routes.

</domain>

<decisions>
## Implementation Decisions

### Actions Idempotency & Execution
- `flow_action_executions` table tracks (flow_id, user_id, step_id, action_type) to prevent duplicate emails/charges on back-forward navigation
- Stripe checkout idempotency key: deterministic format `flow_{flowId}_{stepId}_{userId}`
- Action execution: synchronous await all — user sees result before moving to next step

### Condition Evaluation & User API
- Condition evaluation in JS route handler (not Postgres RPC) — simpler to test, debug, iterate; sufficient for <20 active flows
- No caching for v1 — evaluate fresh each request
- Three separate endpoints: POST /api/flows/start, POST /api/flows/{id}/respond, POST /api/flows/{id}/complete

### Claude's Discretion
- Internal action handler architecture (single dispatcher vs per-action modules)
- Error handling strategy for partial action failures (some actions succeed, one fails)
- Condition evaluator type coercion details (string comparison vs strict typing)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- lib/flows/flow-service.ts — existing flow CRUD (getFlowWithSteps for condition evaluation)
- lib/flows/step-service.ts — step operations
- lib/flows/types.ts — all TypeScript interfaces
- lib/flows/kitcom.ts — Kit.com wrapper already built
- lib/supabaseServer.ts — server client for route handlers
- Existing Stripe integration in the project

### Established Patterns
- Route handlers use createSupabaseServerClient() for auth
- Service layer functions take supabase client as parameter
- User routes don't need admin auth — just authenticated user via getUser()

### Integration Points
- New migration for flow_action_executions table
- User API routes under app/api/flows/
- lib/flows/engine.ts for getActiveFlowForUser
- lib/flows/actions.ts for action handlers

</code_context>

<specifics>
## Specific Ideas

From user spec and research:
- getActiveFlowForUser(userId, trigger) — fetch active flows ordered by priority, evaluate conditions, check frequency/completion
- 8 action types: save_to_profile, send_email, kit_tag, stripe_checkout, redirect, trigger_flow, success_popup, mark_complete
- Conditions: role, onboarding_complete, has_profile_picture, subscription_status, birthday_is_today, flow_completed/not_completed, always
- trigger_flow action needs loop detection (max depth of 3 chained flows)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
