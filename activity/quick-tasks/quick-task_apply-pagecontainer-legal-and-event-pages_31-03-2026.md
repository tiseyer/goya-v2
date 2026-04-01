---
task: 260331-jpr
date: 2026-03-31
status: completed
---

# Quick Task: Apply PageContainer to Legal Pages + Event Detail

## Task Description

Apply the `PageContainer` component to the 4 legal pages (privacy, terms, code-of-conduct, code-of-ethics) and the event detail page (`app/events/[id]/page.tsx`) that were missed when the PageContainer standard was established in quick-260331-j10.

## Status

Completed — all 5 pages updated, 0 hardcoded `max-w-7xl` remain on these pages.

## Solution

For each legal page:
- Hero section: removed inline `px-4 sm:px-6 lg:px-8` from full-bleed bg div, replaced inner `max-w-7xl mx-auto` with `<PageContainer>`
- Body section: replaced `max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-14 pb-24` with `<PageContainer className="py-14 pb-24">` + inner `<div className="max-w-3xl mx-auto">` for prose readability

For the event detail page:
- Image hero overlay: wrapped content in `<PageContainer>`, removed hardcoded px padding from absolute-positioned outer div
- Gradient hero: removed `px-4 sm:px-6 lg:px-8` from `bg-primary-dark` outer div, replaced inner `max-w-7xl mx-auto relative` with `<PageContainer className="relative">`
- Main content grid: replaced `max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10` div with `<PageContainer className="py-10">`

## Commits

- `c58e3fc` — refactor(quick-260331-jpr): apply PageContainer to 4 legal pages
- `3cac382` — refactor(quick-260331-jpr): apply PageContainer to event detail page
