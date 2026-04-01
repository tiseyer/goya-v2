---
phase: 01-foundation
plan: 01
subsystem: api-foundation
tags: [api, database, types, response-helpers]
requirements: [AUTH-01, AUTH-04, AUTH-09]

dependency_graph:
  requires: []
  provides:
    - api_keys table DDL (supabase/migrations/20260348_api_keys.sql)
    - API type definitions (lib/api/types.ts)
    - Response helper functions (lib/api/response.ts)
  affects:
    - All subsequent API plans (consume lib/api/types.ts and lib/api/response.ts)

tech_stack:
  added: []
  patterns:
    - Service role client for all API data access (AUTH-09)
    - Standard { success, data, error, meta } response envelope (AUTH-04)
    - API keys stored as hashed values (AUTH-01)

key_files:
  created:
    - supabase/migrations/20260348_api_keys.sql
    - lib/api/types.ts
    - lib/api/response.ts
  modified: []

decisions:
  - RLS enabled on api_keys with no policies — enforces service-role-only access at DB level
  - API version pinned as constant (1.0.0) in response.ts — easy to bump for major API changes
  - buildMeta() is internal helper — keeps exported functions clean and DRY

metrics:
  duration: ~5 minutes
  completed: 2026-03-25
  tasks_completed: 2
  files_created: 3
---

# Phase 01 Plan 01: API Foundation — Migration + Types + Response Helpers Summary

**One-liner:** api_keys table DDL with hashed-key schema plus TypeScript type definitions and NextResponse helper functions implementing the { success, data, error, meta } envelope.

## What Was Built

### Task 1: api_keys migration and API type definitions

Created `supabase/migrations/20260348_api_keys.sql` with the `api_keys` table:
- `key_hash text NOT NULL UNIQUE` — stores bcrypt/SHA-256 hash, never the raw key
- `key_prefix text NOT NULL` — first 8 chars for UI identification without exposing the key
- `permissions text[]` — array of `read | write | admin` permission strings
- `created_by uuid` — FK to profiles, SET NULL on delete
- `last_used_at`, `request_count` — usage tracking fields
- `active boolean` — soft-delete flag
- Partial index on `key_hash WHERE active = true` — fast validation lookups
- RLS enabled with no policies — only accessible via service role client

Created `lib/api/types.ts` exporting:
- `ApiKeyPermission` — `'read' | 'write' | 'admin'`
- `ApiResponse<T>` — standard envelope with `success`, `data`, `error`, `meta`
- `ApiErrorDetail` — `code`, `message`, optional `details`
- `ApiMeta` — `timestamp`, `version`, optional `pagination`
- `PaginationMeta` — `page`, `limit`, `total`, `total_pages`, `has_next`, `has_prev`
- `PaginationParams` — `page`, `limit`, `sort`, `order`
- `ApiKeyRow` — mirrors the migration column shape

### Task 2: Response helper functions

Created `lib/api/response.ts` exporting three helpers:
- `successResponse<T>(data, status?)` — wraps data in success envelope, `error: null`
- `errorResponse(code, message, status, details?)` — wraps error detail, `data: null`, `success: false`
- `paginatedResponse<T>(data, pagination, status?)` — includes pagination in meta
- All use `NextResponse.json()` with explicit status codes
- Documented `getSupabaseService` import pattern per AUTH-09

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — no UI rendering or data wiring in this plan. Types and helpers are complete definitions.

## Self-Check: PASSED

- supabase/migrations/20260348_api_keys.sql: FOUND
- lib/api/types.ts: FOUND
- lib/api/response.ts: FOUND
- Commit 26d6b80: Task 1 (migration + types)
- Commit 398ec2d: Task 2 (response helpers)
