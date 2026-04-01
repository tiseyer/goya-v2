---
phase: 33-admin-school-management
plan: "01"
subsystem: admin-inbox
tags: [admin, schools, email, server-actions]
dependency_graph:
  requires: []
  provides: [approveSchool-server-action, rejectSchool-server-action, school-designations-in-inbox]
  affects: [admin-inbox, school-approval-workflow]
tech_stack:
  added: []
  patterns: [server-actions-with-email, service-role-join]
key_files:
  created:
    - app/admin/schools/actions.ts
  modified:
    - app/admin/inbox/page.tsx
    - app/admin/inbox/SchoolRegistrationsTab.tsx
    - docs/admin/inbox.md
    - public/docs/search-index.json
decisions:
  - "Used service role client in inbox page.tsx for schools query to enable school_designations join — matches pattern used by other tabs"
  - "Moved supabaseService declaration before schools query to fix use-before-declaration TS error"
  - "Kept handleReset as direct client-side Supabase call — reset is a convenience action, not a formal workflow requiring email"
metrics:
  duration: "4 minutes"
  completed_date: "2026-03-31"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 5
---

# Phase 33 Plan 01: Admin School Approve/Reject Workflow Summary

**One-liner:** Server actions for school approve/reject with Resend email notifications and designation badges in admin inbox tab.

## What Was Built

### Task 1: Server Actions (`app/admin/schools/actions.ts`)

Created two `'use server'` actions:

- **`approveSchool(schoolId)`** — sets `status='approved'`, `approved_at=now()`, `approved_by=admin.id`, clears `rejection_reason`; fetches owner profile; sends `school_approved` email via `sendEmailFromTemplate`; calls `revalidatePath('/admin/inbox')`
- **`rejectSchool(schoolId, reason)`** — sets `status='rejected'`, `rejection_reason=reason`; fetches owner profile; sends `school_rejected` email; calls `revalidatePath('/admin/inbox')`

Both actions authenticate the admin via `createSupabaseServerClient`, use `getSupabaseService()` for DB writes (bypasses RLS), and wrap everything in try/catch returning `{ success, error? }`.

### Task 2: Inbox Tab Updates

**`app/admin/inbox/page.tsx`:**
- Moved `supabaseService = getSupabaseService()` declaration before the schools query (was after — caused TS2448)
- Extended schools `select` to include `school_designations (designation_type, status)`
- Updated `pendingSchoolCount` to count `pending` OR `pending_review` statuses

**`app/admin/inbox/SchoolRegistrationsTab.tsx`:**
- Added `school_designations: Designation[]` to `School` type
- Added `pending_review` to status union and `STATUS_STYLES` map
- Added **DESIGNATIONS** column (purple pill badges per designation type)
- Updated grid from 6 to 7 columns: `[2fr_1.2fr_1.5fr_0.8fr_0.8fr_0.8fr_auto]`
- Fixed **View** link: `/schools/${id}/settings` → `/admin/schools/${id}`
- Replaced direct `supabase.from('schools').update()` in `handleApprove`/`handleReject` with calls to `approveSchool`/`rejectSchool` server actions
- Kept `handleReset` as client-side direct call (not a formal workflow)

## Commits

| Hash | Type | Description |
|------|------|-------------|
| 8dc7a39 | feat | Add approveSchool and rejectSchool server actions with email |
| 21f5d74 | feat | Update inbox tab with designations column and server actions |
| 27d996a | docs | Update inbox admin docs for school registrations tab changes |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed supabaseService used before declaration**
- **Found during:** Task 2 TypeScript verification
- **Issue:** The schools query was moved to use `supabaseService` but the declaration was further down in the file, causing TS2448
- **Fix:** Moved `const supabaseService = getSupabaseService()` to before the schools query block and removed the duplicate declaration
- **Files modified:** `app/admin/inbox/page.tsx`
- **Commit:** 21f5d74

## Known Stubs

None — all data is wired to real Supabase queries. Designation badges show a dash when no designations exist (intentional empty state).

## Self-Check: PASSED
