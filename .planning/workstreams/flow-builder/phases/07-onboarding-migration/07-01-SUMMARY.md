---
phase: 07-onboarding-migration
plan: 01
subsystem: flow-engine, database
tags: [migration, seeding, condition-evaluator, onboarding]
dependency_graph:
  requires: [06-01-SUMMARY.md, 05-01-SUMMARY.md]
  provides: [3 onboarding flow templates in DB, member_type condition evaluation]
  affects: [lib/flows/engine.ts, lib/flows/condition-evaluator.ts, supabase/migrations]
tech_stack:
  added: []
  patterns: [DO $$ PL/pgSQL seed blocks, ALTER TABLE IF NOT EXISTS for safe column add, supabase db query --linked for direct execution]
key_files:
  created:
    - supabase/migrations/20260369_seed_onboarding_flow_templates.sql
  modified:
    - lib/flows/condition-evaluator.ts
    - lib/flows/engine.ts
decisions:
  - "Actions column added via ALTER TABLE IF NOT EXISTS in same migration — not separate migration"
  - "Migration applied via supabase db query --linked (not db push) due to pre-existing _skip_* file conflict in migration history"
  - "Teacher step 12B (blocked) placed at position 13 (not a gap) — flow branches route to it; sequential player never reaches it normally"
  - "In-progress users marked completed with onboarding_step=999 as sentinel value"
  - "Boolean columns (other_org_member, certificate_is_official, wellness_regulatory_body) use string 'true'/'false' values in choice options — consistent with save_to_profile writing raw answer strings"
metrics:
  duration: "8min"
  completed: "2026-03-30"
  tasks_completed: 2
  files_modified: 3
---

# Phase 07 Plan 01: Seed Onboarding Flow Templates Summary

**One-liner:** Three role-targeted onboarding flow templates seeded via SQL migration with member_type-aware condition evaluation fixing the student/teacher/wellness_practitioner role matching bug.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Fix condition evaluator member_type role matching | bc27151 | lib/flows/condition-evaluator.ts, lib/flows/engine.ts |
| 2 | Create migration seeding 3 onboarding flow templates | 764232a | supabase/migrations/20260369_seed_onboarding_flow_templates.sql |

## What Was Built

### Task 1: Condition Evaluator Fix

Fixed a bug where the ConditionsBuilder UI allows selecting `student`, `teacher`, `wellness_practitioner` as role values, but the evaluator only checked `profile.role` (which holds `admin`/`moderator`/`member`). The actual role-subtype is stored in `member_type`.

Changes:
- `UserProfileForConditions` interface now includes `member_type: string | null`
- `role` condition case: if value is a member_type ('student'|'teacher'|'wellness_practitioner'), compare against `member_type`; otherwise compare against `role` (backward compatible)
- `in` operator checks both `role` and `member_type` (handles mixed arrays)
- Engine SELECT query includes `member_type`; engine passes `member_type` to evaluator

### Task 2: Migration — 3 Onboarding Flow Templates

Created `supabase/migrations/20260369_seed_onboarding_flow_templates.sql` which:

1. Adds `actions jsonb NOT NULL DEFAULT '[]'` column to `flow_steps` (was missing — Plan 03-04 noted it as deferred)
2. Marks all in-progress onboarding users as completed (`onboarding_completed=true, onboarding_step=999`)
3. Seeds 3 flow templates via PL/pgSQL DO $$ blocks:

**Student Onboarding** (priority 100, 13 steps):
- Steps 0-12: Designation info → Full Name → Email → Username → Practice Format → Profile Picture → Introduction → Bio → Practice Level → Practice Styles (19 options) → Languages (22 options) → Social Media → Complete (mark_complete)

**Teacher Onboarding** (priority 99, 24 steps):
- Includes: Teacher Status (8 GOYA designations) → Other Org Membership (BRANCH: yes→org details, no→cert check) → Certificate Official? (BRANCH: yes→upload, no→blocked dead-end) → Introduction → Bio → Video Intro → Years Teaching → Teaching Styles → Teaching Focus → Influences → Languages → Social → Complete
- Branches: Step 7 (other_org_member true/false), Step 11 (certificate_is_official true/false)

**Wellness Practitioner Onboarding** (priority 98, 16 steps):
- Includes: Org Name → Designations (16 wellness types) → Regulatory Body? (BRANCH: yes→designations, no→cert) → Certificate Upload → Profile Picture → Wellness Journey Bio → Wellness Focus (11 areas) → Languages → Social → Complete
- Branch: Step 7 (wellness_regulatory_body true/false)

All templates: `active`, `modal`, `modal_dismissible=false`, `blur` backdrop, `login` trigger, `once` frequency, `is_template=true`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Migration push via db query instead of db push**
- **Found during:** Task 2 verification
- **Issue:** Pre-existing `_skip_*` prefixed migration files caused `supabase db push` to fail with duplicate key constraint errors even after `migration repair`. The `_skip_*` files share version numbers with their non-skip counterparts, causing the CLI to get confused about migration history.
- **Fix:** Used `npx supabase db query --linked -f <file>` to execute both `20260368` and `20260369` directly on the remote database. Migration files remain tracked in the local `supabase/migrations/` directory.
- **Note:** This is a known pre-existing infrastructure issue noted in STATE.md ("Migration 20260366_add_faq_category.sql fails on remote — needs supabase migration repair"). Deferred to a separate cleanup task.
- **Files modified:** None (behavioral change only)

**2. [Rule 2 - Missing] Added actions column to flow_steps**
- **Found during:** Task 2 planning
- **Issue:** Plan 03-04 explicitly noted "Step actions stored in editor store stepActions[stepId] map — UI scaffold only, not persisted until flow_steps gets actions column". The column did not exist.
- **Fix:** Added `ALTER TABLE flow_steps ADD COLUMN IF NOT EXISTS actions jsonb NOT NULL DEFAULT '[]'::jsonb;` to the migration.
- **Commit:** 764232a

## Known Stubs

None — all template data is fully wired to real profile columns. The `mark_complete` action on last steps sets `onboarding_completed=true` via the existing action handler.

## Verification Results

Database queries confirmed:
- 3 templates present: Student Onboarding, Teacher Onboarding, Wellness Practitioner Onboarding
- Step counts: Student=13, Teacher=24, Wellness=16
- All templates: status=active, trigger_type=login, frequency=once, display_type=modal, modal_dismissible=false
- TypeScript: no errors in lib/flows/ files

## Self-Check: PASSED

- [x] lib/flows/condition-evaluator.ts updated with member_type
- [x] lib/flows/engine.ts fetches and passes member_type
- [x] supabase/migrations/20260369_seed_onboarding_flow_templates.sql created
- [x] bc27151 commit exists
- [x] 764232a commit exists
- [x] 3 flow templates confirmed in remote database
