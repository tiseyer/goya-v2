---
milestone: v1.23
milestone_name: Mattea Intelligence System
created: 2026-04-04
last_updated: 2026-04-04
---

# Requirements — v1.23 Mattea Intelligence System

## v1.23 Requirements

### Schema & Infrastructure

- [ ] **INFRA-01**: DB migration adds `started_from`, `user_feedback`, `feedback_at` columns to conversations table
- [ ] **INFRA-02**: DB migration adds `ticket_type`, `rejection_reason` columns to support_tickets table
- [ ] **INFRA-03**: Fix existing bug where `chat-service.ts` writes to `question` instead of `question_summary` column
- [ ] **INFRA-04**: Extract shared `useChatStream` hook from the 3 duplicated stream loops (ChatPanel, InlineChat, MatteaSearchHint)
- [ ] **INFRA-05**: Server returns `message_id` in streaming `done` chunk so feedback can target actual DB rows

### Feedback

- [ ] **FEED-01**: User can give thumbs up/down on Mattea responses in floating chat widget
- [ ] **FEED-02**: User can give thumbs up/down on Mattea responses in search hint card
- [ ] **FEED-03**: User can give thumbs up/down on Mattea responses in help page chat
- [ ] **FEED-04**: Admin can see feedback status (thumbs up/down/none) in admin Conversations table

### Source Tracking

- [ ] **SRC-01**: Each conversation records where it started (chat_widget / search_hint / help_page)
- [ ] **SRC-02**: Admin can see "Started from" column in admin Conversations table

### Unanswered Question Pipeline

- [ ] **UNQ-01**: System detects when Mattea cannot answer confidently and auto-creates a support ticket
- [ ] **UNQ-02**: Admin can click "Mattea answers this" to stream an AI-generated FAQ answer
- [ ] **UNQ-03**: Admin can edit the streamed answer and click "Add to FAQ" to publish it
- [ ] **UNQ-04**: Admin can click "Mattea won't answer this" with a reason to reject the ticket
- [ ] **UNQ-05**: Admin can filter Support Tickets by source (User submitted / Chatbot escalated)

### Conversation History

- [ ] **HIST-01**: User can see a list of previous conversations on the Help page
- [ ] **HIST-02**: User can select and load a previous conversation into the chat area
- [ ] **HIST-03**: User can start a new conversation (reset to empty state)

## Future Requirements

None deferred.

## Out of Scope

| Feature | Reason |
|---------|--------|
| Per-message feedback | Per-conversation is sufficient granularity; per-message adds schema complexity |
| Free-text feedback comments | Low signal value at current scale |
| Auto-publish FAQ answers | Admin must review before publishing |
| Real-time analytics dashboard | Not needed for v1.23; admin table columns are sufficient |

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| INFRA-01 | — | Pending |
| INFRA-02 | — | Pending |
| INFRA-03 | — | Pending |
| INFRA-04 | — | Pending |
| INFRA-05 | — | Pending |
| FEED-01 | — | Pending |
| FEED-02 | — | Pending |
| FEED-03 | — | Pending |
| FEED-04 | — | Pending |
| SRC-01 | — | Pending |
| SRC-02 | — | Pending |
| UNQ-01 | — | Pending |
| UNQ-02 | — | Pending |
| UNQ-03 | — | Pending |
| UNQ-04 | — | Pending |
| UNQ-05 | — | Pending |
| HIST-01 | — | Pending |
| HIST-02 | — | Pending |
| HIST-03 | — | Pending |
