# Quick Task: Global Layout Width Consistency

**Date:** 2026-03-31
**Status:** Complete

## Description

Extracted the canonical layout width pattern (`max-w-7xl mx-auto px-4 sm:px-6 lg:px-8`) into a reusable `PageContainer` component and fixed all public pages that used narrower or inconsistent widths.

## Solution

### PageContainer Component
Created `app/components/ui/PageContainer.tsx` as the single source of truth for page content width. Accepts `children`, `className`, and `as` (div/section/main) props.

### Pages Fixed

| Page | Change |
|------|--------|
| `app/events/[id]/page.tsx` | `max-w-5xl` -> `max-w-7xl` (3 occurrences: hero overlay, gradient hero, main content) |
| `app/academy/[id]/page.tsx` | `max-w-6xl` -> `max-w-7xl` + added missing `px-4 sm:px-6 lg:px-8` to hero |
| `app/academy/[id]/lesson/page.tsx` | `max-w-5xl` -> `max-w-7xl` (2 occurrences: top bar, main content) |
| `app/members/[id]/page.tsx` | Added `px-4 sm:px-6 lg:px-8` to hero section (already had `max-w-7xl`) |
| `app/privacy/page.tsx` | Hero `max-w-3xl` -> `max-w-7xl` (body prose stays `max-w-3xl`) |
| `app/terms/page.tsx` | Hero `max-w-3xl` -> `max-w-7xl` (body prose stays `max-w-3xl`) |
| `app/code-of-conduct/page.tsx` | Hero `max-w-3xl` -> `max-w-7xl` (body prose stays `max-w-3xl`) |
| `app/code-of-ethics/page.tsx` | Hero `max-w-3xl` -> `max-w-7xl` (body prose stays `max-w-3xl`) |

### CLAUDE.md Updated
Added "Layout Width Standard" section documenting the pattern and rules for future development.
