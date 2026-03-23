---
gsd_state_version: 1.0
milestone: v1.2
milestone_name: Stripe Admin & Shop
current_phase: None
current_plan: N/A
status: Defining requirements
stopped_at: ""
last_updated: "2026-03-23T00:00:00.000Z"
last_activity: 2026-03-23
progress:
  total_phases: 0
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
---

# Project State

## Current Position

Phase: Not started (defining requirements)
Plan: —
Status: Defining requirements
Last activity: 2026-03-23 — Milestone v1.2 started

## Accumulated Context

### Decisions

- Supabase as cache layer; Stripe as source of truth for all payment data
- Bidirectional sync: admin UI changes push to Stripe, Stripe webhooks update Supabase
- Admin + Moderator access only (no regular user access to Shop admin)
- Shop nav lives under AdminShell "Shop" dropdown: Orders (top), Products, Coupons, Analytics
- USD only, flat rate pricing, recurring (yearly) or one-off

### Pending Todos

(none yet)

### Blockers/Concerns

(none yet)

## Session Continuity

Last session: 2026-03-23
Stopped at: Requirements definition in progress
Resume file: None
