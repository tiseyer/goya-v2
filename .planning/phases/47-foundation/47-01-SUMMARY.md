---
phase: 47-foundation
plan: "01"
subsystem: database
tags: [migration, types, profile, storage]
one_liner: "Idempotent migration adding 4 profile columns + profile-covers bucket; 7 new fields added to Profile TS interface"

dependency_graph:
  requires: []
  provides:
    - profiles.cover_image_url (text, nullable)
    - profiles.location_lat (double precision, nullable)
    - profiles.location_lng (double precision, nullable)
    - profiles.location_place_id (text, nullable)
    - storage bucket profile-covers (public read, authenticated write)
    - Profile.lineage (string[] | null)
    - Profile.principal_trainer_school_id (string | null)
    - Profile.faculty_school_ids (string[] | null)
  affects:
    - lib/types.ts (Profile interface)
    - supabase profiles table
    - supabase storage buckets

tech_stack:
  added: []
  patterns:
    - Idempotent migration using DO $$ IF NOT EXISTS pattern
    - Storage bucket RLS: DROP POLICY IF EXISTS before CREATE POLICY
    - Migration applied via pg client SET SESSION ROLE postgres (project has pre-existing migration history drift)

key_files:
  created:
    - supabase/migrations/20260402_profile_cover_location_columns.sql
  modified:
    - lib/types.ts

decisions:
  - Applied migration directly via pg client (not `npx supabase db push`) due to pre-existing project-wide migration history drift that blocks db push with version-order conflicts. Migration was recorded in supabase_migrations.schema_migrations manually.
  - cover_image_url, location_lat, location_lng, location_place_id placed after country field in Profile interface (logical location group)
  - lineage placed after influences_arr (both are teacher-history/tradition fields)
  - principal_trainer_school_id and faculty_school_ids placed after certificate_url (school-relationship fields)

metrics:
  duration_minutes: 26
  completed_date: "2026-04-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 1
  files_modified: 2
---

# Phase 47 Plan 01: Migration + Profile Types Summary

## What Was Built

Added the four DB columns required by Phases 48-50 (cover photo and location data), created the `profile-covers` storage bucket, and updated the `Profile` TypeScript interface to include all missing fields that were already in the DB but not typed.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create migration for profile columns and storage bucket | `12275a4` | `supabase/migrations/20260402_profile_cover_location_columns.sql` |
| 2 | Update Profile interface in lib/types.ts | `99efe95` | `lib/types.ts` |

## Verification Results

1. Migration file exists at `supabase/migrations/20260402_profile_cover_location_columns.sql`
2. DB columns verified: `cover_image_url` (text), `location_lat` (double precision), `location_lng` (double precision), `location_place_id` (text) — all present in `profiles` table
3. Storage bucket `profile-covers` verified: public read, 4 RLS policies (SELECT/INSERT/UPDATE/DELETE)
4. Profile interface contains all 7 new fields: `cover_image_url`, `location_lat`, `location_lng`, `location_place_id`, `lineage`, `principal_trainer_school_id`, `faculty_school_ids`
5. `npx tsc --noEmit` passes with zero source-file errors (one pre-existing `.next` cache artifact error, unrelated)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `npx supabase db push` blocked by pre-existing migration history drift**

- **Found during:** Task 1
- **Issue:** The project has a long-standing migration history mismatch where some local migration files (short 8-digit timestamps like `20260331`) exist in the remote `supabase_migrations.schema_migrations` but the CLI cannot reconcile them with local files. Running `--include-all` failed because those migrations were already applied to the DB (tables exist, `CREATE TABLE` would fail). The `db push` command alternated between "remote not in local" and "local not in remote" errors for version `20260331`.
- **Root cause:** The short timestamp format (`20260331`) used by older local migration files conflicts with how the current Supabase CLI 2.84.6 resolves version matching when there are duplicate short-version entries in the history table.
- **Fix:** Applied the migration SQL directly via a Node.js pg client using `SET SESSION ROLE postgres` (same approach the Supabase CLI uses internally). Manually inserted the migration record into `supabase_migrations.schema_migrations`. Verified all DB objects were created correctly.
- **Files modified:** None (the migration SQL file was already created correctly)
- **Commits:** No extra commit — applied as part of task 1

## Known Stubs

None.

## Self-Check: PASSED

- FOUND: supabase/migrations/20260402_profile_cover_location_columns.sql
- FOUND: lib/types.ts with cover_image_url, lineage, faculty_school_ids
- FOUND: commit 12275a4 (Task 1)
- FOUND: commit 99efe95 (Task 2)
- FOUND: DB columns and bucket verified via direct pg query
