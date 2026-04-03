# Quick Task: Fix Events Page Dark Background

**Date:** 2026-04-03
**Task ID:** 260403-bsn
**Status:** Done

## Task Description

Events page outer wrapper used `bg-[#F8FAFC]` (hardcoded light gray) with no `.dark` override in globals.css. In dark mode, the page background stayed light while cards/sidebar/calendar correctly went dark, breaking visual consistency.

## Solution

1. Added `.dark .bg-\[\#F8FAFC\] { background-color: var(--background) !important; }` to `app/globals.css` — follows the same pattern as existing hex overrides for `#F9FAFB`, `#F3F4F6`, `#FAFAFA`.

2. Updated the mobile sticky filter bar in `app/events/page.tsx` to include `dark:bg-[#0F1117]/95` and `dark:border-slate-700` dark mode variants.

## Commit

`cb6135d` — fix(260403-bsn): events page dark mode background
