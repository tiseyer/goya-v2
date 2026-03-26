---
phase: 04-courses
plan: 01
subsystem: api
tags: [supabase, rest-api, courses, soft-delete, pagination, audit]

# Dependency graph
requires:
  - phase: 03-events
    provides: Events service and route handler patterns (listEvents, createEvent, updateEvent, deleteEvent)
provides:
  - Courses soft-delete migration (deleted_at column, expanded status CHECK)
  - CourseStatus type updated to include 'deleted'
  - Course interface updated with deleted_at field
  - lib/api/services/courses.ts with full CRUD service layer
  - GET /api/v1/courses with category, level, access, status, search filters
  - POST /api/v1/courses with validation and audit logging
  - GET /api/v1/courses/:id returning course detail or 404
  - PATCH /api/v1/courses/:id with allowlist validation and audit logging
  - DELETE /api/v1/courses/:id soft-delete with audit logging
affects: [04-courses, future-consumers-of-courses-api]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Courses service layer following exact events.ts pattern with getSupabaseService() as any
    - Soft-delete via deleted_at + status='deleted' dual-state tracking
    - listCourses always filters .is('deleted_at', null) — soft-deleted never appear in list results
    - Route handlers follow events route.ts pattern for auth/rateLimit/requirePermission middleware chain

key-files:
  created:
    - supabase/migrations/20260350_courses_soft_delete.sql
    - lib/api/services/courses.ts
    - app/api/v1/courses/route.ts
    - app/api/v1/courses/[id]/route.ts
  modified:
    - lib/types.ts

key-decisions:
  - "Courses service uses getSupabaseService() as any — courses table not in generated types, same pattern as events/users"
  - "Migration applied via supabase db query --linked due to duplicate timestamp blocking db push (same pattern as Phase 03)"
  - "listCourses always filters .is('deleted_at', null) — soft-deleted courses never appear in list results"
  - "deleteCourse sets both deleted_at AND status='deleted' for dual-state tracking, consistent with events pattern"

patterns-established:
  - "Courses CRUD: service layer in lib/api/services/courses.ts, collection route at app/api/v1/courses/route.ts, detail route at app/api/v1/courses/[id]/route.ts"
  - "Soft-delete: set deleted_at=now() and status='deleted', filter with .is('deleted_at', null) in all read queries"

requirements-completed: [CRSE-01, CRSE-02, CRSE-03, CRSE-04, CRSE-05]

# Metrics
duration: 15min
completed: 2026-03-26
---

# Phase 04 Plan 01: Courses API Summary

**Five-endpoint courses REST API with soft-delete support: migration, service layer, and route handlers following Phase 03 events pattern**

## Performance

- **Duration:** 15 min
- **Started:** 2026-03-26T08:40:00Z
- **Completed:** 2026-03-26T08:55:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments

- Created soft-delete migration adding deleted_at column and expanding courses status CHECK to include 'deleted'
- Built full courses service layer (listCourses, getCourseById, createCourse, updateCourse, deleteCourse) with filter support and proper soft-delete handling
- Implemented all five CRUD route handlers across two files with auth middleware, validation, and audit logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Create soft-delete migration, update CourseStatus type, and build courses service layer** - `ec7f17a` (feat)
2. **Task 2: Create courses collection and detail route handlers** - `c6ed648` (feat)

## Files Created/Modified

- `supabase/migrations/20260350_courses_soft_delete.sql` - Adds deleted_at column and expands status CHECK to include 'deleted'
- `lib/types.ts` - Updated CourseStatus to include 'deleted', added deleted_at to Course interface
- `lib/api/services/courses.ts` - Full courses CRUD service layer with listCourses, getCourseById, createCourse, updateCourse, deleteCourse
- `app/api/v1/courses/route.ts` - GET (list with filters) and POST (create with validation + audit) handlers
- `app/api/v1/courses/[id]/route.ts` - GET (detail), PATCH (update with allowlist), DELETE (soft-delete) handlers

## Decisions Made

- Courses service uses `getSupabaseService() as any` — courses table not in generated types, same pattern as events/users
- Migration applied via `supabase db query --linked` due to batch push failing on pre-existing policies in earlier migrations (same pattern as Phase 03)
- listCourses always filters `.is('deleted_at', null)` — soft-deleted courses never appear in list results
- deleteCourse sets both deleted_at AND status='deleted' for dual-state tracking

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- `npx supabase db push --include-all` failed due to pre-existing policies in 20260341_webhook_events.sql migration. Resolved using `supabase db query --linked` to apply only the courses soft-delete migration directly — same established pattern from Phase 03.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Courses CRUD API fully implemented and ready for consumers
- Phase 04 Plan 02 can proceed (courses enrollments/progress endpoints if planned)
- All 5 CRSE requirements (CRSE-01 through CRSE-05) satisfied

---
*Phase: 04-courses*
*Completed: 2026-03-26*
