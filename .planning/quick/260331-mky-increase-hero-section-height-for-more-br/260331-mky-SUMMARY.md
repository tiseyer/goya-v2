# Quick Task 260331-mky: Increase hero section height for more breathing room

**Status:** Complete
**Date:** 2026-03-31

## Changes

Increased hero height by +40px at each breakpoint for a more spacious, premium feel:

| Breakpoint | Old | New |
|------------|-----|-----|
| Mobile | 200px | 240px |
| sm (640px+) | 220px | 260px |
| md (768px+) | 240px | 280px |

### Files updated (5 instances total):

1. `app/components/PageHero.tsx` — shared component (2 variants: dark + light), plus inner glow div height
2. `app/events/[id]/page.tsx` — event detail hero
3. `app/members/[id]/page.tsx` — member detail hero
4. `app/academy/[id]/page.tsx` — course detail hero

## Verification

- No remaining old height values (`h-[200px] sm:h-[220px]`)
- `npx tsc --noEmit` passes
