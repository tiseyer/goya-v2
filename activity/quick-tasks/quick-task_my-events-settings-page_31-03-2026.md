# Quick Task: My Events Settings Page

**Date:** 2026-03-31
**Status:** Complete

## Description
Implement a "My Events" page in user settings for teachers, wellness practitioners, and admins to submit events for review.

## Solution
- Updated `SettingsShell.tsx` to support role-based nav items, added "My Events" with calendar icon (visible only for teacher/wellness_practitioner/admin roles)
- Updated `settings/layout.tsx` to fetch user role and pass it to SettingsShell
- Created `app/settings/my-events/page.tsx` (server component) with auth/role guards and event data fetching
- Created `app/settings/my-events/MyEventsClient.tsx` (client component) with:
  - Empty state with CTA
  - Events list with status badges (Draft, Pending Review, Published, Rejected)
  - Status-specific action buttons (Edit, Delete, Submit for Review, View, Resubmit)
  - Rejection reason display
  - Delete confirmation inline
  - First-time info modal (localStorage-persisted)
  - Inline create/edit form (adapted from admin EventForm, no status dropdown)
  - Image upload via Supabase storage
- Created `app/settings/my-events/actions.ts` with server actions:
  - `createMemberEvent` — insert with event_type='member', audit log
  - `updateMemberEvent` — ownership + status check, audit log
  - `submitEventForReview` — draft to pending_review, audit log
  - `deleteMemberEvent` — soft delete, audit log
- All actions write to `event_audit_log` table
