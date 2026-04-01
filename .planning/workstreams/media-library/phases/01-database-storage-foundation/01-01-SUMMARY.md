---
phase: 1
plan: 1
workstream: media-library
title: "Database & Storage Foundation"
status: complete
completed: 2026-03-31
subsystem: database, storage, instrumentation
tags: [media-library, supabase, rls, migrations, typescript]
requirements: [DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07, DB-08, INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, INST-08]
dependency_graph:
  requires: []
  provides: [media_items table, media_folders table, RLS policies, registerMediaItem, registerMediaItemAction]
  affects: [avatar upload, event image upload, school logo upload, certificate upload, chatbot avatar upload, post media upload]
tech_stack:
  added: [lib/media/register.ts, app/actions/media.ts]
  patterns: [service-role insert bypasses RLS, fire-and-forget server action, non-throwing media registration]
key_files:
  created:
    - supabase/migrations/20260374_media_library_schema.sql
    - supabase/migrations/20260375_media_library_rls.sql
    - lib/media/register.ts
    - app/actions/media.ts
  modified:
    - types/supabase.ts
    - app/api/avatar/route.ts
    - app/upgrade/actions.ts
    - app/admin/chatbot/chatbot-actions.ts
    - app/admin/events/components/EventForm.tsx
    - app/settings/my-events/MyEventsClient.tsx
    - app/schools/create/onboarding/page.tsx
    - app/schools/[id]/settings/SchoolSettingsClient.tsx
    - lib/feed.ts
decisions:
  - "media_folders defined before media_items in schema migration to satisfy FK constraint"
  - "No INSERT RLS policy on media_items — service role bypasses RLS, keeping client code clean"
  - "Admin-only DELETE uses inline profiles.role subquery, no new is_only_admin() function created"
  - "Client upload flows use fire-and-forget .catch(console.error) to never block upload UX"
  - "upgrade-certificates bucket created via API (was missing from Supabase Storage)"
metrics:
  duration: ~35 minutes
  tasks_completed: 8
  files_created: 4
  files_modified: 9
---

# Phase 1 Plan 1: Database & Storage Foundation Summary

**One-liner:** PostgreSQL schema + RLS policies for media tracking, with server helper and server action instrumenting all 8 existing upload flows to produce media_items rows.

## Tasks Completed

| Task | Description | Commit | Status |
|------|-------------|--------|--------|
| 1 | Schema migration — media_items and media_folders tables | 6f4437b | Done |
| 2 | RLS migration — access policies for all role tiers | bc908ab | Done |
| 3 | Regenerate TypeScript types | 1e5c3c1 | Done |
| 4 | Create lib/media/register.ts server helper | 6c01b70 | Done |
| 5 | Create app/actions/media.ts server action | 42d2c48 | Done |
| 6 | Instrument server-side upload sites (avatar, certificate, chatbot avatar) | 61017f4 | Done |
| 7 | Instrument client-side upload sites (events, my-events, school logos, feed) | a8822ea | Done |
| 8 | Storage bucket verification | — | Done |

## Requirements Met

- **DB-01:** media_items table created with all specified columns
- **DB-02:** media_folders table created with all specified columns
- **DB-03:** Admin/moderator SELECT, INSERT (folders), UPDATE policies active
- **DB-04:** Admin-only DELETE policies active on both tables (inline role check)
- **DB-05:** Members can SELECT their own media_items rows
- **DB-06:** No public SELECT/INSERT on media_items — service role used for inserts
- **DB-07:** All 8 storage buckets exist (upgrade-certificates was missing, created via API)
- **DB-08:** types/supabase.ts contains media_items and media_folders Row/Insert/Update types
- **INST-01:** app/api/avatar/route.ts — avatars bucket
- **INST-02:** app/admin/events/components/EventForm.tsx — event-images bucket (admin)
- **INST-03:** app/settings/my-events/MyEventsClient.tsx — event-images bucket (member)
- **INST-04:** app/upgrade/actions.ts — upgrade-certificates bucket
- **INST-05:** app/schools/create/onboarding/page.tsx — school-logos bucket
- **INST-06:** app/schools/[id]/settings/SchoolSettingsClient.tsx — school-logos bucket
- **INST-07:** app/admin/chatbot/chatbot-actions.ts — chatbot-avatars bucket
- **INST-08:** lib/feed.ts — post-images, post-videos, post-audio buckets

## Deviations from Plan

### Task 1 — Migration deployment method

**Found during:** Task 1
**Issue:** `npx supabase db push` could not apply the new migration due to duplicate timestamp entries in the migration history table (local files with timestamp 20260341, 20260348, etc. existed both with and without `_skip_` prefixes, and as separate files with different names). The push command kept failing with duplicate key violations.
**Fix (Rule 3 — blocking issue):** Used `npx supabase migration repair --status applied` to mark already-applied migrations, then used `npx supabase db query --linked -f <file>` to apply the migration SQL directly, followed by `npx supabase migration repair --status applied 20260374` to record it. Same approach used for Task 2.
**Impact:** Both migrations applied successfully and verified in the database. No SQL changes made.

### Task 8 — upgrade-certificates bucket missing

**Found during:** Task 8
**Issue:** The `upgrade-certificates` bucket did not exist in Supabase Storage. All other 7 buckets were already present.
**Fix (Rule 2 — missing critical infrastructure):** Created the bucket via the Supabase Storage Management API with `public: true`, matching the existing bucket pattern.
**Note:** Logged in this SUMMARY. No LOG.md entry needed as creation succeeded.

## TypeScript Compilation

`npx tsc --noEmit` passes with zero new errors. Only pre-existing errors remain:
- `TS2688: Cannot find type definition file for 'linkify-it 2'`
- `TS2688: Cannot find type definition file for 'mdurl 2'`

These are pre-existing duplicate type declaration issues unrelated to this plan.

## Known Stubs

None. All 8 upload flows wire directly to `registerMediaItem`/`registerMediaItemAction` with real data. No placeholder values or mock data used.
