---
phase: 02-service-layer-admin-api-routes
plan: "02"
subsystem: flow-builder
tags: [api-routes, admin, auth, cycle-detection]
dependency_graph:
  requires: ["02-01"]
  provides: ["03-admin-ui"]
  affects: []
tech_stack:
  added: []
  patterns:
    - "requireFlowAdmin() shared auth guard — eliminates 8-line auth block from every route"
    - "Next.js 16 async params pattern — const { id } = await params"
    - "Cycle detection before branch persist — HTTP 422 with cyclePath on cycle"
key_files:
  created:
    - lib/flows/admin-auth.ts
    - app/api/admin/flows/route.ts
    - app/api/admin/flows/[id]/route.ts
    - app/api/admin/flows/[id]/duplicate/route.ts
    - app/api/admin/flows/[id]/steps/route.ts
    - app/api/admin/flows/[id]/steps/[stepId]/route.ts
    - app/api/admin/flows/[id]/steps/reorder/route.ts
    - app/api/admin/flows/[id]/steps/[stepId]/branches/route.ts
  modified: []
decisions:
  - "requireFlowAdmin() returns { user, error } union — routes early-return the error response, keeping handler body clean"
  - "Cycle detection uses merged branch list (existing minus stepId's branches + incoming) — prevents false positives from stale data"
  - "Branches PUT returns 422 (Unprocessable Entity) not 400 — request is well-formed but semantically invalid due to cycle"
metrics:
  duration_minutes: 3
  tasks_completed: 2
  files_created: 8
  files_modified: 0
  completed_date: "2026-03-30"
---

# Phase 02 Plan 02: Admin API Routes Summary

**One-liner:** 7 REST route handlers + shared auth guard wiring flow/step CRUD to the service layer, with DFS cycle detection returning HTTP 422 on branch cycles.

## What Was Built

Admin-only HTTP API under `/api/admin/flows/` providing full CRUD for flows, steps, and branches. All routes share a reusable `requireFlowAdmin()` guard that returns 401 for unauthenticated requests and 403 for non-admin/moderator users.

### Routes created

| Method | Path | Handler |
|--------|------|---------|
| GET | /api/admin/flows | List flows (status/template filters) |
| POST | /api/admin/flows | Create flow |
| GET | /api/admin/flows/[id] | Get flow with all steps and branches |
| PATCH | /api/admin/flows/[id] | Update flow fields |
| DELETE | /api/admin/flows/[id] | Delete flow (CASCADE handles children) |
| POST | /api/admin/flows/[id]/duplicate | Copy flow with all steps and branches |
| GET | /api/admin/flows/[id]/steps | List steps for a flow |
| POST | /api/admin/flows/[id]/steps | Create step |
| GET | /api/admin/flows/[id]/steps/[stepId] | Get step with branches |
| PATCH | /api/admin/flows/[id]/steps/[stepId] | Update step |
| DELETE | /api/admin/flows/[id]/steps/[stepId] | Delete step |
| PUT | /api/admin/flows/[id]/steps/reorder | Reorder steps by stepIds array |
| PUT | /api/admin/flows/[id]/steps/[stepId]/branches | Replace branches with cycle detection |

### Key design: cycle detection on branch save

The branches PUT route fetches the full flow graph, builds a merged branch list (existing branches minus the current step's + the incoming branches), runs DFS via `detectCycle()`, and returns HTTP 422 with `cyclePath` if a cycle is found. Only then does it call `upsertBranches()`.

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | 720048f | Admin auth guard and flow list/create/detail/duplicate routes |
| Task 2 | 23ff4da | Step CRUD routes with cycle detection on branch save |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all routes call real service layer functions, return real data.

## Self-Check: PASSED

Files created:
- lib/flows/admin-auth.ts — FOUND
- app/api/admin/flows/route.ts — FOUND
- app/api/admin/flows/[id]/route.ts — FOUND
- app/api/admin/flows/[id]/duplicate/route.ts — FOUND
- app/api/admin/flows/[id]/steps/route.ts — FOUND
- app/api/admin/flows/[id]/steps/[stepId]/route.ts — FOUND
- app/api/admin/flows/[id]/steps/reorder/route.ts — FOUND
- app/api/admin/flows/[id]/steps/[stepId]/branches/route.ts — FOUND

TypeScript compilation: No errors on any route file.
