---
phase: 06-analytics-user-management
plan: 01
subsystem: flow-builder
tags: [analytics, recharts, flow-editor, admin-ui]
dependency_graph:
  requires:
    - 05-02 (FlowEditorShell base)
    - 01-01 (flow_analytics table)
  provides:
    - Per-flow analytics dashboard tab in editor
    - GET /api/admin/flows/[id]/analytics endpoint
  affects:
    - FlowEditorShell (view toggle added)
tech_stack:
  added: []
  patterns:
    - Recharts BarChart with ResponsiveContainer for step drop-off
    - date-fns for preset date range calculations (startOfMonth, startOfWeek, etc.)
    - Pill-button preset filters with custom date range inputs
key_files:
  created:
    - app/api/admin/flows/[id]/analytics/route.ts
    - app/admin/flows/components/editor/FlowAnalyticsTab.tsx
    - app/admin/flows/components/editor/FlowAnalyticsDropoff.tsx
    - app/admin/flows/components/editor/FlowAnalyticsFilters.tsx
  modified:
    - app/admin/flows/components/editor/FlowEditorShell.tsx
decisions:
  - First step drop-off uses 'started' event count (not step_completed) — users who started the flow are by definition at step 1
  - completionRate formula is completed/shown (not completed/started) per ANALYTICS-01 requirement
  - Step user counts use distinct user_id sets per step_id to avoid double-counting repeated completions
metrics:
  duration: 3min
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 5
---

# Phase 06 Plan 01: Per-Flow Analytics Dashboard Summary

Per-flow analytics dashboard with event counts, completion rate, step drop-off chart, and time range filters — accessible as a tab within the existing flow editor.

## What Was Built

### API Route
`GET /api/admin/flows/[id]/analytics?from=<ISO>&to=<ISO>` — returns:
- `counts`: shown, started, completed, skipped, dismissed aggregated from `flow_analytics` table
- `completionRate`: completed / shown as a percentage (1 decimal)
- `dropoff`: array of `{ stepId, position, title, reached }` ordered by step position

### Components
- **FlowAnalyticsFilters** — 6 pill-style preset buttons (Today, Yesterday, This Week, This Month, This Year, Custom) with inline date range inputs when Custom is selected; uses date-fns for date math
- **FlowAnalyticsDropoff** — Recharts BarChart showing users reached per step; empty state if no steps; bar color `#1B3A5C`
- **FlowAnalyticsTab** — orchestrates filters + metric cards (6 counts + completion rate) + drop-off chart; loading skeleton while fetching

### Editor Integration
FlowEditorShell now has `activeView: 'editor' | 'analytics'` state. An Analytics button with BarChart3 icon toggles between views. The full three-panel editor layout is hidden in analytics view; FlowAnalyticsTab renders in its place.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired to live API calls against the `flow_analytics` and `flow_steps` tables.

## Self-Check: PASSED
