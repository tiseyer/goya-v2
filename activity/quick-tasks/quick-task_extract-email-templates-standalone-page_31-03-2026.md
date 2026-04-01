# Quick Task: Extract Email Templates to Standalone Page

**Date:** 2026-03-31
**Task ID:** 260331-k2r
**Status:** Done

## Task Description

Extract the Email Templates tab from System Settings into a standalone page at `/admin/settings/email-templates`. Update the admin sidebar to link directly to the new URL. Fix sidebar highlighting so only the correct item is active on each page.

## Solution

1. Created `app/admin/settings/email-templates/page.tsx` — renders `EmailTemplatesList` with a page header.
2. Updated `app/admin/settings/page.tsx` — removed `EmailTemplatesList` import and tab; System Settings now has 3 tabs: General, Health, Maintenance.
3. Updated `app/admin/components/AdminShell.tsx` — changed Email Templates href from `/admin/settings?tab=email-templates` to `/admin/settings/email-templates`. The existing exact-match guard for `/admin/settings` in `isChildActive` already handled the highlighting correctly.

## Commits

- `540b852` — feat: create standalone email templates page, remove tab from system settings
- `da39228` — fix: update sidebar email templates href and fix highlighting
