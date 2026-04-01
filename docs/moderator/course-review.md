---
title: "Course Review"
audience: ["moderator"]
section: "moderator"
order: 4
last_updated: "2026-03-31"
---

# Course Review

Members can submit yoga and wellness courses to be listed in the GOYA course catalogue. Like events, these require moderator approval before going live. The workflow is nearly identical to event review with a few differences in what fields you will see.

## Table of Contents

- [Where Member Courses Come From](#where-member-courses-come-from)
- [Finding Courses to Review](#finding-courses-to-review)
- [Reading a Course Submission](#reading-a-course-submission)
- [Approving a Course](#approving-a-course)
- [Rejecting a Course](#rejecting-a-course)
- [Understanding Course Statuses](#understanding-course-statuses)
- [Reviewing Already-Processed Courses](#reviewing-already-processed-courses)

---

## Where Member Courses Come From

When a member submits a course through their settings, it is created with a `pending_review` status and tagged as a `member` course. Only member-submitted courses appear in the inbox — platform-level courses added by admins bypass this review.

---

## Finding Courses to Review

1. Go to **Inbox** in the sidebar (`/admin/inbox`).
2. Click the **Courses** tab.
3. The tab defaults to the **Pending** sub-tab. An amber badge shows how many courses are awaiting review.

Courses are sorted with the oldest pending submissions first.

---

## Reading a Course Submission

The courses list is a table with the following columns:

| Column | What it shows |
|---|---|
| **Course Title** | The course name and its current status badge |
| **Submitted By** | Member name and email |
| **Category** | Course category (e.g., Hatha Yoga, Meditation, Breathwork) |
| **Duration** | Duration of the course if provided (may show `—` if not set) |
| **Submitted** | How long ago the submission was made (e.g., "3h ago") |
| **Actions** | Approve / Reject buttons (pending only) |

### What to check before approving

- The title and category are appropriate and relevant to yoga or wellness
- The course is something a GOYA member would plausibly teach or run
- The submitter's profile looks legitimate (not spam or test data)
- The content is not duplicate spam or completely unrelated to the GOYA community

Courses do not have a public date the way events do, so focus on the title and category relevance. If you see a missing duration, that alone is not a reason to reject — it is an optional field.

---

## Approving a Course

1. Find the course in the **Pending** sub-tab.
2. Click **Approve** in the Actions column.
3. The button shows `...` briefly while saving.
4. The course's status badge updates to **Published** and it moves to the **Approved** sub-tab.

Approved courses are immediately visible in the GOYA course catalogue.

---

## Rejecting a Course

Rejection requires a reason of at least 10 characters — the **Confirm Reject** button stays disabled until you meet this minimum. The interface shows a live character countdown if you have not typed enough yet.

1. Find the course in the **Pending** sub-tab.
2. Click **Reject** in the Actions column.
3. A text area expands below the row. Type your rejection reason.
4. Click **Confirm Reject** to submit, or press **Escape** to cancel.
5. The course moves to the **Rejected** sub-tab.

### Writing a good rejection reason

Be specific about what the member needs to change. Examples:

- `This course category does not match the content described — please recategorise under Meditation or Breathwork.`
- `Course title is too vague. Please provide a descriptive title that clearly explains what the course covers.`
- `This appears to be a duplicate submission. Please check your existing courses before resubmitting.`
- `Course content does not appear to be yoga or wellness-related. GOYA courses must be relevant to the community.`

Helpful feedback makes it easier for members to correct and resubmit, reducing the chance you see the same item again.

---

## Understanding Course Statuses

| Status | Badge colour | Meaning |
|---|---|---|
| `pending_review` | Amber / **Pending** | Submitted by member, awaiting moderator review |
| `published` | Green / **Published** | Approved — live in the course catalogue |
| `rejected` | Red / **Rejected** | Rejected — not visible publicly |

---

## Reviewing Already-Processed Courses

Switch between the **Pending**, **Approved**, and **Rejected** sub-tabs to view past decisions.

- **Approved** shows all published member courses.
- **Rejected** shows all rejected courses with their stored rejection reason. The reason appears truncated in the row — hover over it to see the full text.

If a previously rejected course needs to be reinstated (e.g., the member fixed the issue and an admin wants to re-approve), that action must be handled by an admin directly in the database or via the course management pages.

---

## See Also

- [Inbox Guide](./inbox-guide.md) — Overview of all inbox tabs
- [Event Review](./event-review.md) — The same workflow applied to event submissions
- [Moderator Overview](./overview.md) — What moderators can and cannot do
