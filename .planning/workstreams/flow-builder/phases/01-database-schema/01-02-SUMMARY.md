---
phase: 01-database-schema
plan: 02
subsystem: flow-builder
tags: [rls, security, supabase, database]
dependency_graph:
  requires: [01-01]
  provides: [SCHEMA-07]
  affects: [all flow-builder phases that read/write flow tables]
tech_stack:
  added: []
  patterns: [inline EXISTS RLS pattern, user-own-data RLS, admin role check]
key_files:
  created:
    - supabase/migrations/20260365_flow_builder_rls.sql
  modified: []
decisions:
  - "Used 20260365 filename (not 20260364) due to number conflict with 20260364_add_wp_user_id.sql; RLS was already pushed to remote by prior agent session"
  - "Authenticated users get read-only SELECT on active flows/steps/branches — required for flow player to function"
  - "flow_responses uses per-operation policies (SELECT/INSERT/UPDATE) not a catch-all policy — consistent with user_course_progress pattern"
  - "flow_analytics admins can only SELECT (not DELETE) — preserve audit trail"
metrics:
  duration: "5 minutes"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 01 Plan 02: Flow Builder RLS Policies Summary

RLS policies added to all 5 flow builder tables using inline EXISTS role check pattern matching existing courses migration.

## What Was Built

Single migration `supabase/migrations/20260365_flow_builder_rls.sql` containing:

- **5 ENABLE ROW LEVEL SECURITY** statements (one per table)
- **15 CREATE POLICY** statements across all tables

### Policy Breakdown

| Table | Policy Count | Access Model |
|-------|-------------|--------------|
| flows | 2 | Authenticated read active/template; admin full CRUD |
| flow_steps | 2 | Authenticated read steps of active flows; admin full CRUD |
| flow_branches | 2 | Authenticated read branches of active flows; admin full CRUD |
| flow_responses | 7 | User own-data SELECT/INSERT/UPDATE; admin SELECT/UPDATE/INSERT/DELETE |
| flow_analytics | 2 | Authenticated INSERT own events; admin SELECT all |

### Security Model

- **Content tables** (flows, flow_steps, flow_branches): Non-admin users are read-only on active content. Admins/moderators have full CRUD.
- **Response table** (flow_responses): Users can only see and modify their own responses. Admins have full access for user management (reset, force-complete, force-assign).
- **Analytics table** (flow_analytics): Authenticated users insert their own events. Only admins can read. No user can delete analytics (audit trail preserved).
- **Pattern**: Consistent with `supabase/migrations/20260324_add_courses_tables.sql` — inline `EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('admin', 'moderator'))` pattern used throughout.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create RLS policies migration | ac8986e | supabase/migrations/20260364_flow_builder_rls.sql (later reconciled to 20260365) |
| 2 | Push RLS migration and verify policies | 7fa1de1 | Cleanup of duplicate file; 20260365 already on remote |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Filename conflict with 20260364_add_wp_user_id.sql**
- **Found during:** Task 2 (db push)
- **Issue:** Created `20260364_flow_builder_rls.sql` which conflicted with the pre-existing `20260364_add_wp_user_id.sql` migration. The previous agent session had already correctly used `20260365_flow_builder_rls.sql` and pushed it to remote.
- **Fix:** Deleted the conflicting `20260364_flow_builder_rls.sql`. The canonical migration is `20260365_flow_builder_rls.sql` which was already applied to remote.
- **Files modified:** `supabase/migrations/20260364_flow_builder_rls.sql` (deleted)
- **Commit:** 7fa1de1

## Verification Results

- `20260365_flow_builder_rls.sql`: 5 ENABLE ROW LEVEL SECURITY + 15 CREATE POLICY
- Migration list confirms `20260365` applied on remote (all 3 columns present)
- No pending flow RLS migrations outstanding

## Known Stubs

None.

## Self-Check: PASSED

- `supabase/migrations/20260365_flow_builder_rls.sql` — FOUND
- Commit ac8986e — FOUND (initial creation)
- Commit 7fa1de1 — FOUND (conflict cleanup)
- Migration 20260365 on remote — CONFIRMED via `supabase migration list`
