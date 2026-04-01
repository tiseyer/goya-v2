---
date: 2026-03-30
task_id: 260330-cwt
status: DONE
---

# Quick Task: Fix Migration Overwrite Mode — Handle Already-Registered Users

## Task Description

When re-running migration in overwrite mode, `supabase.auth.admin.createUser` fails for users who already exist in Supabase Auth, returning "already registered" or "Database error creating new user". Previously these failures immediately threw, causing the user to be counted as an error and skipped entirely.

## Solution

Modified `migration/import-core.ts` to catch known auth conflict errors and fall back to `supabase.auth.admin.listUsers` to find the existing auth user by email. If found, their ID is reused for the profile upsert and they are counted as "updated". Only truly unresolvable cases (cannot create AND cannot find by email) count as errors.

Key implementation details:
- `/already registered/i` and `/database error/i` patterns trigger the fallback path
- `listUsers({ page: 1, perPage: 1000 })` used (no `getUserByEmail` in Supabase admin API)
- `isExistingAuthUser` flag skips the 150ms trigger delay and routes to `updated` counter
- Unknown auth errors still throw immediately

## Commit

`cf978f2` — fix(migration): handle already-registered users gracefully in overwrite mode
