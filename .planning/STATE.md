---
gsd_state_version: 1.0
milestone: v1.18
milestone_name: User Profile Redesign
status: defining_requirements
stopped_at: null
last_updated: "2026-04-02T08:00:00.000Z"
last_activity: 2026-04-02 - Milestone v1.18 started
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-02)

**Core value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.
**Current focus:** v1.17 — Dashboard Redesign

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-04-02 — Milestone v1.18 started

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| — | — | — | — |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- School is NOT a separate role — school owners have role='teacher' AND principal_trainer_school_id IS NOT NULL. Any role branch that checks role === 'school' will silently never match.
- Role branching must live in page.tsx, not layout.tsx — App Router layouts do not re-run on client-side navigation, which breaks impersonation.
- CSS scrollbar hiding via @utility no-scrollbar in globals.css — do NOT use tailwind-scrollbar-hide plugin (confirmed broken under Tailwind CSS 4, GitHub issue #31).
- JSONB empty arrays are truthy in JS — isFieldComplete() must use Array.isArray(v) ? v.length > 0 : Boolean(v?.trim()) to avoid inflated profile completion scores.
- embla-carousel-react for desktop drag-to-scroll on carousels; CSS snap-x for mobile touch natively.
- Feed DB tables (posts, likes, comments) must NOT be dropped — they are used by the admin panel. Phase 43 deletes only UI component files.
- All data fetching server-side in page.tsx via Promise.all — role layout components receive data as props and do no internal fetching.

### Research Notes

- Verify principal_trainer_school_id column name in supabase/migrations/20260376_school_owner_schema.sql before writing school detection condition in Phase 43.
- Verify embla-carousel-react version at install time: npm info embla-carousel-react (pin to ^8, confirm 9.x is still RC).
- RLS on schools table: check whether school record is readable by the owner via standard server client or requires service client — validate in Phase 43.

### Blockers/Concerns

None.

### Pending Todos

- [ ] Plan Phase 43 via /gsd:plan-phase 43

## Session Continuity

Last session: 2026-04-02
Stopped at: Completed 46-01-PLAN.md — DashboardTeacher full layout
Resume file: None
