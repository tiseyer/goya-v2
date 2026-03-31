---
title: System Settings
audience: ["admin"]
section: admin
order: 9
last_updated: "2026-03-31"
---

# System Settings

The System Settings page controls platform-wide configuration. Navigate to **Settings > System** in the sidebar or go to `/admin/settings`.

The page has three tabs: **General**, **Health**, and **Maintenance**.

## Table of Contents

- [General Tab](#general-tab)
- [Health Tab](#health-tab)
- [Maintenance Tab](#maintenance-tab)
- [Email Templates](#email-templates)

---

## General Tab

Shows read-only platform information:

| Field | Value |
|---|---|
| **App Name** | GOYA — Global Online Yoga Association |
| **Version** | Current build version |
| **Environment** | Production or Development |

### Live Environment switcher

A toggle lets you switch between the **Develop** preview deployment and the **Production** site. Clicking a different environment navigates your browser to that deployment's URL. This is useful for quickly comparing behaviour between environments without manually typing URLs.

Your current environment is detected automatically from the hostname.

### Danger Zone

A reserved section for destructive operations such as database operations and cache clearing. These features will be added here in future milestones.

---

## Health Tab

The Health tab provides a real-time status check of platform dependencies — database connectivity, third-party integrations, and key services. Use this tab to diagnose issues without leaving the admin panel.

---

## Maintenance Tab

The Maintenance tab lets you put the platform into maintenance mode, which replaces the public-facing site with a maintenance page for all non-admin users.

### Enabling maintenance mode immediately

1. Go to **Settings > System** and click the **Maintenance** tab.
2. Toggle **Maintenance Mode Enabled** to on.
3. Click **Save** (or the equivalent save action on the form).

The amber maintenance banner will appear at the top of every admin page to confirm the mode is active. Click **Manage** in that banner to return to this tab quickly.

### Scheduling maintenance

Instead of enabling maintenance mode immediately, you can schedule a maintenance window:

1. Toggle **Schedule Maintenance** to on.
2. Set a **Start** and **End** time in UTC.
3. Save.

The platform automatically enters and exits maintenance mode at the specified times. If maintenance mode is also manually enabled at the same time, the manual toggle takes precedence.

### Disabling maintenance mode

Toggle **Maintenance Mode Enabled** to off and save. The maintenance page is removed immediately for public visitors.

---

## Email Templates

Navigate to **Settings > Email Templates** or go to `/admin/settings/email-templates`.

This page allows you to view and edit the transactional email templates used for events such as:

- Member verification approval and rejection
- Teacher upgrade approval and rejection
- Password reset and welcome emails

Each template has editable subject and body fields with variable placeholders (e.g. `{{firstName}}`). Changes take effect immediately for all future emails of that type.

---

**See also:** [Overview](./overview.md) | [Audit Log](./audit-log.md) | [Chatbot](./chatbot.md)
