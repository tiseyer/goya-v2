---
workstream: ai-super-helper
milestone: v1.23
milestone_name: Mattea Intelligence System
created: 2026-04-03
last_updated: 2026-04-03
---

# Roadmap: Mattea Intelligence System

## Overview

Five phases transform Mattea from a stateless chatbot into an intelligence layer with feedback loops, source tracking, unanswered-question escalation, and conversation history. Phase 1 lays the schema and shared-hook foundation that all other phases depend on. Phases 2-5 then deliver four coherent, independently verifiable capabilities on top of that foundation.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Schema & Infrastructure** - DB migrations, bug fixes, and shared hook extraction that unblock all feature phases
- [ ] **Phase 2: Source Tracking** - Record and surface which Mattea surface started each conversation
- [ ] **Phase 3: Feedback** - Thumbs up/down on all three Mattea surfaces with admin visibility
- [ ] **Phase 4: Unanswered Question Pipeline** - Auto-detect failures, escalate to tickets, admin resolves via FAQ or rejection
- [ ] **Phase 5: Conversation History** - Users load previous Help page conversations; new conversation reset

## Phase Details

### Phase 1: Schema & Infrastructure
**Goal**: The database schema is correct and complete, the existing column-name bug is fixed, and all three Mattea surfaces share one streaming hook
**Depends on**: Nothing (first phase)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. Running `npx supabase db push` applies migrations that add `started_from`, `user_feedback`, `feedback_at` to the conversations table and `ticket_type`, `rejection_reason` to the support_tickets table without errors
  2. A new support ticket created via chat escalation has a non-null `question_summary` value (the existing `question` column bug is gone)
  3. All three chat surfaces (ChatPanel, InlineChat, MatteaSearchHint) call the same `useChatStream` hook; no duplicated fetch/NDJSON-parse loop exists in any surface component
  4. The streaming `done` event payload includes a `message_id` field containing the server-assigned DB row ID of the persisted assistant message
**Plans:** 2 plans
Plans:
- [ ] 01-01-PLAN.md — Migration + bug fix + getOrCreateSession update (INFRA-01, INFRA-02, INFRA-03)
- [ ] 01-02-PLAN.md — useChatStream hook extraction + message_id wiring (INFRA-04, INFRA-05)

### Phase 2: Source Tracking
**Goal**: Every conversation records which Mattea surface created it, and admins can see that source in the Conversations table
**Depends on**: Phase 1
**Requirements**: SRC-01, SRC-02
**Success Criteria** (what must be TRUE):
  1. Opening the chat widget and sending a message results in a conversation row where `started_from = 'chat_widget'`
  2. Using the search hint (Cmd+K) and sending a message results in a conversation row where `started_from = 'search_hint'`
  3. Chatting on the Help page results in a conversation row where `started_from = 'help_page'`
  4. The admin Conversations table shows a "Started from" column with the correct surface label for each row
**Plans:** 1 plan
Plans:
- [ ] 02-01-PLAN.md — Wire started_from at all surfaces + admin column (SRC-01, SRC-02)

### Phase 3: Feedback
**Goal**: Users can rate any Mattea response with thumbs up or down on all three surfaces, and admins can see the rating in the Conversations table
**Depends on**: Phase 1
**Requirements**: FEED-01, FEED-02, FEED-03, FEED-04
**Success Criteria** (what must be TRUE):
  1. After Mattea finishes streaming a response in the chat widget, thumbs up and thumbs down buttons appear; clicking one persists the rating to the database and the selected button shows as active
  2. The same thumbs buttons appear and work identically in the search hint card and on the Help page chat
  3. Thumbs buttons are not clickable while a response is still streaming
  4. The admin Conversations table shows the feedback status (thumbs up / thumbs down / none) for each conversation
**Plans**: TBD
**UI hint**: yes

### Phase 4: Unanswered Question Pipeline
**Goal**: When Mattea cannot answer confidently it automatically creates a support ticket; admins can publish the question as FAQ or reject it with a reason; admins can filter tickets by source
**Depends on**: Phase 1, Phase 2
**Requirements**: UNQ-01, UNQ-02, UNQ-03, UNQ-04, UNQ-05
**Success Criteria** (what must be TRUE):
  1. Sending a question Mattea cannot answer (triggering a phrase like "I don't know" or "I'm not sure") automatically creates a support ticket visible in the admin inbox with `ticket_type = 'unanswered_question'`
  2. An admin clicking "Mattea answers this" on an unanswered-question ticket sees an AI-generated answer stream into an editable field
  3. An admin clicking "Add to FAQ" after reviewing the streamed answer publishes a new FAQ entry; if an identical question already exists in the FAQ, the admin sees a warning before proceeding
  4. An admin clicking "Mattea won't answer this" with a rejection reason marks the ticket resolved without creating a FAQ entry
  5. The admin Support Tickets view has a source filter that separates "User submitted" tickets from "Chatbot escalated" tickets
**Plans**: TBD
**UI hint**: yes

### Phase 5: Conversation History
**Goal**: Users on the Help page can see and reload their previous conversations, and start fresh when needed
**Depends on**: Phase 2
**Requirements**: HIST-01, HIST-02, HIST-03
**Success Criteria** (what must be TRUE):
  1. A logged-in user on the Help page sees a list of their previous help-page conversations (not widget or search conversations) ordered by most recent
  2. Clicking a previous conversation loads its full message transcript into the chat area
  3. A "New conversation" button resets the chat area to the empty starting state without deleting the history list
**Plans**: TBD
**UI hint**: yes

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Schema & Infrastructure | 0/2 | Planning complete | - |
| 2. Source Tracking | 0/1 | Planning complete | - |
| 3. Feedback | 0/TBD | Not started | - |
| 4. Unanswered Question Pipeline | 0/TBD | Not started | - |
| 5. Conversation History | 0/TBD | Not started | - |
