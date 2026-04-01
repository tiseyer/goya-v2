---
phase: 02-users
plan: "02"
subsystem: api/users
tags: [rest-api, users, write-endpoint, sub-resources, audit-log]
dependency_graph:
  requires: [lib/api/services/users.ts, lib/api/handler.ts, lib/api/middleware.ts, lib/api/pagination.ts, lib/api/response.ts, lib/audit.ts]
  provides: [app/api/v1/users/[id]/route.ts (PATCH), app/api/v1/users/[id]/credits/route.ts, app/api/v1/users/[id]/certifications/route.ts, app/api/v1/users/[id]/verifications/route.ts]
  affects: [lib/api/services/users.ts]
tech_stack:
  added: []
  patterns: [service-layer, handler-factory, middleware-chain, audit-logging, allowlist-validation]
key_files:
  created:
    - app/api/v1/users/[id]/credits/route.ts
    - app/api/v1/users/[id]/certifications/route.ts
    - app/api/v1/users/[id]/verifications/route.ts
  modified:
    - lib/api/services/users.ts
    - app/api/v1/users/[id]/route.ts
decisions:
  - "PATCH body validation: allowlist check first (unknown keys → 400), then enum value check per field"
  - "PATCH 404 vs 500 disambiguation: if updateUser fails, call getUserById to distinguish not-found from DB error"
  - "getUserCertifications uses as any cast on supabase client — user_designations and products tables not in generated types"
  - "getUserVerifications queries only verification-specific fields from profiles (not full profile) — focused response"
  - "verifications endpoint returns 404 when no data — profile row not found indicates user does not exist"
metrics:
  duration_minutes: 10
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_created: 3
  files_modified: 2
---

# Phase 02 Plan 02: Users Write Endpoint and Sub-Resource Reads Summary

PATCH /api/v1/users/:id with allowlist field validation and audit logging, plus three sub-resource GET endpoints for credits, certifications, and verifications.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Add update and sub-resource service functions | f8e172e | lib/api/services/users.ts |
| 2 | Add PATCH handler and create sub-resource route files | 0c99d94 | app/api/v1/users/[id]/route.ts, credits/route.ts, certifications/route.ts, verifications/route.ts |

## What Was Built

**lib/api/services/users.ts (additions)**
- `updateUser(id, updates)` — validates allowlist fields (role, subscription_status, member_type), adds updated_at, updates profiles table
- `getUserCredits(userId, pagination)` — paginated credit_entries query with sort/range support; `CREDITS_SORT_FIELDS` constant exported
- `getUserCertifications(userId)` — user_designations joined with products(name, full_name, category, slug), excludes soft-deleted rows
- `getUserVerifications(userId)` — queries id, verification_status, is_verified, certificate_url, certificate_is_official from profiles

**app/api/v1/users/[id]/route.ts (PATCH added)**
- PATCH /api/v1/users/:id — requires 'write' permission
- Validates request body: unknown keys → 400 INVALID_FIELD; invalid enum values → 400 INVALID_VALUE
- Empty body (no valid fields) → 400 MISSING_FIELDS
- On updateUser error: checks user existence to distinguish 404 vs 500
- Logs audit entry: category='admin', action='user.update' with fields_updated metadata

**app/api/v1/users/[id]/credits/route.ts**
- GET /api/v1/users/:id/credits — requires 'read' permission
- Parses pagination with CREDITS_SORT_FIELDS (created_at, activity_date, amount, credit_type, status)
- Returns paginatedResponse with full pagination metadata

**app/api/v1/users/[id]/certifications/route.ts**
- GET /api/v1/users/:id/certifications — requires 'read' permission
- Returns successResponse(data) — no pagination (typically small dataset)
- Includes joined product info (name, full_name, category, slug)

**app/api/v1/users/[id]/verifications/route.ts**
- GET /api/v1/users/:id/verifications — requires 'read' permission
- Returns 404 when user not found, successResponse with verification fields otherwise

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all endpoints query live Supabase tables.

## Self-Check: PASSED

Files exist:
- lib/api/services/users.ts: FOUND
- app/api/v1/users/[id]/route.ts: FOUND
- app/api/v1/users/[id]/credits/route.ts: FOUND
- app/api/v1/users/[id]/certifications/route.ts: FOUND
- app/api/v1/users/[id]/verifications/route.ts: FOUND

Commits exist:
- f8e172e: FOUND
- 0c99d94: FOUND
