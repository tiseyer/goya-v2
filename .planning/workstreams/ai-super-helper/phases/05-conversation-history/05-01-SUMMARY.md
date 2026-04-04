---
phase: 05-conversation-history
plan: "01"
subsystem: chatbot
tags: [conversation-history, help-page, server-actions, ui]
dependency_graph:
  requires: []
  provides: [listUserConversations, conversation-history-dropdown]
  affects: [lib/chatbot/chat-actions.ts, app/settings/help/HelpPageClient.tsx]
tech_stack:
  added: []
  patterns: [server-action, optimistic-ui, read-only-historical-view]
key_files:
  created: []
  modified:
    - lib/chatbot/chat-actions.ts
    - app/settings/help/HelpPageClient.tsx
    - docs/teacher/help-page.md
decisions:
  - "ConversationSummary interface exported from chat-actions.ts (single source of truth, removed local duplicate)"
  - "Historical view is read-only — isHistoricalView disables input and submit button"
  - "Empty sessions excluded by skipping sessions with no first user message"
  - "Conversation list refreshes after New Chat so previous conversation appears immediately"
metrics:
  duration: "~10 minutes"
  completed: "2026-04-03"
  tasks_completed: 2
  files_changed: 3
---

# Phase 05 Plan 01: Conversation History Summary

Conversation history dropdown on the Help page — users can browse and reload previous help-page conversations, with read-only enforcement and relative timestamps.

## What Was Built

### Task 1: listUserConversations server action (lib/chatbot/chat-actions.ts)

- Added `ConversationSummary` interface (exported)
- Added `listUserConversations(userId: string): Promise<ConversationSummary[]>` server action
- Queries `chat_sessions` filtered by `user_id` and `started_from = 'help_page'`
- For each session: fetches first user message as preview and last message timestamp
- Skips sessions with no messages (empty sessions excluded)
- Returns up to 20 sessions, most recent first

### Task 2: Conversation history dropdown + new chat wiring (app/settings/help/HelpPageClient.tsx)

- Imported `listUserConversations` and `type ConversationSummary` from `chat-actions`
- Removed local `ConversationSummary` interface (now comes from server)
- Replaced `loadConversations` placeholder stub with real `listUserConversations` call
- Added `isHistoricalView` state — set to `true` when loading a previous conversation
- Disabled follow-up input and submit button when `isHistoricalView` is `true`
- Added hint text: "Viewing a previous conversation. Click 'New chat' to start fresh."
- `handleNewChat` now resets `isHistoricalView` and refreshes conversation list
- Added `relativeDate` helper for human-readable timestamps (e.g. "5m ago", "2d ago")
- Updated dropdown date display to use `relativeDate`

## Commits

| Hash | Message |
|------|---------|
| c4ccdad | feat(05-01): add listUserConversations server action |
| 28da814 | feat(05-01): wire conversation history dropdown in HelpPageClient |
| 459bbe9 | docs(05-01): add help page conversation history documentation |

## Verification

- `npx tsc --noEmit` passes with 0 errors
- `listUserConversations` exists in chat-actions.ts with `help_page` filter
- `ConversationSummary` exported from chat-actions.ts
- `HelpPageClient` imports `listUserConversations` and `ConversationSummary` from chat-actions
- `isHistoricalView` state present for read-only enforcement
- `relativeDate` helper present
- No local `ConversationSummary` interface in HelpPageClient

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data flows are wired. The conversation list is populated from real DB queries.

## Self-Check: PASSED
