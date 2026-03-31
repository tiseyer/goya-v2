# Quick Task: Admin Sidebar Navigation Restructure

**Date:** 2026-03-31
**Status:** Complete
**Task ID:** 260331-ihy

## Description

Restructured the admin sidebar navigation from a flat list into a grouped layout with three logical sections separated by dividers, plus added Verifications to Inbox and cleaned up Settings.

## What was done

### Sidebar restructure (AdminShell.tsx)
- **Moved under Analytics group:** Shop Analytics (existing), Visitors (new placeholder)
- **Moved under Settings group:** System (/admin/settings), Email Templates (/admin/settings?tab=email-templates), Flows, Chatbot, Credits, API Keys, Audit Log, Migration
- **Removed as standalone items:** Verification, Credits, Audit Log, Chatbot, Flows, API Keys, Migration, Settings (now all under Settings group)
- **Added two dividers** separating: [Dashboard, Analytics, Inbox] | [Users, Events, Courses, Shop] | [Settings]
- **Generalized group state** from single `shopOpen` boolean to `Set<string>` supporting independent expand/collapse of Analytics, Shop, and Settings groups
- **Auto-open groups** whose children match current pathname on mount and navigation

### New placeholder page
- Created `/admin/analytics/visitors` placeholder page describing upcoming GA4, Clarity, and Vercel Analytics integration

### Inbox Verifications tab (inbox/page.tsx)
- Added Verifications as 2nd tab (after Credits & Hours)
- Fetches pending profiles with verification_status='pending'
- Renders same UI as standalone verification page with VerificationActions component
- Changed default tab from 'schools' to 'credits'
- Updated tab order: Credits & Hours, Verifications, Support Tickets, Teacher Upgrades, School Registrations

### Settings cleanup (settings/page.tsx)
- Removed Analytics tab entirely (GA4/Clarity config accessible via API Keys > Third Party Keys)
- Removed unused components: Toggle, InputField, StatusDot, Toast, datetime helpers
- Renamed heading from "Settings" to "System Settings"
- Added useSearchParams for URL-based tab selection (sidebar link support)
- Reduced tabs from 5 to 4: General, Email Templates, Health, Maintenance

## Files Modified
- `app/admin/components/AdminShell.tsx` — sidebar restructure
- `app/admin/inbox/page.tsx` — verifications tab added
- `app/admin/settings/page.tsx` — analytics tab removed, heading renamed

## Files Created
- `app/admin/analytics/visitors/page.tsx` — visitor analytics placeholder
