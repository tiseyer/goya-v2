---
title: "Support Tickets"
audience: ["moderator"]
section: "moderator"
order: 6
last_updated: "2026-03-31"
---

# Support Tickets

Support tickets are created when a member's conversation with Mattea (the GOYA chatbot) is escalated to a human. This guide explains how tickets reach you, what information is available, and how to handle them.

## Table of Contents

- [How Tickets Are Created](#how-tickets-are-created)
- [Finding Support Tickets](#finding-support-tickets)
- [Reading the Ticket List](#reading-the-ticket-list)
- [Viewing a Ticket](#viewing-a-ticket)
- [Replying to a Ticket](#replying-to-a-ticket)
- [Managing Ticket Status](#managing-ticket-status)
- [Ticket Statuses Explained](#ticket-statuses-explained)
- [Guest Tickets](#guest-tickets)

---

## How Tickets Are Created

When someone uses the Mattea chatbot and their issue cannot be resolved automatically, the conversation is escalated. This creates a support ticket in the system that links to the full conversation history.

Escalation can happen:
- When Mattea recognises it cannot answer the question
- When the user explicitly asks to speak to a person
- When the conversation reaches a point requiring human judgment

Once escalated, the ticket appears in your inbox with a status of **Open**.

---

## Finding Support Tickets

1. Go to **Inbox** in the sidebar (`/admin/inbox`).
2. Click the **Support Tickets** tab.
3. An amber badge on the tab shows the count of currently **Open** tickets.

The ticket list defaults to showing **All Tickets**. Use the status filter dropdown at the top to narrow down to **Open**, **In Progress**, or **Resolved**.

---

## Reading the Ticket List

Each row in the ticket table shows:

| Column | What it shows |
|---|---|
| **User** | Member's name and email — or "Guest #xxxxxxxx" for anonymous users |
| **Issue** | A short summary of what the conversation was about (truncated to 80 characters) |
| **Created** | Relative time since the ticket was created (e.g., "3h ago") |
| **Status** | Current status badge: Open, In Progress, or Resolved |
| **Actions** | **View** button to open the full ticket, plus a quick status-advance button |

The quick status button (e.g., **→ In Progress**) cycles the ticket to the next status without opening it. Use this for fast triage when you can tell from the summary alone that a ticket should be moved along.

---

## Viewing a Ticket

Click **View** on any ticket row to open the ticket viewer. This replaces the list with a detail panel showing:

- The full conversation between the user and Mattea, displayed as a chat timeline
- Messages are labelled **Mattea / Support** (assistant) or appear right-aligned (user)
- The timestamp of each message
- The ticket's current status with direct status controls
- A reply text area at the bottom

Click the **back arrow** (top left of the viewer) to return to the ticket list.

---

## Replying to a Ticket

When viewing a ticket that has an associated chat session, a reply box appears at the bottom of the panel.

1. Type your reply in the **Type your reply...** text area.
2. Click the send button (teal arrow icon) or press **Cmd+Enter** (Mac) / **Ctrl+Enter** (Windows) to send.
3. Your reply appears in the conversation as a **Mattea / Support** message.

If the ticket was created without an associated chat session (rare), the reply area will not appear and you will see a note: "This ticket has no associated chat session — replies are unavailable."

### Writing effective replies

- Address the user by context (their question is visible above)
- Be concise and direct
- If you are resolving their issue, include the answer or next steps clearly
- If you need more information, ask a specific question
- After sending a helpful reply, consider moving the ticket to **Resolved**

---

## Managing Ticket Status

You can change a ticket's status from either the list view or the detail view.

### From the list view

Click the quick-action button next to **View**. It shows the next status in the sequence:
- **→ In Progress** (if ticket is Open)
- **→ Resolved** (if ticket is In Progress)
- **→ Open** (if ticket is Resolved — use this to reopen if needed)

### From the ticket viewer

In the viewer header, three buttons appear: **Open**, **In Progress**, and **Resolved**. Click any of them to set the status directly, regardless of the current state. The active status button is highlighted.

---

## Ticket Statuses Explained

| Status | Badge | Meaning |
|---|---|---|
| **Open** | Amber | Newly escalated — not yet actioned by a moderator |
| **In Progress** | Blue | A moderator has looked at this and is handling it |
| **Resolved** | Green | The issue has been addressed and the ticket is closed |

Move a ticket to **In Progress** as soon as you start working on it so other moderators know it is claimed. Move it to **Resolved** once you have replied and the issue is addressed.

Resolved tickets remain visible under the **Resolved** filter for future reference but no longer count toward the open badge.

---

## Guest Tickets

Some tickets come from users who were not logged in when they used the chatbot. These appear in the list as **Guest #xxxxxxxx** where the hash is the first 8 characters of an anonymous session identifier.

Guest tickets have no email address — you cannot contact them directly. You can still read the conversation and update the status for your own tracking, but the reply will not reach anyone if the guest has left.

If a guest ticket contains a valid question about the platform (even without an identifiable user), it is still worth resolving — it helps track recurring issues Mattea cannot handle.

---

## See Also

- [Inbox Guide](./inbox-guide.md) — Overview of all inbox tabs and prioritisation
- [Moderator Overview](./overview.md) — Role capabilities and admin panel navigation
