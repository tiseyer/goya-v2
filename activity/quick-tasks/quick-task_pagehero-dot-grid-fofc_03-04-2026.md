# Quick Task: PageHero Dot Grid Visibility + FOFC Prevention

**Date:** 2026-04-03
**Task ID:** 260403-n8u
**Status:** Done

## Task Description

Fix two visual issues in PageHero:
1. Dot grid pattern on dark variant was barely visible at normal zoom
2. On hard refresh, hero text flashed fallback prop values before DB content loaded

## Solution

**Fix 1 — Dot grid opacity:** Changed `opacity-[0.04]` to `opacity-[0.08]` on the dot-grid texture div in the dark variant. Light variant has no dot grid and was not changed.

**Fix 2 — FOFC prevention:** Added two state variables (`contentReady`, `showFallback`) and derived `isVisible` flag. Text content divs (both dark and light variants) start at `opacity-0` and transition to `opacity-100` when fetch resolves or after an 800ms timeout. The outer `<section>` (background, height, decorative elements) is always fully visible — no layout shift.

Heroes without a `pageSlug` (no fetch needed) render text immediately since both flags start as `true`.

## Files Changed

- `app/components/PageHero.tsx`

## Commit

`48ecc5c` — fix(quick-260403-n8u): increase dot grid opacity and prevent FOFC in PageHero
