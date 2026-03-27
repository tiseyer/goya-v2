---
phase: 08-admin-ui-and-documentation
plan: 01
subsystem: ui
tags: [admin, api-keys, server-actions, next-app-router]

# Dependency graph
requires:
  - phase: 01-api-key-auth
    provides: api_keys table with key_hash, key_prefix, permissions, active, last_used_at, request_count columns
provides:
  - Admin UI for creating API keys (name + permissions, show raw key once)
  - Admin UI for revoking API keys (optimistic update)
  - API keys usage display (last_used_at, request_count)
  - Sidebar navigation entry for /admin/api-keys
affects: [08-02-admin-documentation]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Server action returning rawKey exactly once (never stored in plaintext)
    - Optimistic UI for revoke: setKeys locally before server confirms
    - Placeholder row prepend on create (revalidatePath syncs real row on next hard nav)

key-files:
  created:
    - app/admin/api-keys/actions.ts
    - app/admin/api-keys/page.tsx
    - app/admin/api-keys/ApiKeysTable.tsx
  modified:
    - app/admin/components/AdminShell.tsx

key-decisions:
  - "createApiKey returns rawKey in server action response — shown once, never persisted to client state after dismiss"
  - "Optimistic placeholder row on create: prepend with pending-${Date.now()} id, revalidatePath handles real sync"
  - "getSupabaseService() as any for api_keys queries — table not in generated types, consistent with Phase 01 pattern"

patterns-established:
  - "One-time key display: amber banner with copy button + dismiss; rawKey cleared from state on dismiss"
  - "Relative time for last_used_at (e.g. 3 days ago), absolute date for created_at (Mar 25, 2026)"

requirements-completed: [AKUI-01, AKUI-02, AKUI-03]

# Metrics
duration: 3min
completed: 2026-03-27
---

# Phase 08 Plan 01: API Keys Admin UI Summary

**Admin CRUD UI for API keys with one-time raw key display, optimistic revoke, and usage stats table.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-27T02:42:01Z
- **Completed:** 2026-03-27T02:45:00Z
- **Tasks:** 2 of 2 auto tasks complete (1 checkpoint pending human verify)
- **Files modified:** 4

## Accomplishments

1. **Server actions** (`app/admin/api-keys/actions.ts`): `createApiKey` generates 32-byte random hex key, computes SHA-256 hash, inserts to `api_keys` with prefix, permissions, created_by. Returns `{ success, rawKey }` — raw value returned exactly once. `revokeApiKey` sets `active=false`.

2. **Page** (`app/admin/api-keys/page.tsx`): Async server component fetching all api_keys rows via `getSupabaseService() as any`, ordered by `created_at DESC`, passes typed `ApiKeyRow[]` to `<ApiKeysTable>`.

3. **Client table** (`app/admin/api-keys/ApiKeysTable.tsx`): Create form with name input + read/write/admin checkboxes. Post-create amber banner shows raw key with copy button and "will not be shown again" warning — cleared on dismiss. Table columns: Name, Key Prefix (prefix + "..."), Permissions (colored pills), Status (emerald/red pill), Last Used (relative), Requests, Created (absolute), Actions (Revoke button for active keys). Optimistic revoke.

4. **Sidebar** (`app/admin/components/AdminShell.tsx`): "API Keys" nav entry added before "Settings" with lock/key SVG icon, routing to `/admin/api-keys`.

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `app/admin/api-keys/actions.ts` — FOUND
- `app/admin/api-keys/page.tsx` — FOUND
- `app/admin/api-keys/ApiKeysTable.tsx` — FOUND
- `app/admin/components/AdminShell.tsx` — MODIFIED (api-keys entry added)
- Commit `392a291` — feat(08-01): add API keys server actions and page
- Commit `2a1e1f7` — feat(08-01): add ApiKeysTable client component and sidebar nav entry
