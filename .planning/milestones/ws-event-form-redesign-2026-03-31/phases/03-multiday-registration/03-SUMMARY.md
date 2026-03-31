# Phase 3: Multi-day Events + Registration Toggle Summary

**One-liner:** End date, all-day toggle, and registration-required gate with animated field transitions in both admin and member event forms.

## Completed Tasks

| Task | Description | Commit | Key Files |
|------|-------------|--------|-----------|
| 1 | Add multi-day + all-day + registration fields to admin EventForm | b3a9482 | `app/admin/events/components/EventForm.tsx`, `lib/types.ts` |
| 2 | Update member form (MyEventsClient) with same fields | b3a9482 | `app/settings/my-events/MyEventsClient.tsx`, `app/settings/my-events/actions.ts` |
| 3 | TypeScript verification + docs update | b3a9482 | `docs/admin/events.md`, `docs/teacher/my-events.md` |

## Requirements Covered

- **SCHED-02**: End Date field added alongside Start Date (optional)
- **SCHED-03**: All Day Event toggle hides Start Time and End Time fields via AnimatedField
- **SCHED-04**: Backward compatible -- existing events with null end_date/all_day work unchanged (defaults: endDate='', allDay=false)
- **REG-02**: Registration Required toggle added at top of Registration section
- **REG-03**: Price, is_free, Total Spots, Spots Remaining hidden when registration not required (AnimatedField in admin, conditional render in member form)
- **REG-04**: Total Spots placeholder changed from "--" to "Unlimited"

## Changes Made

### Event Type (lib/types.ts)
Added `end_date`, `all_day`, `registration_required`, `website_url` fields to the Event interface.

### Admin EventForm (app/admin/events/components/EventForm.tsx)
- New state: `endDate`, `allDay`, `registrationRequired`, `websiteUrl`
- Schedule section: Start Date + End Date (2-col grid), All Day checkbox, time fields wrapped in `<AnimatedField show={!allDay}>`
- Registration section: Registration Required toggle, Price/Spots wrapped in `<AnimatedField show={registrationRequired}>`, Total Spots placeholder "Unlimited", Event Website URL always visible
- Payload updated with `end_date`, `all_day`, `time_start`/`time_end` set to null when allDay, `registration_required`, `website_url`

### Member EventForm (app/settings/my-events/MyEventsClient.tsx)
- Same new fields added to `MemberEventForm` component and `FormValues` interface
- `buildFormValues()` updated with new fields
- Date section restructured with End Date and All Day toggle
- Price/Spots conditionally rendered based on `registrationRequired`
- Event Website field always visible
- Button disabled logic updated: time not required when allDay

### Actions (app/settings/my-events/actions.ts)
- `MemberEventFormData` interface: added `end_date`, `all_day`, `registration_required`, `website_url`; `time_start`/`time_end` changed to `string | null`

### Documentation
- `docs/admin/events.md`: Updated Schedule and Registration field descriptions
- `docs/teacher/my-events.md`: Updated form fields table with all new fields and adjusted required logic

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] MemberEventFormData type mismatch**
- **Found during:** Task 2
- **Issue:** `time_start: string` in `MemberEventFormData` was incompatible with `null` values sent when `all_day` is true
- **Fix:** Changed `time_start` and `time_end` to `string | null` in the interface
- **Files modified:** `app/settings/my-events/actions.ts`
- **Commit:** b3a9482

## Known Stubs

None -- all fields are fully wired to state and payloads.

## Self-Check: PASSED
