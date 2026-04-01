---
phase: 33-admin-school-management
plan: "02"
subsystem: admin-schools
tags: [admin, schools, detail-page, storage, member-profile]
dependency_graph:
  requires: [approveSchool-server-action, rejectSchool-server-action]
  provides: [admin-school-detail-page, member-visit-school-button]
  affects: [admin-inbox, member-profiles, school-approval-workflow]
tech_stack:
  added: []
  patterns: [supabase-storage-signed-urls, parallel-data-fetching, service-role-join]
key_files:
  created:
    - app/admin/schools/[id]/page.tsx
    - app/admin/schools/[id]/ApproveRejectBar.tsx
  modified:
    - app/members/[id]/page.tsx
decisions:
  - "Used createSupabaseServerClient() for storage signed URLs (not service role) — storage API is available on anon client, and cookies-based auth is appropriate for signed URL generation in server components"
  - "ApproveRejectBar uses textarea (not input) for rejection reason to allow multi-line explanations"
  - "Normalized owner join array → single object pattern (matches inbox page.tsx convention)"
  - "Visit School card placed above the GOYA Member card in right column for visual prominence"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 3
---

# Phase 33 Plan 02: Admin School Detail Page & Member Visit School Button Summary

**One-liner:** Admin school detail/review page at /admin/schools/[id] with all data sections and approve/reject bar; Visit School button on member profiles for school-affiliated members.

## What Was Built

### Task 1: Admin School Detail Page (`app/admin/schools/[id]/page.tsx` + `ApproveRejectBar.tsx`)

**Server component (`page.tsx`):**
- Fetches school with full columns + owner join using `getSupabaseService()` (service role for cross-table join)
- Parallel fetch of `school_designations`, `school_faculty` (with profile join), and `school_verification_documents`
- Generates Supabase Storage signed URLs (1-hour expiry) for each uploaded document using `createSupabaseServerClient().storage.from('school-documents').createSignedUrl(path, 3600)` — extracts relative path from full URL if needed
- Calls `notFound()` if school not found

**Layout sections (white rounded-2xl cards, admin slate palette):**
1. **Owner** — avatar, name, email, "View User →" link to `/admin/users?search={owner_id}`
2. **Basic Info** — slug, short bio, bio, description, established year, insured status, onboarding completion
3. **Online Presence** — website (linked), instagram, youtube, facebook, tiktok, video URL (linked), video platform
4. **Teaching Info** — practice styles, programs offered, delivery format, lineage, languages (all as pill badges where array)
5. **Location** — address, city, country, lat/lng
6. **Designations** — table: type, status (purple badge), subscription ID, signup fee, annual fee
7. **Verification Documents** — table: type, file name, size (formatted), status, Download link (signed URL, new tab)
8. **Faculty Members** — table: name/avatar/email, position, principal trainer badge, status

**Header:** school name, status badge (matches `STATUS_STYLES` from inbox tab), created date, "Back to Inbox" link to `/admin/inbox?tab=schools`

**Conditional UI:**
- `ApproveRejectBar` shown only when status is `pending` or `pending_review`
- Rejection reason alert (rose-tinted) shown when status is `rejected`

**Client component (`ApproveRejectBar.tsx`):**
- Approve button calls `approveSchool(schoolId)`, reject button toggles inline textarea for reason
- `rejectSchool(schoolId, reason)` called on confirm; reason is required (button disabled when empty)
- `useRouter().refresh()` after successful action to update page state
- Inline feedback message (success/error) shown after action

### Task 2: Visit School Button (`app/members/[id]/page.tsx`)

- Added `principal_trainer_school_id` and `faculty_school_ids` to the profiles select query
- If `principal_trainer_school_id` is set: fetch that school filtered to `status='approved'` via `.maybeSingle()`
- Else if `faculty_school_ids` is non-empty: fetch all matching schools via `.in()` filtered to `status='approved'`
- Renders a white card per affiliated approved school in the right column (above the GOYA Member card):
  - School logo (or initial circle fallback), school name
  - "Visit School" button linking to `/schools/[slug]` (falls back to `/schools/[id]`)
- Not rendered when no approved affiliated school exists

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 9a1a460 | feat | Create admin school detail/review page |
| 1e8c60b | feat | Add Visit School button to member profile page |

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired to real Supabase queries. Empty states (no faculty, no documents, no designations) display appropriate placeholder text.

## Self-Check: PASSED
