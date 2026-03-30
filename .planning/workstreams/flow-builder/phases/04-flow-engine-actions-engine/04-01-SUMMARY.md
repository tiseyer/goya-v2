---
phase: 04-flow-engine-actions-engine
plan: "01"
subsystem: flow-engine
tags: [flow-engine, condition-evaluator, api-routes, migration, idempotency]
dependency_graph:
  requires:
    - 03-04 (FlowStep, FlowBranch, FlowCondition types from schema)
    - 01-01 (flows, flow_steps, flow_branches, flow_responses, flow_analytics tables)
    - 01-02 (RLS policies for flow tables)
  provides:
    - lib/flows/engine.ts (getActiveFlowForUser, recordStepResponse, completeFlow)
    - lib/flows/condition-evaluator.ts (evaluateConditions)
    - GET /api/flows/active
    - POST /api/flows/[id]/respond
    - POST /api/flows/[id]/complete
    - flow_action_executions table (for Plan 04-02 actions engine)
  affects:
    - Phase 5 (flow player UI consumes these API routes)
    - Plan 04-02 (actions engine uses flow_action_executions for idempotency)
tech_stack:
  added: []
  patterns:
    - Server-only engine module with service role client (same pattern as flow-service.ts)
    - Conditions stripped from flow payload before returning to client (Omit<Flow, 'conditions'>)
    - Next.js 15+ async params pattern for dynamic routes
    - Priority + frequency + condition triple-gate for flow matching
key_files:
  created:
    - supabase/migrations/20260368_flow_action_executions.sql
    - lib/flows/condition-evaluator.ts
    - lib/flows/engine.ts
    - app/api/flows/active/route.ts
    - app/api/flows/[id]/respond/route.ts
    - app/api/flows/[id]/complete/route.ts
  modified:
    - lib/flows/types.ts (added FlowActionType, FlowStepAction, FlowActionExecution, ActiveFlowResponse, StepResponseInput)
decisions:
  - "conditions field is stripped via Omit<Flow, 'conditions'> in engine.ts before returning ActiveFlowResponse — client never receives condition rules"
  - "frequency=custom treated as once for v1 — avoids undefined behavior until scheduling is built"
  - "completeFlow analytics failure is non-fatal — console.error logged but 200 returned — flow is already marked complete"
  - "getActiveFlowForUser creates new flow_response on first match, reuses existing in_progress response on re-trigger"
metrics:
  duration: "3min 10sec"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 6
  files_modified: 1
---

# Phase 04 Plan 01: Flow Engine Core Summary

**One-liner:** Server-side flow matching engine with priority/frequency/condition gating, idempotency migration, and three authenticated user-facing API routes — conditions never leaked to client.

## What Was Built

### Migration: flow_action_executions
`supabase/migrations/20260368_flow_action_executions.sql` creates the idempotency tracking table for the actions engine (Plan 04-02). Unique constraint on `(flow_id, user_id, step_id, action_type)` prevents double-execution of actions. RLS: users see own rows, service role manages all.

### Types (lib/flows/types.ts additions)
- `FlowActionType` — 8 action types for Plan 04-02
- `FlowStepAction` — action config envelope
- `FlowActionExecution` — DB row shape
- `ActiveFlowResponse` — engine return type with `Omit<Flow, 'conditions'>` (security)
- `StepResponseInput` — input shape for recordStepResponse

### Condition Evaluator (lib/flows/condition-evaluator.ts)
`evaluateConditions(conditions, userProfile)` — server-only, AND logic across 6 condition types:
- `role` — equals / in
- `onboarding_status` — equals
- `has_profile_picture` — equals
- `subscription_status` — equals / in
- `birthday` — is_today (UTC month+day comparison)
- `flow_completed` — completed / not_completed

Empty conditions = always match. Unknown types fail-safe (return false).

### Flow Engine (lib/flows/engine.ts)
Three exported functions:
1. `getActiveFlowForUser(userId, trigger)` — fetches active flows for trigger, evaluates priority + frequency + conditions, upserts flow_response, returns `ActiveFlowResponse` with conditions stripped
2. `recordStepResponse(userId, flowId, input)` — merges answers into existing responses JSONB, advances last_step_id
3. `completeFlow(userId, flowId)` — sets status=completed + completed_at, inserts analytics event

### API Routes
- `GET /api/flows/active` — returns matched flow or `{ flow: null }`, requires auth
- `POST /api/flows/[id]/respond` — records step answer, requires step_id, returns updated response
- `POST /api/flows/[id]/complete` — marks flow done, returns `{ success: true }`

All three routes return 401 for unauthenticated requests.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 0eaf473 | feat(04-01): flow engine core — migration, condition evaluator, engine service |
| 2 | 931e5cb | feat(04-01): user-facing flow API routes — active, respond, complete |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data paths are fully wired. The `getActiveFlowForUser` function fetches real data from the database, condition evaluation runs against real profile data, and response recording writes to real DB rows.

## Self-Check: PASSED
