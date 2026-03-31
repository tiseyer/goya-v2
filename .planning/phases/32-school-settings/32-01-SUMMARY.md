---
phase: 32-school-settings
plan: "01"
subsystem: school-settings
tags: [school, settings, navigation, server-actions]
dependency_graph:
  requires: [31-school-onboarding-flow]
  provides: [school-settings-shell, school-settings-actions]
  affects: [header-navigation, school-settings-pages]
tech_stack:
  added: []
  patterns: [collapsible-sidebar, server-actions-with-ownership-guard, async-params-next15]
key_files:
  created:
    - app/schools/[slug]/settings/components/SchoolSettingsShell.tsx
    - app/schools/[slug]/settings/layout.tsx
    - app/schools/[slug]/settings/page.tsx
    - app/schools/[slug]/settings/actions.ts
    - docs/teacher/school-settings.md
  modified:
    - app/components/Header.tsx
decisions:
  - "School slug (not id) stored in Header state for correct settings URL construction"
  - "SchoolSettingsShell accepts schoolSlug prop and constructs nav hrefs dynamically"
  - "Layout guards with owner_id check and role fallback for admin/moderator"
  - "updateGeneral triggers re-review only on name or slug change, not other fields"
  - "getOwnedSchool helper always allows completed schools (post-onboarding context)"
metrics:
  duration: "~12 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 6
---

# Phase 32 Plan 01: School Settings Infrastructure Summary

School settings infrastructure with header link, collapsible 8-section sidebar shell, auth-guarded layout, and server actions covering general, online presence, teaching info, and location updates.

## Tasks Completed

### Task 1: Header dropdown link + SchoolSettingsShell + layout

**Commit:** afaaebe

**What was done:**
- Updated `Header.tsx` to fetch school `slug` (was `id`) via Supabase query; renamed `schoolId` state to `schoolSlug` throughout
- Both fetch paths (initial getUser + onAuthStateChange) updated; mobile menu updated to use `schoolSlug`
- Created `SchoolSettingsShell.tsx` as a 'use client' component matching SettingsShell exactly: collapsible sidebar, localStorage key `school-settings-sidebar-collapsed`, active-state detection via `usePathname()`, identical styling/transitions
- 8 nav items: General, Online Presence, Teaching Info, Location, Faculty, Designations, Documents, Subscription — hrefs built dynamically from `schoolSlug` prop
- `pending_review` status banner (amber-50/amber-200) rendered above `{children}` in main content area
- `layout.tsx` as Next.js 15 async-params server component: auth check → slug extraction → parallel fetch of profile + school → owner/admin guard → renders SchoolSettingsShell
- Placeholder `page.tsx` at settings root

**Files:** app/components/Header.tsx, app/schools/[slug]/settings/components/SchoolSettingsShell.tsx, app/schools/[slug]/settings/layout.tsx, app/schools/[slug]/settings/page.tsx

### Task 2: Server actions for all settings sections

**Commit:** c80e37a

**What was done:**
- Created `actions.ts` as 'use server' module with private `getOwnedSchool` helper (always `allowCompleted=true` — settings is post-onboarding)
- `updateGeneral`: validates name (3+ chars), short_bio (≤250), bio (1000-5000), established_year (1900-current); validates new slug format (lowercase alphanumeric + hyphens) and uniqueness; sets `status: 'pending_review'` when name or slug changes
- `updateOnlinePresence`: at-least-one-field validation, video_url required if video_platform set
- `updateTeachingInfo`: course_delivery_format required, practice_styles max 5, languages max 3
- `updateLocation`: required field validation for address/city/country and place_id coordinates
- All actions use `createSupabaseServerActionClient()` + `(supabase as any)` cast pattern; all return `{ success: true } | { error: string }`

**Files:** app/schools/[slug]/settings/actions.ts

### Documentation (CLAUDE.md requirement)

**Commit:** 9792c85

Created `docs/teacher/school-settings.md` covering: how to access School Settings link, sidebar section overview, pending review banner explanation, and name/slug re-review trigger behavior. Regenerated search index (46 entries).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `app/schools/[slug]/settings/page.tsx` — placeholder page with static text. Plan 02 will implement the actual General settings form.

## Self-Check

- [x] SchoolSettingsShell.tsx exists with 8 nav items (> 100 lines)
- [x] layout.tsx has auth guard and ownership check
- [x] actions.ts exports updateGeneral, updateOnlinePresence, updateTeachingInfo, updateLocation
- [x] Header.tsx fetches slug and links to /schools/[slug]/settings
- [x] TypeScript compiles with no new errors in modified/created files
