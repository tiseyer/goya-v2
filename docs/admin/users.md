---
title: Users
audience: ["admin"]
section: admin
order: 3
last_updated: "2026-04-03"
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

## Deleting Users

Select one or more users using the checkboxes in the table. A floating action bar appears at the bottom of the screen. Click **Delete Selected** to open the confirmation dialog, which lists the users to be deleted.

**Deleting regular users:** Confirm the dialog — the deletion is immediate and cannot be undone.

**Deleting admin accounts:** Only the platform owner can delete admin accounts. If admin accounts are selected:

- Regular admins see them annotated as "admin — will be skipped". Admin accounts are excluded from deletion for regular admins.
- The platform owner sees them annotated as "admin — extra confirmation required". After the first dialog, a **second confirmation dialog** appears listing each admin account to be deleted. You must type `DELETE ADMIN` exactly into the text field before the confirm button becomes active.

**The platform owner account cannot be deleted by anyone.** It appears as "cannot be deleted" in the dialog and is always skipped.

## User Detail Page

Click a user's row or the **View** button to open `/admin/users/[id]`. The page is organized into editable info boxes:

**Profile Info** — Full Name, Username, Role, Member Type, MRN. Click the pencil icon to edit, then Save or Cancel.

**Account Status** — Subscription Status (Guest/Member), Verification Status (Unverified/Pending/Verified), Onboarding Status (Incomplete/Completed). Each field has a dropdown in edit mode. The Reset Onboarding button is also available here.

**Contact & Dates** — Email, Member Since, Last Login. Read-only.

**WP Migration Info** — WP Roles and WP User ID. Read-only and collapsible. Only shown for users with WordPress migration data.

Additional tabs: **Connections** (school memberships and user connections) and **Flows** (assigned flow responses).

## Creating a User

Click the **Create User** button in the top-right corner of the Users page. A modal opens with fields for First Name, Last Name, Email (required), Role (Student/Teacher/Wellness Practitioner), and an optional Password (auto-generated if left empty). On success, the new user's email is displayed. If the email already exists, an error is shown.

---

**See also:** [Audit Log](./audit-log.md) | [Credits](./credits.md) | [Verification](./verification.md)
