# Milestone: v1.10 Member Courses

**Started:** 2026-03-31
**Completed:** 2026-03-31
**Phases:** 6 (22-27)

## Deliverables

### Database (Phase 22)
- [x] `course_type` column ('goya'/'member') on courses table
- [x] `created_by` FK to profiles for member-submitted courses
- [x] Status workflow: draft, pending_review, published, rejected, cancelled, deleted
- [x] `rejection_reason` text column
- [x] `deleted_at` column for soft-delete
- [x] `course_audit_log` table with full lifecycle tracking
- [x] RLS policies: member insert/read/update own courses, mod approve/reject, admin full access
- [x] Reuses `is_event_submitter()` helper from events milestone
- [x] TypeScript types regenerated

### Admin Courses List (Phase 23)
- [x] Course type badge (GOYA blue / Member indigo) in admin table
- [x] Type filter dropdown (All/GOYA/Member)
- [x] Submitter name shown for member courses via created_by join
- [x] Extended status filter (Published, Draft, Pending Review, Rejected, Cancelled, Deleted)
- [x] Changed hard delete to soft delete with restore functionality
- [x] Audit history timeline on course edit page (admin only)
- [x] Audit logging on all admin actions (create, edit, delete, restore)

### Admin Inbox Courses Tab (Phase 24)
- [x] "Courses" tab in admin inbox (after Events tab)
- [x] Pending review queue with badge count
- [x] Approve action → status to published + audit log
- [x] Reject action with required reason modal → status to rejected + audit log

### My Courses Settings Page (Phase 25)
- [x] "My Courses" nav item in settings sidebar (role-gated: teacher/WP/admin)
- [x] Empty state with book icon, description, "+ Add New Course" button
- [x] Courses list with status badges (Draft grey, Pending amber, Published green, Rejected red)
- [x] Status-aware actions per course
- [x] First-time info modal (localStorage-gated)
- [x] Inline course creation/edit form with all fields + gradient preview
- [x] "Save as Draft" / "Submit for Review" buttons
- [x] Rejected course edit + resubmit clears rejection_reason

### Public Academy Type Filter (Phase 26)
- [x] Course type filter on /academy: All Courses, GOYA Courses, Member Courses
- [x] Pill button style matching category filter
- [x] Only published courses shown regardless of filter
- [x] Works alongside existing category and progress filters

### Audit Log Coverage (Phase 27)
- [x] Shared `lib/courses/audit.ts` with `writeCourseAuditLog()` utility
- [x] All 10 code paths wired: admin create/edit/delete/restore, inbox approve/reject, member create/edit/submit/delete

## Files Changed

### New Files
- `supabase/migrations/20260372_member_courses_schema.sql`
- `supabase/migrations/20260373_member_courses_rls.sql`
- `lib/courses/audit.ts`
- `app/admin/courses/actions.ts`
- `app/admin/inbox/CoursesTab.tsx`
- `app/settings/my-courses/page.tsx`
- `app/settings/my-courses/MyCoursesClient.tsx`
- `app/settings/my-courses/actions.ts`

### Modified Files
- `types/supabase.ts` (regenerated)
- `lib/types.ts` (Course type extended)
- `app/admin/courses/page.tsx` (type badge, filters, submitter)
- `app/admin/courses/AdminCoursesFilters.tsx` (type + status filters)
- `app/admin/courses/AdminCourseActions.tsx` (soft delete, restore, audit)
- `app/admin/courses/[id]/edit/page.tsx` (audit history timeline)
- `app/admin/courses/components/CourseForm.tsx` (audit logging)
- `app/admin/inbox/page.tsx` (Courses tab + data fetch)
- `app/admin/inbox/actions.ts` (approveCourse, rejectCourse)
- `app/settings/components/SettingsShell.tsx` (My Courses nav item)
- `app/academy/page.tsx` (type filter)

## Summary

Members with teacher, wellness_practitioner, or admin roles can now submit courses to the GOYA Academy. Courses go through a draft → pending review → published/rejected workflow with full audit logging. Admins and moderators can approve or reject submissions from the inbox. The public academy page supports filtering by GOYA vs Member courses. Mirrors the v1.9 Member Events milestone patterns exactly.
