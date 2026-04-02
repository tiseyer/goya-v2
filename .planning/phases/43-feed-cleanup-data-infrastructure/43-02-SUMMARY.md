---
phase: 43-feed-cleanup-data-infrastructure
plan: "02"
subsystem: dashboard
tags: [server-component, role-branching, dashboard, async, data-fetching]
dependency_graph:
  requires: [43-01]
  provides: [dashboard-server-component, role-layout-stubs]
  affects: [app/dashboard/page.tsx, app/dashboard/components/]
tech_stack:
  added: []
  patterns: [async-server-component, promise-all-data-fetch, url-param-toggle, role-based-routing]
key_files:
  created:
    - app/dashboard/components/types.ts
    - app/dashboard/components/utils.tsx
    - app/dashboard/components/DashboardStudent.tsx
    - app/dashboard/components/DashboardTeacher.tsx
    - app/dashboard/components/DashboardSchool.tsx
    - app/dashboard/components/DashboardWellness.tsx
  modified:
    - app/dashboard/page.tsx
decisions:
  - "SchoolProps.slug and .status typed as nullable (string | null) to match Supabase return type"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  tasks_total: 2
  files_created: 6
  files_modified: 1
---

# Phase 43 Plan 02: Async Server Component + Role Layout Stubs Summary

**One-liner:** Async server component with Promise.all data fetching and four role layout stubs (student, teacher, school via teacher+principal_trainer_school_id, wellness), plus ?view=school toggle.

## What Was Built

### Task 1 — page.tsx rewrite
`app/dashboard/page.tsx` is now a pure async server component (zero `'use client'`). Key behaviors:

- Auth via `getEffectiveUserId()` + `getEffectiveClient()` — impersonation-safe
- Profile fetched with explicit column list (no `select('*')`)
- All data fetched once via `Promise.all` before any branching: events, courses, connections, credits, in-progress courses
- School ownership: `profile.role === 'teacher' && Boolean(profile.principal_trainer_school_id)` — never checks `role === 'school'`
- View as School toggle: `params.view === 'school'` URL param; school/faculty data fetched in a second `Promise.all` only when toggled
- Profile completion computed server-side (no client flicker)
- Role branch order: school view → teacher → wellness_practitioner → student (default)

### Task 2 — Role layout stubs
Six files created in `app/dashboard/components/`:

| File | Purpose |
|------|---------|
| `types.ts` | `DashboardProps`, `TeacherProps`, `SchoolProps` using real types from `queries.ts` and `credits.ts` |
| `utils.tsx` | Shared `getTimeOfDay()` and `StubSection` card component |
| `DashboardStudent.tsx` | Greeting + events/courses/connections/completion counts |
| `DashboardTeacher.tsx` | Same + conditional "View as School →" link |
| `DashboardSchool.tsx` | School.name in subtitle + faculty count + "← Back to Teacher View" link |
| `DashboardWellness.tsx` | Same structure as student with wellness messaging |

All stubs: `'use client'`, use `PageContainer`, show greeting with time-of-day, show data summary counts, show profile completion when < 100%.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] SchoolProps.school nullable fields**
- **Found during:** Task 2, tsc --noEmit
- **Issue:** `SchoolProps.school.slug` and `status` typed as `string` (non-nullable) but Supabase `.single()` returns `string | null` for both
- **Fix:** Changed both to `string | null` in `types.ts`
- **Files modified:** `app/dashboard/components/types.ts`
- **Commit:** 547816d

## Known Stubs

The role layout components are intentional stubs — they display data counts but no rich UI:

| Component | File | Stub nature | Resolved in |
|-----------|------|-------------|-------------|
| DashboardStudent | `app/dashboard/components/DashboardStudent.tsx` | Count cards only; no carousels, no feed | Phase 44 |
| DashboardTeacher | `app/dashboard/components/DashboardTeacher.tsx` | Count cards only; no teaching-specific sections | Phase 45 |
| DashboardSchool | `app/dashboard/components/DashboardSchool.tsx` | Count cards only; no school management UI | Phase 45 |
| DashboardWellness | `app/dashboard/components/DashboardWellness.tsx` | Count cards only; no wellness-specific sections | Phase 46 |

These stubs intentionally display real data (counts from live DB queries) — they are not placeholder text. The plan explicitly scopes full UI to Phases 44-46.

## Verification Results

```
grep -c "use client" app/dashboard/page.tsx  → 0
grep getEffectiveUserId app/dashboard/page.tsx  → found
grep Promise.all app/dashboard/page.tsx  → found
grep principal_trainer_school_id app/dashboard/page.tsx  → found
grep view.*school app/dashboard/page.tsx  → found
ls app/dashboard/components/Dashboard*.tsx  → 4 files
grep PageContainer app/dashboard/components/Dashboard*.tsx | wc -l  → 4
npx next build  → zero errors
npx tsc --noEmit (dashboard files)  → zero errors
```

## Self-Check: PASSED
