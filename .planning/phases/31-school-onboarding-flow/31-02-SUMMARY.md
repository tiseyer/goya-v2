---
phase: 31-school-onboarding-flow
plan: "02"
subsystem: schools
tags: [wizard, client-component, server-component, multi-step-form, onboarding]
dependency_graph:
  requires: [Plan 31-01 server actions, PageContainer, createSupabaseServerClient]
  provides: [/schools/[slug]/onboarding page, OnboardingWizard steps 1-5]
  affects: [app/schools/[slug]/onboarding/*, school owner UX]
tech_stack:
  added: []
  patterns: [async-server-component-params, useTransition-for-server-actions, url-param-step-navigation]
key_files:
  created:
    - app/schools/[slug]/onboarding/page.tsx
    - app/schools/[slug]/onboarding/OnboardingWizard.tsx
  modified: []
decisions:
  - "StepIndicator uses desktop (full 9-step) and mobile (compact current-step) variants for responsive layout"
  - "Lineage stored as comma-separated string to match actions.ts signature, rendered as tag chips in UI"
  - "Video intro uses client-side URL parsing (parseYouTubeId/parseVimeoId) for instant embed preview"
  - "Steps 6-9 render placeholder cards with back/forward navigation so step indicator works end-to-end"
  - "unused designations/faculty/documents props are passed through to page for Plan 31-03 use"
metrics:
  duration: "~4 minutes"
  completed_date: "2026-03-31"
  tasks: 2
  files: 2
---

# Phase 31 Plan 02: Onboarding Wizard UI (Steps 1-5) Summary

One-liner: Server page wrapper with auth/owner/completion guards plus a 9-step client wizard covering Welcome, Basic Info, Online Presence, Video Intro, and Teaching Info steps.

## What Was Built

### Task 1: Server Page Wrapper (`app/schools/[slug]/onboarding/page.tsx`)

Async server component accepting Next.js 15 async `params: Promise<{ slug: string }>`.

Auth and access control:
- Redirects to `/sign-in` if no authenticated user
- Fetches school by `slug` — redirects to `/dashboard` if not found or `owner_id !== user.id`
- Redirects to `/schools/${school.id}/settings` if `onboarding_completed` is already `true`

Data fetched server-side and passed to wizard:
- `school` — full row via `from('schools').select('*').eq('slug', slug)`
- `designations` — `school_designations` rows for this school
- `faculty` — `school_faculty` rows for this school
- `documents` — `school_verification_documents` rows for this school

Renders inside `<PageContainer className="py-8">` with `<Suspense>` fallback for the client wizard.

### Task 2: Onboarding Wizard (`app/schools/[slug]/onboarding/OnboardingWizard.tsx`)

`'use client'` component with `useSearchParams`-based step navigation (URL param `?step=N`).

**StepIndicator:**
- Desktop: all 9 steps with labels, filled circles for done, outlined for current, grey for future
- Mobile: compact single-step view with left/right ellipsis and step counter badge

**Step 1 — Welcome:**
- School name badge chip, checklist of upcoming sections
- Single "Get Started →" button, no server action

**Step 2 — Basic Info:**
- School name (min 3 chars), short bio (max 250 with live counter), full bio (1000-5000 with counter and under-minimum warning), year established (dropdown 1900-current)
- Calls `saveBasicInfo` on continue; client-side pre-validation before server call

**Step 3 — Online Presence:**
- Five URL inputs (website, Instagram, Facebook, TikTok, YouTube) with social platform icons
- Continue disabled + warning shown when all fields are empty; validates at least one value
- Calls `saveOnlinePresence`

**Step 4 — Video Introduction:**
- YouTube / Vimeo toggle tabs
- URL input with instant regex-based video ID parsing
- Live iframe embed preview when URL is valid
- Back / Skip (clears video data) / Save & Continue buttons
- Calls `saveVideoIntro`

**Step 5 — Teaching Info:**
- Practice Styles: 19-item checkbox grid, max 5, remaining items disabled at cap with count badge
- Programs Offered: 10-item checkbox grid, no limit
- Course Delivery Format: radio group (In-Person / Online / Hybrid), required
- Lineage: tag-chip input — Enter/comma adds tag, Backspace removes last, max 3, stored as comma-joined string
- Languages: 22-item checkbox grid, max 3 with count badge
- Calls `saveTeachingInfo`

**Steps 6-9:** Placeholder cards with label and Back/Forward navigation; will be replaced by Plan 31-03.

**Shared patterns used throughout:**
- `useTransition` wraps all server action calls for non-blocking pending state
- `ErrorMessage` component shows inline red error below form
- `NavButtons` shared component for Back + Continue layout
- `Spinner` SVG for loading state on continue buttons

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- Steps 6-9 render placeholder content. These are implemented in Plan 31-03.
- `designations`, `faculty`, and `documents` props are passed to the wizard but not yet consumed (used by steps 7 and 8 in Plan 31-03).

## Self-Check

Files created:
- `app/schools/[slug]/onboarding/page.tsx` — 99 lines
- `app/schools/[slug]/onboarding/OnboardingWizard.tsx` — 1293 lines

Commits:
- `5cd6a88` — feat(31-02): add server page wrapper for school onboarding
- `2f898bf` — feat(31-02): add OnboardingWizard client component with steps 1-5

## Self-Check: PASSED
