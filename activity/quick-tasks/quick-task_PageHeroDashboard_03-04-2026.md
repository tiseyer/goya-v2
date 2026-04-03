# Quick Task: Standardize Page Hero on Dashboard

**Date:** 2026-04-03
**Status:** Complete
**Quick ID:** 260403-bpe

## Task Description

Add the existing `<PageHero>` component to all 4 dashboard layouts (Student, Teacher, Wellness, School) with role-aware content, replacing the inline `DashboardGreeting` component.

## Solution

- Replaced `DashboardGreeting` with `<PageHero variant="dark">` in `DashboardStudent`, `DashboardTeacher`, `DashboardWellness`, and `DashboardSchool`
- Each dashboard now shows a full-width dark hero with role pill, dynamic time-of-day title ("Good morning/afternoon/evening, [Name]."), and role-specific subtitle
- DashboardSchool uses "Welcome, [SchoolName]." since time-of-day doesn't suit org names
- Deleted `DashboardGreeting.tsx` (no remaining imports)
- Added TODO comment in `PageHero.tsx` listing 3 adoption candidates: about, standards, credits pages

## Commits

- `cbae423` — feat: replace DashboardGreeting with PageHero in all 4 dashboard layouts
- `7ddf829` — chore: delete DashboardGreeting and add PageHero adoption TODO
