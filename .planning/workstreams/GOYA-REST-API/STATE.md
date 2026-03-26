---
gsd_state_version: 1.0
milestone: v1.6
milestone_name: milestone
status: Ready to plan
stopped_at: Completed 04-02-PLAN.md
last_updated: "2026-03-26T08:51:42.198Z"
progress:
  total_phases: 8
  completed_phases: 4
  total_plans: 10
  completed_plans: 10
---

# Project State — GOYA-REST-API workstream

## Project Reference

See: .planning/PROJECT.md (updated 2026-03-25)

**Core value:** External services can programmatically access and manage all GOYA v2 entities through a secure, documented REST API.
**Current focus:** Phase 04 — courses

## Current Position

Phase: 5
Plan: Not started

## Performance Metrics

**Velocity:**

- Total plans completed: 0
- Average duration: -
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

*Updated after each plan completion*
| Phase 01 P01 | 127 min | 2 tasks | 3 files |
| Phase 01 P02 | 15 min | 2 tasks | 3 files |
| Phase 01 P03 | 35 min | 1 task | 1 file |
| Phase 01 P04 | 20 min | 2 tasks | 1 file |
| Phase 02 P01 | 8 min | 2 tasks | 3 files |
| Phase 18-admin-inbox-teacher-upgrades P01 | 5 | 1 tasks | 1 files |
| Phase 02 P02 | 10 | 2 tasks | 5 files |
| Phase 03 P01 | 3 | 2 tasks | 3 files |
| Phase 03 P02 | 4 | 2 tasks | 4 files |
| Phase 04-courses P01 | 15 | 2 tasks | 5 files |
| Phase 04-courses P02 | 3 | 2 tasks | 3 files |

## Accumulated Context

### Decisions

- All routes under `/app/api/v1/` — consistent namespacing
- Supabase service role client for all API ops — bypass RLS
- Shared handler factory in `/lib/api/` — reduce repetition
- Business logic in `/lib/api/` service files, not route handlers
- API keys stored as hashed values — security requirement
- [Phase 01]: RLS enabled on api_keys with no policies — enforces service-role-only access at DB level
- [Phase 01]: API version pinned as constant in response.ts — easy to bump for major changes
- [Phase 01 P03]: as any cast on Supabase client for api_keys queries — table exists in DB but not in generated types (types regeneration deferred)
- [Phase 01 P03]: Fire-and-forget last_used_at/request_count update — usage tracking is best-effort
- [Phase 01 P03]: In-memory rate limiter with periodic cleanup every 1000 calls — avoids background timers
- [Phase 15]: Inline Separator function component — no separate file needed for a single-use 4-line component
- [Phase 15]: Optimistic UI in DesignationsBox (filter local state) — avoids full page reload; softDeleteDesignation still calls revalidatePath for next hard navigation
- [Phase 01 P04]: Health endpoint has no auth/rate-limit — AUTH-05 requires public access
- [Phase 01 P04]: api_keys migration applied via supabase db query --linked — duplicate 20260341 timestamp prefix blocked standard db push
- [Phase 02 P01]: as any cast on Supabase client for profiles queries — same pattern as middleware.ts, profiles not in generated types
- [Phase 02 P01]: UUID regex validation in [id] route handler returns 400 before any DB call for invalid formats
- [Phase 18-admin-inbox-teacher-upgrades]: Auth guard fetches admin role via getSupabaseService() (service role) rather than session-based RLS
- [Phase 18-admin-inbox-teacher-upgrades]: Errors per Stripe call returned as { success: false, error } — no redirect() so client components can surface them
- [Phase 02]: PATCH body validation: allowlist check first (unknown keys 400), then enum value check per field
- [Phase 02]: PATCH 404 vs 500 disambiguation: if updateUser fails, call getUserById to distinguish not-found from DB error
- [Phase 03]: Events service uses getSupabaseService() as any — events table not in generated types, same pattern as users/profiles
- [Phase 03]: listEvents always filters .is('deleted_at', null) — soft-deleted events never appear in list results
- [Phase 03]: deleteEvent sets both deleted_at AND status='deleted' for dual-state tracking
- [Phase 03]: event_registrations.user_id has no FK to profiles — plain uuid consistent with codebase pattern
- [Phase 03]: Migration applied via supabase db query --linked due to duplicate timestamp blocking db push
- [Phase 04-courses]: Courses service uses getSupabaseService() as any — courses table not in generated types, same pattern as events/users
- [Phase 04-courses]: Migration applied via supabase db query --linked due to batch push failing on pre-existing policies in earlier migrations (same pattern as Phase 03)
- [Phase 04-courses]: listCourses always filters .is('deleted_at', null) — soft-deleted courses never appear in list results
- [Phase 04-courses]: deleteCourse sets both deleted_at AND status='deleted' for dual-state tracking, consistent with events pattern
- [Phase 04-courses]: ENROLLMENTS_SORT_FIELDS exported from courses service - consistent with COURSES_SORT_FIELDS pattern
- [Phase 04-courses]: updateEnrollment auto-clears completed_at when status reverts to in_progress - prevents stale completion dates
- [Phase 04-courses]: Unknown field rejection in PATCH enrollment body - allowlist only status and completed_at, 400 on unknown keys

### Pending Todos

None yet.

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-03-26T08:47:58.953Z
Stopped at: Completed 04-02-PLAN.md
Resume file: None
