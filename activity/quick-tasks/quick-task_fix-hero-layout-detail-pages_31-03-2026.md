---
task: 260331-my2
date: 2026-03-31
status: completed
---

# Quick Task: Fix Hero Layout on Detail Pages

## Description

Fixed hero layout on three detail pages (event, course, member profile) to be left-aligned with increased spacing, larger titles, and consistent structure.

## Status

Completed

## Solution

**Files modified:**

- `app/events/[id]/page.tsx` — Image hero: bumped title to `text-4xl md:text-5xl`, added date meta line, tightened back link gap. Gradient hero: pills `mb-4`→`mb-3`, title updated to `md:text-5xl`.
- `app/academy/[id]/page.tsx` — Back link `mb-2`→`mb-4`, pills `mb-2`→`mb-3`, title `text-3xl sm:text-4xl`→`text-4xl md:text-5xl`, instructor + duration meta line added.
- `app/members/[id]/page.tsx` — All hero text left-aligned (removed text-center/justify-center), title `text-3xl sm:text-4xl lg:text-5xl`→`text-4xl md:text-5xl`, location meta `mt-2`→`mt-1`.

**Commits:**
- `43354ed` — event + course heroes
- `5bbb045` — member profile hero
