---
phase: 48-hero-sidebar
plan: "02"
subsystem: member-profiles
tags: [sidebar, profile, membership-card, social-links, connect-button, stats]
dependency_graph:
  requires: [48-01]
  provides: [ProfileSidebar component, sidebar wired into member profile page]
  affects: [app/members/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [sticky sidebar, Promise.all parallel fetch, count:exact Supabase query, inline SVG icons for brand icons unavailable in lucide-react v1.7.0]
key_files:
  created:
    - app/members/[id]/components/ProfileSidebar.tsx
  modified:
    - app/members/[id]/page.tsx
decisions:
  - "Used inline SVG for Instagram, Facebook, YouTube social icons — lucide-react v1.7.0 does not export brand icons; Globe and Video (TikTok) available as Lucide icons"
  - "Pass real viewerRole (fetched from profiles.member_type) to both ProfileHero and ProfileSidebar — was hardcoded null before"
  - "Moved school affiliation cards from right column to left column below ConnectionsSection (deferred extraction to Phase 49 REL-01)"
metrics:
  duration_minutes: 12
  completed_date: "2026-04-01"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 48 Plan 02: ProfileSidebar Component + Page Wiring Summary

**One-liner:** ProfileSidebar with GOYA membership card, designation badges, connect/message buttons, Lucide+SVG social icons, and live connections/events stats — wired into the right column of the member profile page.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create ProfileSidebar component | 1aad46b | app/members/[id]/components/ProfileSidebar.tsx (created) |
| 2 | Wire ProfileSidebar into page.tsx right column | c99f5a6 | app/members/[id]/page.tsx (modified) |

## What Was Built

**ProfileSidebar.tsx** (`app/members/[id]/components/ProfileSidebar.tsx`):
- `'use client'` component (required for ConnectButton + MessageButton)
- Sticky wrapper `sticky top-20 space-y-6` for desktop scroll-follow
- Membership card: dark blue (`#1B3A5C`) with decorative blur, "GOYA Member" header, green pulse dot, "Since [month year]", amber designation badge pills (from `wellness_designations` + `other_org_names`)
- Connect + Message buttons: hidden when `isOwnProfile`, renders ConnectButton + MessageButton in white card
- Social links: circular icon buttons with Lucide Globe (website), Lucide Video (TikTok), inline SVG for Instagram/Facebook/YouTube; renders only when at least one field is truthy; URL construction handles bare handles vs full URLs
- Quick stats: Eye icon + "Profile Views" ("—" placeholder per PROF-F01), Users icon + real `connectionsCount`, Calendar icon + real `eventsCount`

**page.tsx changes**:
- Added `wellness_designations` and `other_org_names` to profile type cast
- Added connections count query (`count: exact, head: true`) to `Promise.all`
- Added `viewerRole` fetch from `profiles.member_type` (for ConnectButton role-pair logic)
- Replaced entire right column content with `<ProfileSidebar />` receiving all required props
- Moved school affiliation cards to left column below `<ConnectionsSection />` (guarded by `affiliatedSchools.length > 0`)
- Removed old inline social links card, old member card JSX, and `ConnectButton` direct import
- Removed unused `memberSince` variable (now computed inside ProfileSidebar)
- Pass real `viewerRole` to ProfileHero (was hardcoded `null`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] lucide-react v1.7.0 missing brand social icons**
- **Found during:** Task 1
- **Issue:** `Instagram`, `Facebook`, `Youtube` are not exported from lucide-react v1.7.0 — TypeScript compile errors
- **Fix:** Used Lucide `Globe` and `Video` where available; replaced `Instagram`, `Facebook`, `Youtube` with the same inline SVG paths already used in the old page.tsx social links card
- **Files modified:** `app/members/[id]/components/ProfileSidebar.tsx`
- **Commit:** 1aad46b

## Known Stubs

- **Profile Views stat** — `app/members/[id]/components/ProfileSidebar.tsx` shows `"—"` for profile views. Intentional: PROF-F01 is deferred per plan spec. Will be wired in a future plan when view tracking is implemented.

## Self-Check

- [x] `app/members/[id]/components/ProfileSidebar.tsx` exists
- [x] `ProfileSidebar` imported and rendered in `app/members/[id]/page.tsx`
- [x] `sticky top-20` in ProfileSidebar.tsx
- [x] `GOYA Member` in ProfileSidebar.tsx
- [x] `ConnectButton` in ProfileSidebar.tsx
- [x] `connectionsCount` and `eventsCount` in ProfileSidebar.tsx
- [x] `count: 'exact'` connections query in page.tsx
- [x] Commits 1aad46b and c99f5a6 exist
- [x] `npx tsc --noEmit` passes (only pre-existing unrelated error in `.next/dev/types/validator.ts`)

## Self-Check: PASSED
