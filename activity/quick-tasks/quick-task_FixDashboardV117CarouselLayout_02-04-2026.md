---
task: 260402-jts
date: 02-04-2026
status: complete
---

# Quick Task: Fix Dashboard v1.17 Carousel Layout

## Task Description

Restore the full v1.17 student dashboard layout that was built in Phase 45 but never merged from the worktree branch to develop.

The student dashboard was showing a stub with basic greeting and stat cards (StubSection components) instead of the redesigned carousel layout.

## Status

Complete

## Solution

1. Created `app/dashboard/components/TeacherCard.tsx` — the only card component still missing from develop (CourseCard and EventCard had been recreated by later phases).

2. Replaced `app/dashboard/components/DashboardStudent.tsx` stub with the full v1.17 carousel layout:
   - DashboardGreeting with role="student"
   - Teachers carousel (connections filtered by role=teacher)
   - Courses carousel
   - Events carousel
   - Each carousel has a contextual empty state with CTA link

Commits: 17b17ff (TeacherCard), 555da57 (DashboardStudent)
