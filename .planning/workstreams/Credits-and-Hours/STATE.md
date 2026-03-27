---
gsd_state_version: 1.0
milestone: v2.0
milestone_name: Credits & Hours Overhaul
status: planning
stopped_at: null
last_updated: "2026-03-27T16:00:00.000Z"
last_activity: 2026-03-27
progress:
  total_phases: 7
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State — Credits-and-Hours workstream

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-27)

**Core value:** Members can submit, track, and manage their professional credits with clear status visibility and admin oversight.
**Current focus:** Phase 1 — Submission Form Redesign

## Current Position

Phase: 1
Plan: Not started
Status: Requirements and roadmap defined
Last activity: 2026-03-27

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

## Accumulated Context

### Decisions

- DB already has status (pending/approved/rejected) and rejection_reason on credit_entries — no migration needed
- credit_requirements table already has configurable amounts per type — reuse as-is
- Form currently auto-approves (status: 'approved') — changing to 'pending'
- Teaching Hours gated by member_type === 'teacher' (server-side)
- "Learn About Credits" button currently links to /resources (404) — redirecting to /credits/learn
- Community Credits not manually submittable — auto-awarded only

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-27
Stopped at: Milestone v2.0 initialized — requirements and roadmap defined
Resume file: None
