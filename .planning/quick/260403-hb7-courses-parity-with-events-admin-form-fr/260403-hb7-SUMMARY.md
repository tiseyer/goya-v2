---
phase: quick-task
plan: 260403-hb7
subsystem: courses
tags: [courses, instructors, organizers, attendees, join-table, migration, visibility-toggles, admin-form, frontend]
key-files:
  created:
    - supabase/migrations/_skip_20260403_course_instructors_attendees.sql
    - app/admin/courses/components/AttendeePicker.tsx
  modified:
    - lib/types.ts
    - app/admin/courses/components/CourseForm.tsx
    - app/admin/courses/[id]/edit/page.tsx
    - app/academy/[id]/page.tsx
    - app/settings/my-courses/page.tsx
    - docs/admin/courses.md
decisions:
  - Profile-based instructors via course_instructors join table; legacy text instructor field kept as fallback for pre-migration courses
  - organizer_ids uuid[] on courses table (same pattern as events); RLS policies depend on column being present, so columns added before join tables in migration
  - canManage check on course detail page reuses the existing auth.getUser() call; does a separate profile fetch only when not already an organizer
  - My Courses uses .or() with cs (contains) operator for organizer_ids uuid[] array, same pattern as My Events
completed: "2026-04-03"
---

# Quick Task 260403-hb7: Courses Parity with Events

**One-liner:** Profile-based course instructors/organizers/attendees via join tables with visibility toggles, restyled admin form matching EventForm's FormSection pattern, and organizer-aware frontend widgets and permissions.

## What Was Built

### Task 1 — Database + Types
- Created migration `_skip_20260403_course_instructors_attendees.sql`
- Columns added to `courses`: `show_organizers boolean DEFAULT true`, `show_instructors boolean DEFAULT true`, `show_attendees boolean DEFAULT false`, `organizer_ids uuid[] DEFAULT '{}'`, `created_by uuid REFERENCES profiles(id)`
- `course_instructors` join table (`course_id`, `profile_id`, `created_at`) with RLS: public read; organizer/admin/moderator write
- `course_attendees` join table (`course_id`, `profile_id`, `created_at`) with RLS: public read; organizer/admin/moderator write
- `Course` interface updated with all 5 new fields
- Migration order: columns first, then tables (RLS policies reference `c.organizer_ids`)

### Task 2 — Admin Form
- `CourseForm.tsx` fully rewritten to match `EventForm.tsx` design
  - `FormSection` helper (bg-white, border-goya-border, shadow-soft, p-6)
  - Tokens: `INPUT`, `LABEL`, `SELECT` use `border-goya-border`, `text-foreground`, `focus:ring-primary`
  - Removed text instructor input
- Instructors section: `InstructorPicker`, `show_instructors` toggle, join table sync on save (delete+insert)
- Organizers section: `OrganizerPicker` (current user always slot 1), `show_organizers` toggle, stored in `organizer_ids[]`
- Attendees section (edit mode only): new `AttendeePicker` component using `course_attendees` table, `show_attendees` toggle
- `CourseForm` props extended: `userRole`, `currentUserId`, `currentUserName`, `currentUserAvatar`
- Edit page: passes all new props; audit history now collapsible `<details>`; "View Course" link in header
- New `AttendeePicker.tsx` at `app/admin/courses/components/AttendeePicker.tsx`

### Task 3 — Frontend + Permissions
- `app/academy/[id]/page.tsx`:
  - canManage: checks `organizer_ids.includes(user.id)` OR role is admin/moderator
  - Fetches organizer profiles from `profiles` using `organizer_ids` array
  - Fetches instructor profiles from `course_instructors` join table
  - Fetches attendee count + first 20 profiles when `show_attendees` is true
  - Instructor sidebar widget with text fallback for pre-migration courses
  - Organizer sidebar widget
  - Attendees section in left column (gated by `show_attendees`, shows "+N more" when >20)
  - Edit Course button in right sidebar for `canManage` users
- `app/settings/my-courses/page.tsx`: query uses `.or('created_by.eq.X,organizer_ids.cs.{X}')` so organizer-linked courses are included

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | c0bafdb | Database migration + Course type fields |
| 2 | 195d6bc | CourseForm restyle + AttendeePicker + edit page updates |
| 3 | afc9828 | Frontend sidebar widgets + edit button + My Courses query |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Migration column ordering**
- **Found during:** Task 1 database push
- **Issue:** RLS policies on `course_instructors` referenced `c.organizer_ids` which didn't exist yet when policies were evaluated — the original migration added columns after creating the tables
- **Fix:** Reordered migration to add all `courses` columns first, then create join tables with RLS policies
- **Files modified:** `supabase/migrations/_skip_20260403_course_instructors_attendees.sql`

## Known Stubs

None — all new fields are wired to real data. Visibility flags default to sensible values (`show_organizers/show_instructors = true`, `show_attendees = false`).

## Self-Check: PASSED
