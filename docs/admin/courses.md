---
title: Courses
audience: ["admin"]
section: admin
order: 5
last_updated: "2026-04-01"
---

# Courses

The Courses page lists all courses on the platform, both GOYA-created and member-submitted. Navigate to **Courses** in the sidebar or go to `/admin/courses`.

The page has two tabs: **Courses** (the default course list) and **Categories** (manage course categories).

## Table of Contents

- [Tabs](#tabs)
- [Course Types](#course-types)
- [Table Columns](#table-columns)
- [Status Workflow](#status-workflow)
- [Filters](#filters)
- [Adding a New Course](#adding-a-new-course)
- [Editing a Course](#editing-a-course)
  - [Lessons Section](#lessons-section)
- [Soft Delete and Restore](#soft-delete-and-restore)
- [Managing Categories](#managing-categories)
- [Role Permissions](#role-permissions)

## Tabs

The Courses page has a tab bar at the top:

| Tab | URL | Description |
|---|---|---|
| **Courses** | `/admin/courses` | The course list with filters, table, and pagination |
| **Categories** | `/admin/courses?tab=categories` | Manage course categories |

Switching tabs updates the URL so the view is bookmarkable and shareable.

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
| **Duration** | Duration in hours and minutes (e.g. "1h 30m") |
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
| **Category** | Loaded from the database — reflects your current category list |
| **Access** | Free, Members Only |
| **Status** | All active, Draft, Pending Review, Published, Rejected, Cancelled, Deleted (admin only) |
| **Type** | All, GOYA, Member |
| **Sort** | Created date descending (default), Title A-Z, Title Z-A |

The **Deleted** status filter is only available to the **admin** role. Moderators see active courses only.

When viewing deleted courses, the table background becomes red-tinted.

## Adding a New Course

Click **Add New Course** in the top-right corner to open `/admin/courses/new`. The form is divided into three sections:

- **Basic Info** — Title (required), Category (dropdown from the database, with a colour indicator), Level, Access, and Instructor.
- **Content** — Short description (200-char limit with counter), full description, thumbnail URL, and card gradient pickers with a live preview.
- **Settings** — Status (Published/Draft) and a Duration slider from 5 minutes to 10 hours in 5-minute steps, displayed as "Xh Ym".

GOYA courses do not go through the review queue. After saving a new course, you are taken directly to the **Lessons** tab of the edit page to begin adding lesson content.

## Editing a Course

Click the **Edit** action on any course row to open `/admin/courses/[id]`. From there you can:

- Edit all course fields
- Change the status
- Manage lessons in the **Lessons** section below the course form
- View the audit history timeline showing every change made to the course record

### Lessons Section

Below the course edit form is a **Lessons** card that lists all lessons attached to the course.

| Element | Description |
|---|---|
| **Drag handle** | Six-dot grip icon — drag to reorder lessons. Reorder is saved automatically to the database. Works on touch screens. |
| **Number** | Sequential position of the lesson |
| **Title** | Lesson title |
| **Type badge** | Video (blue), Audio (amber), or Text (emerald) |
| **Duration** | Duration in minutes (e.g. "30m"), or `--` if not set |
| **Edit** | Opens the inline lesson form pre-filled with existing data (pencil icon) |
| **Delete** | Removes the lesson after confirmation (trash icon) |

When no lessons have been added yet, the section shows an empty state: "No lessons yet. Add your first lesson below."

Click **+ Add Lesson** to open the inline lesson form below the list.

### Adding and Editing Lessons

The lesson form appears inline below the lesson list. It has three steps:

**1. Lesson Type** — Select one of three cards:

| Card | Fields shown |
|---|---|
| **Video** | Platform toggle (Vimeo / YouTube), Video URL, descriptions, duration slider |
| **Audio** | Audio URL, Featured Image URL (optional), descriptions, duration slider |
| **Text** | Featured Image URL (optional), descriptions (larger text area), duration slider |

**2. Common fields** — All lesson types share:
- **Title** (required)
- **Short Description** — shown on the lesson card, max 200 characters
- **Full Description** — shown on the lesson detail page
- **Duration slider** — 1 to 180 minutes in 1-minute steps, displayed as "Xh Ym" or "Ym"

**3. Save or Cancel** — Click **Add Lesson** (or **Save Changes** when editing) to submit. The lesson list updates immediately without a page reload. Click **Cancel** to discard changes and close the form.

## Soft Delete and Restore

Soft-deleting a course sets `status` to `deleted` and records a `deleted_at` timestamp. The course is hidden from the default view and from the public academy.

To find deleted courses, apply the **Deleted** status filter. The deletion date appears under the status badge.

To restore, open the course detail page and set the status back to `draft` or `published`.

## Managing Categories

Switch to the **Categories** tab (`/admin/courses?tab=categories`) to manage the course category list.

### Categories Table

| Column | Description |
|---|---|
| **Color** | Colour swatch for the category |
| **Name** | Category name |
| **Slug** | URL-safe identifier (monospace) |
| **Parent** | Parent category name, or `---` if top-level |
| **Description** | Truncated description |
| **Actions** | Edit and delete controls |

### Adding a Category

Click **Add Category** in the top-right corner of the Categories tab. Fill in:

- **Name** (required) — the display name; the slug is auto-generated on blur
- **Slug** — URL-safe identifier; editable after auto-generation
- **Description** — optional free-text description
- **Parent Category** — optional parent for hierarchical organisation
- **Color** — hex colour code (e.g. `#345c83`) with a live preview swatch

Click **Save Category** to create it. The new category appears at the top of the table.

### Editing a Category

Click **Edit** on any category row. The same modal opens pre-filled with the current values. The parent dropdown excludes the category itself to prevent circular references. Click **Save Category** to update.

### Deleting a Category

Click the trash icon on any category row.

- If the category has **no courses**, it is deleted immediately.
- If the category is **used by one or more courses**, deletion is blocked. An amber notice shows how many courses reference it, with a Dismiss button. To delete, first reassign or remove the category from those courses.

## Role Permissions

| Action | Admin | Moderator |
|---|---|---|
| View active courses | Yes | Yes |
| View deleted courses | Yes | No |
| Create GOYA courses | Yes | Yes |
| Approve/reject member courses | Yes | Yes |
| Soft-delete courses | Yes | Yes |
| Restore deleted courses | Yes | No |
| View categories | Yes | Yes |
| Create/edit categories | Yes | Yes |
| Delete categories | Yes | Yes |

---

**See also:** [Inbox — Courses Tab](./inbox.md#courses-tab) | [Events](./events.md) | [Audit Log](./audit-log.md)
