---
title: "Event Review"
audience: ["moderator"]
section: "moderator"
order: 3
last_updated: "2026-03-31"
---

# Event Review

Members can submit their own yoga and wellness events to be listed on the GOYA platform. Before these go live they need moderator approval. This guide covers the full review workflow.

## Table of Contents

- [Where Member Events Come From](#where-member-events-come-from)
- [Finding Events to Review](#finding-events-to-review)
- [Reading an Event Submission](#reading-an-event-submission)
- [Approving an Event](#approving-an-event)
- [Rejecting an Event](#rejecting-an-event)
- [Understanding Event Statuses](#understanding-event-statuses)
- [Reviewing Already-Processed Events](#reviewing-already-processed-events)

---

## Where Member Events Come From

When a member submits an event through their account, it is created with a `pending_review` status and tagged as a `member` event. Only member-submitted events appear in the inbox — events created directly by admins are published immediately without review.

---

## Finding Events to Review

1. Go to **Inbox** in the sidebar (`/admin/inbox`).
2. Click the **Events** tab.
3. The tab defaults to the **Pending** sub-tab, which shows all events awaiting review. An amber badge on the tab shows the total pending count.

Events are sorted with the oldest pending submissions first, so work through the list top to bottom to clear the queue fairly.

---

## Reading an Event Submission

The events list is a table with the following columns:

| Column | What it shows |
|---|---|
| **Event Title** | The event name and its current status badge |
| **Submitted By** | Member name and email |
| **Category** | Event category (e.g., Workshop, Retreat, Class) |
| **Date** | The date the event is scheduled for |
| **Submitted** | How long ago the submission was made (e.g., "2d ago") |
| **Actions** | Approve / Reject buttons (pending only) |

### What to check before approving

- The title and category are appropriate and relevant to yoga or wellness
- The event date is in the future (or a reasonable near-past for multi-day events)
- The submitter's email looks legitimate (not a test or spam account)
- The content is not promotional spam or unrelated to the GOYA community

If you are unsure whether an event fits the platform, err on the side of rejection with a clear explanation — the member can edit and resubmit.

---

## Approving an Event

1. Find the event in the **Pending** sub-tab.
2. Click **Approve** in the Actions column.
3. The button shows `...` briefly while saving.
4. The event's status badge updates to **Published** and the row moves to the **Approved** sub-tab on the next view.

Approved events are immediately visible on the public GOYA events listing.

---

## Rejecting an Event

Rejection requires a reason of at least 10 characters. The system enforces this minimum — the **Confirm Reject** button stays disabled until you have typed enough.

1. Find the event in the **Pending** sub-tab.
2. Click **Reject** in the Actions column.
3. A text area expands below the row. Type your rejection reason (minimum 10 characters). The interface shows a character countdown if you have not yet met the minimum.
4. Click **Confirm Reject** (or press **Escape** to cancel without rejecting).
5. The event moves to the **Rejected** sub-tab and the rejection reason is stored against it.

> Note: Unlike some other inbox tabs, event rejection reasons are required to be meaningful — the 10-character minimum prevents accidentally submitting a blank or trivially short reason.

### Does the member get notified?

The current system records the rejection and stores the reason on the event record. The rejection reason is visible to moderators in the **Rejected** sub-tab when reviewing past decisions.

---

## Understanding Event Statuses

| Status | Badge colour | Meaning |
|---|---|---|
| `pending_review` | Amber / **Pending** | Submitted by member, awaiting moderator review |
| `published` | Green / **Published** | Approved — live on the platform |
| `rejected` | Red / **Rejected** | Rejected — not visible publicly |

---

## Reviewing Already-Processed Events

You can switch between the **Pending**, **Approved**, and **Rejected** sub-tabs at the top of the Events panel to review past decisions.

- **Approved** shows all events you or other moderators have published.
- **Rejected** shows all rejected events along with the stored rejection reason (shown as a truncated tooltip on the row — hover to read the full text).

There is no way to un-reject or un-approve an event directly from this panel. If a rejected event needs to be reinstated, contact an admin.

---

## See Also

- [Inbox Guide](./inbox-guide.md) — Overview of all inbox tabs
- [Course Review](./course-review.md) — The same workflow applied to course submissions
- [Moderator Overview](./overview.md) — What moderators can and cannot do
