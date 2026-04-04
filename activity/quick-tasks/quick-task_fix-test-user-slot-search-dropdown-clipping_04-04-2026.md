---
task: 260404-kmn
date: 2026-04-04
status: complete
---

# Quick Task: Fix Test User Slot Search Dropdown Clipping

## Task Description

The search results dropdown in Admin Settings > Test Users tab was invisible because two parent containers had `overflow-hidden` set, causing the absolutely-positioned dropdown to be clipped. The dropdown also had a low z-index (z-20) that could cause stacking issues.

## Solution

Three changes in `app/admin/settings/components/TestUsersTab.tsx`:

1. Removed `overflow-hidden` from the outer card wrapper (`<div>` at line 377)
2. Removed `overflow-hidden` from the individual slot card (`<div>` at line 123 inside `SortableSlot`)
3. Raised dropdown z-index from `z-20` to `z-50` on both dropdown elements (results list and "no results" message), matching the `InstructorPicker` pattern

## Status

Complete — commit `900e820`
