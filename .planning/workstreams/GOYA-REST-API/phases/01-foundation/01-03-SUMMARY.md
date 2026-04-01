---
phase: 01-foundation
plan: 03
subsystem: api-middleware
tags: [api, middleware, auth, rate-limiting, permissions]
requirements: [AUTH-02, AUTH-03, AUTH-06]

dependency_graph:
  requires: [01-01, 01-02]
  provides:
    - validateApiKey middleware (lib/api/middleware.ts)
    - rateLimit middleware (lib/api/middleware.ts)
    - requirePermission middleware (lib/api/middleware.ts)
  affects:
    - All /api/v1/ route handlers (consume middleware functions)

tech_stack:
  added: []
  patterns:
    - Composable middleware functions returning Response | null/ApiKeyRow
    - SHA-256 hashing via Node.js crypto module for key validation
    - In-memory sliding-window rate limiting with periodic stale-entry cleanup
    - admin permission supersedes all — single admin check covers all scopes

key_files:
  created:
    - lib/api/middleware.ts
  modified: []

decisions:
  - "as any cast on Supabase client for api_keys queries — table exists in DB but not in generated types (types regeneration deferred to after migration is applied)"
  - "Fire-and-forget last_used_at / request_count update — usage tracking is best-effort, not a blocking concern"
  - "Retry-After header set on 429 responses — standard HTTP compliance alongside the JSON body"
  - "Periodic stale entry cleanup every 1000 calls — avoids unbounded memory growth without background timers"

metrics:
  duration_minutes: 35
  completed_date: "2026-03-25"
  tasks_completed: 1
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 03: API Middleware Summary

**One-liner:** `validateApiKey` / `rateLimit` / `requirePermission` — three composable middleware functions using SHA-256 key hashing, in-memory sliding-window rate limiting (100 req/60s), and permission-array checks with admin superseding all scopes.

## What Was Built

### lib/api/middleware.ts

Three exported middleware functions composable in any route handler:

**`validateApiKey(req: NextRequest): Promise<ApiKeyRow | Response>`**

- Extracts key from `x-api-key` header with `Authorization: Bearer ...` fallback
- Returns 401 `UNAUTHORIZED` immediately if no key present
- SHA-256 hashes the key via `crypto.createHash('sha256')` and queries `api_keys` WHERE `key_hash = ? AND active = true`
- Returns 401 `UNAUTHORIZED` if no matching active key found
- On success: fires best-effort update of `last_used_at` and `request_count` (no await)
- Returns `ApiKeyRow` on success

**`rateLimit(keyId: string): Response | null`**

- Module-scope `Map<string, { count: number; resetAt: number }>` tracks per-key windows
- Window: 60 seconds. Limit: 100 requests per key.
- Resets window automatically when `resetAt` has passed
- Returns 429 `RATE_LIMITED` with `Retry-After` header and `retry_after` in error details when limit exceeded
- Every 1000 calls, purges stale entries (past their `resetAt`) to prevent unbounded memory growth
- Returns `null` if under limit

**`requirePermission(apiKey: ApiKeyRow, required: ApiKeyPermission): Response | null`**

- Checks `apiKey.permissions` array for `'admin'` — grants access to everything
- Falls through to check for the specific required permission
- Returns 403 `FORBIDDEN` if neither check passes
- Returns `null` if allowed

All errors use the standard `errorResponse()` helper from `lib/api/response.ts`, preserving the `{ success, data, error, meta }` envelope shape.

## Requirements Satisfied

- **AUTH-02**: `validateApiKey` validates API key on every request with constant-time DB lookup via hashed key
- **AUTH-03**: `rateLimit` enforces 100 req/min per key with proper 429 response and Retry-After header
- **AUTH-06**: `requirePermission` provides admin permission check composable into any route handler

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Supabase `api_keys` table not in generated Database types**

- **Found during:** Task 1 — TypeScript compilation
- **Issue:** The `api_keys` table migration (created in plan 01-01) exists in the DB but the `types/supabase.ts` generated types file was never regenerated to include it. Calling `.from('api_keys')` on the typed Supabase client caused TS2769 type errors.
- **Fix:** Cast Supabase client to `any` for `api_keys` queries with an eslint-disable comment. The type `ApiKeyRow` (from `lib/api/types.ts`) is still used for the returned data, preserving type safety at the application level.
- **Files modified:** lib/api/middleware.ts
- **Commit:** ce1737d (same task commit)

## Known Stubs

None — no UI rendering or data wiring in this plan. All middleware functions are complete implementations.

## Self-Check: PASSED

- lib/api/middleware.ts: FOUND (162 lines, 3 exported functions)
- Commit ce1737d: FOUND
- validateApiKey exports confirmed
- rateLimit exports confirmed
- requirePermission exports confirmed
- sha256 hashing via createHash confirmed
- All three error codes (401, 403, 429) present
