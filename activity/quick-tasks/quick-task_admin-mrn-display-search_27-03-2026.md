# Quick Task: Admin MRN Display and Search Fixes

**Status:** Complete
**Date:** 2026-03-27

## Description
Added MRN display to admin user detail page and enabled MRN search in admin users list.

## Solution
- Added `mrn` to profile query and displayed as first field in Profile Information card
- Added `mrn` to `.or()` search filter in admin users list page
