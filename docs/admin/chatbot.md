---
title: Chatbot
audience: ["admin"]
section: admin
order: 11
last_updated: "2026-04-04"
---

# Chatbot

The Chatbot settings page lets you configure the AI-powered support chatbot (named Mattea by default), manage its FAQ knowledge base, review conversations, and control which data sources it can search. Navigate to **Settings > Chatbot** or go to `/admin/chatbot`.

The page has four tabs: **Configuration**, **FAQ**, **Conversations**, and **API Connections**.

## Table of Contents

- [Configuration Tab](#configuration-tab)
- [FAQ Tab](#faq-tab)
- [Conversations Tab](#conversations-tab)
- [API Connections Tab](#api-connections-tab)

---

## Configuration Tab

The Configuration tab controls the chatbot's identity and AI settings.

### Identity section

| Field | Description |
|---|---|
| **Chatbot Name** | The name displayed to users in the chat widget (e.g. "Mattea") |
| **Profile Image** | Upload a JPG, PNG, or WebP avatar (recommended 200×200px, max 2 MB). A preview appears before saving. |
| **Active / Inactive toggle** | When **Active**, the chat widget is visible on the public site. When **Inactive**, the widget is hidden. |

### AI Configuration section

| Field | Description |
|---|---|
| **AI Provider Key** | Select which API key the chatbot uses to power its responses. Keys are managed in [API Keys](./api-keys.md) (Third Party Keys tab). If no keys are configured, the selector shows a message directing you there. |
| **System Prompt** | The instruction set sent to the AI model at the start of every conversation. This defines the chatbot's personality, tone, scope, and any restrictions. |

### Guest Settings section

| Field | Description |
|---|---|
| **Guest Session Retention (days)** | How many days to keep chat sessions from non-logged-in visitors before they are automatically deleted. Accepts 1–365. |

### Saving

Click **Save Configuration** to save all Identity, AI Configuration, and Guest Settings changes in one action. Validation ensures the name and system prompt are not empty, and that the retention period is within bounds. A success or error toast appears at the bottom-right of the screen.

---

## FAQ Tab

The FAQ tab is where you manage the chatbot's knowledge base. Published FAQ items are automatically searched when a user asks the chatbot a question.

### FAQ list

Each item shows the question, answer (truncated), publish status, and action buttons.

**Statuses:**
| Status | Meaning |
|---|---|
| **Published** | Active in the chatbot's knowledge base |
| **Draft** | Saved but not yet surfaced to the chatbot |

### Creating an FAQ item

Click **Add FAQ** to open the FAQ modal. Fill in:

- **Question** — the phrasing users might ask
- **Answer** — the chatbot's response
- **Status** — set to Draft or Published immediately

Click **Save** in the modal. The item appears in the list.

### Editing an FAQ item

Click the **Edit** button on any row to reopen the modal with the existing content pre-filled. Make changes and save.

### Deleting an FAQ item

Click **Delete** on any row. You will be asked to confirm before the item is removed permanently.

---

## Conversations Tab

The Conversations tab shows a log of all chatbot conversations from both logged-in members and guest visitors.

The table columns are: **User**, **Started**, **Last Message**, **Messages**, **Escalated**, **Source**, **Feedback**, and **Actions**.

**Filters available:**
- All conversations / Logged-in Users / Guests / Escalated (dropdown)
- Search by name or guest ID

Click **View** on a conversation row to read the full message thread. This is useful for identifying gaps in the FAQ knowledge base — if users frequently ask questions the chatbot cannot answer well, add new FAQ items to address them.

### User Feedback (thumbs up / down)

Users can rate Mattea's responses using thumbs up or thumbs down buttons that appear on assistant messages. Feedback is available in:

- **Chat widget** and **Help Page** — buttons appear after each assistant message finishes streaming.
- **Search hint** (the AI answer card in the search bar) — buttons appear below the answer. Clicking a thumb creates the conversation session if one has not been started yet.

Feedback is per-conversation (not per-message). The **Feedback** column in the Conversations table shows:

| Badge | Meaning |
|---|---|
| Green **Helpful** | User clicked thumbs up |
| Red **Not helpful** | User clicked thumbs down |
| — | No feedback given |

Conversations with negative feedback are useful for identifying improvement areas in the system prompt or FAQ knowledge base.

---

## API Connections Tab

The API Connections tab controls which external data sources Mattea can search when answering questions. Toggling a tool on or off takes effect immediately (no save button required).

| Tool | Description | Lockable |
|---|---|---|
| **FAQ Knowledge Base** | Searches published FAQ items. Always active. | Always on — cannot be disabled |
| **Events Search** | Searches upcoming events and workshops from the GOYA calendar | Toggleable |
| **Teacher Directory** | Searches registered teacher profiles by name, specialty, or location | Toggleable |
| **Course Catalog** | Searches available academy courses and training programs | Toggleable |

Each tool shows a toggle switch. The **FAQ Knowledge Base** toggle is locked in the enabled state and labelled "Always enabled". All other tools can be freely enabled or disabled.

If a toggle fails to save (e.g. a network error), it reverts to its previous state and shows an error message.

---

**See also:** [API Keys](./api-keys.md) | [Settings](./settings.md) | [Inbox — Support Tickets](./inbox.md#support-tickets-tab)
