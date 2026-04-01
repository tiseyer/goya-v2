---
phase: 02-import-script-test-data
plan: 02
subsystem: migration
tags: [import-script, supabase, typescript, cli, users]
dependency_graph:
  requires: [02-01]
  provides: [migration/import-users.ts, import CLI with skip/overwrite modes]
  affects: [supabase auth, profiles table, stripe_orders table]
tech_stack:
  added: [tsx@4.21.0]
  patterns: [supabase admin API, profiles email lookup, stripe_orders upsert, env parsing without dotenv]
key_files:
  created:
    - migration/import-users.ts
  modified:
    - package.json
    - package-lock.json
decisions:
  - "Use profiles table email lookup instead of listUsers() for efficient duplicate detection at any scale"
  - "biography column not present in live DB — use bio column instead (002_profile_fields.sql not applied)"
  - "Live profiles schema differs from plan spec — mapped to actual columns (city, country, teaching_styles, teaching_focus_arr, influences_arr)"
  - "Run overwrite mode to fix profiles after first skip-mode run failed due to column mismatch"
metrics:
  duration: ~15m
  completed: 2026-03-27
  tasks_completed: 2/2
  files_changed: 3
requirements_satisfied: [IMPT-01, IMPT-02, IMPT-03, IMPT-04, IMPT-05, IMPT-06, IMPT-07, IMPT-08, IMPT-09, IMPT-10, IMPT-11, IMPT-12, TEST-05]
---

# Phase 02 Plan 02: Import Script and Test Data Run Summary

**One-liner:** TypeScript CLI import script that reads WP export JSON and creates Supabase auth users with full profile mapping, Stripe orders, MRN generation, and migration logging — successfully importing all 25 dummy users.

## What Was Built

`migration/import-users.ts` — a standalone TypeScript CLI script runnable via `npx tsx`. It reads one or more WP export JSON files and creates or updates users in Supabase with:

- Auth user creation via `supabase.auth.admin.createUser` (service role key)
- Profile update using actual live DB columns after the `handle_new_user` trigger auto-creates the row
- Role mapping: subscriber/member → student, teacher → teacher, wellness → wellness_practitioner, administrator → admin
- Stripe subscription upsert into `stripe_orders` (by `stripe_id` to avoid duplicates)
- `requires_password_reset: true` set for all migrated users
- Migration log JSON written to `migration/migration-log-{timestamp}.json`

**Modes:**
- `--mode=skip`: skips existing emails, creates new ones
- `--mode=overwrite`: updates profile/subscription data for existing users, creates new ones

**Run result:** 25/25 dummy users imported (0 errors). Sample user `priya.sharma@test.goya.com` verified with `role=teacher`, `mrn=14862981`, `requires_password_reset=true`, `city=Mumbai`, `country=India`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] biography column does not exist in live DB**
- **Found during:** Task 2 (first import run)
- **Issue:** Plan spec referenced `biography` column (from 002_profile_fields.sql) but live DB only has `bio`. Migration 002 not applied to linked project.
- **Fix:** Changed `biography` to `bio` in profile update mapping.
- **Files modified:** migration/import-users.ts
- **Commit:** d54828d

**2. [Rule 1 - Bug] Multiple plan-spec columns absent from live DB**
- **Found during:** Task 2 (first import run), confirmed via `information_schema.columns` query
- **Issue:** Columns referenced in plan (`introduction`, `practice_level`, `practice_styles`, `years_teaching`, `teaching_styles_profile`, `teaching_format`, `lineage`) do not exist in the live DB. Live schema uses `city`, `country`, `teaching_styles`, `teaching_focus_arr`, `influences_arr` instead.
- **Fix:** Rewrote `buildProfileUpdate()` to only set columns confirmed to exist in the live schema.
- **Files modified:** migration/import-users.ts
- **Commit:** d54828d

**3. [Rule 1 - Bug] `basename` function receiving array index as second argument**
- **Found during:** Task 2 (fatal error after import loop)
- **Issue:** `filePaths.map(basename)` passes `(element, index, array)` to `basename`, and `basename(path, index)` throws `ERR_INVALID_ARG_TYPE` when index is a number.
- **Fix:** Changed to `filePaths.map((f) => basename(f))`.
- **Files modified:** migration/import-users.ts
- **Commit:** d54828d

## Import Run Results

| Run | Mode | Total | Created | Updated | Skipped | Errors |
|-----|------|-------|---------|---------|---------|--------|
| 1st | skip | 25 | 25 (auth only) | 0 | 0 | 25 (profile update failed) |
| 2nd | overwrite | 25 | 0 | 25 | 0 | 0 |

After fix: all 25 users have correct profiles, roles, MRNs, and `requires_password_reset=true`.

## Commits

| Hash | Message |
|------|---------|
| 22b9e16 | feat(02-02): add import-users.ts CLI script and tsx dev dependency |
| d54828d | fix(02-02): fix column mapping to match live DB schema and basename arg bug |

## Known Stubs

None — all profile data is sourced from dummy-users.json and written to live DB columns.

## Self-Check: PASSED

- migration/import-users.ts: EXISTS (484 lines after initial write, ~476 after fix)
- package.json contains tsx: CONFIRMED (tsx@4.21.0)
- migration-log file: EXISTS (migration/migration-log-1774607101614.json)
- 25/25 users imported (0 errors)
- Sample user priya.sharma@test.goya.com: role=teacher, mrn set, requires_password_reset=true
