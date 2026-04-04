# Quick Task 260404-m1b — Summary

**Task:** Fix test user slot search dropdown clipped by overflow — use fixed-position portal
**Status:** Complete
**Commit:** a74cb3e

## What Changed

The search results dropdown in the Test Users tab was being clipped by `overflow: hidden` on the parent card/grid. Fixed by rendering the dropdown via `ReactDOM.createPortal()` to `document.body` with `position: fixed` positioning calculated from `getBoundingClientRect()`.

### Changes
- `app/admin/settings/components/TestUsersTab.tsx`: Added `createPortal` import, `inputWrapperRef` + `dropdownRef` refs, `dropdownPos` state, `updateDropdownPosition()` callback. Both results list and "no results" message now portal to `document.body` with `position: fixed` and `z-index: 9999`. Outside-click handler updated to check both the input container and portal dropdown.
