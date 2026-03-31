---
title: Events
audience: ["admin"]
section: admin
order: 4
last_updated: "2026-03-31"
---

# Events

The Events page lists all events on the platform, both GOYA-created and member-submitted. Navigate to **Events** in the sidebar or go to `/admin/events`.

## Table of Contents

- [Event Types](#event-types)
- [Table Columns](#table-columns)
- [Status Workflow](#status-workflow)
- [Filters](#filters)
- [Adding a New Event](#adding-a-new-event)
- [Editing an Event](#editing-an-event)
- [Soft Delete and Restore](#soft-delete-and-restore)
- [Role Permissions](#role-permissions)

## Event Types

Every event carries a **Type** badge in the table:

| Badge | Meaning |
|---|---|
| **GOYA** (blue) | Created directly by an admin or moderator through the admin panel |
| **Member** (indigo) | Submitted by a platform member and requiring review |

Member events show "Submitted by [name/email]" beneath the event title.

## Table Columns

| Column | Description |
|---|---|
| **Event** | Title, category badge, format badge, and submitter info for member events |
| **Type** | GOYA or Member badge |
| **Date** | The event date |
| **Time** | Event start time |
| **Instructor** | Instructor name if set |
| **Price** | Dollar amount or "Free" label |
| **Spots** | Remaining / total capacity |
| **Status** | Current status badge |
| **Actions** | Edit, delete, or restore controls |

The table paginates at 25 rows per page.

## Status Workflow

Events move through the following statuses:

```
draft  →  pending_review  →  published
                          →  rejected
published  →  cancelled
any  →  deleted  (soft delete)
```

| Status | Badge colour | Description |
|---|---|---|
| **published** | Emerald | Visible to members on the public site |
| **draft** | Amber | In progress, not yet submitted for review |
| **pending_review** | Amber | Submitted by a member, awaiting admin decision |
| **rejected** | Red | Declined by an admin |
| **cancelled** | Red | Event was cancelled after publishing |
| **deleted** | Red with strikethrough | Soft-deleted; hidden from the default view |

To approve or reject a **pending_review** member event, use the [Inbox Events tab](./inbox.md#events-tab). Admins can also change status directly from the event detail page.

## Filters

The filter bar supports the following controls:

| Filter | Options |
|---|---|
| **Search** | Searches event titles |
| **Category** | Workshop, Teacher Training, Dharma Talk, Conference, Yoga Sequence, Music Playlist, Research |
| **Format** | Online, In-Person, Hybrid |
| **Status** | All active, Draft, Pending Review, Published, Rejected, Cancelled, Deleted (admin only) |
| **Type** | All, GOYA, Member |
| **Sort** | Date ascending (default), Date descending, Created date descending |

The **Deleted** status filter is only available to the **admin** role. Moderators cannot view soft-deleted events.

When viewing deleted events, the table background becomes red-tinted to indicate the special view.

## Adding a New Event

Click the **Add New Event** button in the top-right corner. This opens `/admin/events/new` — a card-based form organised into sections:

| Section | Fields |
|---|---|
| **Basic Info** | Title, Category, Format, Status |
| **Schedule** | Start Date, End Date (optional), All Day toggle, Start Time, End Time (hidden when All Day) |
| **Location** | Instructor, Location |
| **Registration** | Registration Required toggle, Price (with free toggle), Total Spots (placeholder "Unlimited"), Spots Remaining, Event Website (always visible) |
| **Details** | Description, Featured Image |
| **Organizers** | Coming soon |

Admins and moderators can set status to Published, Draft, or Cancelled. Members creating events see only Draft and Pending Review options.

GOYA events created here are published immediately (or saved as draft) without going through the review queue.

## Editing an Event

Click the **Edit** action on any event row to open `/admin/events/[id]`. From the detail page you can:

- Edit all event fields
- Change the status
- View the audit history timeline — a chronological log of every change made to the event, including who made it and when

## Soft Delete and Restore

Deleting an event sets `status` to `deleted` and records a `deleted_at` timestamp. The event is hidden from the default list view and from the public site.

To view deleted events, apply the **Deleted** status filter. Each deleted row shows the deletion date beneath the status badge.

To restore a deleted event, open its detail page and change the status back to the desired state (e.g. `draft` or `published`).

## Role Permissions

| Action | Admin | Moderator |
|---|---|---|
| View active events | Yes | Yes |
| View deleted events | Yes | No |
| Create GOYA events | Yes | Yes |
| Approve/reject member events | Yes | Yes |
| Soft-delete events | Yes | Yes |
| Restore deleted events | Yes | No |

---

**See also:** [Inbox — Events Tab](./inbox.md#events-tab) | [Courses](./courses.md) | [Audit Log](./audit-log.md)
