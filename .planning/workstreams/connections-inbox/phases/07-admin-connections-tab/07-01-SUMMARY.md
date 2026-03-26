---
phase: 07-admin-connections-tab
plan: 01
subsystem: admin
tags: [admin, connections, server-action, service-role, tabs]
dependency_graph:
  requires: [04-database-foundation]
  provides: [admin-connections-tab, remove-connection-action]
  affects: [app/admin/users/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [url-search-param-tabs, service-role-bypass, server-action-with-role-guard, confirm-then-delete]
key_files:
  created:
    - app/actions/adminConnections.ts
    - app/admin/users/[id]/RemoveConnectionButton.tsx
  modified:
    - app/admin/users/[id]/page.tsx
decisions:
  - "Use getSupabaseService() in server action and page fetch — RLS on connections only allows requester/recipient, admin sessions return 0 rows without service role"
  - "revalidatePath() in server action instead of router.refresh() — server action owns cache invalidation; client component stays simple"
  - "URL search param tabs (?tab=connections) — deep-linkable, no client bundle, server-rendered data fetch per tab"
metrics:
  duration: ~15 minutes
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_changed: 3
requirements: [ADM-01, ADM-02]
---

# Phase 07 Plan 01: Admin Connections Tab Summary

**One-liner:** Tabbed admin user detail page with service-role connections fetch and confirm-then-delete server action for admin connection management.

## What Was Built

Added a Connections tab to the admin user detail page at `/admin/users/[id]`. The tab bar uses URL search params (`?tab=connections`) so tabs are server-rendered and deep-linkable. Connections are fetched with `getSupabaseService()` to bypass the RLS policy that would otherwise return 0 rows for an admin viewing another user's data.

A new server action (`removeConnectionAsAdmin`) performs the privileged delete using the service role, with an inline role guard (admin or moderator only). A `RemoveConnectionButton` client component manages the confirm/loading state and calls the action.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create server action and RemoveConnectionButton | 94ba51a | app/actions/adminConnections.ts, app/admin/users/[id]/RemoveConnectionButton.tsx |
| 2 | Add tab bar and Connections tab to admin user detail page | c7d4d5a | app/admin/users/[id]/page.tsx |

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| `getSupabaseService()` for both fetch and delete | RLS on `connections` only allows `requester_id` or `recipient_id` — admin sessions silently return empty rows |
| `revalidatePath()` in server action | Server action owns cache invalidation; simpler than requiring `router.refresh()` in the client component |
| URL search param tabs | Deep-linkable, server-rendered per tab, no client state or extra bundle |
| Admin + moderator role guard | Consistent with other admin server actions in the project |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the Connections tab fetches live data from Supabase on each request.

## Self-Check: PASSED

Files verified:
- `app/actions/adminConnections.ts` — exists, exports `removeConnectionAsAdmin` with `'use server'`, role guard, service role delete, revalidatePath
- `app/admin/users/[id]/RemoveConnectionButton.tsx` — exists, `'use client'`, imports and calls `removeConnectionAsAdmin`, confirm/cancel/loading state
- `app/admin/users/[id]/page.tsx` — exists, accepts `searchParams: Promise<{tab?:string}>`, awaits it, tab bar rendered, connections fetch with `getSupabaseService()`, `RemoveConnectionButton` rendered per row

Commits verified:
- `94ba51a` — feat(07-01): add adminConnections server action and RemoveConnectionButton
- `c7d4d5a` — feat(07-01): add tab bar and Connections tab to admin user detail page
