---
gsd_state_version: 1.0
milestone: v1.15
milestone_name: Course System Redesign
status: verifying
stopped_at: Completed 40-02-PLAN.md — per-lesson player page with type-specific rendering and prev/next navigation
last_updated: "2026-04-01T06:00:00.000Z"
last_activity: 2026-04-01 - Completed quick task 260401-hg8: Fix Vercel build — 4 module-not-found errors
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 7
  completed_plans: 7
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-01)

**Core value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.
**Current focus:** Phase 38 — Course Creation Form — UI Redesign

## Current Position

Phase: 40 (Wire Lessons to Frontend) — COMPLETE
Plan: 3 of 3
Status: Plan 03 complete — member my-courses lesson management with LessonList reuse and stale column fixes
Last activity: 2026-04-01

Progress: [███░░░░░░░] 33%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|

*Updated after each plan completion*
| Phase 36-database-migrations P01 | 5 | 2 tasks | 4 files |
| Phase 36-database-migrations P02 | 3 | 2 tasks | 2 files |
| Phase 36-database-migrations P03 | 5 | 2 tasks | 2 files |
| Phase 37-admin-courses-tabs-categories P01 | 2 | 2 tasks | 2 files |
| Phase 37-admin-courses-tabs-categories P02 | 8 | 2 tasks | 4 files |
| Phase 38-course-creation-form-ui-redesign P01 | 45 | 2 tasks | 4 files |
| Phase 38-course-creation-form-ui-redesign P02 | 10 | 2 tasks | 1 files |
| Phase 39-lesson-management-ui-logic P01 | 4m | 2 tasks | 7 files |
| Phase 39-lesson-management-ui-logic P02 | 8m | 2 tasks | 5 files |

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- v1.15: Float numeric sort_order for lessons (not integer) — enables single-row drag reorder via midpoint math
- v1.15: LessonList.tsx must use dynamic(..., { ssr: false }) — dnd-kit uses browser APIs that fail during SSR
- [Phase 39-01]: LessonSection client wrapper isolates next/dynamic ssr:false from server component edit page
- [Phase 39-01]: fetchLessons runs in parallel with fetchCategories via Promise.all for performance
- v1.15: Category FK backfill order is critical — add column, seed categories, UPDATE existing courses, verify zero NULLs, then drop old text column
- v1.10: Shared audit utility pattern (lib/courses/audit.ts) — reuse for course-related changes
- event_categories migration is the authoritative schema reference for course_categories
- [Phase 36-database-migrations]: Applied migrations via Supabase Management API (SUPABASE_ACCESS_TOKEN) — db push blocked by CLI history mismatch; this is the established pattern for this project
- [Phase 36-database-migrations]: sort_order on lessons uses numeric type for midpoint drag-reorder math (avoids integer-only limitations)
- [Phase 36-database-migrations]: Plan 01 lessons RLS policies updated to plan-spec: TO authenticated + SELECT-only for member/creator access (not public/ALL)
- [Phase 36-database-migrations]: Used DROP POLICY IF EXISTS pattern in 20260382 and 20260383 (not removing inline RLS from predecessors) — keeps earlier migrations unmodified and self-contained
- [Phase 37-admin-courses-tabs-categories]: Use maybeSingle() for slug uniqueness checks in category actions — returns null instead of error on no-match
- [Phase 37-admin-courses-tabs-categories]: deleteCategory returns courseCount in all response shapes for consistent caller interface
- [Phase 37-admin-courses-tabs-categories]: CategoryModal created in Task 1 commit (not Task 2) since AdminCategoriesTab depends on it for compilation
- [Phase 37-admin-courses-tabs-categories]: AdminCoursesFilters category filter uses c.id (UUID) as option value matching the category_id FK column
- [Phase 38-course-creation-form-ui-redesign]: Card-section form layout (border border-border rounded-xl p-6 bg-card) established for CourseForm — three sections: Basic Info, Content, Settings
- [Phase 38-course-creation-form-ui-redesign]: New admin courses auto-set course_type=goya and redirect to edit?tab=lessons after creation
- [Phase 38-course-creation-form-ui-redesign]: Button row uses flex-col sm:flex-row — Submit button becomes w-full on mobile for large touch target
- [Phase 39-02]: LessonList owns formMode state internally — keeps edit page as server component without callback drilling
- [Phase 39-02]: LessonForm nullifies type-irrelevant fields on submit — video type nulls audio_url, audio/text types null video_platform and video_url

### Codebase Findings (v1.15 pre-flight)

- `course_categories` table: does NOT exist — needs creation
- `lessons` table: does NOT exist — needs creation
- `courses.vimeo_url`: exists — needs removal (moves to lessons)
- `courses.category`: string column — needs replacement with `category_id` FK
- `event_categories` table: exists as pattern reference
- `@dnd-kit/sortable` v10: already installed (used in ProductsTable.tsx)

### Blockers/Concerns

- Category FK backfill: 8 existing seed courses have duration as freeform text (e.g. "4h 30m") — Phase 36 migration must parse to integer minutes; unparseable values default to 0
- Vimeo embed domain allowlist: production domain and localhost:3000 must be added to Vimeo before Phase 40 testing

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
| 260401-dm7 | Remove footer from all pages except landing and legal | 2026-04-01 | — | [260401-dm7-remove-footer-from-all-pages-except-land](./quick/260401-dm7-remove-footer-from-all-pages-except-land/) |
| 260401-f1l | WordPress media library migration script | 2026-04-01 | d64f9b9, cb51c1a | [260401-f1l-wordpress-media-library-migration-script](./quick/260401-f1l-wordpress-media-library-migration-script/) |
| 260401-hg8 | Fix Vercel build: 4 module-not-found errors | 2026-04-01 | 61a2c5e | [260401-hg8-fix-vercel-build-resolve-4-module-not-fo](./quick/260401-hg8-fix-vercel-build-resolve-4-module-not-fo/) |
| 260401-hk4 | Add milestone branching rules to CLAUDE.md | 2026-04-01 | 046ed9c | [260401-hk4-add-milestone-branching-rules-to-claude-](./quick/260401-hk4-add-milestone-branching-rules-to-claude-/) |
| 260401-jqr | Fix Recharts labelFormatter and formatter types | 2026-04-01 | 98eecf6 | [260401-jqr-fix-labelformatter-type-in-usersanalytic](./quick/260401-jqr-fix-labelformatter-type-in-usersanalytic/) |
| 260401-jv9 | Fix all TypeScript errors for clean Vercel build | 2026-04-01 | cf8b5c2 | [260401-jv9-fix-all-typescript-errors-for-clean-verc](./quick/260401-jv9-fix-all-typescript-errors-for-clean-verc/) |
| 260401-kfs | Fix admin analytics: user data, visitors UX, shop redesign | 2026-04-01 | 7c4a7a1, 2e569b7, 87e9814 | [260401-kfs-fix-admin-analytics-user-data-visitors-u](./quick/260401-kfs-fix-admin-analytics-user-data-visitors-u/) |
| 260401-l88 | Fix admin nav: email position, tab styling, group nav, active state | 2026-04-01 | 1bdcac4, c964378 | [260401-l88-fix-admin-nav-email-position-tab-styling](./quick/260401-l88-fix-admin-nav-email-position-tab-styling/) |
| 260401-llt | Fix sidebar: divider, emails position, split chevron toggle | 2026-04-01 | 2945a2b | [260401-llt-fix-sidebar-divider-emails-position-spli](./quick/260401-llt-fix-sidebar-divider-emails-position-spli/) |
| 260401-lv2 | Admin subscriptions page with filters, table, and sidebar nav | 2026-04-01 | fec21bc, 0924b1d, c6e612f | [260401-lv2-admin-subscriptions-page-with-filters-ta](./quick/260401-lv2-admin-subscriptions-page-with-filters-ta/) |

## Session Continuity

Last session: 2026-04-01T04:21:57.080Z
Stopped at: Completed 39-02-PLAN.md — LessonForm component and inline integration
Resume file: None
