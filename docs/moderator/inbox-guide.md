---
title: "Inbox Guide"
audience: ["moderator"]
section: "moderator"
order: 5
last_updated: "2026-03-31"
---

# Inbox Guide

The Inbox is the central moderation workspace. Every item that needs a human decision — from a teacher's certificate to a support ticket — flows through here. This guide gives you a practical overview of all seven tabs and what you can do in each.

## Table of Contents

- [Navigating the Inbox](#navigating-the-inbox)
- [Tab Reference](#tab-reference)
  - [Credits & Hours](#credits--hours)
  - [Verifications](#verifications)
  - [Support Tickets](#support-tickets)
  - [Teacher Upgrades](#teacher-upgrades)
  - [School Registrations](#school-registrations)
  - [Events](#events)
  - [Courses](#courses)
- [Prioritising Your Queue](#prioritising-your-queue)

---

## Navigating the Inbox

Go to **Inbox** in the left sidebar (`/admin/inbox`). You will see a row of tabs across the top of the page. Each tab with pending work shows an amber number badge.

Clicking a tab updates the URL (`?tab=verifications`, `?tab=events`, etc.), so you can bookmark or share links directly to a specific tab.

---

## Tab Reference

### Credits & Hours

**URL:** `/admin/inbox?tab=credits`

Members submit credit entries for teaching hours, professional development, and other activities. These appear here for review.

**What you can do:**
- View submitted credit entries with the member's name, email, credit type, amount, and date
- **Approve** entries that look accurate and legitimate
- **Reject** entries that are duplicates, incorrect, or ineligible, with an optional reason

Credits support sub-tabs for **Pending**, **Approved**, and **Rejected** entries.

---

### Verifications

**URL:** `/admin/inbox?tab=verifications`

Yoga Teachers and Wellness Practitioners who have uploaded their credentials appear here pending review.

**What you can do:**
- See the member's name, email, member type, and submission date
- Click **View Cert** to open their uploaded certificate in a new tab
- Click **Approve** to grant verified status — this sets `is_verified: true` and sends the member an approval email
- Click **Reject** to decline — an optional reason is stored and included in the rejection email to the member

This tab does not have sub-tabs. Once a member is approved or rejected they leave the queue and the page refreshes.

For a detailed step-by-step guide, see [Verification Guide](./verification-guide.md).

---

### Support Tickets

**URL:** `/admin/inbox?tab=tickets`

When a member escalates a conversation with the Mattea chatbot, it creates a support ticket that appears here.

**What you can do:**
- Filter tickets by status: **All Tickets**, **Open**, **In Progress**, or **Resolved**
- Click **View** on a ticket to open the full conversation history (including Mattea's replies) and a reply box
- Cycle a ticket's status using the **→ In Progress** / **→ Resolved** quick-action buttons
- Set status directly from inside the ticket viewer using the **Open / In Progress / Resolved** buttons
- Type a reply in the ticket viewer and send it — your reply appears in the conversation as a "Mattea / Support" message

Tickets have three statuses: **Open** (amber), **In Progress** (blue), **Resolved** (green).

For full details, see [Support Tickets](./support-tickets.md).

---

### Teacher Upgrades

**URL:** `/admin/inbox?tab=upgrades`

Members can apply to upgrade their role to Teacher. This involves a payment and uploading one or more certificates. Upgrade requests appear here.

**What you can do:**
- Review the member's current role, email, submitted certificates (click links to open each one), and Stripe payment reference
- Click **Approve** to approve the upgrade
- Click **Reject** to open an inline text field — type an optional rejection reason and click **Confirm Reject**

Teacher Upgrades has sub-tabs for **Pending**, **Approved**, and **Rejected** requests.

The payment reference shown is the Stripe Payment Intent ID. You do not need to verify this in Stripe — it is displayed for reference if a dispute arises.

---

### School Registrations

**URL:** `/admin/inbox?tab=schools`

When a member registers a yoga school on GOYA, it enters a pending state and appears here.

**What you can do:**
- View the school name, owner name (links to their user profile in the admin users panel), location, submission date, and current status
- Click **View** to open the school's settings page
- Click **Approve** to approve the school
- Click **Reject** to open an inline text field — type an optional reason and click **Confirm Reject**
- Click **Reset** on an already-approved, rejected, or suspended school to move it back to pending status

School statuses: **Pending** (amber), **Approved** (green), **Rejected** (red), **Suspended** (orange).

---

### Events

**URL:** `/admin/inbox?tab=events`

Member-submitted events appear here for review before they are listed publicly.

**What you can do:**
- Review the event title, submitter, category, scheduled date, and submission time
- Click **Approve** to publish the event immediately
- Click **Reject** to expand a text area — type a reason (minimum 10 characters required) and click **Confirm Reject**

Events has sub-tabs for **Pending**, **Approved**, and **Rejected**. Rejected events show the stored reason in the row.

For full details, see [Event Review](./event-review.md).

---

### Courses

**URL:** `/admin/inbox?tab=courses`

Member-submitted courses appear here for review before they are listed in the course catalogue.

**What you can do:**
- Review the course title, submitter, category, duration, and submission time
- Click **Approve** to publish the course immediately
- Click **Reject** to expand a text area — type a reason (minimum 10 characters required) and click **Confirm Reject**

Courses has sub-tabs for **Pending**, **Approved**, and **Rejected**. Rejected courses show the stored reason in the row.

For full details, see [Course Review](./course-review.md).

---

## Prioritising Your Queue

When you open the inbox and see multiple tabs with badges, use this rough priority order:

1. **Verifications** — Members are waiting for status that may affect what they can access on the platform
2. **Support Tickets** — Open tickets represent people who needed help beyond what Mattea could provide
3. **Events** — Time-sensitive because events have dates; a rejected event that could have been approved may miss its window
4. **Teacher Upgrades** — Members have paid; resolve these promptly
5. **School Registrations** — Schools in pending state cannot operate fully
6. **Courses** — Less time-sensitive than events
7. **Credits & Hours** — Usually the lowest urgency; process in batches

---

## See Also

- [Moderator Overview](./overview.md) — Role capabilities and admin panel navigation
- [Verification Guide](./verification-guide.md) — Detailed verification workflow
- [Event Review](./event-review.md) — Detailed event review workflow
- [Course Review](./course-review.md) — Detailed course review workflow
- [Support Tickets](./support-tickets.md) — How to handle escalated support conversations
