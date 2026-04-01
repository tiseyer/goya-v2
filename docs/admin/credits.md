---
title: Credits and Hours
audience: ["admin"]
section: admin
order: 14
last_updated: "2026-03-31"
---

# Credits and Hours

The Credits page lets you configure the credit requirements members must meet to maintain their membership status, monitor members who need attention, and see an overview of all credit activity. Navigate to **Settings > Credits** or go to `/admin/credits`.

For reviewing individual credit submissions, use the [Inbox — Credits & Hours tab](./inbox.md#credits--hours-tab).

## Table of Contents

- [Credit Types](#credit-types)
- [Membership Requirements](#membership-requirements)
- [Credit Entry Statistics](#credit-entry-statistics)
- [Members Needing Attention](#members-needing-attention)

---

## Credit Types

GOYA tracks five types of credits:

| Type | Label | Applies to |
|---|---|---|
| `ce` | CE | Continuing education units |
| `karma` | Karma | Community contribution hours |
| `practice` | Practice | Personal yoga practice hours |
| `teaching` | Teaching | Hours spent teaching classes |
| `community` | Community | Community engagement activities |

Requirements can be set independently for each type. Setting a required amount to **0** disables that requirement entirely.

---

## Membership Requirements

The **Membership Requirements** section displays one row per credit type. Each row shows:

- The credit type name
- Current required amount within the configured period
- The time window (e.g. per year, per 6 months)

Click the edit icon (or the row itself if inline editing is enabled) to update the required amount or time window for that credit type. Requirements apply to **Teachers** and **Wellness Practitioners** — other member types do not have credit requirements.

A note at the bottom of the section confirms: "Set Required Amount to 0 to disable the requirement for a particular credit type."

---

## Credit Entry Statistics

The **Credit Entry Statistics** section provides a quick health check of all credit submissions across the platform:

| Metric | Description |
|---|---|
| **Total Entries** | All credit entries ever submitted, regardless of status |
| **Pending Review** | Entries awaiting admin approval (amber) |
| **Approved** | Accepted entries; also shows the approval rate as a percentage |

These counts update in real time as entries are submitted and reviewed.

---

## Members Needing Attention

The **Members Needing Attention** section surfaces members who are not meeting their credit requirements or have credits expiring soon. Up to the first 50 members with applicable member types are checked automatically when the page loads.

Members are sorted with **red** (needs attention) first, then **yellow** (expiring soon).

### Status meanings

| Status | Badge colour | Meaning |
|---|---|---|
| **On Track** | Emerald | Member meets all current requirements |
| **Expiring Soon** | Amber | Credits will expire before the next period ends |
| **Needs Attention** | Rose | Member is below the required threshold right now |
| **No Requirements** | Slate | Member type has no credit requirements |

### Columns

| Column | Description |
|---|---|
| **User** | Avatar, name, and email |
| **Credit Issues** | Each problematic credit type shown as a badge with current/required counts (e.g. "CE: 2/10") |
| **Overall Status** | The member's combined status badge |
| **Actions** | **View** link to the user's admin detail page |

If all checked members are on track, a green checkmark message reads "All members are on track with their credit requirements."

---

**See also:** [Inbox — Credits & Hours Tab](./inbox.md#credits--hours-tab) | [Users](./users.md) | [Audit Log](./audit-log.md)
