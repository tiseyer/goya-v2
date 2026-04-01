---
title: "Verification Guide"
audience: ["moderator"]
section: "moderator"
order: 2
last_updated: "2026-03-31"
---

# Verification Guide

Member verification is one of the most important moderation tasks. A verified badge signals to the GOYA community that a member's credentials have been reviewed. This guide walks you through the full process.

## Table of Contents

- [What is Member Verification?](#what-is-member-verification)
- [Finding Pending Verifications](#finding-pending-verifications)
- [Reading a Verification Request](#reading-a-verification-request)
- [Approving a Verification](#approving-a-verification)
- [Rejecting a Verification](#rejecting-a-verification)
- [What Happens After You Decide](#what-happens-after-you-decide)
- [Common Rejection Reasons](#common-rejection-reasons)

---

## What is Member Verification?

When a Yoga Teacher or Wellness Practitioner joins GOYA, they can request verification of their professional status. They upload a certificate or supporting document as part of their profile. Once submitted, their account enters a `pending` verification status and appears in your queue.

Verified members receive the `is_verified` flag on their profile, which may unlock additional features and signals trust to other members.

---

## Finding Pending Verifications

1. Go to **Inbox** in the sidebar (`/admin/inbox`).
2. Click the **Verifications** tab.
3. If there are pending requests, you will see a list of members. If the queue is clear, you will see an "All caught up!" message.

The tab itself shows an amber badge count whenever there are pending verifications waiting.

---

## Reading a Verification Request

Each row in the verification list shows:

| Field | What it tells you |
|---|---|
| **Avatar / Initials** | Member's profile photo or first initial |
| **Full name** | The member's display name |
| **Email** | Their registered email address |
| **Member type badge** | Either "Yoga Teacher" or "Wellness Practitioner" |
| **Submission date** | When they joined / submitted for verification |

If the member uploaded a certificate, a **View Cert** button appears in the actions area on the right.

### Checking the certificate

Click **View Cert** to open the uploaded document in a new browser tab. This is typically a teaching certificate, yoga alliance registration, or equivalent professional credential.

Look for:
- The member's name matching their GOYA profile name
- A recognisable issuing organisation (yoga school, professional body, government body)
- A valid or plausible issue date (not expired by many years)
- Legible and unaltered document content

If no certificate was uploaded, the **View Cert** button will not appear. Use your judgment — some members may have been verified via another channel. If you are unsure, reject with a reason asking them to upload a certificate.

---

## Approving a Verification

Once you are satisfied the document checks out:

1. Click **Approve** on the member's row.
2. The button briefly shows a loading state (`…`) while the update saves.
3. The member's row disappears from the **Verifications** tab — they are now verified.

That is all. No confirmation dialog appears — the action is immediate.

---

## Rejecting a Verification

If the document is missing, unreadable, does not match the member's name, or is otherwise insufficient:

1. Click **Reject** on the member's row. A small text input expands below the action buttons.
2. Type a rejection reason in the **Reason (optional)** field. While optional in the system, providing a reason is strongly recommended — it helps the member understand what to fix and resubmit.
3. Click **Confirm** to finalise the rejection.

You can press **Escape** or click anywhere outside to cancel without rejecting.

---

## What Happens After You Decide

| Decision | Profile update | Email sent? |
|---|---|---|
| **Approve** | `verification_status` set to `verified`, `is_verified` set to `true` | Yes — verification approved email |
| **Reject** | `verification_status` set to `rejected` | Yes — verification rejected email (includes your reason if provided) |

Both approval and rejection trigger an automated email to the member. The approved email uses their teacher status designation (e.g., "RYT 200"). The rejected email includes your reason text if you provided one, so write it in plain, helpful language — imagine you are writing directly to the member.

After your decision the page refreshes automatically and the member no longer appears in the pending list.

---

## Common Rejection Reasons

Here are some example rejection reason texts you can adapt:

- `Certificate image is too blurry to read — please re-upload a clearer photo.`
- `The name on the certificate does not match your GOYA profile name. Please upload a document that shows your full name, or update your profile name to match.`
- `No certificate was uploaded. Please add your yoga teaching certificate to your profile and resubmit.`
- `This document appears to be expired. Please upload a current or renewed certificate.`

Keep reasons constructive and specific so the member knows exactly what to do next.

---

## See Also

- [Inbox Guide](./inbox-guide.md) — Overview of all inbox tabs
- [Moderator Overview](./overview.md) — What moderators can and cannot do
