---
phase: 09-tab-shell-own-keys-migration
plan: "01"
subsystem: admin-ui
tags: [tabs, api-keys, admin, next-15]
dependency_graph:
  requires: []
  provides: [three-tab-shell, own-keys-tab, secrets-placeholder, endpoints-placeholder]
  affects: [app/admin/api-keys]
tech_stack:
  added: []
  patterns: [url-searchparams-tabs, server-component-composition]
key_files:
  created:
    - app/admin/api-keys/OwnKeysTab.tsx
    - app/admin/api-keys/SecretsPlaceholder.tsx
    - app/admin/api-keys/EndpointsPlaceholder.tsx
  modified:
    - app/admin/api-keys/page.tsx
key_decisions:
  - "Default tab is 'keys' — no param needed for Own Keys, consistent with most-used tab being the default"
  - "Fetch api_keys unconditionally in page.tsx — fast query, avoids conditional data fetch complexity"
  - "OwnKeysTab receives initialKeys as prop — server-rendered data passed to client component boundary via wrapper"
metrics:
  duration_minutes: 2
  completed_date: "2026-03-27"
  tasks_completed: 1
  tasks_total: 2
  files_changed: 4
status: checkpoint
---

# Phase 09 Plan 01: Tab Shell and Own Keys Migration Summary

**One-liner:** Three-tab shell at `/admin/api-keys` with URL-based switching and existing API key management moved into Own Keys tab.

## What Was Built

The flat `/admin/api-keys` page was converted into a three-tab interface using the same design tokens and URL-based tab pattern as the admin inbox page.

### Files Created

- **`app/admin/api-keys/OwnKeysTab.tsx`** — Server component wrapper that renders the existing `ApiKeysTable` with a header showing title "API Keys" and key count
- **`app/admin/api-keys/SecretsPlaceholder.tsx`** — Empty-state placeholder for Phase 10 (encrypted secrets manager) with lock icon
- **`app/admin/api-keys/EndpointsPlaceholder.tsx`** — Empty-state placeholder for Phase 11 (auto-scanned endpoints) with document icon

### Files Modified

- **`app/admin/api-keys/page.tsx`** — Rewritten as async server component accepting `searchParams: Promise<{ tab?: string }>`, deriving `activeTab` ('keys' | 'secrets' | 'endpoints'), rendering tab bar and conditionally rendering tab content

## Decisions Made

| Decision | Rationale |
|----------|-----------|
| Default tab is 'keys' | Own Keys is the most-used tab; no param needed, consistent with inbox pattern |
| Unconditional api_keys fetch | Fast query; avoids conditional fetch complexity per plan spec |
| OwnKeysTab as thin wrapper | Keeps server/client boundary clean — server component passes data to client table |

## Deviations from Plan

None — plan executed exactly as written. All 14 acceptance criteria passed.

## Known Stubs

- `SecretsPlaceholder.tsx` — placeholder content for Phase 10 (intentional; Phase 10 will replace with real secrets manager)
- `EndpointsPlaceholder.tsx` — placeholder content for Phase 11 (intentional; Phase 11 will replace with real endpoint docs)

These stubs are intentional by plan design. They do not block the plan's goal (tab shell + Own Keys migration).

## Checkpoint Status

Task 2 is a `checkpoint:human-verify` — awaiting human verification at `/admin/api-keys`.

## Self-Check: PASSED

- `app/admin/api-keys/page.tsx` — exists and modified
- `app/admin/api-keys/OwnKeysTab.tsx` — exists and created
- `app/admin/api-keys/SecretsPlaceholder.tsx` — exists and created
- `app/admin/api-keys/EndpointsPlaceholder.tsx` — exists and created
- Commit `6fa8b66` — verified in git log
- Build — passed with no errors
