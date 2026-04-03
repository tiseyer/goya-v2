# Quick Task: event-instructors-organizers-join-tables

**Date:** 2026-04-03
**Task ID:** 260403-d6k
**Status:** Complete

## Task Description

Convert event instructors from plain text to profile-based join table, add visibility toggles for organizers/instructors on public event page, add Edit/Delete buttons to event detail for authorized users, and expand My Events to include events where user is an organizer.

## Solution

1. **Migration** — Created `event_instructors` join table with RLS and added `show_organizers`/`show_instructors` boolean columns to `events` table. Applied directly via `npx supabase db query --linked`.

2. **InstructorPicker component** — New `app/components/InstructorPicker.tsx` modeled on OrganizerPicker: debounced search, profile hydration, chip UI, all instructors removable, max 5.

3. **EventForm** — Replaced text instructor field with InstructorPicker in its own FormSection. Added visibility toggles for organizers and instructors. Syncs `event_instructors` join table on save.

4. **Event detail page** — Fetches instructors from join table, renders profile-based widgets with avatars/links. Legacy text instructor shown as fallback. Visibility flags gate both widgets. Edit/Delete buttons shown for organizers and admin/moderator.

5. **My Events** — Query expanded with `.or('created_by.eq.X,organizer_ids.cs.{X}')` to include events where user is organizer.

## Commits

- `556eae3` — feat(260403-d6k): add event_instructors migration and update Event type
- `4b64cef` — feat(260403-d6k): add InstructorPicker component and update EventForm
- `0d07005` — feat(260403-d6k): update event detail page and my-events query
