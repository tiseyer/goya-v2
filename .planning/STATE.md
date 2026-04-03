---
gsd_state_version: 1.0
milestone: v1.19
milestone_name: Global Search
status: active
stopped_at: null
last_updated: "2026-04-03T12:00:00.000Z"
last_activity: 2026-04-03 - Roadmap created (phases 51-54)
progress:
  total_phases: 4
  completed_phases: 0
  total_plans: 0
  completed_plans: 0
  percent: 0
---

# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-03)

**Core value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.
**Current focus:** v1.19 — Global Search

## Current Position

Phase: Phase 51 — Search Overlay UI (not started)
Plan: —
Status: Roadmap defined, ready to plan Phase 51
Last activity: 2026-04-03 — Roadmap created (phases 51-54)

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0 (this milestone)
- Average duration: —
- Total execution time: —

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 51. Search Overlay UI | TBD | — | — |
| 52. Search API + Page Registry | TBD | — | — |
| 53. Header Integration | TBD | — | — |
| 54. Performance + Polish | TBD | — | — |

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- School is NOT a separate role — school owners have role='teacher' AND principal_trainer_school_id IS NOT NULL
- All data fetching server-side in page.tsx via Promise.all — section components receive props, do no internal fetching
- PUBLIC_PROFILE_COLUMNS constant required — never use select('*') for profile fetches (security)
- Own-profile detection must use supabase.auth.getUser() server-side
- deriveProfileVisibility() must gate map/address before any JSX — privacy rules are server-side only

### Research Notes

- Search overlay: mount SearchOverlay at layout level (not per-page) so the keyboard shortcut works everywhere — one instance, controlled by a global state atom or context
- Page registry: static TypeScript file (not DB) — defines routes with role[] visibility arrays; teacher/school pages filtered by checking profiles.principal_trainer_school_id
- Debounce: use useCallback + useRef pattern (no extra library needed) — 200ms window resets on every keystroke
- Caching: Map<string, SearchResult[]> in component state, keyed by trimmed lowercase query; check cache before firing fetch
- Admin member search: extend /api/search to accept searchField param ('name' | 'email' | 'mrn') — gated by role check server-side
- has_full_address: derive from profiles.location_place_id IS NOT NULL AND practice_format IN ('in-person', 'hybrid') — same logic as deriveProfileVisibility()

### Blockers/Concerns

None.

### Pending Todos

None.

### Quick Tasks Completed

| # | Description | Date | Commit | Directory |
|---|-------------|------|--------|-----------|
| 260402-jsp | Fix profile route UUID/slug resolution and dropdown link | 2026-04-02 | a6b3344, da8697a | [260402-jsp-fix-profile-route-uuid-slug-resolution-a](./quick/260402-jsp-fix-profile-route-uuid-slug-resolution-a/) |
| 260402-jts | Fix dashboard to show full v1.17 redesign (carousels) | 2026-04-02 | 17b17ff, 555da57 | [260402-jts-fix-dashboard-to-show-full-v1-17-redesig](./quick/260402-jts-fix-dashboard-to-show-full-v1-17-redesig/) |
| 260403-bpe | Standardize page hero sections with reusable PageHero | 2026-04-03 | cbae423, 7ddf829 | [260403-bpe-standardize-page-hero-sections-with-reus](./quick/260403-bpe-standardize-page-hero-sections-with-reus/) |
| 260403-bsn | Fix events page dark background | 2026-04-03 | cb6135d | [260403-bsn-fix-events-page-dark-background](./quick/260403-bsn-fix-events-page-dark-background/) |
| 260403-c1n | Switch Events and Academy PageHero to variant dark | 2026-04-03 | db08db4 | [260403-c1n-switch-events-and-academy-pagehero-to-va](./quick/260403-c1n-switch-events-and-academy-pagehero-to-va/) |
| 260403-c2q | Fix events sidebar filter box border colors for dark mode | 2026-04-03 | f3eb53c | [260403-c2q-fix-events-sidebar-filter-box-border-col](./quick/260403-c2q-fix-events-sidebar-filter-box-border-col/) |
| 260403-c47 | Add nav skeleton loading state to prevent progressive pop-in | 2026-04-03 | 65194b6 | [260403-c47-nav-skeleton-loading-state-to-prevent-pr](./quick/260403-c47-nav-skeleton-loading-state-to-prevent-pr/) |
| 260403-c7w | Fix nav auth race condition causing progressive pop-in | 2026-04-03 | bf9024c | [260403-c7w-fix-nav-items-progressive-loading-with-s](./quick/260403-c7w-fix-nav-items-progressive-loading-with-s/) |
| 260403-cuh | Fix admin event edit save button stuck in Saving state | 2026-04-03 | 473908b | [260403-cuh-fix-admin-event-edit-save-button-stuck-i](./quick/260403-cuh-fix-admin-event-edit-save-button-stuck-i/) |
| 260403-cxz | Move instructor to sidebar and add organizers widget | 2026-04-03 | 444c23a | [260403-cxz-move-instructor-to-sidebar-and-add-organ](./quick/260403-cxz-move-instructor-to-sidebar-and-add-organ/) |
| 260403-d8m | Add View Event button to admin event edit page | 2026-04-03 | db7091b, ce3078b | [260403-d8m-add-view-event-button-to-admin-event-edi](./quick/260403-d8m-add-view-event-button-to-admin-event-edi/) |

## Session Continuity

Last session: 2026-04-03
Stopped at: Roadmap created for v1.19 Global Search (phases 51-54)
Resume file: None
