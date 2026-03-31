---
phase: 32-school-settings
plan: "03"
subsystem: school-settings
tags: [school, settings, faculty, designations, documents, subscription, stripe]
dependency_graph:
  requires: [32-01, 32-02]
  provides: [faculty-settings-page, designations-settings-page, documents-settings-page, subscription-settings-page]
  affects: [school-settings-shell, school-settings-actions]
tech_stack:
  added: []
  patterns: [server-component-client-component-split, debounced-search, file-upload-formdata, stripe-billing-portal]
key_files:
  created:
    - app/schools/[slug]/settings/faculty/page.tsx
    - app/schools/[slug]/settings/faculty/FacultyClient.tsx
    - app/schools/[slug]/settings/designations/page.tsx
    - app/schools/[slug]/settings/documents/page.tsx
    - app/schools/[slug]/settings/documents/DocumentsClient.tsx
    - app/schools/[slug]/settings/subscription/page.tsx
    - app/schools/[slug]/settings/subscription/SubscriptionClient.tsx
  modified:
    - app/schools/[slug]/settings/actions.ts
decisions:
  - "Faculty/document actions duplicated in settings/actions.ts rather than reusing onboarding/actions.ts — settings helper always allows completed schools"
  - "Stripe billing portal uses owner profile.stripe_customer_id (not designation column — school_designations has no stripe_customer_id column)"
  - "Designations page is read-only with 'contact support' for new designations (checkout flow deferred per context)"
  - "Documents page groups by designation with per-type upload slots matching DOCUMENT_TYPES constant"
metrics:
  duration: "~7 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  files_changed: 8
---

# Phase 32 Plan 03: Remaining Settings Pages Summary

Four settings section pages (Faculty, Designations, Documents, Subscription) completing all 8 school settings sections with faculty CRUD, read-only designation view, document re-upload, and Stripe billing portal link.

## Tasks Completed

### Task 1: Faculty and Designations settings pages

**Commit:** 6261c6d

**What was done:**
- Added to `settings/actions.ts`: `saveFacultyMember`, `removeFacultyMember`, `inviteFacultyByEmail` (settings-specific versions that always allow completed schools), plus `uploadDocument`, `deleteDocument`, and `createBillingPortalSession`
- `faculty/page.tsx`: server component fetches school + faculty with profile joins + owner profile name; renders `FacultyClient`
- `FacultyClient.tsx`: owner shown as Principal Trainer (always); faculty list with name/position/status cards and Remove (with confirmation); "Add Member" button toggles add section with two tabs — Search (debounced `/api/schools/faculty-search` with dropdown results) and Invite by Email; position select from 6 predefined roles; toast feedback on all actions
- `designations/page.tsx`: pure server component (no client needed) — fetches designations, renders cards with designation type label, status badge (active=green, pending=amber, cancelled=red, expired=gray), verified date, subscription note; "contact support" note at bottom

**Files:** app/schools/[slug]/settings/actions.ts, app/schools/[slug]/settings/faculty/page.tsx, app/schools/[slug]/settings/faculty/FacultyClient.tsx, app/schools/[slug]/settings/designations/page.tsx

### Task 2: Documents and Subscription settings pages

**Commit:** 0162e83

**What was done:**
- `documents/page.tsx`: server component fetches school + designations + all documents; groups documents by `designation_id`; passes `DesignationWithDocs[]` to client
- `DocumentsClient.tsx`: renders one card per designation; within each card shows 3 document type rows (business_registration, qualification_certificate, insurance); each row shows file name/date/status badge if uploaded, or "No document uploaded" if not; Upload/Re-upload button triggers file input; re-upload deletes old doc first then uploads new; toast feedback per upload
- `subscription/page.tsx`: server component fetches school + designations (stripe_subscription_id) + owner profile (stripe_customer_id); passes `hasStripeCustomer` boolean
- `SubscriptionClient.tsx`: renders subscription card listing each designation with label and status badge; "Subscription active" note when stripe_subscription_id exists; "Manage Billing" button calls `createBillingPortalSession` and redirects to Stripe portal; graceful message when no billing account; "contact support" footer note

**Files:** app/schools/[slug]/settings/actions.ts (updated), app/schools/[slug]/settings/documents/page.tsx, app/schools/[slug]/settings/documents/DocumentsClient.tsx, app/schools/[slug]/settings/subscription/page.tsx, app/schools/[slug]/settings/subscription/SubscriptionClient.tsx

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] school_designations has no stripe_customer_id column**
- **Found during:** Task 2 (while verifying schema)
- **Issue:** Plan spec referenced `stripe_customer_id` on `school_designations` — this column does not exist. The table only has `stripe_subscription_id`. Stripe customer IDs are stored on `profiles.stripe_customer_id`.
- **Fix:** `createBillingPortalSession` action queries `profiles.stripe_customer_id` for the school owner; subscription page fetches owner profile for `hasStripeCustomer` check; `DesignationInfo` interface has no `stripe_customer_id` field.
- **Files modified:** app/schools/[slug]/settings/actions.ts, app/schools/[slug]/settings/subscription/page.tsx, app/schools/[slug]/settings/subscription/SubscriptionClient.tsx
- **Commit:** 0162e83

## Known Stubs

None. All 4 pages are wired to live data:
- Faculty page reads from `school_faculty` with profile joins
- Designations page reads from `school_designations`
- Documents page reads from `school_verification_documents` grouped by designation
- Subscription page reads from `school_designations` + `profiles.stripe_customer_id`

Note: `inviteFacultyByEmail` records the invite in DB but does not send an email (deferred to Phase 35, FAC-01 per onboarding comment).

## Self-Check

- [x] app/schools/[slug]/settings/faculty/page.tsx exists (> 50 lines)
- [x] app/schools/[slug]/settings/designations/page.tsx exists (> 30 lines)
- [x] app/schools/[slug]/settings/documents/page.tsx exists (> 50 lines)
- [x] app/schools/[slug]/settings/subscription/page.tsx exists (> 30 lines)
- [x] FacultyClient imports saveFacultyMember, removeFacultyMember, inviteFacultyByEmail from ../actions
- [x] DocumentsClient imports uploadDocument, deleteDocument from ../actions
- [x] SubscriptionClient imports createBillingPortalSession from ../actions
- [x] TypeScript compiles with no new errors in new files
- [x] Task 1 commit 6261c6d exists
- [x] Task 2 commit 0162e83 exists
