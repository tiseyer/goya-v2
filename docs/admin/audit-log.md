---
title: Audit Log
audience: ["admin"]
section: admin
order: 13
last_updated: "2026-03-31"
---

# Audit Log

The Audit Log is a tamper-evident record of every significant action taken on the platform. It is the primary tool for compliance, debugging, and investigating unexpected behaviour. Navigate to **Settings > Audit Log** or go to `/admin/audit-log`.

## Table of Contents

- [What is Tracked](#what-is-tracked)
- [Table Columns](#table-columns)
- [Filters](#filters)
- [Reading an Entry](#reading-an-entry)
- [Exporting](#exporting)

---

## What is Tracked

The audit log captures actions across three categories:

| Category | Examples |
|---|---|
| **admin** | Approving a school registration, rejecting a member verification, changing event status, modifying system settings, creating or revoking API keys |
| **user** | Member submitting a credit entry, a user upgrading their account, course or event submissions |
| **system** | Automated jobs, scheduled maintenance mode changes, background data syncs |

Each entry records who performed the action, what they did, what they did it to, and when.

---

## Table Columns

| Column | Description |
|---|---|
| **Time** | Date and time of the action (displayed in DD.MM.YYYY HH:MM format) |
| **Category** | `admin`, `user`, or `system` badge |
| **Severity** | `info`, `warning`, or `error` badge |
| **Actor** | Name and role of the user who performed the action |
| **Action** | Machine-readable action code shown in a monospace pill (e.g. `event.status_changed`, `school.approved`) |
| **Target** | The type and label of the object affected (e.g. "EVENT / Summer Retreat Workshop") |
| **Description** | A human-readable summary of what happened |
| **Details** | An expandable section showing the raw metadata JSON for the entry |

### Severity levels

| Severity | Badge colour | When used |
|---|---|---|
| **info** | Blue | Routine actions with no risk |
| **warning** | Amber | Actions that may warrant attention (e.g. failed login attempts, unusual patterns) |
| **error** | Red | Failed operations or system errors |

### Category badge colours

| Category | Badge colour |
|---|---|
| **admin** | Blue |
| **user** | Emerald |
| **system** | Slate |

---

## Filters

Use the filter bar at the top of the page to narrow the log:

| Filter | Description |
|---|---|
| **Search** | Full-text search across description, actor name, action code, and target label |
| **Category** | Filter to `admin`, `user`, or `system` entries only |
| **Severity** | Filter to `info`, `warning`, or `error` entries only |
| **Date from** | Show entries on or after this date |
| **Date to** | Show entries on or before this date (inclusive, through end of day) |
| **Sort** | Newest first (default) or Oldest first |
| **Page size** | 25, 50, or 100 entries per page |

A count of displayed versus total matching entries is shown in the page header.

---

## Reading an Entry

Each row in the table contains the full audit context at a glance:

1. **Who** — the **Actor** column shows the admin or user's name and their role at the time.
2. **What** — the **Action** code (e.g. `event.status_changed`) combined with the **Description** explains the operation.
3. **On what** — the **Target** column shows the type of object (e.g. EVENT, SCHOOL, USER) and its display label.
4. **When** — the **Time** column shows the exact timestamp.

### Expanding metadata

If an entry has associated metadata (e.g. the old and new status of an event, or the rejection reason), a "N fields" link appears in the **Details** column. Click it to expand and view the raw JSON. This is especially useful when investigating status changes, as the old and new values are recorded.

---

## Exporting

An export option is available from the audit log page. Click the export control (located near the filters or in the page actions area) to download the current filtered view as a CSV file. The export includes all matching entries — not just the current page.

---

**See also:** [Events](./events.md) | [Courses](./courses.md) | [Settings](./settings.md) | [API Keys](./api-keys.md)
