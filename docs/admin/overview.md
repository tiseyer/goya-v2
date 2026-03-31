---
title: Admin Panel Overview
audience: ["admin"]
section: admin
order: 1
last_updated: "2026-03-31"
---

# Admin Panel Overview

The GOYA admin panel is the central hub for managing users, content, commerce, and platform settings. It is accessible to users with the **admin** or **moderator** role.

## Table of Contents

- [Accessing the Admin Panel](#accessing-the-admin-panel)
- [Sidebar Navigation](#sidebar-navigation)
- [Maintenance Mode Banner](#maintenance-mode-banner)
- [Role Differences](#role-differences)

## Accessing the Admin Panel

Navigate to `/admin` in your browser. If you are not logged in or do not have the required role, you will be redirected automatically.

The panel loads at `/admin/dashboard` by default.

## Sidebar Navigation

The left sidebar organises all admin sections. Click the double-arrow button at the top of the sidebar to collapse it to icons-only mode. Clicking again restores the full labels. Your preference is saved between sessions.

The sidebar is divided into the following groups:

### Top-level links

| Item | URL | Notes |
|---|---|---|
| **Dashboard** | `/admin/dashboard` | At-a-glance platform overview |
| **Inbox** | `/admin/inbox` | Action queue; shows a badge with pending school registrations |

### Analytics group

| Item | URL |
|---|---|
| **Shop** | `/admin/shop/analytics` |
| **Visitors** | `/admin/analytics/visitors` |

### Content section

| Item | URL |
|---|---|
| **Users** | `/admin/users` |
| **Media** | `/admin/media` |
| **Events** | `/admin/events` |
| **Courses** | `/admin/courses` |

### Shop group

| Item | URL |
|---|---|
| **Orders** | `/admin/shop/orders` |
| **Products** | `/admin/shop/products` |
| **Coupons** | `/admin/shop/coupons` |

### Settings group

| Item | URL |
|---|---|
| **System** | `/admin/settings` |
| **Email Templates** | `/admin/settings/email-templates` |
| **Flows** | `/admin/flows` |
| **Chatbot** | `/admin/chatbot` |
| **Credits** | `/admin/credits` |
| **API Keys** | `/admin/api-keys` |
| **Audit Log** | `/admin/audit-log` |
| **Migration** | `/admin/migration` |

Groups (Analytics, Shop, Settings) expand and collapse by clicking the group label. The active group opens automatically when you navigate to any child page.

## Maintenance Mode Banner

When maintenance mode is active, a yellow banner appears at the top of every admin page:

> "Maintenance mode is active — non-admin users are seeing the maintenance page."

Click **Manage** in the banner to go directly to the maintenance settings. See [Settings](./settings.md) for how to enable or schedule maintenance mode.

## Role Differences

The admin panel is accessible to both **admin** and **moderator** roles, but some features are restricted:

- **Deleted content** (events, courses with `status: deleted`) is only visible to the **admin** role. Moderators see active content only.
- The **Migration** tool is available in the sidebar to both roles, but sensitive operations within it may be admin-only.

---

**See also:** [Inbox](./inbox.md) | [Settings](./settings.md) | [Audit Log](./audit-log.md)
