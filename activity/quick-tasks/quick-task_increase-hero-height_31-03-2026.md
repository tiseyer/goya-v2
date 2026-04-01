# Quick Task: Increase Hero Section Height

**Status:** Complete
**Date:** 2026-03-31

## Task

Hero sections across all pages felt too compact. Increased height by +40px at each breakpoint (200→240, 220→260, 240→280) for more generous vertical breathing room.

## Solution

Updated 5 instances across 4 files: shared PageHero component (both variants) and 3 detail page heroes (events, members, academy). All now use consistent `h-[240px] sm:h-[260px] md:h-[280px]`.
