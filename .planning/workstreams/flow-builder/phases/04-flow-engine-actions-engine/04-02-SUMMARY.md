---
phase: 04-flow-engine-actions-engine
plan: "02"
subsystem: flow-engine
tags: [actions-engine, idempotency, kit.com, stripe, flow-triggers, profile-sync]
dependency_graph:
  requires:
    - 04-01 (engine.ts — recordStepResponse, completeFlow; flow_action_executions migration)
    - lib/flows/types.ts (FlowActionType, FlowStepAction)
    - lib/flows/kitcom.ts (tagSubscriber)
    - lib/stripe/client.ts (getStripe)
    - lib/supabase/service.ts (getSupabaseService)
  provides:
    - lib/flows/actions.ts (executeStepActions with all 8 action handlers + idempotency)
    - Updated lib/flows/engine.ts (recordStepResponse accepts optional actions array)
    - Updated app/api/flows/[id]/respond/route.ts (returns actionResults to client)
  affects:
    - Phase 5 (flow player receives actionResults — checkout URLs, redirects, popup config)
    - Any consumer of the respond API (now returns richer response with action outcomes)
tech_stack:
  added: []
  patterns:
    - Idempotency via flow_action_executions UNIQUE(flow_id, user_id, step_id, action_type)
    - Dynamic import (import('./engine')) inside actions.ts to break circular dependency
    - Dynamic import (import('./actions')) inside engine.ts for same reason
    - Stripe idempotency key format: flow_{flowId}_{stepId}_{userId}
    - Sequential action execution — all actions run even if one fails
    - Client-only actions (redirect, success_popup) return data without DB side effects
key_files:
  created:
    - lib/flows/actions.ts
  modified:
    - lib/flows/engine.ts (recordStepResponse extended with optional actions/userEmail params)
    - app/api/flows/[id]/respond/route.ts (parses actions from body, returns actionResults)
decisions:
  - "Dynamic import used in both actions.ts and engine.ts to break the circular dependency (actions imports completeFlow from engine; engine imports executeStepActions from actions)"
  - "redirect and success_popup are intentionally client-only pass-throughs — no DB record written, no idempotency needed"
  - "send_email is a deliberate no-op stub — console.warn logged, success returned, real integration deferred"
  - "Sequential execution with continue-on-failure — partial failures are reported in ActionResult[] rather than aborting"
  - "trigger_flow skips (returns skipped:true) if user already has any flow_response for target flow — prevents re-triggering completed flows"
metrics:
  duration: "8min"
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
---

# Phase 04 Plan 02: Actions Engine Summary

**One-liner:** Sequential actions dispatcher with idempotency protection covering all 8 action types — save_to_profile, kit_tag, stripe_checkout, trigger_flow, mark_complete, redirect, success_popup, send_email (stub) — wired into recordStepResponse and returning actionResults to the client.

## What Was Built

### Actions Engine (lib/flows/actions.ts)

New server-only module exporting `executeStepActions`. Architecture:

**Idempotency layer:**
- `checkIdempotency()` queries `flow_action_executions` before each action
- If row exists: returns `{ success: true, skipped: true }` immediately
- `recordExecution()` inserts after successful execution; UNIQUE violation on race condition is silently ignored

**8 action handlers:**

| Action | Behavior |
|--------|----------|
| `save_to_profile` | Reads `config.mappings` (element_key → profile column), upserts profiles table |
| `send_email` | Stub — console.warn + return success (deferred) |
| `kit_tag` | Calls `tagSubscriber(userEmail, config.tag_id)` — graceful fallback if KITCOM_API_KEY missing |
| `stripe_checkout` | Creates Stripe checkout session; idempotency key `flow_{flowId}_{stepId}_{userId}` |
| `redirect` | Returns `{ data: { redirect_url } }` for client — no server execution |
| `trigger_flow` | Checks depth (max 3), checks for existing response, inserts new flow_response |
| `success_popup` | Returns `{ data: { popup: { title, message } } }` for client — no server execution |
| `mark_complete` | Calls `completeFlow(userId, flowId)` via dynamic import |

**Circular dependency resolution:** `actions.ts` calls `completeFlow` from `engine.ts`. `engine.ts` calls `executeStepActions` from `actions.ts`. Both use dynamic `import()` at call time (not module-level) to break the cycle — TypeScript compiles cleanly.

### Engine Update (lib/flows/engine.ts)

`recordStepResponse` signature extended:
```typescript
recordStepResponse(
  userId, flowId, input,
  options?: { actions?: FlowStepAction[]; userEmail?: string }
): Promise<{ data: FlowResponse | null; actionResults?: ActionResult[]; error: unknown }>
```

Backward compatible — if no options provided, behavior is identical to Plan 01. When actions are provided, `executeStepActions` is called after the DB update.

### Respond Route Update (app/api/flows/[id]/respond/route.ts)

- Body parsing extended to include `actions?: FlowStepAction[]`
- `user.email` forwarded as `userEmail`
- Response shape changed from bare `FlowResponse` to `{ response, actionResults? }` — client receives both the updated response record and action outcomes in one call

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | e310501 | feat(04-02): actions engine with all 8 handlers and idempotency |
| 2 | cce8c37 | feat(04-02): wire actions into engine and respond route |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

**`send_email` action** — `lib/flows/actions.ts` line ~91. Intentional stub per plan spec. Logs `console.warn` with template ID and returns `{ success: true }`. Real email integration deferred to a future plan. The idempotency record IS written (prevents re-fire on navigation), but no email is actually sent.

This stub does NOT prevent the plan's goal from being achieved — the actions engine fully operates; send_email is explicitly called out in the plan as a v1 no-op.

## Self-Check: PASSED
