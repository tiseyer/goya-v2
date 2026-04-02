---
phase: 48-hero-sidebar
plan: "01"
subsystem: member-profile
tags: [profile, hero, layout, ui-components]
dependency_graph:
  requires: []
  provides: [ProfileHero, two-column-layout, profile-completion-nudge]
  affects: [app/members/[id]/page.tsx]
tech_stack:
  added: []
  patterns: [two-column-css-grid, negative-margin-avatar-overlap, cover-image-overlay]
key_files:
  created:
    - app/members/[id]/components/ProfileHero.tsx
  modified:
    - app/members/[id]/page.tsx
decisions:
  - "Exported ROLE_LABEL and ROLE_HERO from ProfileHero.tsx so page.tsx can import ROLE_LABEL without re-declaring it"
  - "Used double-cast (as unknown as Record<string, unknown>) for profileData passed to getProfileCompletion due to Supabase GenericStringError type mismatch"
  - "ProfileHero is 'use client' because ConnectButton and MessageButton are client components"
  - "void visibility kept for Phase 50 map consumption"
metrics:
  duration: "~25 minutes"
  completed: "2026-04-02"
  tasks: 2
  files: 2
requirements_completed: [HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06, DES-01, DES-02, DES-03]
---

# Phase 48 Plan 01: ProfileHero Component + Two-Column Layout Summary

**One-liner:** Full-bleed cover image hero with 120px avatar overlap, role badge, intro text, language/format pills, action buttons, and two-column profile page layout.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create ProfileHero component | `9ba392d` | `app/members/[id]/components/ProfileHero.tsx` (created) |
| 2 | Restructure page.tsx with two-column layout + ProfileHero | `7489386` | `app/members/[id]/page.tsx` (modified) |

## What Was Built

### ProfileHero.tsx (`app/members/[id]/components/ProfileHero.tsx`)

- **Hero banner:** `h-[200px] sm:h-[240px]`, cover image with `bg-black/30` overlay, `#345c83` solid fallback when no cover image
- **Avatar:** `w-[120px] h-[120px] rounded-full ring-4 ring-white shadow-lg`, overlaps hero via `-mt-16`, initial letter fallback with `#345c83` background
- **Info row:** `text-2xl font-bold` name + `rounded-full` role badge pill with role-specific colors
- **Intro text:** italic, 250-char truncation, only renders when `profile.introduction` is truthy
- **Location:** Lucide `MapPin` icon + `[city, country].filter(Boolean).join(', ')`
- **Language pills:** `rounded-full bg-[#345c83]/10 text-[#345c83]` per DES-01
- **Format pill:** green/blue/purple per practice_format per DES-02
- **Action buttons:** ConnectButton + MessageButton for non-owners; hidden for own profile
- **Edit Profile:** Lucide `Pencil` + outlined button for own profile only, links to `/settings`
- **Completion nudge:** `bg-amber-50` banner with progress bar, missing field links, only shows when `isOwnProfile && score < 100`
- Exported `ROLE_LABEL` and `ROLE_HERO` constants for reuse

### page.tsx (`app/members/[id]/page.tsx`)

- **Profile cast expanded:** added `introduction`, `languages`, `tiktok`, `cover_image_url` fields
- **ProfileHero integrated:** replaces old `bg-primary` hero section entirely
- **Two-column grid:** `grid grid-cols-1 lg:grid-cols-[1fr_360px] gap-8` inside `PageContainer className="py-8"`
- **Left column:** bio card + ConnectionsSection
- **Right column:** social links (including new tiktok + facebook), school cards, member card
- **Profile completion computed:** `getProfileCompletion()` called for own profiles using `hasContent` from events/courses count
- Removed old `-mt-8` content container (avatar overlap now handled by ProfileHero's `-mt-16`)

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] TypeScript cast error for profileData in getProfileCompletion call**
- **Found during:** Task 2 (TypeScript check)
- **Issue:** `profileData as Record<string, unknown>` failed — Supabase's inferred return type `GenericStringError` does not overlap with `Record<string, unknown>` directly
- **Fix:** Changed to `profileData as unknown as Record<string, unknown>` (double-cast through `unknown`)
- **Files modified:** `app/members/[id]/page.tsx`
- **Commit:** `7489386`

## Known Stubs

None — all data wired from real profile fields.

## Self-Check: PASSED
