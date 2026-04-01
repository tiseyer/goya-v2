# Milestone: v1.9 Member Events

**Started:** 2026-03-31
**Completed:** 2026-03-31
**Phases:** 6 (16-21)

## Deliverables

### Database (Phase 16)
- [x] `event_type` column ('goya'/'member') on events table
- [x] `created_by` FK to profiles for member-submitted events
- [x] Status workflow: draft, pending_review, published, rejected, cancelled, deleted
- [x] `rejection_reason` text column
- [x] `event_audit_log` table (action, performer, role, changes diff)
- [x] RLS: member insert/read/update own, moderator approve/reject, admin full access
- [x] `is_event_submitter()` helper function
- [x] TypeScript types regenerated

### Admin Events List (Phase 17)
- [x] Event type badge (GOYA blue / Member indigo) in admin table
- [x] Type filter dropdown (All/GOYA/Member)
- [x] Submitter name shown for member events via created_by join
- [x] Extended status filter (Published, Draft, Pending Review, Rejected, Cancelled, Deleted)
- [x] Audit history timeline on event edit page (admin only)

### Admin Inbox Events Tab (Phase 18)
- [x] "Events" tab (Tab 6) in admin inbox
- [x] Pending review queue with badge count
- [x] Approve action → status to published + audit log
- [x] Reject action with required reason modal → status to rejected + audit log

### My Events Settings Page (Phase 19)
- [x] "My Events" nav item in settings sidebar (role-gated: teacher/WP/admin)
- [x] Empty state with icon, description, "+ Add New Event" button
- [x] Events list with status badges (Draft grey, Pending amber, Published green, Rejected red)
- [x] Status-aware actions per event
- [x] First-time info modal (localStorage-gated)
- [x] Inline event creation/edit form with "Save as Draft" / "Submit for Review"
- [x] Rejected event edit + resubmit clears rejection_reason

### Public Calendar Type Filter (Phase 20)
- [x] Event type filter on /events: All Events, GOYA Events, Member Events
- [x] Desktop sidebar + mobile segmented control
- [x] Only published events shown regardless of filter
- [x] Clear filters resets type filter too

### Audit Log Coverage (Phase 21)
- [x] Shared `lib/events/audit.ts` with `writeEventAuditLog()` utility
- [x] All 10 code paths wired: admin create/edit/delete/restore, inbox approve/reject, member create/edit/submit/delete

## Files Changed

### New Files
- `supabase/migrations/20260370_member_events_schema.sql`
- `supabase/migrations/20260371_member_events_rls.sql`
- `lib/events/audit.ts`
- `app/admin/events/actions.ts`
- `app/admin/inbox/EventsTab.tsx`
- `app/settings/my-events/page.tsx`
- `app/settings/my-events/MyEventsClient.tsx`
- `app/settings/my-events/actions.ts`

### Modified Files
- `types/supabase.ts` (regenerated)
- `lib/types.ts` (Event type extended)
- `app/admin/events/page.tsx` (type badge, filters, submitter)
- `app/admin/events/AdminEventsFilters.tsx` (type + status filters)
- `app/admin/events/[id]/edit/page.tsx` (audit history timeline)
- `app/admin/events/components/EventForm.tsx` (audit logging)
- `app/admin/events/AdminEventActions.tsx` (audit logging)
- `app/admin/inbox/page.tsx` (Events tab + data fetch)
- `app/admin/inbox/actions.ts` (approveEvent, rejectEvent)
- `app/settings/components/SettingsShell.tsx` (My Events nav item)
- `app/settings/layout.tsx` (userRole prop)
- `app/events/page.tsx` (type filter)

## Summary

Members with teacher, wellness_practitioner, or admin roles can now submit events to the GOYA community calendar. Events go through a draft → pending review → published/rejected workflow with full audit logging. Admins and moderators can approve or reject submissions from the inbox. The public events page supports filtering by GOYA vs Member events.
