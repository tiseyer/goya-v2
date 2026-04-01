---
phase: 32-school-settings
plan: "02"
subsystem: school-settings
tags: [school, settings, forms, google-places, chip-select]
dependency_graph:
  requires: [32-01]
  provides: [general-settings-page, online-presence-settings-page, teaching-info-settings-page, location-settings-page]
  affects: [school-settings-shell]
tech_stack:
  added: []
  patterns: [server-component-client-component-split, google-places-autocomplete, chip-multiselect, slug-auto-generation, re-review-warning]
key_files:
  created:
    - app/schools/[slug]/settings/components/GeneralSettingsClient.tsx
    - app/schools/[slug]/settings/online-presence/OnlinePresenceClient.tsx
    - app/schools/[slug]/settings/online-presence/page.tsx
    - app/schools/[slug]/settings/teaching/TeachingInfoClient.tsx
    - app/schools/[slug]/settings/teaching/page.tsx
    - app/schools/[slug]/settings/location/LocationClient.tsx
    - app/schools/[slug]/settings/location/page.tsx
  modified:
    - app/schools/[slug]/settings/page.tsx
decisions:
  - "Each settings page uses server component wrapper (page.tsx) + client component for data fetching and interactivity"
  - "Online presence page.tsx is a plain server component (not 'use client') — client form is in OnlinePresenceClient.tsx"
  - "Teaching and language lists copied verbatim from OnboardingWizard.tsx to keep settings consistent with onboarding"
  - "Location page uses same Google Maps dynamic-load + polling pattern as Phase 31 onboarding step 6"
  - "Save button disabled when no place selected on Location page — prevents saving without coordinates"
metrics:
  duration: "~8 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 8
---

# Phase 32 Plan 02: Settings Sub-Pages Summary

Four settings section pages (General, Online Presence, Teaching Info, Location) with pre-filled forms, save buttons calling server actions from Plan 01, and toast feedback on success/error.

## Tasks Completed

### Task 1: General and Online Presence settings pages

**Commit:** eb7dd0b

**What was done:**
- Replaced placeholder `page.tsx` with a Next.js 15 async-params server component that fetches `name, slug, short_bio, bio, established_year, status` from the `schools` table and renders `GeneralSettingsClient`
- `GeneralSettingsClient`: editable name (3+ chars), editable slug with auto-generation from name via `generateSlug()` (marks slug as manually edited once user types directly), URL preview `goya.community/schools/[slug]`, amber warning box when name or slug differs from original, short bio textarea (250 char counter), full bio textarea (1000-char minimum progress hint, 5000-char counter), year-established dropdown (1900 to current year), Save button calls `updateGeneral` server action, toast feedback
- `online-presence/page.tsx`: server component fetching `website, instagram, facebook, tiktok, youtube, video_platform, video_url`, renders `OnlinePresenceClient`
- `OnlinePresenceClient`: website + 4 social URL inputs with platform icons in a left-icon input pattern, video platform toggle (YouTube/Vimeo) + video URL field, Save button calls `updateOnlinePresence` server action, toast feedback

**Files:** app/schools/[slug]/settings/page.tsx, app/schools/[slug]/settings/components/GeneralSettingsClient.tsx, app/schools/[slug]/settings/online-presence/page.tsx, app/schools/[slug]/settings/online-presence/OnlinePresenceClient.tsx

### Task 2: Teaching Info and Location settings pages

**Commit:** 2c22574

**What was done:**
- `teaching/page.tsx`: server component fetching `practice_styles, programs_offered, course_delivery_format, lineage, languages`, renders `TeachingInfoClient`
- `TeachingInfoClient`: practice styles chip-grid with max-5 enforcement (disabled + grayed when at limit), programs chip-grid (no limit), delivery format as bordered radio cards (In-Person/Online/Hybrid), lineage tag-input (Enter or comma to add, backspace to remove, max 3 tags rendered as dark pill chips), languages chip-grid with max-3 enforcement, Save button calls `updateTeachingInfo`, toast feedback
- `location/page.tsx`: server component fetching all `location_*` fields, renders `LocationClient`
- `LocationClient`: Google Maps Places API loaded dynamically in `useEffect` (same script-loading + interval-polling pattern as OnboardingWizard), Autocomplete on address input extracts `formatted_address`, `locality`, `country`, `lat/lng`, `place_id` on `place_changed` event, green confirmation box shows selected address/city/country with a Clear button, Save button disabled when no place selected, calls `updateLocation` server action, toast feedback

**Files:** app/schools/[slug]/settings/teaching/page.tsx, app/schools/[slug]/settings/teaching/TeachingInfoClient.tsx, app/schools/[slug]/settings/location/page.tsx, app/schools/[slug]/settings/location/LocationClient.tsx

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. All 4 pages are fully wired to their server actions and pre-filled from database data.

## Self-Check

- [x] app/schools/[slug]/settings/page.tsx exists and imports GeneralSettingsClient
- [x] app/schools/[slug]/settings/online-presence/page.tsx exists and imports OnlinePresenceClient
- [x] app/schools/[slug]/settings/teaching/page.tsx exists and imports TeachingInfoClient
- [x] app/schools/[slug]/settings/location/page.tsx exists and imports LocationClient
- [x] All 4 client components import their respective server actions
- [x] GeneralSettingsClient has re-review warning (amber box on name/slug change)
- [x] LocationClient loads Google Places API dynamically
- [x] TypeScript compiles with no new errors in modified/created files
- [x] Task 1 commit eb7dd0b exists
- [x] Task 2 commit 2c22574 exists
