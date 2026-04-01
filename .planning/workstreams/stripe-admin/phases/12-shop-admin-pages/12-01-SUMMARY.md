---
phase: 12-shop-admin-pages
plan: 01
subsystem: admin-shop-products
tags: [dnd-kit, server-actions, sortable-table, bulk-actions, products-admin]
dependency_graph:
  requires: [11-01]
  provides: [products-list-page, products-server-actions]
  affects: [app/admin/shop/products]
tech_stack:
  added: ["@dnd-kit/core@6.3.1", "@dnd-kit/sortable@10.0.0", "@dnd-kit/utilities@3.2.2"]
  patterns: [server-actions-write-partitioning, dnd-kit-sortable, optimistic-updates, url-based-filters]
key_files:
  created:
    - app/admin/shop/products/actions.ts
    - app/admin/shop/products/actions.test.ts
    - app/admin/shop/products/page.tsx
    - app/admin/shop/products/ProductsTable.tsx
    - app/admin/shop/products/ProductsFilters.tsx
  modified:
    - package.json (added @dnd-kit deps)
decisions:
  - "Write-partitioning enforced: GOYA products.is_active/priority via getSupabaseService(), Stripe active state via getStripe().products.update()"
  - "Status derivation: Deleted = stripe.active false; Draft = is_active false with stripe active; Published = both active"
  - "Sales counts fetched via stripe_orders table grouped in JS with Map for simplicity"
  - "Pagination for status/type filtering done client-side (JS) after fetching all products to support status derivation"
metrics:
  duration: "7 min"
  completed_date: "2026-03-24"
  tasks_completed: 2
  files_created: 5
---

# Phase 12 Plan 01: Products List Page Summary

**One-liner:** Products admin page at /admin/shop/products with dnd-kit sortable table, inline status pill toggle, bulk actions, and write-partitioned Server Actions.

## What Was Built

The complete Products admin list page under `/admin/shop/products`:

1. **Server Actions** (`actions.ts`) — four exported async functions with write-partitioning:
   - `toggleProductStatus`: updates `products.is_active` + Stripe `active` state
   - `bulkProductAction`: publish/draft/delete multiple products at once
   - `reorderProducts`: updates `products.priority` for each item in new order
   - `softDeleteProduct`: sets `is_active=false` + deactivates in Stripe

2. **Products Page** (`page.tsx`) — Server Component that:
   - Queries `products` table with sort/search/pagination
   - Fetches `stripe_products` + `stripe_prices` for type info and Stripe active state
   - Fetches `stripe_orders` to compute per-product sales counts
   - Derives status (Published/Draft/Deleted) from both `is_active` and `stripe.active`
   - Applies URL-based filters and pagination

3. **ProductsTable** (`ProductsTable.tsx`) — Client Component with:
   - `DndContext` + `SortableContext` + `useSortable` + `arrayMove` for drag-and-drop reorder
   - Inline status pill click-to-toggle with optimistic updates
   - Multi-select checkboxes with select-all
   - Bulk action bar (Publish / Draft / Delete) appearing on selection
   - Per-row trash icon for soft-delete

4. **ProductsFilters** (`ProductsFilters.tsx`) — Client Component with:
   - Debounced search input (300ms) updating `?search=` URL param
   - Status dropdown (All/Published/Draft/Deleted)
   - Type dropdown (All/One-time/Recurring)
   - Sort dropdown (Priority/Name A-Z/Name Z-A/Newest/Oldest)
   - Reset button clears all filters

## Tests

4 unit tests in `actions.test.ts` — all passing:
- `describe('reorderProducts')`: verifies correct priority values and stripe_product_id equality
- `describe('toggleProductStatus')`: verifies is_active update + Stripe sync
- `describe('softDeleteProduct')`: verifies is_active=false + Stripe deactivation
- `describe('bulkProductAction')`: verifies publish sets is_active=true for all items

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `9b390d4` | feat(12-01): install dnd-kit and create Products Server Actions with tests |
| Task 2 | `01a6ffe` | feat(12-01): build Products list page with dnd-kit sortable table, status pills, bulk actions |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Pre-existing untracked files from parallel agent broke build**
- **Found during:** Task 2 build verification
- **Issue:** `app/onboarding/components/*.tsx` files left by another parallel agent had TS type errors causing `npx next build` to fail with type errors in unrelated code
- **Fix:** Temporarily moved files aside to verify my code builds cleanly, then restored. These are out-of-scope files from another agent — not fixed, documented in deferred items.
- **Files modified:** None (files restored)
- **Commit:** N/A — out of scope

## Known Stubs

None — all data flows are wired to real Supabase queries and Stripe API calls.

## Self-Check: PASSED
