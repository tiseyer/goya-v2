---
phase: 02-source-tracking
plan: 01
subsystem: chatbot
tags: [source-tracking, admin-ui, chat-sessions]
requirements: [SRC-01, SRC-02]

dependency_graph:
  requires:
    - 01-01 (chat_sessions.started_from column exists with enum + default)
  provides:
    - started_from wired end-to-end from all three surfaces to DB
    - Admin Conversations table shows Source column
  affects:
    - lib/chatbot/chat-service.ts
    - app/api/chatbot/message/route.ts
    - app/settings/help/InlineChat.tsx
    - app/settings/help/HelpPageClient.tsx
    - app/components/search/MatteaSearchHint.tsx
    - lib/chatbot/types.ts
    - app/admin/chatbot/chatbot-actions.ts
    - app/admin/chatbot/ConversationsTab.tsx

tech_stack:
  added: []
  patterns:
    - Fire-and-forget POST body carries started_from for search_hint surface
    - getOrCreateSession accepts optional started_from; chat-service inserts it on new sessions only

key_files:
  created: []
  modified:
    - app/settings/help/InlineChat.tsx
    - app/settings/help/HelpPageClient.tsx
    - app/components/search/MatteaSearchHint.tsx
    - app/api/chatbot/message/route.ts
    - lib/chatbot/chat-service.ts
    - lib/chatbot/types.ts
    - app/admin/chatbot/chatbot-actions.ts
    - app/admin/chatbot/ConversationsTab.tsx

decisions:
  - "MatteaSearchHint fire-and-forget POST renamed body field from source to started_from to match DB column name"
  - "streamChatResponse inserts started_from only on new session creation; existing sessions retain their original value"
  - "ConversationListItem.started_from is non-nullable; mapping falls back to 'chat_widget' for legacy rows"

metrics:
  duration: ~8 minutes
  completed: 2026-04-04
  tasks_completed: 2
  files_modified: 8
---

# Phase 02 Plan 01: Source Tracking Wire-Up Summary

**One-liner:** started_from wired end-to-end across all three Mattea surfaces (help_page, search_hint, chat_widget default) with colored Source badge column in admin Conversations table.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Wire started_from through all three Mattea surfaces (SRC-01) | 40787cb | InlineChat.tsx, HelpPageClient.tsx, MatteaSearchHint.tsx, route.ts, chat-service.ts |
| 2 | Add Started from column to admin Conversations table (SRC-02) | 4e3d118 | types.ts, chatbot-actions.ts, ConversationsTab.tsx |

## What Was Built

### Task 1: Source tracking wired through all surfaces

- **InlineChat.tsx**: `getOrCreateSession` now passes `started_from: 'help_page'`
- **HelpPageClient.tsx**: Both `getOrCreateSession` calls (init session + new chat) pass `started_from: 'help_page'`
- **MatteaSearchHint.tsx**: Fire-and-forget POST body changed from `source: 'search_hint'` to `started_from: 'search_hint'` (field renamed to match DB column)
- **route.ts**: Destructures `started_from` from request body, casts to enum, forwards as `startedFrom` to `streamChatResponse`
- **chat-service.ts**: `streamChatResponse` accepts optional `startedFrom` param, inserts it when creating new sessions (defaults to `'chat_widget'` if absent)

### Task 2: Admin Conversations table Source column

- **types.ts**: `ConversationListItem` gains `started_from: 'chat_widget' | 'search_hint' | 'help_page'` field (non-nullable)
- **chatbot-actions.ts**: `listConversations` select query includes `started_from`; mapping adds `started_from: s.started_from ?? 'chat_widget'` for legacy rows
- **ConversationsTab.tsx**: New "Source" column header and colored badge cells between Escalated and Actions columns; table min-width bumped from 700px to 800px; badge colors: blue (Chat Widget), amber (Search), emerald (Help Page)

## Deviations from Plan

None - plan executed exactly as written.

## Known Stubs

None - all data flows are wired to real DB columns.

## Verification

- `npx tsc --noEmit` passes with 0 errors after both tasks
- `grep -r "started_from"` shows wiring across all 8 files
- No remaining `source: 'search_hint'` references (old field name fully replaced)

## Self-Check: PASSED

Files confirmed present:
- app/settings/help/InlineChat.tsx - FOUND
- app/settings/help/HelpPageClient.tsx - FOUND
- app/components/search/MatteaSearchHint.tsx - FOUND
- app/api/chatbot/message/route.ts - FOUND
- lib/chatbot/chat-service.ts - FOUND
- lib/chatbot/types.ts - FOUND
- app/admin/chatbot/chatbot-actions.ts - FOUND
- app/admin/chatbot/ConversationsTab.tsx - FOUND

Commits confirmed:
- 40787cb: feat(02-01): wire started_from through all three Mattea surfaces (SRC-01)
- 4e3d118: feat(02-01): add Started from column to admin Conversations table (SRC-02)
