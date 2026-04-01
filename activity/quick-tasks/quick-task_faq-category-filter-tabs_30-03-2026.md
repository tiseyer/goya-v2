# Quick Task: FAQ Category Filter Tabs

**Date:** 2026-03-30
**Task ID:** 260330-hva
**Status:** DONE

## Task Description

Add category filter tabs to the FAQ admin UI at `/admin/chatbot`. With 33 FAQs across 8 categories, a flat list is hard to navigate. Tabs let admins focus on one category at a time.

## Solution

Modified `app/admin/chatbot/FaqTab.tsx`:
- Added `categoryFilter` state (default `'All'`)
- Added `categories` useMemo — derives unique sorted categories from `items` (full list, stable during search)
- Added `categoryCounts` useMemo — counts per category including "All"
- Updated `filteredItems` to useMemo combining both search and category filter
- Rendered pill-style tab bar between toolbar and table using brand blue `#4e87a0` for active state

Also fixed two type bugs discovered during build:
- Added `category: string | null` to `FaqItem` in `lib/chatbot/types.ts` (was missing despite 20260366 migration)
- Added `category: data.category ?? null` to returned item in `chatbot-actions.ts` `createFaqItem` action

## Commits

- `411f37c` — FaqTab.tsx + types.ts changes
- `7057ec5` — chatbot-actions.ts fix
