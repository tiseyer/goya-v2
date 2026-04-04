---
phase: quick
plan: 260404-kk9
subsystem: schools/onboarding
tags: [localStorage, slug, wizard, state-isolation, school-registration]
key-decisions:
  - Use getDraftKey(uid) function pattern instead of constant — ensures user-scoped isolation without extra abstraction
  - Single .in() query for collision resolution — checks base + 98 suffixed slugs in one DB round-trip
  - resolvedSlug state lives in parent wizard (not Step1) — slug is derived server state, not user input
key-files:
  modified:
    - app/schools/create/SchoolCreateWizard.tsx
    - app/schools/create/page.tsx
    - app/api/schools/check-slug/route.ts
metrics:
  duration: ~8min
  completed: 2026-04-04
  tasks: 1
  files: 3
---

# Quick Task 260404-kk9: Fix School Onboarding State Isolation + Slug UX

**One-liner:** User-scoped localStorage draft key and read-only auto-generated slug with single-query collision resolution in the school registration wizard.

## What Was Done

### Task 1: Scope localStorage by user ID and auto-generate slug with collision resolution

**page.tsx** — Added `userId={user.id}` prop passed to `SchoolCreateWizard`. The user ID was already fetched server-side; it just wasn't forwarded.

**SchoolCreateWizard.tsx — three changes:**

1. **User-scoped localStorage (Bug 1 fixed):**
   - Replaced `const DRAFT_KEY = 'school-registration-draft'` constant with `const getDraftKey = (uid: string) => \`school-registration-draft-\${uid}\``
   - All `localStorage.getItem/setItem/removeItem` calls now use `getDraftKey(userId)`
   - On mount, `localStorage.removeItem(OLD_DRAFT_KEY)` cleans up the old unscoped key
   - `WizardDraft` interface no longer includes `slug` (always re-derived from school name on load)

2. **Removed editable slug input (Bug 2 fixed):**
   - `Step1SchoolName` no longer accepts `onSlugChange` or `slug` props
   - Removed `slugEdited` state and `handleSlugChange` entirely
   - Replaced the slug input field with a read-only URL preview: `goya.org/schools/{resolvedSlug || '...'}`
   - Status indicator (spinner / checkmark / warning) shown inline next to the URL

3. **Auto-generate slug with collision resolution:**
   - `resolvedSlug` and `slugStatus` state live in the parent wizard
   - `scheduleSlugCheck(name)` debounces 500ms, calls `/api/schools/check-slug?slug=base-slug`
   - API returns `{ available: true, resolvedSlug: "base-slug-N" }` — wizard stores `resolvedSlug`
   - `canContinue` checks `resolvedSlug.length >= 1 && slugStatus === 'available'`
   - `createSchoolCheckoutSession` receives `resolvedSlug` (not the raw generated slug)

**check-slug/route.ts — collision resolution:**
   - Builds candidate array `[base-slug, base-slug-2, ..., base-slug-99]`
   - Single `.in('slug', candidates)` query fetches all taken slugs at once
   - Returns first candidate not in the taken set as `resolvedSlug`
   - Returns `{ available: false, resolvedSlug: '' }` only if all 99 variants are taken (essentially impossible)

## Deviations from Plan

None — plan executed exactly as written.

## Commits

| Hash | Description |
|------|-------------|
| 436301b | feat(quick-260404-kk9): user-scoped localStorage draft + auto-generated read-only slug |

## Self-Check: PASSED

- app/api/schools/check-slug/route.ts — FOUND
- app/schools/create/SchoolCreateWizard.tsx — FOUND
- app/schools/create/page.tsx — FOUND
- Commit 436301b — FOUND
