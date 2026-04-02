# Quick Task: School Context Switch

**Date:** 2026-04-02
**Status:** Complete
**Branch:** develop (commits mixed — see note)

## Description

Implemented full "School Context Switch" feature allowing teachers who own or manage a school to switch their active context between personal and school identity. Similar to Facebook Pages or Slack workspace switching.

## Solution

### Database (Migration 20260403)
- Added `can_manage` boolean to `school_faculty` table
- Added `author_type` + `school_author_id` to events, courses, and messages tables
- Indexes on school author columns

### Context Infrastructure
- `lib/active-context.ts`: parseActiveContext(), getUserSchools(), validateSchoolAccess()
- `app/actions/context.ts`: switchContext() server action — sets `goya_active_context` cookie
- `lib/hooks/useActiveContext.ts`: client hook for reading/switching context
- `middleware.ts`: reads cookie, validates access (TTL-cached), forwards as `x-active-context` header

### Profile Dropdown Redesign
- Header UserMenu shows context switcher when schools available
- Active identity (personal or school) shown at top with avatar/logo
- "Switch to" section shows available alternatives
- Menu items change (School Profile, School Settings vs My Profile, Credits & Hours)
- Mobile bottom sheet updated with same context switching

### Dashboard
- Replaced `?view=school` URL param with cookie-based context reading
- Removed toggle pills from DashboardTeacher/DashboardSchool

### Attribution
- Messages: `sender_type` + `sender_school_id` set from active context
- Events: `author_type` + `school_author_id` set from active context
- Courses: `author_type` + `school_author_id` set from active context

### Faculty Management
- `toggleFacultyCanManage` server action
- "Can manage / View only" toggle badge on faculty list
- Faculty with `can_manage=true` can switch to school context

### Seed Data
- `scripts/seed-school-context-test.ts` creates test teacher, school, 3 faculty
- `npm run seed:school-test`

## Commits
- 48aff3c docs: research and plan
- 995de1d feat: database foundation
- 33aac14 feat: add seed script
- aa5204f feat: context switching infrastructure
- 38520b8 feat: redesign profile dropdown
- e29e256 feat: dashboard reads active context
- 3d58801 feat: context-aware attribution
- fe727ef feat: add can_manage toggle
