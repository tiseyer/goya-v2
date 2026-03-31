---
title: Courses
audience: ["admin"]
section: admin
order: 5
last_updated: "2026-03-31"
---

# Courses

The Courses page lists all courses on the platform, both GOYA-created and member-submitted. Navigate to **Courses** in the sidebar or go to `/admin/courses`.

## Table of Contents

- [Course Types](#course-types)
- [Table Columns](#table-columns)
- [Status Workflow](#status-workflow)
- [Filters](#filters)
- [Adding a New Course](#adding-a-new-course)
- [Editing a Course](#editing-a-course)
- [Soft Delete and Restore](#soft-delete-and-restore)
- [Role Permissions](#role-permissions)

## Course Types

Every course carries a **Type** badge:

| Badge | Meaning |
|---|---|
| **GOYA** (blue) | Created directly by an admin or moderator |
| **Member** (indigo) | Submitted by a platform member and requiring review |

Member courses show "Submitted by [name/email]" beneath the course title.

## Table Columns

| Column | Description |
|---|---|
| **Course** | Title, category badge, access badge, and submitter info for member courses |
| **Type** | GOYA or Member badge |
| **Instructor** | Instructor name if set |
| **Level** | Beginner (emerald), Intermediate (amber), Advanced (rose), All Levels (slate) |
| **Duration** | Duration string (e.g. "6 weeks") |
| **Status** | Current status badge |
| **Actions** | Edit, delete, or restore controls |

The table paginates at 25 rows per page. Default sort is newest first.

### Access badges

| Badge | Meaning |
|---|---|
| **Free** (emerald) | Available to all visitors |
| **Members Only** (blue) | Requires an active subscription |

## Status Workflow

Courses share the same status lifecycle as events:

```
draft  →  pending_review  →  published
                          →  rejected
published  →  cancelled
any  →  deleted  (soft delete)
```

| Status | Badge colour | Description |
|---|---|---|
| **published** | Emerald | Live and visible to members |
| **draft** | Amber | In progress |
| **pending_review** | Amber | Submitted by a member, awaiting admin decision |
| **rejected** | Red | Declined |
| **cancelled** | Red | Cancelled after publishing |
| **deleted** | Red with strikethrough | Soft-deleted |

To approve or reject a **pending_review** member course, use the [Inbox Courses tab](./inbox.md#courses-tab). Admins can also change status directly from the course detail page.

## Filters

| Filter | Options |
|---|---|
| **Search** | Searches course titles |
| **Category** | Workshop, Yoga Sequence, Dharma Talk, Music Playlist, Research |
| **Access** | Free, Members Only |
| **Status** | All active, Draft, Pending Review, Published, Rejected, Cancelled, Deleted (admin only) |
| **Type** | All, GOYA, Member |
| **Sort** | Created date descending (default), Title A-Z, Title Z-A |

The **Deleted** status filter is only available to the **admin** role. Moderators see active courses only.

When viewing deleted courses, the table background becomes red-tinted.

## Adding a New Course

Click **Add New Course** in the top-right corner to open `/admin/courses/new`. Fill in the title, category, level, instructor, duration, and access settings. GOYA courses do not go through the review queue.

## Editing a Course

Click the **Edit** action on any course row to open `/admin/courses/[id]`. From there you can:

- Edit all course fields
- Change the status
- View the audit history timeline showing every change made to the course record

## Soft Delete and Restore

Soft-deleting a course sets `status` to `deleted` and records a `deleted_at` timestamp. The course is hidden from the default view and from the public academy.

To find deleted courses, apply the **Deleted** status filter. The deletion date appears under the status badge.

To restore, open the course detail page and set the status back to `draft` or `published`.

## Role Permissions

| Action | Admin | Moderator |
|---|---|---|
| View active courses | Yes | Yes |
| View deleted courses | Yes | No |
| Create GOYA courses | Yes | Yes |
| Approve/reject member courses | Yes | Yes |
| Soft-delete courses | Yes | Yes |
| Restore deleted courses | Yes | No |

---

**See also:** [Inbox — Courses Tab](./inbox.md#courses-tab) | [Events](./events.md) | [Audit Log](./audit-log.md)
