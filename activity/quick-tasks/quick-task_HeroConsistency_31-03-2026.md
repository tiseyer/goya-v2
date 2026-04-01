# Quick Task: Hero Consistency — GOYA Blue, Shared Height, Vertical Centering

**Date:** 2026-03-31
**Task ID:** 260331-kny
**Status:** Complete

## Task Description

Make all detail page heroes visually consistent with the overview page heroes. Previously, event detail, course detail, and member profile pages each had their own hero styling (different heights, different background colors including category-specific gradients and hardcoded hex values). This caused a jarring visual shift when navigating from an overview page to a detail page.

## Solution Summary

Applied the same hero pattern as `PageHero.tsx` (dark variant) to all three detail pages:

- **Background:** `bg-primary` (maps to `--goya-primary` = #345c83 CSS variable) — replaces `bg-primary-dark`, category gradient `linear-gradient` with `gradient_from`/`gradient_to` fields, and hardcoded `bg-gradient-to-b from-[#1B3A5C]`
- **Height:** `h-[200px] sm:h-[220px] md:h-[240px]` — fixed height matching overview page heroes
- **Centering:** `flex items-center` — vertical centering via flexbox, removing manual pt/pb padding
- **Decorations:** dot-grid texture overlay + soft glow added to course detail (already present on event detail)
- **CSS variables:** Replaced `bg-[#4E87A0]` with `bg-primary-light` on member profile glow element

## Files Changed

- `app/events/[id]/page.tsx` — gradient hero branch updated (image hero branch left unchanged)
- `app/academy/[id]/page.tsx` — category gradient removed, bg-primary applied, PageContainer added
- `app/members/[id]/page.tsx` — hardcoded hex gradient replaced with bg-primary, PageContainer added
