---
title: Inbox
audience: ["admin"]
section: admin
order: 2
last_updated: "2026-03-31"
---

# Inbox

The Inbox is the primary action queue for the admin panel. It consolidates all items that require a review decision in one place. Navigate to **Inbox** in the sidebar or go to `/admin/inbox`.

Each tab that has pending items shows an amber badge with the count. The **Inbox** sidebar link itself shows a badge for pending school registrations.

## Table of Contents

- [Tabs at a Glance](#tabs-at-a-glance)
- [Credits & Hours Tab](#credits--hours-tab)
- [Verifications Tab](#verifications-tab)
- [Support Tickets Tab](#support-tickets-tab)
- [Teacher Upgrades Tab](#teacher-upgrades-tab)
- [School Registrations Tab](#school-registrations-tab)
- [Events Tab](#events-tab)
- [Courses Tab](#courses-tab)

## Tabs at a Glance

| Tab | What it shows | Badge counts |
|---|---|---|
| **Credits & Hours** | Member credit/hour submissions | Pending entries |
| **Verifications** | Pending teacher and wellness practitioner verifications | Pending users |
| **Support Tickets** | Chatbot-originated support tickets | Open tickets |
| **Teacher Upgrades** | Requests to upgrade a member to the Teacher role | Pending requests |
| **School Registrations** | Applications to register a new school | Pending schools |
| **Events** | Member-submitted events awaiting review | Pending review events |
| **Courses** | Member-submitted courses awaiting review | Pending review courses |

The default tab when arriving at `/admin/inbox` is **Credits & Hours**. Switch tabs by clicking the tab name or appending `?tab=<key>` to the URL (keys: `credits`, `verifications`, `tickets`, `upgrades`, `schools`, `events`, `courses`).

---

## Credits & Hours Tab

Shows all credit entries submitted by members across types: CE, Karma, Practice, Teaching, and Community.

Each row displays the submitting member, credit type, amount, activity date, description, and current status. The list is ordered newest first.

**Statuses:**
- **Pending** — awaiting admin review (amber badge)
- **Approved** — accepted and counting toward the member's totals
- **Rejected** — declined with an optional reason

To approve or reject an entry, use the action buttons on the row. Rejection opens an inline input for an optional reason.

For full credit configuration (requirements, member attention list), see [Credits](./credits.md).

---

## Verifications Tab

Shows members who have set their `verification_status` to `pending` — typically Yoga Teachers and Wellness Practitioners who have uploaded a certificate.

Each row shows:
- Avatar and name
- Email address
- Member type badge (**Yoga Teacher** or **Wellness Practitioner**)
- Registration date

**Actions available per row:**

| Button | What it does |
|---|---|
| **View Cert** | Opens the uploaded certificate in a new tab (only shown if a certificate URL exists) |
| **Reject** | Opens an optional reason input, then sends a rejection email and updates `verification_status` to `rejected` |
| **Approve** | Sets `is_verified: true`, `verification_status: verified`, and sends an approval email |

When the queue is empty, a green checkmark screen confirms "All caught up!"

---

## Support Tickets Tab

Shows support tickets generated through the GOYA chatbot. Only tickets with **open** status contribute to the badge count.

Each ticket shows the subject, status, and creation date. Click a ticket to expand the conversation thread and reply or change its status.

**Statuses:**
- **open** — active ticket requiring attention
- **closed** — resolved

---

## Teacher Upgrades Tab

Shows requests from members who have applied to become a Teacher. Submitters typically upload certificates as part of the upgrade flow.

Each row shows:
- Profile info (name, email, current role)
- Uploaded certificate URLs
- Associated Stripe payment or subscription ID (if applicable)
- Submission date and reviewed date
- Current status

**Statuses:** `pending`, `approved`, `rejected`

**Actions:**
- **Approve** — promotes the user to the Teacher role
- **Reject** — declines the request; an optional reason can be provided
- **Reset** — returns an approved or rejected request back to `pending`

---

## School Registrations Tab

Shows all school applications ordered by submission date (newest first).

The table columns are: **School**, **Owner**, **Designations**, **Location**, **Submitted**, **Status**, and **Actions**.

The **Designations** column shows purple pill badges for each designation type the school applied for (e.g. "RYS 200", "RCYS 50"). Schools with no designations show a dash.

**Statuses:**
| Status | Badge colour |
|---|---|
| **pending** | Amber |
| **In Review** (`pending_review`) | Yellow |
| **approved** | Green |
| **rejected** | Rose |
| **suspended** | Orange |

The badge count on the tab includes both `pending` and `pending_review` schools.

**Actions available:**

| Button | Condition | What it does |
|---|---|---|
| **View** | Always | Opens the admin school detail page at `/admin/schools/[id]` |
| **Approve** | Not already approved | Sets status to `approved`, records approver and timestamp, sends approval email to school owner |
| **Reject** | Not already rejected | Opens an inline reason field; sets status to `rejected`, saves reason, sends rejection email to school owner |
| **Reset** | Approved, rejected, or suspended | Returns the school to `pending` status (client-side only, no email) |

When rejecting, type a reason in the inline field and press **Confirm Reject** (or press Enter). Press **Cancel** to discard. An email is automatically sent to the school owner upon both approval and rejection.

---

## Events Tab

Shows member-submitted events that are in `pending_review`, `published`, or `rejected` status. GOYA-created events do not appear here.

The tab has three sub-tabs: **Pending**, **Approved**, and **Rejected**.

Each row shows the event title, the submitter's name and email, category, event date, and how long ago it was submitted.

**Approving an event:**
1. Click the row in the **Pending** sub-tab.
2. Click **Approve** — the status changes to `published` immediately.

**Rejecting an event:**
1. Click **Reject** on the row.
2. Type a rejection reason (minimum 10 characters — the button stays disabled until this is met).
3. Click **Confirm Reject**.

The rejection reason is stored and shown on the row in the **Rejected** sub-tab.

For managing all events (including GOYA events, soft-delete, audit history), see [Events](./events.md).

---

## Courses Tab

Follows the same pattern as the Events tab. Shows member-submitted courses in `pending_review`, `published`, or `rejected` status with three sub-tabs: **Pending**, **Approved**, **Rejected**.

Each row shows the course title, submitter, category, duration, and submission time.

**Approving a course:**
1. Click **Approve** on any row in the **Pending** sub-tab.

**Rejecting a course:**
1. Click **Reject**.
2. Enter a reason (minimum 10 characters).
3. Click **Confirm Reject**.

For managing all courses (including GOYA courses, soft-delete, audit history), see [Courses](./courses.md).

---

**See also:** [Events](./events.md) | [Courses](./courses.md) | [Credits](./credits.md) | [Verification](./verification.md)
