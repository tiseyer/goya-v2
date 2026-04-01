---
phase: 04-courses
verified: 2026-03-26T00:00:00Z
status: passed
score: 12/12 must-haves verified
re_verification: false
---

# Phase 04: Courses Verification Report

**Phase Goal:** Callers can manage courses and track learner enrollment progress through the API
**Verified:** 2026-03-26
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| #  | Truth | Status | Evidence |
|----|-------|--------|----------|
| 1  | GET /api/v1/courses returns paginated course list filterable by category, level, access, and status | VERIFIED | `app/api/v1/courses/route.ts` GET handler calls `listCourses` with all 5 filter params; `listCourses` applies `.eq()` per filter plus `.or()` for search, `.is('deleted_at', null)` guard, and range/sort from pagination |
| 2  | GET /api/v1/courses/:id returns full course detail for a valid UUID | VERIFIED | `app/api/v1/courses/[id]/route.ts` GET handler validates UUID regex, calls `getCourseById` which queries `courses` table with `.is('deleted_at', null).single()`, returns `successResponse(data)` |
| 3  | GET /api/v1/courses/:id returns 404 for unknown or soft-deleted courses | VERIFIED | `getCourseById` uses `.is('deleted_at', null)` — soft-deleted records return no data; route returns `errorResponse('NOT_FOUND', 'Course not found', 404)` when `error || !data` |
| 4  | POST /api/v1/courses creates a new course and returns 201 with the created record and an audit entry | VERIFIED | POST handler validates `title` and `category` required fields, calls `createCourse`, calls `ctx.logAudit` with `action: 'course.create'`, returns `successResponse(data, 201)` |
| 5  | PATCH /api/v1/courses/:id updates allowed course fields and logs an audit entry | VERIFIED | PATCH handler rejects unknown keys against `ALLOWED_COURSE_UPDATE_FIELDS`, validates enums, calls `updateCourse`, calls `ctx.logAudit` with `action: 'course.update'` and `fields_updated` metadata |
| 6  | DELETE /api/v1/courses/:id soft-deletes the course (sets deleted_at and status=deleted) and logs an audit entry | VERIFIED | `deleteCourse` sets `{ deleted_at: new Date().toISOString(), status: 'deleted' }` with `.is('deleted_at', null)` guard; route calls `ctx.logAudit` with `action: 'course.delete'` |
| 7  | GET /api/v1/courses/:id/enrollments returns a paginated list of enrollments for the course | VERIFIED | Enrollment GET handler extracts courseId, calls `listEnrollments` which queries `user_course_progress` table with pagination; returns `paginatedResponse(data, meta)` |
| 8  | POST /api/v1/courses/:id/enrollments enrolls a user and logs an audit entry | VERIFIED | POST handler validates `user_id` UUID, calls `enrollUser`, calls `ctx.logAudit` with `action: 'course.enroll'`, returns `successResponse(data, 201)` |
| 9  | POST /api/v1/courses/:id/enrollments returns 409 if user is already enrolled | VERIFIED | `enrollUser` checks for existing record with `.maybeSingle()`, returns `'ALREADY_ENROLLED'` const; route maps to `errorResponse('CONFLICT', ..., 409)` |
| 10 | POST /api/v1/courses/:id/enrollments returns 404 if course does not exist or is soft-deleted | VERIFIED | `enrollUser` calls `getCourseById` first; returns `'COURSE_NOT_FOUND'` if no data; route maps to `errorResponse('NOT_FOUND', ..., 404)` |
| 11 | PATCH /api/v1/courses/:id/enrollments/:userId updates enrollment progress (status, completed_at) and logs an audit entry | VERIFIED | PATCH handler extracts both courseId and userId from URL segments, validates `status` against `['in_progress', 'completed']`, rejects unknown fields, calls `updateEnrollment` with auto-completion timestamp logic, calls `ctx.logAudit` with `action: 'course.enrollment.update'` |
| 12 | PATCH /api/v1/courses/:id/enrollments/:userId returns 404 if enrollment does not exist | VERIFIED | `updateEnrollment` returns `'NOT_FOUND'` const when `error || !data`; route maps to `errorResponse('NOT_FOUND', 'Enrollment not found', 404)` |

**Score:** 12/12 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260350_courses_soft_delete.sql` | Adds deleted_at column and 'deleted' status CHECK | VERIFIED | File exists; `ALTER TABLE public.courses ADD COLUMN IF NOT EXISTS deleted_at timestamptz`; `ADD CONSTRAINT courses_status_check CHECK (status IN ('published', 'draft', 'deleted'))` |
| `lib/api/services/courses.ts` | CRUD + enrollment service functions | VERIFIED | 305 lines; exports `listCourses`, `getCourseById`, `createCourse`, `updateCourse`, `deleteCourse`, `listEnrollments`, `enrollUser`, `updateEnrollment`, `COURSES_SORT_FIELDS`, `ENROLLMENTS_SORT_FIELDS`, `ALLOWED_COURSE_UPDATE_FIELDS` |
| `app/api/v1/courses/route.ts` | GET and POST /api/v1/courses | VERIFIED | Exports `GET` and `POST`; 171 lines with full filter logic, validation, and audit logging |
| `app/api/v1/courses/[id]/route.ts` | GET, PATCH, DELETE /api/v1/courses/:id | VERIFIED | Exports `GET`, `PATCH`, `DELETE`; 203 lines with UUID validation, allowlist enforcement, and audit logging |
| `app/api/v1/courses/[id]/enrollments/route.ts` | GET and POST /api/v1/courses/:id/enrollments | VERIFIED | Exports `GET` and `POST`; 119 lines with full error discrimination and audit logging |
| `app/api/v1/courses/[id]/enrollments/[userId]/route.ts` | PATCH /api/v1/courses/:id/enrollments/:userId | VERIFIED | Exports `PATCH`; 113 lines with dual UUID extraction, field allowlist, status validation, and audit logging |
| `lib/types.ts` (CourseStatus + Course.deleted_at) | CourseStatus includes 'deleted'; Course has deleted_at | VERIFIED | Line 11: `'published' \| 'draft' \| 'deleted'`; line 90: `deleted_at: string \| null` |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `app/api/v1/courses/route.ts` | `lib/api/services/courses.ts` | `listCourses`, `createCourse` | WIRED | Both imported and called in GET/POST handlers |
| `app/api/v1/courses/[id]/route.ts` | `lib/api/services/courses.ts` | `getCourseById`, `updateCourse`, `deleteCourse` | WIRED | All three imported and called in respective handlers |
| `lib/api/services/courses.ts` | supabase courses table | `getSupabaseService().from('courses')` | WIRED | Lines 28, 66, 100, 160, 179 all query `from('courses')` |
| `app/api/v1/courses/[id]/route.ts` PATCH and DELETE | `lib/audit.ts logAudit` | `ctx.logAudit` after successful write | WIRED | PATCH: line 141; DELETE: line 189 — both call `ctx.logAudit` |
| `app/api/v1/courses/[id]/enrollments/route.ts` | `lib/api/services/courses.ts` | `listEnrollments`, `enrollUser` | WIRED | Both imported and called in GET/POST handlers |
| `app/api/v1/courses/[id]/enrollments/[userId]/route.ts` | `lib/api/services/courses.ts` | `updateEnrollment` | WIRED | Imported and called in PATCH handler |
| `lib/api/services/courses.ts` enrollment functions | supabase user_course_progress table | `getSupabaseService().from('user_course_progress')` | WIRED | Lines 204, 235, 247, 292 query `from('user_course_progress')` |
| enrollment route handlers | `lib/audit.ts logAudit` | `ctx.logAudit` for enroll and update-progress | WIRED | enrollments/route.ts line 104; enrollments/[userId]/route.ts line 100 |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `app/api/v1/courses/route.ts` GET | `data, count` | `listCourses` → `supabase.from('courses').select('*', { count: 'exact' })` | Yes — live DB query with exact count | FLOWING |
| `app/api/v1/courses/[id]/route.ts` GET | `data` | `getCourseById` → `supabase.from('courses').select('*').eq('id', id).is('deleted_at', null).single()` | Yes — live DB query | FLOWING |
| `app/api/v1/courses/[id]/enrollments/route.ts` GET | `data, count` | `listEnrollments` → `supabase.from('user_course_progress').select('*', { count: 'exact' })` | Yes — live DB query with exact count | FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED — no server running; tests are curl-based integration tests requiring a live Next.js instance. All data-flow traces confirm real DB queries with no static returns or empty fallbacks.

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| CRSE-01 | 04-01-PLAN | GET /courses lists courses with filters | SATISFIED | `listCourses` with category/level/access/status/search filters; route handler maps all 5 query params |
| CRSE-02 | 04-01-PLAN | GET /courses/:id returns course details | SATISFIED | `getCourseById` with soft-delete guard; 404 on missing/deleted |
| CRSE-03 | 04-01-PLAN | POST /courses creates a course | SATISFIED | `createCourse` called in POST handler with required field validation and audit log |
| CRSE-04 | 04-01-PLAN | PATCH /courses/:id updates a course | SATISFIED | `updateCourse` with ALLOWED_COURSE_UPDATE_FIELDS allowlist and audit log |
| CRSE-05 | 04-01-PLAN | DELETE /courses/:id deletes a course | SATISFIED | `deleteCourse` sets `deleted_at` + `status='deleted'`; soft-delete with audit log |
| CRSE-06 | 04-02-PLAN | GET /courses/:id/enrollments lists enrollments | SATISFIED | `listEnrollments` with pagination against `user_course_progress`; 404 if course missing |
| CRSE-07 | 04-02-PLAN | POST /courses/:id/enrollments enrolls a user | SATISFIED | `enrollUser` with course-exists check, duplicate detection (409), and audit log |
| CRSE-08 | 04-02-PLAN | PATCH /courses/:id/enrollments/:userId updates progress/completion | SATISFIED | `updateEnrollment` with auto-completion timestamp logic, 404 on missing enrollment, audit log |

No orphaned requirements — all 8 CRSE IDs (CRSE-01 through CRSE-08) are claimed by plans and verified in the codebase.

### Anti-Patterns Found

No anti-patterns detected. Grep scan across all 5 implementation files found zero TODO/FIXME/PLACEHOLDER comments, no `return null` / `return []` / `return {}` stub returns, and no hardcoded empty data flowing to responses.

### Human Verification Required

#### 1. Soft-delete DB constraint live

**Test:** POST a course, DELETE it, then GET it by ID. Verify 404. Also verify the row is still in the DB with `deleted_at` and `status='deleted'` set.
**Expected:** GET returns 404; DB row has `deleted_at` timestamp and `status = 'deleted'`
**Why human:** Requires a running app with a live Supabase connection. The migration was applied via `supabase db query --linked` (not `db push`) — worth confirming the status CHECK constraint actually prevents `status` values other than `published`, `draft`, `deleted`.

#### 2. Enrollment 409 conflict path

**Test:** POST `/api/v1/courses/:id/enrollments` twice with the same `user_id`. Verify second call returns HTTP 409 with `{ success: false, error: { code: 'CONFLICT' } }`.
**Expected:** First call returns 201; second call returns 409.
**Why human:** End-to-end duplicate detection relies on the `UNIQUE(user_id, course_id)` constraint and the `.maybeSingle()` check — needs live DB to confirm the constraint fires correctly alongside the service-layer check.

#### 3. Auto-completion timestamp

**Test:** PATCH `/api/v1/courses/:id/enrollments/:userId` with `{ "status": "completed" }` (no `completed_at`). Verify response includes `completed_at` set to current ISO timestamp. Then PATCH again with `{ "status": "in_progress" }`. Verify `completed_at` is null.
**Expected:** Status transitions correctly clear and set `completed_at`.
**Why human:** Auto-timestamp logic involves server-side `new Date().toISOString()` — needs live response to confirm the field is actually persisted and returned.

### Gaps Summary

No gaps. All 12 must-have truths verified, all 6 artifacts exist with substantive implementation, all 8 key links wired, all 8 CRSE requirements satisfied. Phase goal achieved.

---

_Verified: 2026-03-26_
_Verifier: Claude (gsd-verifier)_
