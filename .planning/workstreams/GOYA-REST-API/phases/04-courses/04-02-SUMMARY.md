---
phase: 04-courses
plan: 02
subsystem: api
tags: [rest-api, courses, enrollments, supabase, next-app-router]

# Dependency graph
requires:
  - phase: 04-courses plan 01
    provides: courses service layer with CRUD functions, getCourseById for validation

provides:
  - listEnrollments function in courses service (paginated user_course_progress query)
  - enrollUser function with course-exists and duplicate-enrollment checks
  - updateEnrollment function with auto-completed_at logic
  - GET /api/v1/courses/:id/enrollments — paginated enrollment list
  - POST /api/v1/courses/:id/enrollments — enroll user with conflict detection
  - PATCH /api/v1/courses/:id/enrollments/:userId — update progress status

affects: [any phase consuming enrollment data, future reporting/analytics phases]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Sub-resource route handlers following /api/v1/{resource}/{id}/{sub-resource} structure
    - Auto-completion timestamp logic: completed_at set when status='completed', cleared on 'in_progress'
    - Course existence verification before enrollment ops (reuse getCourseById)
    - ALREADY_ENROLLED / COURSE_NOT_FOUND / NOT_FOUND typed string constants for discriminated error handling

key-files:
  created:
    - app/api/v1/courses/[id]/enrollments/route.ts
    - app/api/v1/courses/[id]/enrollments/[userId]/route.ts
  modified:
    - lib/api/services/courses.ts

key-decisions:
  - "ENROLLMENTS_SORT_FIELDS exported from courses service — consistent with COURSES_SORT_FIELDS pattern"
  - "updateEnrollment auto-clears completed_at when status reverts to in_progress — prevents stale completion dates"
  - "Unknown field rejection in PATCH body — allowlist only status and completed_at, 400 on unknown keys"

patterns-established:
  - "Sub-resource routes extract parent and child IDs from URL segments using indexOf() on resource name"
  - "Service functions return typed string const errors for discriminated error handling in route handlers"

requirements-completed: [CRSE-06, CRSE-07, CRSE-08]

# Metrics
duration: 3min
completed: 2026-03-26
---

# Phase 04 Plan 02: Courses Enrollment API Summary

**Enrollment sub-resources for courses: list, enroll with duplicate detection, and progress update with auto-completed_at timestamps against user_course_progress table**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-26T08:43:35Z
- **Completed:** 2026-03-26T08:46:33Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Three enrollment service functions (listEnrollments, enrollUser, updateEnrollment) added to courses.ts
- GET /api/v1/courses/:id/enrollments with pagination and 404 on soft-deleted/missing course
- POST /api/v1/courses/:id/enrollments with 409 on duplicate enrollment, 404 on missing course, audit logging
- PATCH /api/v1/courses/:id/enrollments/:userId with status validation, unknown-field rejection, auto-completion timestamps, and audit logging

## Task Commits

Each task was committed atomically:

1. **Task 1: Add enrollment service functions to courses service** - `e422feb` (feat)
2. **Task 2: Create enrollment route handlers** - `2b2a6f7` (feat)

**Plan metadata:** (see final commit below)

## Files Created/Modified

- `lib/api/services/courses.ts` - Added ENROLLMENTS_SORT_FIELDS, listEnrollments, enrollUser, updateEnrollment
- `app/api/v1/courses/[id]/enrollments/route.ts` - GET and POST handlers for enrollment collection
- `app/api/v1/courses/[id]/enrollments/[userId]/route.ts` - PATCH handler for enrollment progress update

## Decisions Made

- updateEnrollment auto-clears completed_at when status reverts to in_progress — prevents stale completion dates from persisting if a user restarts a course
- Unknown field rejection in PATCH body via allowlist — consistent with existing PATCH patterns in users and courses routes
- ENROLLMENTS_SORT_FIELDS exported from courses service alongside COURSES_SORT_FIELDS — maintains consistent pattern for all list endpoints

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Worktree was based on an older commit that predated Plan 01 (courses CRUD). Resolved by fast-forward merging `develop` into the worktree branch before starting execution. All Plan 01 artifacts (courses.ts, route handlers) were present after the merge.

## Known Stubs

None - all enrollment functions query the real user_course_progress table via service role client.

## Next Phase Readiness

- Enrollment endpoints complete; courses API is fully implemented (CRSE-01 through CRSE-08)
- Phase 04 complete — ready for Phase 05 or any phase consuming course/enrollment data

---
*Phase: 04-courses*
*Completed: 2026-03-26*
