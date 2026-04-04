---
task_id: 260404-kk9
date: 2026-04-04
status: complete
---

# Quick Task: Fix School Onboarding State Isolation + Slug UX

## Task Description

Fix two bugs in the school registration wizard (`SchoolCreateWizard.tsx`):

1. **State isolation** — localStorage draft key `school-registration-draft` was shared across all users. User A's draft could leak to User B.
2. **Remove editable slug field** — Replace manual slug input with auto-generated slug from school name. Show as read-only URL preview. Auto-append numeric suffix if slug is taken.

## Status

[x] Complete

## Solution

**page.tsx** — Added `userId={user.id}` prop passed to `SchoolCreateWizard`.

**SchoolCreateWizard.tsx:**
- localStorage key is now `school-registration-draft-{userId}` — fully user-scoped
- Old unscoped key removed on mount (cleanup)
- `WizardDraft` no longer stores `slug` — always re-derived from school name
- Editable slug `<input>` removed; replaced with read-only URL preview (`goya.org/schools/{resolvedSlug}`)
- Status indicator (checking spinner / green check / amber warning) shown inline
- Debounced slug check triggers on school name change (500ms)
- `resolvedSlug` from API response drives the `canContinue` check and checkout session

**check-slug/route.ts:**
- Returns `{ available: boolean, resolvedSlug: string }` (previously only `{ available: boolean }`)
- Builds 99 candidate slugs (`base`, `base-2` ... `base-99`) and queries them all in a single `.in()` call
- Returns the first candidate not taken as `resolvedSlug`
