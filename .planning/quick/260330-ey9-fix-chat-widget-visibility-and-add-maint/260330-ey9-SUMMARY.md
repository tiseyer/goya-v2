---
type: quick
id: 260330-ey9
date: 2026-03-30
status: complete
tasks_completed: 2
tasks_total: 3
commits:
  - 7a20bcd: feat — chat widget admin awareness and maintenance mode support
  - 4f80c10: feat — add Maintenance tab with chatbot maintenance control
files_created:
  - app/admin/settings/components/MaintenanceTab.tsx
  - supabase/migrations/20260362_chatbot_maintenance_mode.sql
files_modified:
  - app/api/chatbot/config/route.ts
  - app/components/chat/ChatWidget.tsx
  - lib/chatbot/chat-actions.ts
  - app/admin/settings/page.tsx
---

# Quick Task 260330-ey9 Summary

**One-liner:** Chat widget admin preview/maintenance badges with dedicated Maintenance settings tab consolidating site maintenance, email sandbox, and chatbot maintenance controls.

## What Was Built

### Task 1 — Chat widget visibility and admin preview mode

- `/api/chatbot/config` now queries `site_settings` for `chatbot_maintenance_mode` in parallel with the chatbot_config query, returning `{ is_active, name, avatar_url, chatbot_maintenance_mode }`.
- Added `getCurrentUserRole()` server action to `lib/chatbot/chat-actions.ts` — queries the `profiles` table for the authenticated user's role.
- `ChatWidget.tsx` now resolves role alongside identity on mount (without waiting for `is_active` — so admins see the widget even when inactive).
- Visibility logic:
  - `is_active=true`, `chatbot_maintenance_mode=false` → show for everyone (no badge)
  - `is_active=true`, `chatbot_maintenance_mode=true` → admins only, amber "Maintenance" badge
  - `is_active=false` → admins only, blue "Preview" badge
  - Non-admins blocked in maintenance/inactive states: return null

### Task 2 — Maintenance tab

- Created `app/admin/settings/components/MaintenanceTab.tsx` with three sections: Maintenance Mode, Email Sandbox, Chatbot Maintenance.
- All maintenance/sandbox state and logic moved out of GeneralTab into MaintenanceTab.
- New Chatbot Maintenance section: toggle, status dot (amber/emerald), info banner, save to `site_settings.chatbot_maintenance_mode`.
- `app/admin/settings/page.tsx` Tab type extended to `'maintenance'`, TABS array updated, GeneralTab cleaned down to General info + Deploy Environment + Danger Zone only.
- Migration `20260362_chatbot_maintenance_mode.sql` seeds the `chatbot_maintenance_mode` key in `site_settings`.

## Deviations from Plan

**[Rule 1 - Bug] FloatingButton is fixed-position — relative wrapper would not anchor badge**

- **Found during:** Task 1
- **Issue:** `FloatingButton` uses `position: fixed` (bottom-6 right-6). Wrapping it in a `relative inline-block` div would not affect badge placement since fixed elements escape normal flow.
- **Fix:** Positioned badges as `fixed bottom-16 right-4` (just above the button) rather than using absolute positioning within a relative wrapper.
- **Files modified:** `app/components/chat/ChatWidget.tsx`

**[Rule 1 - Bug] profiles table holds role, not members table**

- **Found during:** Task 1 (investigation)
- **Issue:** Plan stated role is in `members` table, but the codebase consistently uses `profiles.role`. No `members` table exists in the codebase.
- **Fix:** `getCurrentUserRole()` queries `profiles` table instead.
- **Files modified:** `lib/chatbot/chat-actions.ts`

## Self-Check

- [x] `app/api/chatbot/config/route.ts` — exists, returns `chatbot_maintenance_mode`
- [x] `app/components/chat/ChatWidget.tsx` — exists, admin badge logic implemented
- [x] `lib/chatbot/chat-actions.ts` — exists, `getCurrentUserRole` added
- [x] `app/admin/settings/components/MaintenanceTab.tsx` — exists, three sections
- [x] `app/admin/settings/page.tsx` — Maintenance tab in TABS, GeneralTab cleaned
- [x] `supabase/migrations/20260362_chatbot_maintenance_mode.sql` — exists and applied
- [x] Commits 7a20bcd and 4f80c10 exist

## Self-Check: PASSED
