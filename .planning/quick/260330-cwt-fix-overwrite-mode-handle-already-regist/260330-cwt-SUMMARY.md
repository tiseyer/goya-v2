---
phase: quick
plan: 260330-cwt
subsystem: migration
tags: [migration, auth, overwrite-mode, bug-fix]
dependency_graph:
  requires: []
  provides: [graceful-already-registered-handling]
  affects: [migration/import-core.ts]
tech_stack:
  added: []
  patterns: [fallback-lookup-on-conflict]
key_files:
  modified:
    - migration/import-core.ts
decisions:
  - "Use listUsers (page/perPage) rather than getUserByEmail — Supabase admin API has no getUserByEmail method"
  - "isExistingAuthUser flag drives both the 150ms delay skip and the created/updated counter choice"
metrics:
  duration: ~5 min
  completed: 2026-03-30
---

# Quick Task 260330-cwt: Fix Overwrite Mode — Handle Already-Registered Users

**One-liner:** Fallback lookup via listUsers when createUser returns "already registered" or "Database error" so overwrite-mode re-runs count existing auth users as "updated" rather than "error".

## What Was Done

Modified `migration/import-core.ts` — the "Create new user" block inside `importUsersFromData`.

Previously, any `authError` from `supabase.auth.admin.createUser` was immediately re-thrown, causing the user to land in the error bucket. In overwrite mode this silently skipped re-runs for users who already existed in Supabase Auth.

**New behaviour:**

1. If `authError.message` matches `/already registered/i` or `/database error/i` → attempt fallback lookup via `supabase.auth.admin.listUsers({ page: 1, perPage: 1000 })`.
2. If existing auth user found by email → use their `id`, set `isExistingAuthUser = true`, log a `console.warn`.
3. If NOT found → throw original error (real failure).
4. If error message does not match known conflict patterns → throw immediately (unknown error).
5. `isExistingAuthUser` controls:
   - Skip the 150ms trigger-delay (profile row already exists).
   - Increment `updated` counter instead of `created`.
   - Set result status to `'updated'`.

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Message |
|------|---------|
| cf978f2 | fix(migration): handle already-registered users gracefully in overwrite mode |

## Self-Check: PASSED

- migration/import-core.ts modified and committed at cf978f2
- TypeScript check: zero errors in migration/ files
