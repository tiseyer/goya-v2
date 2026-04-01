---
title: Verification
audience: ["admin"]
section: admin
order: 15
last_updated: "2026-03-31"
---

# Verification

The Verification queue shows members who have applied for professional verification as a Yoga Teacher or Wellness Practitioner. Verified status grants a visual badge on their public profile and may unlock additional platform features.

The verification queue is accessible from two places:

- **Inbox** sidebar link, then click the **Verifications** tab — `/admin/inbox?tab=verifications`
- Directly at `/admin/verification` (standalone page)

Both views show the same data and use the same action controls.

## Table of Contents

- [Who Appears in the Queue](#who-appears-in-the-queue)
- [Reading the Queue](#reading-the-queue)
- [Reviewing Documents](#reviewing-documents)
- [Approving a Verification](#approving-a-verification)
- [Rejecting a Verification](#rejecting-a-verification)
- [After the Decision](#after-the-decision)

---

## Who Appears in the Queue

A member appears in the verification queue when their `verification_status` is set to `pending`. This happens when:

1. A member with the **Yoga Teacher** or **Wellness Practitioner** member type submits their application through the member-facing settings.
2. They upload a certificate or credential document as part of the submission.

Members are ordered by **oldest first** — so the longest-waiting applicants are always at the top.

---

## Reading the Queue

Each row in the queue shows:

| Element | Description |
|---|---|
| **Avatar** | Profile photo, or initials if no photo is set |
| **Name** | Full name as entered in their profile |
| **Email** | Registered email address |
| **Member type badge** | **Yoga Teacher** or **Wellness Practitioner** (blue badge) |
| **Registration date** | The date the user registered (shown on larger screens) |
| **Action buttons** | View Cert, Reject, Approve |

---

## Reviewing Documents

If the applicant uploaded a certificate, a **View Cert** button appears in their row. Click it to open the document in a new browser tab. Review the credential before making a decision.

If no certificate URL is stored, the **View Cert** button is not shown. In this case, you may want to contact the member directly to request supporting documents before approving.

---

## Approving a Verification

1. Review the applicant's certificate if available.
2. Click **Approve** on their row.
3. The following changes happen automatically:
   - `is_verified` is set to `true`
   - `verification_status` is set to `verified`
   - An approval email is sent to the member

The member is immediately removed from the pending queue. They will see their verified badge on their next page load.

---

## Rejecting a Verification

1. Click **Reject** on the applicant's row. A text input appears below the action buttons.
2. Optionally type a reason for rejection (the reason field is not required, but it is good practice to explain the decision).
3. Click **Confirm** to submit the rejection.

The following changes happen automatically:
- `verification_status` is set to `rejected`
- A rejection email is sent to the member, including the reason if one was provided

The member is removed from the pending queue. They can resubmit an application after correcting whatever issue caused the rejection.

To cancel without rejecting, click away from the input or close it — no changes are made until you click **Confirm**.

---

## After the Decision

Both approval and rejection trigger an automatic email notification to the member. The email templates for verification approval and rejection can be customised in **Settings > Email Templates** — see [Settings](./settings.md#email-templates).

All decisions are recorded in the [Audit Log](./audit-log.md) under the `admin` category, so you can review who approved or rejected any verification and when.

---

**See also:** [Inbox — Verifications Tab](./inbox.md#verifications-tab) | [Users](./users.md) | [Settings](./settings.md) | [Audit Log](./audit-log.md)
