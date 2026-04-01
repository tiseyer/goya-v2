# Quick Task: Admin Courses List Updates (Phase 23)

**Date:** 2026-03-31
**Status:** Complete

## Description
Extend the admin courses page to show member-submitted courses, mirroring the v1.9 Phase 17 admin events list updates pattern.

## Solution
- **page.tsx**: Added TYPE_BADGE, expanded STATUS_BADGE (pending_review, rejected, deleted), Type column, profiles join for submitter info, course_type URL filter, default exclusion of deleted courses, user role detection
- **AdminCoursesFilters.tsx**: Added Type dropdown (All/GOYA/Member), expanded status options (pending_review, rejected, cancelled, deleted for admins), userRole prop
- **AdminCourseActions.tsx**: Changed hard delete to soft delete (status='deleted', deleted_at=now()), added restore functionality, integrated audit logging via logAdminCourseAction
- **[id]/edit/page.tsx**: Added Course History audit timeline (admin-only), fetches from course_audit_log via service role, displays action icons, performer names, changed fields, status change details
- **actions.ts**: New server action file for logAdminCourseAction (mirrors events/actions.ts pattern)
- **CourseForm.tsx**: Added audit logging on create (logs 'created' with payload) and edit (logs 'edited' with diff of changed fields), insert now returns id via .select('id').single()
