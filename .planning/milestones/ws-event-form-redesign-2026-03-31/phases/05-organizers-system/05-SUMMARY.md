# Phase 5: Organizers System Summary

**One-liner:** Organizer picker with debounced member search, avatar chips, role-based search scope, and 5-organizer limit across admin and member event forms.

## Completed Tasks

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Create OrganizerPicker component and searchMembers server action | eec9f5c | `app/components/OrganizerPicker.tsx`, `app/actions/members.ts` |
| 2 | Integrate OrganizerPicker into admin EventForm | 01be60d | `app/admin/events/components/EventForm.tsx`, `lib/types.ts` |
| 3 | Integrate OrganizerPicker into member event form | c3fe89f | `app/settings/my-events/MyEventsClient.tsx`, `app/settings/my-events/page.tsx`, `app/settings/my-events/actions.ts` |
| 4 | Pass user info to EventForm in admin create/edit pages | 44c6c00 | `app/admin/events/new/page.tsx`, `app/admin/events/[id]/edit/page.tsx` |

## Requirements Coverage

| Requirement | Status | Notes |
|-------------|--------|-------|
| ORG-02 | Done | Current user shown as default non-removable chip with "You" badge |
| ORG-03 | Done | Search and add up to 4 additional organizers (5 total max) |
| ORG-04 | Done | Admin searches all profiles; non-admin searches accepted connections only |
| ORG-05 | Done | Each organizer displayed as removable avatar chip (except the creator) |

## Implementation Details

### Server Action (`app/actions/members.ts`)
- `searchMembers`: Role-aware search. Admins query all profiles by `ilike` on `full_name`. Non-admin users query the `connections` table for accepted connections, then filter profiles by name match.
- `getProfilesByIds`: Hydrates organizer chips on form load when editing an existing event.
- Both use service role client to bypass RLS for cross-user lookups.

### OrganizerPicker Component (`app/components/OrganizerPicker.tsx`)
- Self-contained client component with debounced search (300ms).
- Current user always shown first as a non-removable chip with "You" label.
- Search results appear in a dropdown with avatar, name, and click-to-select.
- Selected organizers shown as removable chips with X button.
- Max 5 total enforced (1 creator + 4 added). Counter shown in placeholder.
- Profiles for existing organizer IDs hydrated on mount via `getProfilesByIds`.

### Admin Form Integration
- `EventForm` Props extended with `currentUserId`, `currentUserName`, `currentUserAvatar`.
- New/edit pages fetch user profile (full_name, avatar_url) server-side and pass down.
- Organizer placeholder section replaced with live OrganizerPicker.
- `organizer_ids` included in submit payload with current user prepended.

### Member Form Integration
- `MyEventsClient` Props extended with user info, passed from server page component.
- `MemberEventForm` receives and passes user info to OrganizerPicker.
- `MemberEventFormData` and server actions updated to accept and persist `organizer_ids`.
- `FormValues` includes `organizer_ids` in `buildFormValues`.

### Type Changes
- `Event` interface in `lib/types.ts`: added `organizer_ids: string[] | null`.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added getProfilesByIds action**
- **Found during:** Task 1
- **Issue:** When editing an event, the OrganizerPicker needs to display names/avatars for existing organizer IDs, but no action existed to fetch profiles by ID array.
- **Fix:** Added `getProfilesByIds` server action alongside `searchMembers`.
- **Files modified:** `app/actions/members.ts`

**2. [Rule 2 - Missing functionality] Updated docs per CLAUDE.md**
- **Found during:** Task 5
- **Issue:** CLAUDE.md requires documentation updates for every feature change.
- **Fix:** Updated `docs/admin/events.md` and `docs/teacher/my-events.md` with Organizers field documentation. Regenerated search index.
- **Files modified:** `docs/admin/events.md`, `docs/teacher/my-events.md`, `public/docs/search-index.json`

## Known Stubs

None. All data flows are wired end-to-end: form state -> payload -> server action -> Supabase insert/update.

## Duration

~5 minutes
