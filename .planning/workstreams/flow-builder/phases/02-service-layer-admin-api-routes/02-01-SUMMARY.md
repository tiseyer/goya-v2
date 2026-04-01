---
phase: 02-service-layer-admin-api-routes
plan: 01
subsystem: flow-builder/service-layer
tags: [typescript, supabase, service-layer, crud, cycle-detection, kitcom]
dependency_graph:
  requires: [01-01, 01-02]
  provides: [flow-service, step-service, cycle-detection, kitcom, flow-types]
  affects: [02-02-admin-api-routes, 03-admin-ui]
tech_stack:
  added: []
  patterns: [getSupabaseService-as-any, server-only, return-data-error, discriminated-union-FlowElement]
key_files:
  created:
    - lib/flows/types.ts
    - lib/flows/flow-service.ts
    - lib/flows/step-service.ts
    - lib/flows/cycle-detection.ts
    - lib/flows/kitcom.ts
  modified: []
decisions:
  - "FlowElement uses a discriminated union on 'type' — enables exhaustive type-checking in the flow player"
  - "duplicateFlow remaps branch target_step_id references to new step IDs — preserves branch graph topology in copies"
  - "detectCycle uses DFS with gray/black node marking — O(V+E) and returns the full cycle path for error reporting"
  - "upsertBranches does delete-then-insert (not diff) — simpler and sufficient for low branch-count steps"
metrics:
  duration: ~8min
  completed: 2026-03-30
  tasks_completed: 2
  files_created: 5
---

# Phase 02 Plan 01: Flow Builder Service Layer Summary

**One-liner:** TypeScript types for all 5 flow tables plus CRUD services, DFS cycle detection, and Kit.com tag subscriber wrapper with graceful fallback.

## What Was Built

Five files in `lib/flows/` that form the entire service foundation for the flow builder:

- **types.ts** — Interfaces for Flow, FlowStep, FlowBranch, FlowResponse, FlowAnalyticsEvent, FlowCondition; discriminated union FlowElement (9 types); FlowWithSteps composite; and all mutation input types (CreateFlowInput, UpdateFlowInput, CreateStepInput, UpdateStepInput, UpsertBranchInput).

- **flow-service.ts** — Admin CRUD for the flows table: listFlows (with status/is_template filters), getFlowById, getFlowWithSteps (assembles steps + branches), createFlow, updateFlow, deleteFlow, duplicateFlow (remaps branch IDs to new step IDs).

- **step-service.ts** — Admin CRUD for flow_steps and flow_branches: listSteps, getStepById (with branches attached), createStep, updateStep, deleteStep, reorderSteps (individual position updates), upsertBranches (delete-then-insert replace-all).

- **cycle-detection.ts** — Pure DFS function detectCycle(steps, branches). Builds adjacency list, tracks gray/black nodes, returns `{ hasCycle: false }` or `{ hasCycle: true, cyclePath: string[] }`.

- **kitcom.ts** — tagSubscriber(email, tagId) POSTs to Kit.com v4 API. Returns `{ success: false, error: 'KITCOM_API_KEY not configured' }` when key is absent, and wraps network errors in try/catch.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed type cast error in duplicateFlow destructure**
- **Found during:** Task 2 tsc verification
- **Issue:** `step as { id: string; created_at: string; branches: unknown[]; [key: string]: unknown }` failed because FlowStep has no index signature
- **Fix:** Changed cast to `step as any` with eslint-disable comment (consistent with getSupabaseService pattern)
- **Files modified:** lib/flows/flow-service.ts
- **Commit:** 8928001

## Known Stubs

None — all services wire directly to Supabase. No placeholder data.

## Self-Check: PASSED

Files exist:
- lib/flows/types.ts: FOUND
- lib/flows/flow-service.ts: FOUND
- lib/flows/step-service.ts: FOUND
- lib/flows/cycle-detection.ts: FOUND
- lib/flows/kitcom.ts: FOUND

Commits exist:
- 016d80a: feat(02-01): create flow builder TypeScript types and Kit.com wrapper
- 8928001: feat(02-01): create flow service, step service, and cycle detection
