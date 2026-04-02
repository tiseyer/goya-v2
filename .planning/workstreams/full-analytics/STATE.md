---
gsd_state_version: 1.0
milestone: v1.18
milestone_name: milestone
status: executing
stopped_at: Completed 47-foundation 47-02-PLAN.md
last_updated: "2026-04-02T06:19:23.602Z"
last_activity: 2026-04-02
progress:
  total_phases: 5
  completed_phases: 3
  total_plans: 3
  completed_plans: 5
  percent: 60
---

# Project State

## Project Reference

See: .planning/workstreams/full-analytics/PROJECT.md (updated 2026-04-01)

**Core value:** Data-driven visibility into platform health.
**Current focus:** v1.18 Analytics & Tracking System

## Current Position

Phase: 03-visitors-analytics
Plan: 01 (complete)
Status: Executing
Last activity: 2026-04-02

Progress: [██████░░░░] 60%

## Performance Metrics

**Velocity:**

- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

## Accumulated Context

### Decisions

- Fake users = wp_roles contains 'faux' OR 'robot'
- GA4 Property ID from site_settings table
- Service account key from GOOGLE_SERVICE_ACCOUNT_KEY env var
- Chart color: GOYA primary blue #345c83
- [Phase 03-01]: Use BetaAnalyticsDataClient (not AnalyticsDataClient) — it exposes runReport
- [Phase 03-01]: GA4 bounceRate is 0-1 float; multiply by 100 for display
- [Phase 03-01]: GA4 date dimension returns YYYYMMDD; convert to YYYY-MM-DD for Date parsing
- [Phase 03-01]: Wrap VisitorsAnalyticsInner in Suspense so useSearchParams doesn't CSR bail out
- [Phase 03-01]: Pass boolean *Available props from server so client can show per-section error cards
- [Phase 40-02]: Per-lesson page uses 'use client' for auth-gated lesson loading matching existing academy pattern
- [Phase 40-02]: Legacy /academy/[id]/lesson is a server component redirect — no client JS needed for backward compat
- [Phase 40-wire-lessons-to-frontend]: Lesson type defined inline in lib/courses/lessons.ts — worktree branch predates Phase 36-39 types/supabase.ts
- [Phase 40-wire-lessons-to-frontend]: CourseWithCategory local type extends Course with _categoryColor for academy listing — avoids polluting shared Course interface
- [Phase 40]: MemberLessons uses useEffect + fetchLessons (not server-fetched initialLessons) — avoids re-architecting edit view as server component
- [Phase 40]: next/dynamic ssr:false for LessonList in member my-courses — same pattern as admin LessonSection (dnd-kit fails on SSR)
- [Phase 41-themeprovider-infrastructure]: CSS variable name mappings kept in defaults.ts as single source of truth; ThemeColorProvider generates :root block dynamically from those maps
- [Phase 42]: Colors tab positioned after General in settings tab bar; per-color reset button uses opacity-0 when not dirty to avoid layout shift; live preview deferred until loaded flag is true
- [Phase 43]: fetchUserInProgressCourses uses enrolled_at (not last_accessed_at) — actual user_course_progress schema has no last_accessed_at column
- [Phase 43]: SchoolProps.school nullable fields: slug and status typed as string|null to match Supabase return type
- [Phase 44]: @utility no-scrollbar in globals.css — tailwind-scrollbar-hide confirmed broken under Tailwind v4
- [Phase 45-student-wp-dashboards]: StatHero value=null renders em-dash placeholder; real analytics deferred per REQUIREMENTS.md Out of Scope
- [Phase 45]: Teacher carousel populates from connections filtered to role=teacher (no dedicated fetch query needed)
- [Phase 46]: School name used as greeting firstName for school-owner framing
- [Phase 47-01]: Applied migration via pg client SET SESSION ROLE postgres (project has pre-existing migration history drift blocking db push)
- [Phase 47-foundation]: PUBLIC_PROFILE_COLUMNS allowlist as sole SELECT string for service-role profile fetches
- [Phase 47-foundation]: deriveProfileVisibility() enforces privacy server-side with showMap=false for students and online-only profiles

### Blockers/Concerns

None yet.

## Session Continuity

Last session: 2026-04-02T06:19:23.599Z
Stopped at: Completed 47-foundation 47-02-PLAN.md
Resume file: None
