---
phase: 02-import-script-test-data
plan: "01"
subsystem: migration
tags: [migration, supabase, test-data, gitignore]
dependency_graph:
  requires: [01-02-PLAN.md]
  provides: [migration/README.md, migration/dummy-users.json, supabase/migrations/20260354_add_requires_password_reset.sql]
  affects: [02-02-PLAN.md]
tech_stack:
  added: []
  patterns: [Supabase partial index, git-ignore for sensitive data]
key_files:
  created:
    - supabase/migrations/20260354_add_requires_password_reset.sql
    - migration/README.md
    - migration/dummy-users.json (git-ignored)
  modified:
    - .gitignore
decisions:
  - "dummy-users.json is git-ignored by design (migration/*.json rule); only README.md is committed"
  - "Applied migration via supabase db query --linked due to out-of-order migration conflict blocking db push"
metrics:
  duration: "~5m"
  completed: 2026-03-27
  tasks_completed: 2
  files_changed: 4
---

# Phase 02 Plan 01: Migration Infrastructure & Test Data Summary

**One-liner:** Supabase requires_password_reset column + partial index, 25-user WP-format dummy dataset across 16 countries, and full pipeline README with field mapping table.

## Tasks Completed

| Task | Description | Commit | Files |
|------|-------------|--------|-------|
| 1 | Supabase migration + .gitignore update | b9efb29 | supabase/migrations/20260354_add_requires_password_reset.sql, .gitignore |
| 2 | 25 dummy users JSON + migration README | 093832a | migration/README.md (dummy-users.json git-ignored) |

## Artifacts

- **`supabase/migrations/20260354_add_requires_password_reset.sql`** — Adds `requires_password_reset boolean NOT NULL DEFAULT false` to profiles, with a partial index WHERE requires_password_reset = true for middleware performance
- **`migration/dummy-users.json`** — 25 test users matching exact WP export plugin output format: 12 subscribers, 7 teachers, 4 wellness practitioners, 2 admins; 5 expired + 18 active + 2 no-subscription; locations across Canada, Ireland, India, Germany, USA, Brazil, UK, Japan, Australia, South Korea, Poland, France, Kenya, Sweden, Thailand, UAE
- **`migration/README.md`** — 78-line pipeline documentation: export steps, import CLI commands, field mapping table (WP export -> Supabase), security notes
- **`.gitignore`** — `migration/*.json` rule added to protect sensitive user export files

## Verification Results

- `grep -c "requires_password_reset" supabase/migrations/20260354_add_requires_password_reset.sql` returns 5 (PASS)
- `grep -q "migration/*.json" .gitignore` succeeds (PASS)
- `node -e "var d=require('./migration/dummy-users.json'); console.log(d.length === 25 ? 'PASS' : 'FAIL')"` returns PASS
- `wc -l migration/README.md` returns 78 (PASS, requirement was 30+)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npx supabase db push` blocked by out-of-order migration conflict**
- **Found during:** Task 1
- **Issue:** `db push` detected local migration files (20260341_webhook_events.sql and others) inserted before the last remote migration. The `--include-all` flag caused an error applying 20260341 (policy already exists on remote). This is a pre-existing conflict unrelated to this plan.
- **Fix:** Applied the new migration directly via `npx supabase db query --linked -f supabase/migrations/20260354_add_requires_password_reset.sql`, which succeeded with empty rows response confirming successful execution.
- **Files modified:** None (migration file itself unchanged)
- **Commit:** Applied as part of b9efb29

## Known Stubs

None. All artifacts are complete and functional. The dummy-users.json is intentionally git-ignored; Plan 02-02 will use it directly from disk for the import script test run.

## Self-Check: PASSED

- [x] `supabase/migrations/20260354_add_requires_password_reset.sql` exists
- [x] `.gitignore` contains `migration/*.json`
- [x] `migration/dummy-users.json` exists with 25 users (git-ignored, not committed)
- [x] `migration/README.md` exists with 78 lines
- [x] Commits b9efb29 and 093832a exist in git log
