---
task_id: 260403-c2q
date: 2026-04-03
status: complete
commit: f3eb53c
---

# Quick Task: Fix Events Sidebar Filter Box Border Colors

## Task Description

The four sidebar filter containers on the events page (Mini Calendar, Event Type, Format, Category) used `border-slate-200/80` and `bg-white` Tailwind classes that appeared as jarring light/white boxes against the dark-themed events page background.

## Solution

Updated `app/events/page.tsx`:

- Four sidebar `<div>` containers: added `dark:bg-white/5` and `dark:border-white/10`
- Inner location filter divider: added `dark:border-white/10`
- Inactive filter buttons in all three filter boxes: added `dark:text-slate-300 dark:hover:bg-white/5`

## Status

Complete. TypeScript compiles cleanly. All four filter boxes now display correctly on the dark events page background.
