---
phase: 31-school-onboarding-flow
plan: "01"
subsystem: schools
tags: [server-actions, file-upload, api-routes, faculty]
dependency_graph:
  requires: [Phase 28 school schema, school_verification_documents table, school_faculty table, school-documents Storage bucket]
  provides: [saveBasicInfo, saveOnlinePresence, saveVideoIntro, saveTeachingInfo, saveLocation, uploadDocument, deleteDocument, saveFacultyMember, removeFacultyMember, inviteFacultyByEmail, submitForReview, GET /api/schools/faculty-search]
  affects: [app/schools/[slug]/onboarding/*, admin inbox notifications]
tech_stack:
  added: []
  patterns: [server-actions-with-owner-auth, supabase-storage-upload, service-role-notifications]
key_files:
  created:
    - app/schools/[slug]/onboarding/actions.ts
    - app/api/schools/faculty-search/route.ts
  modified: []
decisions:
  - "getOwnedSchool helper centralizes auth + owner check across all 11 actions"
  - "submitForReview uses service role client for elevated update + admin notification query"
  - "Document storage path pattern: {userId}/{schoolId}/{designationId}/{type}_{timestamp}.{ext}"
  - "Email sending for faculty invites deferred to Phase 35 (FAC-01) — invite_token saved to DB now"
  - "Faculty search excludes existing faculty and the school owner via chained .neq() calls"
metrics:
  duration: "~15 minutes"
  completed_date: "2026-03-31"
  tasks: 2
  files: 2
---

# Phase 31 Plan 01: Onboarding Server Actions Summary

One-liner: Server actions and faculty search API covering all 9 onboarding steps with owner auth, Supabase Storage uploads, and admin notification on submit.

## What Was Built

### Task 1: Server Actions (`app/schools/[slug]/onboarding/actions.ts`)

11 exported server actions for the complete onboarding wizard:

| Action | Step | Description |
|--------|------|-------------|
| `saveBasicInfo` | 2 | Validates and saves name, short_bio (≤250), bio (1000–5000), established_year |
| `saveOnlinePresence` | 3 | Saves social links; requires at least one value |
| `saveVideoIntro` | 4 | Optional; validates URL required when platform set |
| `saveTeachingInfo` | 5 | Saves practice styles (≤5), languages (≤3), delivery format, lineage |
| `saveLocation` | 6 | Saves Google Places location fields |
| `uploadDocument` | 7 | Uploads file to `school-documents` bucket, inserts `school_verification_documents` row |
| `deleteDocument` | 7 | Removes file from storage and deletes DB row |
| `saveFacultyMember` | 8 | Adds existing GOYA member as faculty (status=active) |
| `removeFacultyMember` | 8 | Deletes faculty row for this school |
| `inviteFacultyByEmail` | 8 | Saves invite record with UUID token (email delivery deferred to Phase 35) |
| `submitForReview` | 9 | Sets `onboarding_completed=true`, `status='pending_review'`, notifies all admins/moderators |

**Auth pattern:** Every action calls `getOwnedSchool(slug)` which verifies the authenticated user owns the school. The `submitForReview` action uses the service role client for the update and notification inserts.

**Storage path:** `{userId}/{schoolId}/{designationId}/{documentType}_{timestamp}.{ext}` — scoped per user/school/designation to match RLS policies.

### Task 2: Faculty Search API (`app/api/schools/faculty-search/route.ts`)

GET `/api/schools/faculty-search?q=term&school_id=uuid`
- Returns 401 if not authenticated
- Returns 403 if caller doesn't own the school
- Searches `profiles.full_name` with ilike
- Excludes: the calling user, profiles already in `school_faculty` for this school
- Uses service role for unrestricted profile search

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

- `inviteFacultyByEmail`: Saves `invite_token` to DB but does NOT send an email. This is intentional — email delivery is scoped to Phase 35 (FAC-01).

## Self-Check

Files created:
- `app/schools/[slug]/onboarding/actions.ts` — 11 exported server actions
- `app/api/schools/faculty-search/route.ts` — GET handler

Commits:
- `e61eeb4` — feat(31-01): add server actions for all 9 onboarding steps
- `1a8f2b9` — feat(31-01): add faculty search API route

## Self-Check: PASSED
