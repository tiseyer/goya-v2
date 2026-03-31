# Phase 2: Form UI Redesign + Status Summary

Card-based EventForm with six sections (Basic Info, Schedule, Location, Registration, Details, Organizers), role-aware status options, GOYA design system tokens, and AnimatedField transition infrastructure.

## Completed Tasks

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Restructure EventForm into card sections with role-aware status | 8f3226a |
| 2 | Update edit page to pass userRole prop | 8f3226a |
| 3 | Update admin events docs and search index | 23ebd91 |

## Key Changes

### EventForm.tsx (complete rewrite)
- **FormSection** inline component: `bg-white rounded-xl border border-goya-border shadow-soft p-6` with title/description header
- **AnimatedField** inline component: `grid-rows-[1fr]/grid-rows-[0fr]` transition for conditional fields (used on price field)
- **Role-aware status**: `useMemo` derives options from `userRole` and `event.status` -- admin/moderator get Published/Draft/Cancelled; member creating gets Draft/Pending Review; member editing gets context-appropriate transitions
- **Design system tokens**: All hardcoded hex replaced with CSS variable classes (`primary`, `primary-dark`, `foreground`, `foreground-secondary`, `foreground-tertiary`, `goya-border`, `primary-50`)
- **Six card sections**: Basic Info, Schedule, Location, Registration, Details, Organizers (placeholder)
- **Button hierarchy**: Primary CTA `bg-primary text-white hover:bg-primary-dark`, Cancel `border border-goya-border text-foreground-secondary`

### Edit page
- Passes `userRole` from server-fetched profile to EventForm

## Deviations from Plan

None -- plan executed exactly as written.

## Requirements Coverage

| Requirement | Status | Evidence |
|-------------|--------|----------|
| UI-01 | Done | FormSection component with border, shadow-soft, p-6 |
| UI-02 | Done | Six named sections with titles and descriptions |
| UI-03 | Done | AnimatedField component with grid-rows transition |
| UI-04 | Done | Primary CTA prominent, Cancel secondary |
| UI-05 | Done | grid-cols-1 sm:grid-cols-2/3 responsive grids |
| UI-06 | Done | All colors use CSS variable token classes |
| STATUS-01 | Done | Admin/moderator gets Published, Draft, Cancelled |
| STATUS-02 | Done | Member creating gets Draft, Pending Review |
| STATUS-03 | Done | Member editing gets context-appropriate transitions |

## Known Stubs

| File | Line | Stub | Reason |
|------|------|------|--------|
| EventForm.tsx | Organizers section | "Organizer management coming in a future update." | Intentional -- Phase 5 will populate this section |

## Files Modified

- `app/admin/events/components/EventForm.tsx` (rewritten)
- `app/admin/events/[id]/edit/page.tsx` (added userRole prop)
- `docs/admin/events.md` (updated form sections docs)
- `public/docs/search-index.json` (regenerated)

## Duration

~3 minutes
