# Quick Task: Admin Inbox Courses Tab

**Date:** 2026-03-31
**Status:** Complete

## Description

Added a new "Courses" tab to the admin inbox for pending review workflow, mirroring the existing Events tab pattern exactly.

## Solution

1. **CoursesTab.tsx** — New client component with Pending/Approved/Rejected sub-tabs, table layout (Course Title, Submitted By, Category, Duration, Submitted, Actions), approve/reject buttons with inline rejection textarea
2. **actions.ts** — Added `approveCourse` and `rejectCourse` server actions with admin/moderator auth guard, status verification, audit logging via `writeCourseAuditLog`
3. **page.tsx** — Added courses data fetching (member courses with pending_review/published/rejected status), batch profile lookup for submitters, Courses tab link with amber pending badge, routing to CoursesTab component
