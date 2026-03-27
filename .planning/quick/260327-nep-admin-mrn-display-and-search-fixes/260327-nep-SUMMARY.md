# Quick Task 260327-nep: Admin MRN display and search fixes

**Status:** Complete
**Date:** 2026-03-27

## Changes

1. **Admin user detail page** (`app/admin/users/[id]/page.tsx`):
   - Added `mrn` to the profile query select
   - Added "Member Number (MRN)" field in the Profile Information card (first field, monospace font)

2. **Admin users list** (`app/admin/users/page.tsx`):
   - Added `mrn` to the `.or()` search filter so searching by MRN returns matching users

## Files Modified

- `app/admin/users/[id]/page.tsx` — query + display
- `app/admin/users/page.tsx` — search filter
