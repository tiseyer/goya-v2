---
gsd_state_version: 1.0
milestone: v1.15
milestone_name: Course System Redesign
status: defining_requirements
stopped_at: ""
last_updated: "2026-04-01T00:00:00.000Z"
last_activity: 2026-04-01
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.
**Current focus:** Defining requirements for v1.15 Course System Redesign

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-01 — Milestone v1.15 started

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.10: Shared audit utility pattern (lib/courses/audit.ts) — reuse for course-related changes
- v1.9: event_type column distinguishes 'goya' vs 'member' — course_type follows same pattern
- v1.8: Chat route must run Node.js runtime — crypto required for AES-256-GCM decryption
- v1.6: Per-route auth composition — /api/ excluded from middleware; each handler validates explicitly
- event_categories table exists as pattern reference for course_categories

### Codebase Findings (v1.15 pre-flight)

- `course_categories` table: does NOT exist — needs creation
- `lessons` table: does NOT exist — needs creation
- `courses.vimeo_url`: exists — needs removal (moves to lessons)
- `courses.course_type`: already exists ✓
- `courses.category`: string column — needs replacement with `category_id` FK
- `event_categories` table: exists as pattern reference

### Blockers/Concerns

None yet.

### Pending Todos

None yet.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 1 | Admin sidebar docs icon + media library header alignment | 2026-03-31 | b1b6efa, 21437bd | 260331-oyj-admin-sidebar-docs-link-media-library-he |
| 260331-oyv | Backfill existing Storage files into media_items table | 2026-03-31 | be4b692 | [260331-oyv-backfill-existing-storage-files-into-med](./quick/260331-oyv-backfill-existing-storage-files-into-med/) |
| 260331-p7b | Fix admin docs viewer layout proportions | 2026-03-31 | d0e6215 | [260331-p7b-fix-admin-docs-viewer-layout-proportions](./quick/260331-p7b-fix-admin-docs-viewer-layout-proportions/) |
| 260331-p7c | Fix broken PostgREST join in media library | 2026-03-31 | 3d92e5c | — |
| 260331-pe2 | Migrate WordPress avatar URLs and GOYA logos to Supabase Storage | 2026-03-31 | f078306, 1d2fd6c | [260331-pe2-migrate-wordpress-avatar-urls-and-goya-l](./quick/260331-pe2-migrate-wordpress-avatar-urls-and-goya-l/) |
| 260331-s4z | Create uploads bucket and ensure-buckets setup script | 2026-03-31 | 9b9277b | [260331-s4z-create-uploads-bucket-and-ensure-buckets](./quick/260331-s4z-create-uploads-bucket-and-ensure-buckets/) |
| 260331-sbq | Fix avatar migration script resumability WHERE clause | 2026-03-31 | — | [260331-sbq-fix-avatar-migration-script-resumability](./quick/260331-sbq-fix-avatar-migration-script-resumability/) |
| 260401-ahn | Media library: fix delete bug, role permissions, move files, resizable panel | 2026-04-01 | 39e969e, b8568a7, e6a2fcb | [260401-ahn-media-library-fix-delete-bug-role-permis](./quick/260401-ahn-media-library-fix-delete-bug-role-permis/) |
| 260401-9dj | Fix admin users — create user modal, detail boxes, school CTA | 2026-04-01 | a40160a, a7e7085, 2870e63 | — |

## Session Continuity

Last session: 2026-04-01T00:00:00.000Z
Stopped at: Milestone v1.15 started
Resume file: None
