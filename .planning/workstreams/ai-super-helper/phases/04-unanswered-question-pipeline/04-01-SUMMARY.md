---
phase: 04-unanswered-question-pipeline
plan: 01
subsystem: chatbot / admin-inbox
tags: [unanswered-detection, support-tickets, admin-filter, chatbot]
completed: 2026-04-04T09:21:00Z

dependency_graph:
  requires: []
  provides: [unanswered-ticket-auto-creation, ticket-source-filter]
  affects: [lib/chatbot/chat-service.ts, app/admin/inbox/SupportTicketsTab.tsx, app/admin/inbox/actions.ts]

tech_stack:
  added: []
  patterns: [post-stream phrase detection, optional filter parameter chaining]

key_files:
  created: []
  modified:
    - lib/chatbot/chat-service.ts
    - app/admin/inbox/SupportTicketsTab.tsx
    - app/admin/inbox/actions.ts

decisions:
  - Unanswered detection runs after fullContent is assembled in both OpenAI and Anthropic branches, before the done chunk is enqueued — ensures the ticket captures the full response context
  - UNANSWERED_PHRASES uses lowercase matching via detectUnanswered() helper — no external NLP, consistent with existing escalation detection approach
  - ticketTypeFilter is a second optional parameter on listSupportTickets (not a combined object) — preserves backward compatibility with all existing callers

metrics:
  duration: ~8 minutes
  tasks_completed: 2
  files_modified: 3
---

# Phase 04 Plan 01: Unanswered Question Pipeline — Detection and Source Filter Summary

**One-liner:** Phrase-based unanswered detection in both AI provider branches auto-creates `unanswered_question` support tickets; admin Support Tickets tab gains source filter dropdown and Source column.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Detect unanswered responses and auto-create tickets | 084af0b | lib/chatbot/chat-service.ts |
| 2 | Add source filter to Support Tickets tab | ca900f8 | app/admin/inbox/SupportTicketsTab.tsx, app/admin/inbox/actions.ts |

## What Was Built

### Task 1 — Unanswered detection in chat-service.ts

Added `UNANSWERED_PHRASES` constant array and `detectUnanswered(responseText)` helper after `ESCALATION_RESPONSE`. The helper lowercases the full AI response and checks for any phrase match.

After each AI provider finishes streaming and saves the assistant message to `chat_messages`, a check runs: if `detectUnanswered(fullContent)` returns true, a `support_tickets` row is inserted with `ticket_type='unanswered_question'`. This block exists in both the OpenAI branch and the Anthropic branch, confirmed by grep returning count 2.

Phrases detected:
- "i don't have information on"
- "i'm not sure about"
- "this falls outside"
- "please contact support"
- "i cannot help with"

### Task 2 — Source filter in SupportTicketsTab and actions.ts

`listSupportTickets` in `actions.ts` gained a second optional parameter `ticketTypeFilter?: 'all' | 'human_escalation' | 'unanswered_question'`. The select string was updated to include `ticket_type`. When the filter is present and not 'all', `query.eq('ticket_type', ticketTypeFilter)` is applied.

`SupportTicketsTab.tsx` gained:
- `sourceFilter` state (default 'all')
- `refreshTickets(statusFilter, sourceFilter)` function that passes both filters
- `handleStatusFilterChange` and `handleSourceFilterChange` handlers
- A second `<select>` dropdown next to the existing status filter with options: All Sources / User submitted / Chatbot escalated
- A "Source" column in the table header between Created and Status
- Source badge cells: purple `Bot` icon badge for `unanswered_question`, slate badge for `human_escalation`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data is wired directly to the database.

## Self-Check: PASSED

- lib/chatbot/chat-service.ts exists and contains UNANSWERED_PHRASES, detectUnanswered, and 2 occurrences of ticket_type='unanswered_question'
- app/admin/inbox/SupportTicketsTab.tsx contains sourceFilter, "Chatbot escalated", "User submitted"
- app/admin/inbox/actions.ts contains ticketTypeFilter and ticket_type in select string
- Commits 084af0b and ca900f8 confirmed present
- npx tsc --noEmit passes with 0 errors
