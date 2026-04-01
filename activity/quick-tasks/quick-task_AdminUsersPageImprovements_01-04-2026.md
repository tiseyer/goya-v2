# Quick Task: Admin Users Page Improvements

**Date:** 2026-04-01
**Status:** Complete
**Commits:** a40160a, a7e7085, 2870e63

## Description

Four improvements to the admin users area:

1. **Fixed double plus on Create User button** — removed duplicate "+" from button text (SVG icon already shows plus)
2. **Implemented Create User modal** — replaced "coming soon" alert with full modal: First Name, Last Name, Email, Role dropdown, optional Password. Creates Supabase Auth user + profiles row.
3. **Restructured user detail page** — renamed "Edit" to "View", reorganized into 4 editable info boxes (Profile Info, Account Status, Contact & Dates, WP Migration Info) with per-box edit mode
4. **Extended school CTA visibility** — SchoolRegistrationCTA now shows to admins in addition to teachers (dashboard, subscriptions, add-ons)

## Solution

- Created `app/admin/users/actions.ts` with `createUser` and `updateUserProfile` server actions
- Rewrote `CreateUserButton.tsx` with modal state management
- Created `app/admin/users/[id]/UserDetailClient.tsx` client component for editable boxes
- Updated visibility conditions in `app/addons/page.tsx`, `app/settings/subscriptions/page.tsx`, `app/dashboard/page.tsx`
