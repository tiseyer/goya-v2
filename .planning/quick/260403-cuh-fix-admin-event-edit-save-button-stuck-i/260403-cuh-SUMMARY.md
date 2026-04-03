# Quick Task 260403-cuh: Fix admin event edit save button stuck in Saving state

**Date:** 2026-04-03
**Status:** Complete

## Problem

The Save button on the admin event edit form (`/admin/events/[id]/edit`) stayed stuck in "Saving..." state after a successful save. Data was saved correctly but the UI never recovered.

## Root Cause

The `handleSubmit` function called `router.push('/admin/events')` on success but never called `setSaving(false)`. In Next.js App Router, soft navigation doesn't unmount the component immediately, so the button stayed disabled with "Saving..." text.

## Fix

- Added `finally { setSaving(false) }` to guarantee button state resets regardless of outcome
- On edit: stay on page and show inline success message ("Event saved successfully.") that auto-dismisses after 3 seconds
- On create: still navigates to event list as before
- Added emerald success message banner matching the existing red error message style

## File Changed

- `app/admin/events/components/EventForm.tsx`

## Commit

- `473908b` — fix: admin event edit save button stuck in Saving state
