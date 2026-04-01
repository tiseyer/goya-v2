---
phase: 03-events
plan: 02
subsystem: events-api
tags: [events, registrations, migration, rest-api]
dependency_graph:
  requires: [03-01]
  provides: [event_registrations table, POST /api/v1/events/:id/registrations, DELETE /api/v1/events/:id/registrations/:userId]
  affects: [lib/api/services/events.ts]
tech_stack:
  added: []
  patterns: [service-function extension, as-any-cast for untyped tables, spot-tracking-decrement]
key_files:
  created:
    - supabase/migrations/20260348_event_registrations.sql
    - app/api/v1/events/[id]/registrations/route.ts
    - app/api/v1/events/[id]/registrations/[userId]/route.ts
  modified:
    - lib/api/services/events.ts
decisions:
  - event_registrations.user_id has no FK to profiles — plain uuid same as other cross-table refs in codebase
  - Migration applied via supabase db query --linked due to duplicate 20260341 timestamp blocking db push
metrics:
  duration_minutes: 4
  completed_date: "2026-03-26"
  tasks_completed: 2
  files_changed: 4
---

# Phase 03 Plan 02: Event Registration Endpoints Summary

**One-liner:** Event registration sub-resources with spot tracking, conflict detection, and audit logging via POST/DELETE on `/api/v1/events/:id/registrations`.

## What Was Built

Two new route handlers and two service functions completing the events API with registration management (EVNT-06, EVNT-07).

### Migration: event_registrations table
- `supabase/migrations/20260348_event_registrations.sql` creates `public.event_registrations` with `event_id` (FK to events, ON DELETE CASCADE), `user_id` (plain uuid), `UNIQUE(event_id, user_id)`, RLS enabled (no policies — service-role-only), and indexes on both foreign-key columns.

### Service functions (lib/api/services/events.ts)
- `registerUser(eventId, userId)`: checks event exists, checks duplicate, checks spots availability, inserts registration, decrements `spots_remaining` when tracked. Returns error strings `EVENT_NOT_FOUND`, `ALREADY_REGISTERED`, `NO_SPOTS`.
- `unregisterUser(eventId, userId)`: deletes registration, increments `spots_remaining` when tracked. Returns error string `NOT_FOUND`.

### Route: POST /api/v1/events/:id/registrations
- Validates API key + rate limit + write permission
- Validates eventId UUID and body `user_id` UUID
- Maps service errors to HTTP: 404 event not found, 409 already registered, 409 no spots
- Audit log: `event.register` action

### Route: DELETE /api/v1/events/:id/registrations/:userId
- Validates API key + rate limit + write permission
- Extracts both eventId and userId from URL path segments
- Maps NOT_FOUND to 404
- Audit log: `event.unregister` action

## Decisions Made

| Decision | Rationale |
|---|---|
| user_id has no FK to profiles | Consistent with other cross-table references in codebase (profiles not in generated types) |
| Migration applied via `supabase db query --linked` | Duplicate 20260341 timestamp blocks `db push`; same pattern as Phase 01 P04 api_keys migration |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Verification

- event_registrations table confirmed live in Supabase (verified via `db query`)
- TypeScript compiles without errors for all new files (no service/routes errors)
- Route handlers follow same auth + rate-limit + permission pattern as other v1 endpoints

## Self-Check: PASSED
