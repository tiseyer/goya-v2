# Quick Task: Fix Hero Layout on Detail Pages

**Date:** 2026-03-31
**Status:** Complete
**Task ID:** 260331-my2

## Description

Fix the hero layout on event detail, course detail, and member profile pages: left-align all hero content, increase vertical spacing between elements, bump H1 titles to text-4xl md:text-5xl, and establish consistent structure (back link > pills > H1 > meta info).

## Solution

- **app/events/[id]/page.tsx** — Image hero and gradient hero both updated: title to `text-4xl md:text-5xl`, date meta line added after H1, spacing increased between back link/pills/title
- **app/academy/[id]/page.tsx** — Back link gap `mb-2`→`mb-4`, pills `mb-2`→`mb-3`, title to `text-4xl md:text-5xl`, instructor + duration meta line added
- **app/members/[id]/page.tsx** — Removed mobile `text-center`, all hero text left-aligned with `items-start` and `text-left`, title to `text-4xl md:text-5xl`

## Commits

- `43354ed` feat(quick-260331-my2): fix event and course detail hero spacing, title size, meta line
- `5bbb045` feat(quick-260331-my2): left-align member profile hero and bump title size
