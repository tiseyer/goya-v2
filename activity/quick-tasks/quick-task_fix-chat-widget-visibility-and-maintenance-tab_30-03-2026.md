## Task

Fix chat widget not appearing on frontend pages and add a Maintenance tab to /admin/settings consolidating maintenance-related controls including a new Chatbot Maintenance toggle.

## Status

Complete

## Solution

### Chat widget admin awareness

- `/api/chatbot/config` now returns `chatbot_maintenance_mode` from site_settings alongside the existing chatbot_config fields.
- Added `getCurrentUserRole()` server action querying `profiles.role`.
- `ChatWidget` resolves user role on mount and applies badge logic:
  - Normal mode (active, no maintenance): show for everyone
  - Chatbot maintenance on: admins only with amber "Maintenance" badge
  - Chatbot inactive: admins only with blue "Preview" badge
- Non-admins see null widget when chatbot is hidden.

### Maintenance tab

- New `MaintenanceTab.tsx` component with three sections: Maintenance Mode, Email Sandbox, Chatbot Maintenance.
- Maintenance mode and email sandbox blocks moved from GeneralTab to MaintenanceTab.
- New Chatbot Maintenance section: toggle + status indicator + amber warning banner + save.
- GeneralTab now contains only: General info, Deploy Environment card, Danger Zone.
- Migration `20260362_chatbot_maintenance_mode.sql` seeds the key in site_settings (applied via `supabase db query --linked`).
