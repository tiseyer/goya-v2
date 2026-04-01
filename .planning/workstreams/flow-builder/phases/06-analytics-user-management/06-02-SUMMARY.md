---
phase: 06-analytics-user-management
plan: 02
subsystem: flow-builder
tags: [admin, user-management, flows, api-routes]
dependency_graph:
  requires: [lib/flows/admin-auth.ts, lib/supabase/service.ts, app/api/admin/flows/route.ts]
  provides: [user flow list, user flow reset, user flow assign, user flow mark-complete, admin flows tab]
  affects: [app/admin/users/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [requireFlowAdmin guard, getSupabaseService as any (flow tables not in generated DB types), inline confirm pattern]
key_files:
  created:
    - app/api/admin/flows/user-flows/route.ts
    - app/api/admin/flows/user-flows/[responseId]/route.ts
    - app/api/admin/flows/user-flows/assign/route.ts
    - app/admin/users/[id]/UserFlowsSection.tsx
  modified:
    - app/admin/users/[id]/page.tsx
decisions:
  - "getSupabaseService cast as any in all user-flows routes — flow tables (flow_responses, flow_action_executions) not in generated Supabase types; consistent with engine.ts and flow-service.ts pattern"
  - "DELETE flow response also deletes flow_action_executions for same flow_id+user_id — ensures actions re-fire on re-display after reset"
  - "PATCH only accepts status=completed — admin mark-complete is the only supported mutation; partial updates not needed"
  - "assign route validates both userId and flowId exist before upsert — returns 404 not 500 on bad input"
metrics:
  duration: 3 minutes
  completed: 2026-03-30
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 06 Plan 02: User Flow Management Summary

Per-user flow management in the admin user edit page — three API routes and a Flows tab with table, actions, and force-assign UI.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | User flow management API routes (list, reset, assign, mark-complete) | d79a462 | route.ts, [responseId]/route.ts, assign/route.ts |
| 2 | UserFlowsSection component + wire into user edit page as Flows tab | dc546fd | UserFlowsSection.tsx, page.tsx |

## What Was Built

**Three API routes** under `app/api/admin/flows/user-flows/`:

- `GET /api/admin/flows/user-flows?userId=X` — returns array of flow responses joined with flow name and status, ordered by started_at desc
- `DELETE /api/admin/flows/user-flows/[responseId]` — deletes flow_response and related flow_action_executions so the flow re-triggers and actions re-fire
- `PATCH /api/admin/flows/user-flows/[responseId]` — marks response complete with completed_at=now()
- `POST /api/admin/flows/user-flows/assign` — upserts a flow_response for a given user+flow; supports markComplete flag for immediate completion

**UserFlowsSection.tsx** — client component with:
- Table of flow interactions: flow name, status badge (color-coded), started/completed dates, Reset and Mark Complete action buttons
- Inline confirm dialog on Reset: "Reset will show this flow again on next login. Continue?"
- Force Assign section: dropdown of active flows, markComplete checkbox, Assign button
- Empty state and loading state

**page.tsx** — added Flows tab to the three-tab bar (Overview, Connections, Flows) and conditionally renders `<UserFlowsSection userId={id} />`.

## Verification

- `npx tsc --noEmit` — no errors in any new files; pre-existing test errors unrelated to this plan
- All routes use `requireFlowAdmin()` — unauthorized requests return 401/403
- All DB queries use `getSupabaseService() as any` — consistent with engine.ts/flow-service.ts pattern

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Cast getSupabaseService() as any in all routes**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `flow_responses`, `flow_action_executions`, and `flows` tables are not in the generated Supabase Database types (`types/supabase.ts`), causing TS2769 overload errors on every `.from()` call
- **Fix:** Added `getSupabaseService() as any` cast in all three route files — identical pattern to `lib/flows/engine.ts` line 19 and `lib/flows/flow-service.ts` line 20
- **Files modified:** All three route.ts files
- **Commits:** d79a462

## Known Stubs

None — all data is fetched live from the database. The force-assign dropdown shows only `status=active` flows fetched at mount time.

## Self-Check: PASSED

Files created/exist:
- app/api/admin/flows/user-flows/route.ts — FOUND
- app/api/admin/flows/user-flows/[responseId]/route.ts — FOUND
- app/api/admin/flows/user-flows/assign/route.ts — FOUND
- app/admin/users/[id]/UserFlowsSection.tsx — FOUND
- app/admin/users/[id]/page.tsx — FOUND (modified)

Commits exist:
- d79a462 — FOUND
- dc546fd — FOUND
