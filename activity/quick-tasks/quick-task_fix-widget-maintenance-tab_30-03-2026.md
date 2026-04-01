# Quick Task: Fix Chat Widget + Maintenance Tab

**ID:** 260330-ey9
**Date:** 2026-03-30
**Status:** Complete

## Description
Fix Mattea chat widget not appearing on frontend pages and add new "Maintenance" tab to admin settings.

## Solution
1. **Widget fix:** Added admin preview mode — widget shows with "Preview" badge when is_active=false for admins, "Maintenance" badge when chatbot maintenance is on. Config endpoint now returns maintenance mode and user role.
2. **Maintenance tab:** New tab in /admin/settings after Health. Moved Maintenance Mode and Email Sandbox blocks from General tab. Added Chatbot Maintenance toggle with chatbot_maintenance_mode in site_settings.
3. **Migration:** 20260362_chatbot_maintenance_mode.sql adds setting to site_settings table.
