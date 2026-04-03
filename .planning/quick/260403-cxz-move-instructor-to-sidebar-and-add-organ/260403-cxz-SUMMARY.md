# Quick Task 260403-cxz: Move instructor to sidebar and add organizers widget

**Date:** 2026-04-03
**Status:** Complete

## Changes

- Removed instructor block from the main content area (left column) on `app/events/[id]/page.tsx`
- Added Instructor sidebar widget below the booking card (avatar initial + name, matches sidebar card style)
- Added Organizers sidebar widget that fetches profiles by `organizer_ids` array from the events table and displays each with avatar + name, linking to their member profile
- Both widgets only render when relevant data is present

## Commit

- `444c23a` — feat: move instructor to sidebar and add organizers widget on event detail
