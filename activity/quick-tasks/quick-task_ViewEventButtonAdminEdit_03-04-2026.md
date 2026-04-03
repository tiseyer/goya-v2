# Quick Task: Add View Event Button to Admin Event Edit Page

**Date:** 2026-04-03
**Task ID:** 260403-d8m
**Status:** Done

## Task Description

Add a "View Event" button to the admin event edit page in two locations:
1. Top-right of the "Edit Event" heading
2. Bottom-right of the Save/Cancel action bar (edit mode only)

Both buttons open the public event detail page (`/events/{id}`) in a new tab.

## Solution

- **`app/admin/events/[id]/edit/page.tsx`**: Converted heading `<div>` to a flex row with `justify-between`. Added `<a target="_blank">` on the right linking to `/events/${id}` with outline styling and external link SVG icon.
- **`app/admin/events/components/EventForm.tsx`**: Added `{isEdit && event?.id && (...)}` conditional after the Cancel `<Link>`. Uses `ml-auto` to push View Event to the right, keeping Save+Cancel visually grouped. Hidden on the create event form.

## Commits

- `db7091b` — feat(quick-260403-d8m): add View Event button next to Edit Event heading
- `ce3078b` — feat(quick-260403-d8m): add View Event button to EventForm action bar
