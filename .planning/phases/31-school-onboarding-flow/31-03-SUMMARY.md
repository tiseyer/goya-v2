---
phase: 31-school-onboarding-flow
plan: "03"
subsystem: schools
tags: [wizard, client-component, google-places, file-upload, faculty, review-submit]
dependency_graph:
  requires: [Plan 31-01 server actions, Plan 31-02 OnboardingWizard steps 1-5]
  provides: [OnboardingWizard steps 6-9, complete 9-step onboarding wizard]
  affects: [app/schools/[slug]/onboarding/*, school owner UX, school status pending_review]
tech_stack:
  added: []
  patterns: [google-maps-places-autocomplete, formdata-file-upload, debounced-search, conditional-step-navigation]
key_files:
  created: []
  modified:
    - app/schools/[slug]/onboarding/OnboardingWizard.tsx
    - app/schools/[slug]/onboarding/page.tsx
decisions:
  - "Google Maps API loaded dynamically via script tag in useEffect to avoid SSR issues; polls window.google until ready"
  - "window.google typed as any to avoid @types/googlemaps conflict with existing global Window declarations"
  - "Conditional step 6 handled via getVisibleSteps helper — StepIndicator uses display index not raw step number"
  - "Document upload is per-slot (individual async uploads) not batched; state held in docMap keyed by designationId+documentType"
  - "Faculty search debounced 500ms; selected member shown inline with position input before adding"
  - "ownerName fetched server-side from profiles table and passed as prop; defaults to school.name if unavailable"
  - "Step9Review reads school data from prop (server-provided snapshot); edit links use goToStep callback"
metrics:
  duration: "~10 minutes"
  completed_date: "2026-03-31"
  tasks: 1
  files: 2
---

# Phase 31 Plan 03: Onboarding Wizard Steps 6-9 Summary

One-liner: Steps 6-9 added to OnboardingWizard — Google Places location autocomplete (conditional), per-designation document uploads, GOYA member search and email invite for faculty, and read-only review with submit-for-review transition.

## What Was Built

### Task 1: Steps 6-9 — Location, Documents, Faculty, Review & Submit (`app/schools/[slug]/onboarding/OnboardingWizard.tsx`)

**Step navigation helpers:**
- `getVisibleSteps(deliveryFormat)` — returns `[1,2,3,4,5,7,8,9]` for online (skips step 6), all 9 for in_person/hybrid
- `getNextStep(current, deliveryFormat)` / `getPrevStep(current, deliveryFormat)` — navigate through the visible steps
- StepIndicator now receives the display index (position in visible steps array), not the raw step number

**Step 6 — Location (ONB-06):**
- Conditionally rendered only when `course_delivery_format !== 'online'`
- Google Maps Places API loaded dynamically via `<script>` tag; polls `window.google` until the API is ready
- `google.maps.places.Autocomplete` initialized on the input ref with types `['establishment', 'geocode']`
- `place_changed` event extracts `formatted_address`, `place_id`, `locality` (city), `country`, `lat()`, `lng()`
- Green confirmation box shown once a place is selected; pre-fills if school already has location_address
- On Continue: calls `saveLocation(school.slug, data)` via `useTransition`

**Step 7 — Document Upload (ONB-07):**
- `DOCUMENT_SLOTS` const defines 3 slots: business_registration (required), qualification_certificate (required), insurance (optional)
- For each designation, renders a card with all 3 slots
- Each slot shows: green check + file name if uploaded; asterisk (*) if required & missing; circle (○) if optional & missing
- File input hidden behind styled "Choose File" button; accepts `.pdf,.jpg,.jpeg,.png`
- On select: builds `FormData` with schoolSlug, designationId, documentType, file → calls `uploadDocument(formData)`
- Delete button calls `deleteDocument(school.slug, docId)`; loading spinner per-slot during operations
- `canContinue()` validates all required slots have uploads before enabling Continue

**Step 8 — Faculty (ONB-08):**
- Owner shown in blue box as "Principal Trainer (you)" with name badge
- Search input debounced 500ms → fetches `/api/schools/faculty-search?q=...&school_id=...`
- Dropdown shows avatar (or initial) + full_name; click selects member and shows inline position input
- "Add" button calls `saveFacultyMember(school.slug, { profile_id, position })`
- Email invite panel: email + position inputs → "Send Invite" calls `inviteFacultyByEmail`; validates email format
- Faculty list shows all added members with remove (X) button; invited members show "Invited" badge
- Step is optional — Continue works with no additional faculty

**Step 9 — Review & Submit (ONB-09):**
- Read-only summary in cards for: Basic Info, Online Presence, Video, Teaching, Location, Documents, Faculty
- Each card has an "Edit" link navigating to that step via `goToStep` callback
- Location section shows "Online School" for online delivery format
- Documents section shows `X/Y uploaded` count per designation
- "Submit for Review" button calls `submitForReview(school.slug)`
- On success: replaces wizard with confirmation card — "Your school has been submitted for review" + "This typically takes up to 1 week" + "Go to Dashboard" link

**`page.tsx` update:**
- Fetches owner's `full_name` from `profiles` table and passes as `ownerName` prop to wizard

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Window.google type conflict**
- **Found during:** Task 1
- **Issue:** `declare global { interface Window { google: typeof google } }` conflicted with existing Window declarations (TS2717)
- **Fix:** Used `any` type alias (`GoogleMapsType`) for the autocomplete ref and cast `window as any` inside the useEffect
- **Files modified:** `OnboardingWizard.tsx`
- **Commit:** b460bf2

## Known Stubs

None — all steps are fully implemented and connected to server actions.

## Self-Check

Files modified:
- `app/schools/[slug]/onboarding/OnboardingWizard.tsx` — 1070 lines added (steps 6-9 + helpers)
- `app/schools/[slug]/onboarding/page.tsx` — ownerName fetched and passed

Commits:
- `b460bf2` — feat(31-03): implement steps 6-9 in OnboardingWizard

Acceptance criteria verified:
- google.maps.places.Autocomplete: matched at line 1247
- uploadDocument: matched at line 1452
- FormData: matched at line 1446
- faculty-search: matched at line 1671
- submitForReview: matched at line 1978
- "Submit for Review" / "submitted for review": matched at lines 2180, 1996
- "Principal Trainer": matched at line 1785
- business_registration / qualification_certificate / insurance: matched at lines 1385-1387
- getNextStep / getVisibleSteps / getPrevStep: matched at lines 1196-1211
- "1 week": matched at line 1999

## Self-Check: PASSED
