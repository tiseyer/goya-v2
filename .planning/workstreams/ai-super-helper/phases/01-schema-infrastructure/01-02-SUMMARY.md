---
phase: 01-schema-infrastructure
plan: 02
subsystem: chatbot
tags: [streaming, hook-extraction, refactor, message_id]
requirements: [INFRA-04, INFRA-05]

dependency_graph:
  requires:
    - lib/chatbot/chat-service.ts (done chunk emitter)
    - app/components/chat/ChatPanel.tsx (streaming consumer)
    - app/settings/help/InlineChat.tsx (streaming consumer)
  provides:
    - lib/chatbot/useChatStream.ts (shared streaming hook)
    - message_id in all done chunks from chat-service.ts
    - StreamMessage.message_id field for future feedback targeting
  affects:
    - app/components/chat/ChatPanel.tsx
    - app/settings/help/InlineChat.tsx

tech_stack:
  added: []
  patterns:
    - React custom hook extracting shared streaming state machine
    - Supabase .select('id').single() chained after .insert() to capture row ID
    - NDJSON done chunk extended with message_id field

key_files:
  created:
    - lib/chatbot/useChatStream.ts
  modified:
    - lib/chatbot/chat-service.ts
    - app/components/chat/ChatPanel.tsx
    - app/settings/help/InlineChat.tsx

decisions:
  - useChatStream manages its own messages/isTyping/isStreaming/isEscalated/isRateLimited state; callers receive setMessages to seed history
  - anonymousId is an optional param to useChatStream; InlineChat initializes it via getAnonymousId() server action before passing to hook
  - message_id emitted on escalation chunk too (not just done), so escalation messages are also DB-targetable
  - MatteaSearchHint not touched — confirmed fire-and-forget POST, never reads stream

metrics:
  duration: ~3 minutes
  completed: 2026-04-04
  tasks_completed: 2
  tasks_total: 2
  files_modified: 3
  files_created: 1
---

# Phase 01 Plan 02: Shared useChatStream hook and server message_id wiring

Shared NDJSON streaming hook extracted from ChatPanel and InlineChat, with server-side message_id returned in done chunks enabling future per-message feedback targeting.

## What Was Built

**`lib/chatbot/useChatStream.ts`** — new shared React hook exporting:
- `StreamMessage` interface: `id` (client UUID), `role`, `content`, `message_id?` (server DB row ID populated after done event)
- `UseChatStreamOptions` interface: `sessionId`, `anonymousId?`, `onSessionUpdate?`
- `useChatStream` function returning all streaming state (`messages`, `setMessages`, `isTyping`, `isStreaming`, `isEscalated`, `isRateLimited`) and controls (`sendMessage`, `abort`)

The hook contains the complete NDJSON reader loop previously duplicated in both ChatPanel and InlineChat. On receiving a `done` chunk, it writes the server-assigned `message_id` onto the assistant `StreamMessage` object, enabling Phase 3 feedback to target specific DB rows.

**`lib/chatbot/chat-service.ts`** — all three assistant message insert paths now use `.select('id').single()` and emit `message_id` in their output chunks:
1. Escalation path — `message_id` on escalation chunk
2. OpenAI completion path — `message_id` on done chunk
3. Anthropic completion path — `message_id` on done chunk

**`app/components/chat/ChatPanel.tsx`** — refactored. Removed: local `Message` interface, `isTyping`/`isStreaming`/`isEscalated`/`isRateLimited` state, `abortControllerRef`, and the entire `handleSend` fetch + NDJSON reader loop (120+ lines). Replaced with a single `useChatStream` call. Session init, localStorage, new-chat, and all UI rendering unchanged.

**`app/settings/help/InlineChat.tsx`** — same refactor. Added `anonymousId` state initialized via `getAnonymousId()` server action and passed to hook. The greeting message initialised via `setMessages` from the hook's `setMessages` return. All scroll behavior and `PromptInputBox` wiring preserved.

## Tasks

| Task | Status | Commit |
|------|--------|--------|
| Task 1: Wire message_id in done chunks + create useChatStream hook | Complete | 5ce7e2f |
| Task 2: Refactor ChatPanel and InlineChat to use useChatStream | Complete | 13be266 |

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Notes

- `StreamMessage` is a structural superset of the local `Message` interface that `MessageList.tsx` defines internally. No changes to `MessageList` were needed — TypeScript accepts `StreamMessage[]` for the `Message[]` prop since `message_id` is optional.
- InlineChat initializes `anonymousId` as local state (populated by `getAnonymousId()` on mount) and passes it to the hook. This is necessary because the hook runs client-side but `getAnonymousId` is a server action.

## Known Stubs

None — all code paths are wired to real logic. The `message_id` on `StreamMessage` is populated from the server after each stream completes; it is `undefined` only transiently during streaming (before the done chunk arrives), which is the intended behavior.

## Self-Check: PASSED

- [x] `lib/chatbot/useChatStream.ts` exists with `'use client'` directive
- [x] `grep "export function useChatStream" lib/chatbot/useChatStream.ts` — found
- [x] `grep "message_id" lib/chatbot/useChatStream.ts` — found (multiple)
- [x] `grep -c "message_id" lib/chatbot/chat-service.ts` returns 3
- [x] `grep "useChatStream" app/components/chat/ChatPanel.tsx` — found
- [x] `grep "useChatStream" app/settings/help/InlineChat.tsx` — found
- [x] No `getReader`/`reader.read` in ChatPanel or InlineChat
- [x] No local `Message` interface in ChatPanel or InlineChat
- [x] `app/components/search/MatteaSearchHint.tsx` not modified
- [x] `npx tsc --noEmit` — 0 errors
- [x] Commits 5ce7e2f and 13be266 exist
