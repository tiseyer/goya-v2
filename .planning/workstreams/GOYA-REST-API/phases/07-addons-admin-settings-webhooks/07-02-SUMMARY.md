---
phase: 07-addons-admin-settings-webhooks
plan: 02
subsystem: REST API - Add-ons (User Assignments)
tags: [addons, user-designations, assignments, rest-api, soft-delete]
dependency_graph:
  requires: [07-01]
  provides: [ADON-06, ADON-07, ADON-08]
  affects: [user_designations table, lib/api/services/addons.ts]
tech_stack:
  added: []
  patterns: [service-layer, api-handler, soft-delete-deleted_at, duplicate-check, audit-log]
key_files:
  created:
    - app/api/v1/addons/users/[userId]/route.ts
    - app/api/v1/addons/users/[userId]/[addonId]/route.ts
  modified:
    - lib/api/services/addons.ts
key_decisions:
  - "ALREADY_ASSIGNED returned as const string (not Error) for pattern-matching in route handler — same as event ALREADY_REGISTERED"
  - "addonId in DELETE route is user_designations.id (assignment row), not the product ID — prevents accidental mis-routing"
  - "GET /api/v1/addons/users/:userId has no pagination — users typically have few designations, consistent with getUserCertifications pattern"
metrics:
  duration_minutes: 5
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 07 Plan 02: User-Addon Assignment Endpoints Summary

**One-liner:** User-addon assignment REST endpoints backed by user_designations table — list active designations with product join, assign with duplicate guard, soft-delete via deleted_at.

## What Was Built

Three service functions appended to the existing `lib/api/services/addons.ts`, plus two route files with three HTTP method handlers for the `user_designations` table.

### Task 1: User-addon service functions (`lib/api/services/addons.ts`)

- `getUserAddons(userId)` — queries `user_designations` with `products(name, full_name, category, slug)` join, filters `deleted_at = null`
- `assignAddonToUser(userId, params)` — duplicate check via `.maybeSingle()` before insert; returns `{ data: null, error: 'ALREADY_ASSIGNED' as const }` on conflict
- `removeAddonFromUser(userId, addonId)` — soft-delete: `.update({ deleted_at: new Date().toISOString() })` scoped to `id + user_id + deleted_at = null`
- `AssignAddonParams` interface exported: `{ stripe_product_id: string; stripe_price_id: string }`

Commit: `7ec0bb1`

### Task 2: User-addon assignment route handlers

**`app/api/v1/addons/users/[userId]/route.ts`**
- `GET` — auth/rate-limit/read-permission, UUID validation, calls `getUserAddons`, returns plain array (no pagination)
- `POST` — auth/rate-limit/write-permission, UUID validation, required field validation for `stripe_product_id` and `stripe_price_id`, 409 on `ALREADY_ASSIGNED`, audit log on success, 201 response

**`app/api/v1/addons/users/[userId]/[addonId]/route.ts`**
- `DELETE` — auth/rate-limit/write-permission, dual UUID validation (userId + addonId), 404 on missing/already-deleted, audit log on success

Commit: `f1bf6fb`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Self-Check: PASSED

- `lib/api/services/addons.ts` — FOUND
- `app/api/v1/addons/users/[userId]/route.ts` — FOUND
- `app/api/v1/addons/users/[userId]/[addonId]/route.ts` — FOUND
- Commit 7ec0bb1 — FOUND
- Commit f1bf6fb — FOUND
