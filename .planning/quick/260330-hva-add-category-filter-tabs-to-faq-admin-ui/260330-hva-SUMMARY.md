---
phase: quick
plan: 260330-hva
subsystem: admin/chatbot
tags: [faq, admin-ui, filter, category]
dependency_graph:
  requires: [FaqItem.category (20260366 migration)]
  provides: [Category filter tabs in FAQ admin UI]
  affects: [app/admin/chatbot/FaqTab.tsx, lib/chatbot/types.ts, app/admin/chatbot/chatbot-actions.ts]
tech_stack:
  added: []
  patterns: [useMemo for derived state, combined filter chain]
key_files:
  modified:
    - app/admin/chatbot/FaqTab.tsx
    - lib/chatbot/types.ts
    - app/admin/chatbot/chatbot-actions.ts
decisions:
  - "Category tabs derive from items state (full list) so tabs stay stable when search filters table"
  - "categoryFilter and search combine independently — both filters always apply simultaneously"
  - "handleCreated does not reset categoryFilter — new FAQ appears in filtered view only if it matches"
metrics:
  duration: ~10 min
  completed: 2026-03-30
  tasks_completed: 1
  files_modified: 3
---

# Quick Task 260330-hva: Add Category Filter Tabs to FAQ Admin UI

**One-liner:** Pill-style category tabs with dynamic counts above FAQ table, combining with search via useMemo filter chain.

## What Was Built

Category filter tabs rendered between the toolbar and the FAQ table in `/admin/chatbot`. Tabs show "All" plus one tab per unique category value, each with a count badge. Clicking a tab filters the table to that category. Search and category filter combine — both must match for a row to appear.

## Files Changed

| File | Change |
|------|--------|
| `app/admin/chatbot/FaqTab.tsx` | Added `categoryFilter` state, `categories`/`categoryCounts` memos, tab bar JSX, updated `filteredItems` to useMemo with combined filter |
| `lib/chatbot/types.ts` | Added `category: string | null` to `FaqItem` interface (reflects 20260366 DB migration) |
| `app/admin/chatbot/chatbot-actions.ts` | Added `category: data.category ?? null` to returned item object in `createFaqItem` action |

## Commits

| Hash | Message |
|------|---------|
| 411f37c | (FaqTab.tsx + types.ts changes captured by parallel agent commit) |
| 7057ec5 | feat(260330-hva): add category filter tabs to FAQ admin UI |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] FaqItem type missing `category` field**
- **Found during:** Task 1 — build failed with "Property 'category' does not exist on type 'FaqItem'"
- **Issue:** The `20260366_add_faq_category.sql` migration added the column but the TypeScript type was never updated
- **Fix:** Added `category: string | null` to `FaqItem` in `lib/chatbot/types.ts`
- **Files modified:** `lib/chatbot/types.ts`

**2. [Rule 1 - Bug] chatbot-actions.ts not returning `category` in created item**
- **Found during:** Task 1 — after fixing FaqItem type, build failed on chatbot-actions.ts mapping
- **Issue:** The `createFaqItem` server action returned a hardcoded FaqItem shape missing `category`
- **Fix:** Added `category: data.category ?? null` to the returned item
- **Files modified:** `app/admin/chatbot/chatbot-actions.ts`

## Deferred (Out of Scope)

- `lib/health-checks.ts:181` — `Property 'VERSION' does not exist on type 'Stripe'` — introduced by GOYA-REST-API workstream, not related to this task. Logged in `deferred-items.md`.

## Verification

Build compiles (FaqTab and chatbot module). Category tabs derive dynamically from items state. Search + category filters combine correctly via useMemo dependency array `[items, search, categoryFilter]`.

## Self-Check: PASSED

- `app/admin/chatbot/FaqTab.tsx` — exists, contains `categoryFilter`, `categories`, `categoryCounts`, tab bar JSX
- `lib/chatbot/types.ts` — contains `category: string | null` in FaqItem
- `app/admin/chatbot/chatbot-actions.ts` — contains `category: data.category ?? null`
- Commits 411f37c and 7057ec5 exist in git log
