---
phase: 50-media
plan: "01"
subsystem: members/profile
tags: [video, mapbox, carousel, media, profile]
dependency_graph:
  requires: [47-profile-visibility, 48-events, 49-courses]
  provides: [ProfileVideo, ProfileMap, CourseCard, media-sections-wired]
  affects: [app/members/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [facade-video-embed, mapbox-client-only, horizontal-carousel, dynamic-import-ssr-false]
key_files:
  created:
    - app/members/[id]/components/ProfileVideo.tsx
    - app/members/[id]/components/ProfileMap.tsx
    - app/dashboard/components/CourseCard.tsx
  modified:
    - app/members/[id]/page.tsx
decisions:
  - "Named import nextDynamic to avoid conflict with page-level `export const dynamic = 'force-dynamic'`"
  - "Vimeo: simple placeholder (no oEmbed) to avoid server-round-trips on a display-only component"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-02"
  tasks_completed: 2
  tasks_total: 2
  files_created: 3
  files_modified: 1
---

# Phase 50 Plan 01: Video Facade, Mapbox Map, Events and Courses Carousels Summary

**One-liner:** YouTube facade embed (thumbnail + play -> iframe), privacy-gated Mapbox profile map, and reusable HorizontalCarousel sections for events and courses wired into the member profile page.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Create ProfileVideo, ProfileMap, CourseCard | 39e69be | ProfileVideo.tsx, ProfileMap.tsx, CourseCard.tsx |
| 2 | Wire all media sections into profile page | 132bba3 | app/members/[id]/page.tsx |

## What Was Built

### ProfileVideo.tsx
- `'use client'` facade component: renders YouTube thumbnail (`img.youtube.com/vi/{id}/maxresdefault.jpg`) with centered play overlay on first load; replaces with `<iframe autoplay=1>` on click
- Supports YouTube (watch?v=, youtu.be/, /embed/) and Vimeo URL formats
- Vimeo: simple dark placeholder (no oEmbed) to avoid server round-trips
- 16:9 `aspect-video` container with `rounded-xl overflow-hidden`
- Only rendered when `youtube_intro_url` is truthy (parent guards)

### ProfileMap.tsx
- `'use client'` mapbox-gl component loaded via `nextDynamic({ ssr: false })`
- `useRef/useEffect` pattern: creates map on mount, removes on unmount
- `interactive: false` (no zoom/pan), single default Marker at `[lng, lat]`
- Compact attribution control bottom-left
- 240px height, `rounded-xl overflow-hidden`
- MutationObserver on `document.documentElement` for dark mode style toggle
- Returns `null` if `NEXT_PUBLIC_MAPBOX_TOKEN` is not set

### CourseCard.tsx
- Named export `CourseCard` matching EventCard's pattern
- 280px wide, `shrink-0 snap-start` for carousel snapping
- 144px image area: `next/image` with `fill` + `sizes="280px"` if `image_url`, else gradient placeholder
- Category badge with dynamic color from `course_categories.color`
- Title `line-clamp-2`, duration formatted as "Xh Ym"
- Links to `/academy/${course.id}`

### page.tsx changes
- Added `youtube_intro_url: string | null` to profile type cast
- `import nextDynamic from 'next/dynamic'` (renamed to avoid conflict with `export const dynamic = 'force-dynamic'`)
- Imports: `ProfileVideo`, `ProfileMap` (via `nextDynamic`), `HorizontalCarousel`, `EventCard`, `CourseCard`
- Removed `void visibility` placeholder comment
- Section order in main column:
  1. Video (above bio, conditional on `youtube_intro_url`)
  2. Bio (unchanged)
  3. Content pills (unchanged)
  4. School affiliation (unchanged)
  5. Faculty grid (unchanged)
  6. Community section (unchanged)
  7. Events carousel (conditional on `memberEvents.length > 0`)
  8. Courses carousel (conditional on `memberCourses.length > 0`)
  9. Connections (unchanged)
  10. Map (conditional on `visibility.showMap && location_lat/lng != null`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Renamed `dynamic` import to `nextDynamic`**
- **Found during:** Task 2 TypeScript check
- **Issue:** `import dynamic from 'next/dynamic'` conflicted with the file-level `export const dynamic = 'force-dynamic'` declaration, causing TS2395/TS2440/TS2448 errors
- **Fix:** Renamed the import alias to `nextDynamic` and updated the `ProfileMap` dynamic call accordingly
- **Files modified:** app/members/[id]/page.tsx
- **Commit:** 132bba3 (included in task commit)

## Requirements Addressed

- CONT-01: Video facade embed (ProfileVideo, youtube_intro_url conditional)
- MED-01: Mapbox inline map, privacy-gated by `deriveProfileVisibility`
- MED-02: Map hidden for students and online-only profiles (server-side via `showMap`)
- MED-03: Events carousel using HorizontalCarousel + EventCard
- MED-04: Courses carousel using HorizontalCarousel + CourseCard

## Known Stubs

None — all sections render real data from `fetchMemberEvents`, `fetchMemberCourses`, `profile.youtube_intro_url`, and `profile.location_lat/lng`.

## Self-Check: PASSED
