---
title: Users
audience: ["admin"]
section: admin
order: 3
last_updated: "2026-03-31"
---

# Users

The Users page lists every registered member of the GOYA platform. Navigate to **Users** in the sidebar or go to `/admin/users`.

## Table of Contents

- [User List](#user-list)
- [Search and Filters](#search-and-filters)
- [Role Badges](#role-badges)
- [User Detail Page](#user-detail-page)
- [Creating a User](#creating-a-user)

## User List

The table shows up to 25 users per page by default (switchable to 50 or 100 via the page-size selector). The header shows a count of displayed users versus the total matching the current filters.

Columns include: avatar, name, email, role badge, subscription status, verification status, and registration date.

Click any row to open that user's detail page.

## Search and Filters

The filter bar above the table supports the following:

| Filter | How it works |
|---|---|
| **Search** | Matches on full name, email, username, or member record number (MRN) |
| **Role** | Filter by `admin`, `moderator`, `member`, or other roles |
| **Verified** | Show only verified (`true`) or unverified (`false`) accounts |
| **Subscription status** | Filter by Stripe subscription state |
| **Credit status** | Filter by credit health: **Green** (on track), **Yellow** (expiring soon), **Red** (needs attention) |
| **WordPress roles** | Filter by legacy WP roles, with an include/exclude toggle |
| **Date range** | Filter by registration date using **From** and **To** date pickers |
| **Sort** | Newest, Oldest, Name A-Z, Name Z-A |

The credit status filter fetches a pool of up to 200 users, computes each user's credit status in parallel, and then paginates the result. This filter may be slower than the others.

## Role Badges

Each user card shows a role badge:

| Role | Meaning |
|---|---|
| **admin** | Full platform access |
| **moderator** | Admin panel access with reduced permissions |
| **member** | Standard platform user |

Member types (e.g. **Yoga Teacher**, **Wellness Practitioner**, **Student**) appear as a secondary label within the user's profile row or detail page.

## User Detail Page

Click a user's row to open `/admin/users/[id]`. This page contains multiple tabs covering different aspects of the user's account:

- **Profile** — name, email, avatar, member type, subscription status, verification badge
- **Credits** — a breakdown of the user's credit entries by type, with status indicators (green/yellow/red)
- **Connections** — any school memberships or connections linked to the account
- **Impersonation** — admins can use the **Switch To** button to impersonate the user and view the platform from their perspective

The **Switch To** button is also accessible from the user table directly without opening the detail page.

## Creating a User

Click the **Create User** button in the top-right corner of the Users page. This opens a form to provision a new account with a name, email, and initial role.

---

**See also:** [Audit Log](./audit-log.md) | [Credits](./credits.md) | [Verification](./verification.md)
