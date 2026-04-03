---
task_id: 260403-hb7
date: 2026-04-03
status: complete
---

# Quick Task: Courses Parity with Events

## Description

Bring courses to feature parity with events: add instructor/organizer/attendee management to the admin form, restyle the form to match EventForm's FormSection pattern, add frontend sidebar widgets and attendees section, add edit permissions for organizers, and expand the My Courses query.

## Status: Complete

## Solution

### Task 1 — Database migration + type update
- Created `supabase/migrations/_skip_20260403_course_instructors_attendees.sql`
- New columns on `courses`: `show_organizers`, `show_instructors`, `show_attendees`, `organizer_ids uuid[]`, `created_by uuid`
- New `course_instructors` join table with RLS policies (public read, organizer/admin write)
- New `course_attendees` join table with RLS policies (public read, organizer/admin write)
- Updated `Course` interface in `lib/types.ts` with all 5 new fields
- Applied migration via `npx supabase db query --linked -f`

### Task 2 — Admin form restyle + pickers
- `CourseForm.tsx` rewritten to match `EventForm.tsx` design pattern
  - FormSection helper component with `border-goya-border` / `shadow-soft` styling
  - Design tokens updated: `border-goya-border`, `text-foreground`, `focus:ring-primary`
  - Old text `instructor` field removed
- Added `InstructorPicker` section (max 5, join table sync on save)
- Added `OrganizerPicker` section (current user always slot 1, max 5 total)
- Added `AttendeePicker` section (edit mode only, add/remove from `course_attendees`)
- Visibility toggles for all three sections
- Edit page (`app/admin/courses/[id]/edit/page.tsx`):
  - Passes `userRole`, `currentUserId`, `currentUserName`, `currentUserAvatar` to CourseForm
  - Audit history wrapped in `<details>` collapsible element
  - Added "View Course" link to page header
- Created `app/admin/courses/components/AttendeePicker.tsx` (mirrors event AttendeePicker)

### Task 3 — Frontend + permissions + My Courses
- `app/academy/[id]/page.tsx`:
  - Fetches instructor profiles from `course_instructors` join table
  - Fetches organizer profiles from `courses.organizer_ids`
  - Fetches attendee count and first 20 profiles
  - Instructor sidebar widget (with text fallback for pre-migration courses)
  - Organizer sidebar widget
  - Attendees section in main content (show_attendees gated)
  - canManage check: organizer_ids includes user OR role is admin/moderator
  - "Edit Course" button in right sidebar for canManage users
- `app/settings/my-courses/page.tsx`:
  - Query changed from `.eq('created_by', userId)` to `.or('created_by.eq.X,organizer_ids.cs.{X}')`
