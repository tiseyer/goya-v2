# Quick Task 260331-p7b: Fix admin docs viewer layout proportions

**Status:** Complete
**Date:** 2026-03-31

## Changes

### `app/admin/docs/components/DocViewer.tsx`

- **Left sidebar**: widened from 250px to 280px for better nav readability
- **Right sidebar (TOC)**: widened from 220px to 240px, added left border for visual separation, increased heading from `text-xs` to `text-sm`, increased link font from `text-sm` to `text-[13px]` with better line-height and vertical spacing (`space-y-1` → `space-y-1.5`, added `py-0.5`), increased padding from `p-4` to `p-5`
- **Middle content**: removed centering (`mx-auto`), widened max-width from `max-w-3xl` (768px) to `max-w-4xl` (896px), increased horizontal padding (`px-8` → `px-10 lg:px-12`)

## Result

The docs viewer now uses significantly more of the available screen width. The right TOC sidebar feels like a proper sidebar rather than a cramped footnote. The overall layout is closer to docs.anthropic.com / Linear docs in feel.
