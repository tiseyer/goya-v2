---
phase: quick-task
plan: 260403-d6k
subsystem: events
tags: [events, instructors, organizers, join-table, migration, visibility-toggles]
key-files:
  created:
    - supabase/migrations/_skip_20260403_event_instructors.sql
    - app/components/InstructorPicker.tsx
  modified:
    - lib/types.ts
    - app/admin/events/components/EventForm.tsx
    - app/events/[id]/page.tsx
    - app/settings/my-events/page.tsx
decisions:
  - Profile-based instructors via join table; legacy text instructor field kept for backward compat
  - show_organizers and show_instructors default true; both stored as boolean columns on events
  - Delete button rendered without handler (wired in follow-up per plan)
  - My Events uses .or() with cs (contains) operator for organizer_ids uuid[] array
completed: "2026-04-03"
---

# Quick Task 260403-d6k: Event Instructors + Organizers Join Tables

**One-liner:** Profile-based event instructors via join table with visibility toggles, Edit/Delete buttons on event detail, and organizer-inclusive My Events query.

## What Was Built

### Database (Task 1)
- Created `event_instructors` join table (`event_id`, `profile_id`, `created_at`) with RLS policies
- Added `show_organizers boolean DEFAULT true` and `show_instructors boolean DEFAULT true` columns to `events` table
- Added `created_by`, `show_organizers`, `show_instructors` fields to the `Event` TypeScript interface
- Migration applied to remote database via `npx supabase db query --linked -f`

### InstructorPicker component (Task 2)
- New `app/components/InstructorPicker.tsx` modeled on OrganizerPicker
- No fixed "You" chip — all instructors are equal and removable
- Min 0 (optional), max 5, same debounced search + profile hydration pattern

### EventForm updates (Task 2)
- Replaced text `instructor` input with `InstructorPicker` in a new "Instructors" `FormSection`
- Removed `instructor` state variable and text-based payload field
- Added `show_organizers` and `show_instructors` visibility toggle checkboxes
- `useEffect` loads existing instructor IDs from join table on edit mount
- Submit handler syncs `event_instructors` (delete + re-insert) after main event save

### Event detail page (Task 3)
- Fetches instructor profiles from `event_instructors` join table
- Renders profile-based instructor widget (avatars + links to member profiles)
- Falls back to legacy text-based instructor widget for pre-migration events
- Organizers and instructors widgets gated by `show_organizers` / `show_instructors` flags
- Edit/Delete buttons shown for organizers and admin/moderator (Delete is UI-only, no handler yet)

### My Events (Task 3)
- Query changed from `.eq('created_by', user.id)` to `.or('created_by.eq.X,organizer_ids.cs.{X}')` so events where user is organizer (not just creator) are included

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 556eae3 | feat(260403-d6k): add event_instructors migration and update Event type |
| 2 | 4b64cef | feat(260403-d6k): add InstructorPicker component and update EventForm |
| 3 | 0d07005 | feat(260403-d6k): update event detail page and my-events query |

## Deviations from Plan

None — plan executed exactly as written. Migration applied via `npx supabase db query --linked` since `npx supabase db push` intentionally skips `_skip_` prefixed files.

## Known Stubs

- Delete button on event detail page renders but has no onClick handler. This is intentional per plan ("wire delete action in a follow-up").

## Self-Check: PASSED

- `supabase/migrations/_skip_20260403_event_instructors.sql` — exists
- `app/components/InstructorPicker.tsx` — exists
- `lib/types.ts` — has `created_by`, `show_organizers`, `show_instructors`
- Commits 556eae3, 4b64cef, 0d07005 — all present
- `npx tsc --noEmit` — 0 errors (excluding pre-existing `.next/` generated file issue)
