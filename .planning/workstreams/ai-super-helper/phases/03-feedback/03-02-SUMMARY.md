---
phase: 03-feedback
plan: "02"
subsystem: chatbot-feedback
tags: [feedback, search-hint, admin, conversations-table]
dependency_graph:
  requires: [03-01]
  provides: [FEED-02, FEED-04]
  affects: [MatteaSearchHint, FeedbackButtons, ConversationsTab, chatbot-actions, types]
tech_stack:
  added: []
  patterns:
    - onBeforeSubmit prop pattern for deferred session creation
    - useRef promise deduplication for in-flight async requests
    - NDJSON stream parsing to extract session_id from done chunk
key_files:
  created: []
  modified:
    - app/components/search/MatteaSearchHint.tsx
    - app/components/chat/FeedbackButtons.tsx
    - lib/chatbot/types.ts
    - app/admin/chatbot/chatbot-actions.ts
    - app/admin/chatbot/ConversationsTab.tsx
    - docs/admin/chatbot.md
decisions:
  - Search hint session is created lazily on first thumb click via ensureSession — not pre-created on render
  - sessionPromiseRef deduplicates concurrent ensureSession calls (click-before-response races)
  - FeedbackButtons onBeforeSubmit prop allows dynamic session acquisition without breaking existing callers
metrics:
  duration: "~6 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_changed: 6
---

# Phase 03 Plan 02: Search Hint Feedback + Admin Feedback Column Summary

**One-liner:** Thumbs up/down wired into MatteaSearchHint via lazy session creation (ensureSession NDJSON parse), with a Feedback column added to the admin Conversations table.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Wire feedback into MatteaSearchHint | c67d7a6 | MatteaSearchHint.tsx, FeedbackButtons.tsx |
| 2 | Add Feedback column to admin Conversations table | a172123 | types.ts, chatbot-actions.ts, ConversationsTab.tsx |
| - | Docs update | cb2c0ae | docs/admin/chatbot.md, search-index.json |

## What Was Built

**MatteaSearchHint feedback wiring**
- Added `useState<string | null>(null)` for `hintSessionId` to track the session after creation
- Added `useRef<Promise<string | null> | null>(null)` for `sessionPromiseRef` to deduplicate in-flight fetch calls
- `ensureSession()` fires POST to `/api/chatbot/message`, reads NDJSON stream, extracts `session_id` from the `done` chunk, and stores it in state
- `handleContinue` now calls `ensureSession()` fire-and-forget (non-blocking)
- `FeedbackButtons` rendered with `compact={true}`, `sessionId={hintSessionId}`, and `onBeforeSubmit={ensureSession}` — thumbs appear below the answer text alongside the Reply button

**FeedbackButtons onBeforeSubmit extension**
- Added optional `onBeforeSubmit?: () => Promise<string | null>` prop
- In `handleClick`, if `sessionId` is null and `onBeforeSubmit` is provided, it calls `onBeforeSubmit()` to obtain the session ID before making the PATCH call
- `disabled` state updated: buttons are enabled when `onBeforeSubmit` is provided even if `sessionId` is null

**Admin Conversations Feedback column**
- `ConversationListItem` type extended with `user_feedback: 'up' | 'down' | null`
- `listConversations` select query updated to include `user_feedback`
- Result mapping adds `user_feedback: s.user_feedback ?? null`
- ConversationsTab table: new "Feedback" column header between Source and Actions
- Cell renders green "Helpful" badge (ThumbsUp icon), red "Not helpful" badge (ThumbsDown icon), or "—" dash for no feedback

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Feedback writes to the real DB endpoint. The admin column reads live data from `chat_sessions.user_feedback`.

## Self-Check: PASSED

Files verified:
- [x] app/components/search/MatteaSearchHint.tsx — contains FeedbackButtons, hintSessionId, ensureSession
- [x] app/components/chat/FeedbackButtons.tsx — contains onBeforeSubmit prop
- [x] lib/chatbot/types.ts — contains user_feedback on ConversationListItem
- [x] app/admin/chatbot/chatbot-actions.ts — contains user_feedback in select and mapping
- [x] app/admin/chatbot/ConversationsTab.tsx — contains Feedback column, ThumbsUp, ThumbsDown

Commits verified:
- [x] c67d7a6 — Task 1 commit
- [x] a172123 — Task 2 commit
- [x] cb2c0ae — Docs commit

TypeScript: npx tsc --noEmit passes with 0 errors.
