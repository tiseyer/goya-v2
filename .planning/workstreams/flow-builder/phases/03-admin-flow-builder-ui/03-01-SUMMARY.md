---
phase: "03"
plan: "01"
subsystem: flow-builder
tags: [admin-ui, flows, drag-and-drop, crud]
dependency_graph:
  requires: [02-02]
  provides: [flow-list-page, create-flow-modal, flow-stats-api]
  affects: [admin-shell, app/admin/flows]
tech_stack:
  added: []
  patterns: [@dnd-kit/sortable verticalListSortingStrategy, server-component-data-fetch, optimistic-local-state-crud]
key_files:
  created:
    - app/admin/flows/page.tsx
    - app/admin/flows/components/FlowListTabs.tsx
    - app/admin/flows/components/FlowCard.tsx
    - app/admin/flows/components/CreateFlowModal.tsx
    - app/api/admin/flows/stats/route.ts
  modified:
    - app/admin/components/AdminShell.tsx
decisions:
  - "SVG title prop not valid in JSX — use aria-label instead; fixes TS2322 errors"
  - "Stats loaded via useEffect on mount for all flows at once — avoids N+1 per tab switch"
  - "DndContext wraps per-tab sortable list — reorder writes PATCH priority=index for each moved flow"
metrics:
  duration: "6 min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 5
  files_modified: 1
---

# Phase 03 Plan 01: Admin Flow List Page Summary

**One-liner:** Tabbed flow list at /admin/flows with dnd-kit drag-sort, full CRUD actions via API, and completion stats from flow_responses.

## What Was Built

- **AdminShell sidebar** gains a "Flows" nav link between Chatbot and API Keys using a GitBranch-style SVG path.
- **`/admin/flows` page** (server component) fetches regular flows and templates in parallel, passes them to the client list component.
- **FlowListTabs** — `'use client'` component with 5 tabs (Active, Draft, Paused, Archived, Templates). Uses `DndContext` + `SortableContext` from @dnd-kit/sortable for drag-and-drop priority reorder. On drag end, sends parallel PATCH requests to persist new priority values.
- **FlowCard** — sortable row using `useSortable`. Shows: 6-dot drag grip, display type icon (SVG), flow name + description, status badge (color-coded pill), trigger chip, condition chips (up to 2 + overflow count), and completion stats text.
- **CreateFlowModal** — overlay modal with name (required), description (optional), display type dropdown, trigger type dropdown. POSTs to `/api/admin/flows`, calls `onCreated(flow)` on success.
- **CRUD actions** via three-dot menu in FlowCard: Duplicate (POST duplicate), Pause/Activate (PATCH status), Archive (PATCH status), Delete (confirm + DELETE). All update local state optimistically.
- **`GET /api/admin/flows/stats`** — new route, accepts `?ids=id1,id2,...`, queries `flow_responses` table, aggregates completed and in_progress counts per flow_id. Returns `{ [flowId]: { completed, inProgress } }`.

## Decisions Made

1. **SVG `title` prop not valid in JSX** — TypeScript TS2322 errors on `<svg title="...">`. Fixed by using `aria-label` attribute instead. No behavior change.
2. **Stats loaded once on mount** via `useEffect` for all flows — avoids N+1 requests on each tab switch. Stats state accumulates across sessions (new flows after create/duplicate trigger individual stat loads).
3. **`useState` misuse caught** — initial draft used `useState(() => ...)` for a side effect; corrected to `useEffect(() => ..., [])`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SVG `title` prop causes TS2322 in JSX**
- **Found during:** Task 1 TypeScript verification
- **Issue:** `<svg title="Fullscreen">` (and 4 similar) triggers `Property 'title' does not exist on type 'SVGProps<SVGSVGElement>'`
- **Fix:** Replaced `title` prop with `aria-label` on all SVG elements in DisplayTypeIcon
- **Files modified:** `app/admin/flows/components/FlowCard.tsx`
- **Commit:** daae71b (included in Task 1 commit)

**2. [Rule 1 - Bug] `useState` used for side effect instead of `useEffect`**
- **Found during:** Task 1 review
- **Issue:** `useState(() => { loadStats(...) })` — incorrect pattern for triggering an async effect on mount
- **Fix:** Replaced with `useEffect(() => { loadStats(...) }, [])`
- **Files modified:** `app/admin/flows/components/FlowListTabs.tsx`
- **Commit:** daae71b (included in Task 1 commit)

## Known Stubs

None — all data flows are wired to real API routes from Phase 2. Stats show `0 completed, 0 in progress` for flows with no responses (correct zero-state, not a stub).

## Self-Check: PASSED
