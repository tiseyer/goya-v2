---
phase: 34-public-school-profile
plan: 01
subsystem: ui
tags: [nextjs, react, supabase, server-component, school-profile, public-page]

requires:
  - phase: schools-onboarding
    provides: schools table with designations, faculty, slug fields
provides:
  - Public school profile page at /schools/[slug] for approved schools
  - Hero with logo, designation badges, location
  - Left column: about, practice styles, programs, languages, lineage, video embed
  - Right sidebar: details, social links, faculty with member profile links
affects: [member-directory, school-cards, public-browsing]

tech-stack:
  added: []
  patterns:
    - "Server component with force-dynamic for public profile pages"
    - "notFound() guard for non-approved status"
    - "Hero pattern matching member profile: bg-primary, PageContainer, decorative orb"
    - "PillBadge component for array fields"
    - "Faculty sorted Principal Trainer first, linked to /members/[id]"
    - "Video embed via YouTube/Vimeo URL parsing (extract ID, build embed URL)"

key-files:
  created:
    - app/schools/[slug]/page.tsx
  modified: []

key-decisions:
  - "Only show active designations (status=approved) in hero badges — not pending/rejected ones"
  - "Faculty filtered to profile_id !== null to exclude invite-only non-members"
  - "About text prefers bio over description field"
  - "Location falls back city/country then location_city/location_country then 'Online School' for online-only"
  - "Lineage handled as both array and comma-separated string (split on comma)"

patterns-established:
  - "School profile hero: same GOYA blue pattern as member profile (bg-primary, 240-280px height)"
  - "Social links sidebar card: icon grid matching member profile Connect card"

requirements-completed: [PUB-01, PUB-02, PUB-03]

duration: 5min
completed: 2026-03-31
---

# Phase 34 Plan 01: Public School Profile Summary

**Server-rendered public school profile at /schools/[slug] with GOYA blue hero, 2-column body layout, faculty section with member links, and 404 for non-approved schools**

## Performance

- **Duration:** ~5 min
- **Started:** 2026-03-31T09:51:12Z
- **Completed:** 2026-03-31T09:56:00Z
- **Tasks:** 1
- **Files modified:** 1

## Accomplishments
- Created `app/schools/[slug]/page.tsx` as a pure server component with 499 lines
- Hero matches member profile pattern exactly: bg-primary, PageContainer, decorative blur orb, logo/placeholder, designation badges, location
- Left column renders about text, practice styles, programs, languages, lineage pills, and YouTube/Vimeo video embed
- Right sidebar shows established year, delivery format, GOYA Verified badge, all social links (website/instagram/youtube/facebook/tiktok), and faculty sorted with Principal Trainer first
- Faculty cards link to `/members/[id]` for each GOYA profile holder
- Gracefully handles null/empty arrays throughout

## Task Commits

1. **Task 1: Public school profile page with hero, body, and sidebar** - `4f2dccd` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified
- `app/schools/[slug]/page.tsx` - Public school profile server component, 499 lines

## Decisions Made
- Only active designations shown in hero badges (filtered by `status === 'active'`)
- Faculty with no `profile_id` (invite-only, not yet GOYA members) are excluded from public view
- About text: `school.bio` preferred over `school.description`
- Lineage field handled as both array and comma-separated string for compatibility
- Back link goes to `/members` (the directory) matching member profile pattern

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered
None.

## User Setup Required
None — no external service configuration required.

## Next Phase Readiness
- School profile page is live for all approved schools at /schools/[slug]
- Member profile already links to /schools/[slug] via the "Visit School" card
- Phase 34-02 (member directory integration / school cards) can proceed

## Self-Check: PASSED

- `app/schools/[slug]/page.tsx` — FOUND
- Commit `4f2dccd` — FOUND
- TypeScript compilation: no errors in new file
