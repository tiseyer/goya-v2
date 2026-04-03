# Quick Task: Standardize Page Hero Sections with Reusable PageHero

**Date:** 2026-04-03
**Task ID:** 260403-bpe
**Status:** Done

## Task Description

Replace the inline `DashboardGreeting` component with the reusable `PageHero` component across all 4 dashboard layout components, then audit the codebase for other pages that should adopt PageHero.

## Solution

**Task 1 — Dashboard layouts updated (commit cbae423):**

- `DashboardStudent`: `PageHero variant="dark" pill="Student"`, `Good {time}, {firstName}.`, subtitle "Ready to practice today?"
- `DashboardTeacher`: `PageHero variant="dark" pill="Teacher"`, `Good {time}, {firstName}.`, subtitle "What will you teach today?"
- `DashboardWellness`: `PageHero variant="dark" pill="Wellness Practitioner"`, `Good {time}, {firstName}.`, subtitle "Ready to support your clients?"
- `DashboardSchool`: `PageHero variant="dark" pill="School Owner"`, `Welcome, {schoolName}.`, subtitle "Manage your school and students."

PageHero sits outside and before PageContainer in each file. `getTimeOfDay()` from `./utils` used for dynamic time-of-day title (student/teacher/wellness only).

**Task 2 — Cleanup and audit (commit 7ddf829):**

- Deleted `app/dashboard/components/DashboardGreeting.tsx` (no remaining imports)
- Added TODO comment to `app/components/PageHero.tsx` listing 3 adoption candidates: `app/about/page.tsx`, `app/standards/page.tsx`, `app/credits/page.tsx`
