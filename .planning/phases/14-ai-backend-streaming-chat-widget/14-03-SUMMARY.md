---
phase: 14-ai-backend-streaming-chat-widget
plan: "03"
subsystem: chat-widget-integration
tags: [ai, streaming, session-management, guest-cookie, escalation, rate-limit]
dependency_graph:
  requires: [14-01, 14-02]
  provides: [chat-session-actions, streaming-widget-integration, guest-session-cookie]
  affects: [app/components/chat/ChatPanel.tsx, app/components/chat/ChatWidget.tsx]
tech_stack:
  added: []
  patterns: [json-line-streaming, buffer-line-split, localstorage-session-persist, server-actions-use-server]
key_files:
  created:
    - lib/chatbot/chat-actions.ts
  modified:
    - app/components/chat/ChatPanel.tsx
    - app/components/chat/ChatWidget.tsx
decisions:
  - "Session restore uses both localStorage (session ID) and cookie (anonymous ID) — localStorage for cross-navigation restore, cookie for server-side anonymous identity"
  - "AbortController used for in-flight stream cancellation on new chat / unmount — prevents state updates after panel teardown"
  - "initSession useEffect depends only on isOpen — intentional, userId/anonymousId available by the time panel opens"
metrics:
  duration_seconds: 162
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_created: 1
  files_modified: 2
requirements: [CHAT-07, CHAT-08, CHAT-09, CHAT-10, CHAT-11]
---

# Phase 14 Plan 03: Chat Widget Integration Summary

**One-liner:** Wired chat widget to real AI backend with JSON-line stream parsing, session CRUD via server actions, guest cookie identity, conversation history restore, escalation/rate-limit UI states, and localStorage session persistence.

---

## What Was Built

### New File: `lib/chatbot/chat-actions.ts`

Server actions (`'use server'`) for chat session lifecycle management:

| Export | Description |
|--------|-------------|
| `getOrCreateSession` | Validates ownership of existing session or creates new row; returns session ID + history messages |
| `getChatHistory` | Loads up to 100 messages ordered by `created_at ASC` |
| `deleteSession` | Deletes messages first then session (FK order) |
| `getAnonymousId` | Reads/writes `goya_chat_session` cookie (httpOnly, secure, lax, 30-day maxAge) |
| `getCurrentUserId` | Returns authenticated user ID via `createSupabaseServerClient`, or null for guests |

### Updated: `app/components/chat/ChatPanel.tsx`

**Mock send replaced with real streaming integration:**
- `fetch POST /api/chatbot/message` with `{ session_id, message, anonymous_id }`
- Stream read via `response.body.getReader()` + `TextDecoder`
- Buffer + line-split pattern handles partial JSON chunks across reads
- `AbortController` cancels in-flight requests on new chat or unmount

**Stream event handling:**
- `token` — first token switches `isTyping → isStreaming` and creates assistant message; subsequent tokens append to content
- `done` — clears `isStreaming`, updates `sessionId` if server returned different ID
- `escalation` — sets `isEscalated=true`, adds escalation bubble, disables input
- `error` — adds error assistant bubble
- HTTP 429 — sets `isRateLimited=true`, adds rate-limit bubble
- HTTP non-OK — adds generic error bubble

**Session lifecycle:**
- On panel open: `getOrCreateSession` called with stored session ID from localStorage
- Restored messages mapped to local `Message[]` state
- Session ID persisted to `localStorage['goya_chat_session_id']` on change
- New Chat / Delete History: `deleteSession` then `getOrCreateSession` for fresh session

**New props:** `userId`, `anonymousId`, `initialSessionId` — all passed from ChatWidget.

### Updated: `app/components/chat/ChatWidget.tsx`

- Calls `getCurrentUserId()` and `getAnonymousId()` in parallel on mount (after `is_active` confirmed)
- Reads `goya_chat_session_id` from localStorage and passes as `initialSessionId` to ChatPanel
- Passes `userId`, `anonymousId`, `initialSessionId` down to ChatPanel

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

None — all data paths wired to real backend. Chat widget now provides full end-to-end functionality: streaming AI responses, guest sessions via cookie, conversation restore, escalation, and rate limiting.

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `2853c1f` | feat(14-03): create chat session server actions |
| Task 2 | `042e8f9` | feat(14-03): wire ChatPanel and ChatWidget to real streaming backend |

---

## Self-Check: PASSED
