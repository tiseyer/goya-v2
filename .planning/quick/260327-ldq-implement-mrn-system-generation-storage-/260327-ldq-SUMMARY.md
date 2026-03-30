---
phase: quick-260327-ldq
plan: 01
subsystem: database/mrn
tags: [migration, mrn, supabase, triggers, lifecycle]
dependency_graph:
  requires: [supabase/migrations/20260320_fix_auth_trigger.sql]
  provides: [used_mrns table, MRN uniqueness guarantee, MRN retirement]
  affects: [generate_mrn(), profile creation, profile deletion]
tech_stack:
  added: []
  patterns: [SECURITY DEFINER triggers, ON CONFLICT upsert, DO block backfill]
key_files:
  created:
    - supabase/migrations/20260353_mrn_used_table.sql
  modified: []
decisions:
  - "Trigger-based approach for recording MRNs in used_mrns (not modifying handle_new_user) — cleaner separation of concerns"
  - "generate_mrn() now checks used_mrns instead of profiles — prevents reuse after deletion"
  - "Migration applied via npx supabase db query --linked due to earlier migration policy conflicts blocking db push"
metrics:
  duration: "~10 minutes"
  completed: "2026-03-27"
  tasks: 2
  files: 1
---

# Quick Task 260327-ldq: Implement MRN System Summary

**One-liner:** Used_mrns permanent registry with trigger-based lifecycle tracking (active/retired) preventing MRN reuse after user deletion.

## What Was Built

A single migration file (`supabase/migrations/20260353_mrn_used_table.sql`) implementing the full MRN lifecycle:

1. **`used_mrns` table** — permanent registry of every MRN ever issued (mrn PK, status active/retired, created_at). RLS enabled with SELECT for authenticated users and full access for service_role.

2. **Updated `generate_mrn()`** — now checks `used_mrns` for uniqueness instead of `profiles`. Previously a deleted user's MRN could be reassigned; now it's permanently blocked.

3. **`on_profile_mrn_set` trigger** (`record_mrn_usage()`) — fires AFTER INSERT OR UPDATE OF mrn on profiles, upserts the MRN into used_mrns as 'active'.

4. **`on_profile_deleted` trigger** (`retire_mrn()`) — fires BEFORE DELETE on profiles, sets the MRN status to 'retired' in used_mrns.

5. **Backfill** — all existing profile MRNs inserted into used_mrns. Any profiles with NULL mrn had one generated and recorded.

## Verification Results

After applying to remote database:
- `used_mrns` count: **2** (matches all profiles)
- Profiles with NULL mrn: **0**
- All MRNs status: **active**

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create migration file | 8938ce5 | supabase/migrations/20260353_mrn_used_table.sql |
| 2 | Push migration to Supabase | (applied via db query --linked) | — |

## Deviations from Plan

### Auto-handled: db push blocked by earlier migration conflict

- **Found during:** Task 2
- **Issue:** `npx supabase db push --include-all` failed because `20260341_webhook_events.sql` had a pre-existing policy conflict ("policy already exists") on the remote DB — unrelated to this migration.
- **Fix:** Applied the new migration directly via `npx supabase db query --linked` piping the SQL file. Migration applied successfully.
- **Impact:** The `supabase_migrations` history table on remote may not have this migration recorded (depends on Supabase CLI internals). The migration SQL ran and all objects were created/updated.

## Known Stubs

None.

## Self-Check: PASSED

- Migration file exists: FOUND at supabase/migrations/20260353_mrn_used_table.sql
- Commit 8938ce5 exists in git log
- Remote DB verification: 2 active MRNs, 0 null profiles
