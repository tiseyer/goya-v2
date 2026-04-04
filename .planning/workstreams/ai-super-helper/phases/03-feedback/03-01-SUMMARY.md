---
phase: 03-feedback
plan: "01"
subsystem: chatbot-feedback
tags: [feedback, thumbs, api-route, component, streaming]
dependency_graph:
  requires: [01-01, 01-02, 02-01]
  provides: [FEED-01, FEED-03]
  affects: [ChatPanel, InlineChat, MessageList, MessageBubble]
tech_stack:
  added: []
  patterns:
    - feedbackSlot render prop on MessageBubble
    - group-hover Tailwind pattern for hover-reveal buttons
    - FeedbackButtons manages its own fetch state (no lift-up needed)
key_files:
  created:
    - app/api/chatbot/conversations/[id]/feedback/route.ts
    - app/components/chat/FeedbackButtons.tsx
  modified:
    - app/components/chat/MessageBubble.tsx
    - app/components/chat/MessageList.tsx
    - app/components/chat/ChatPanel.tsx
    - app/settings/help/InlineChat.tsx
    - docs/admin/chatbot.md
decisions:
  - FeedbackButtons is fully self-contained — manages fetch and state internally, no callback needed to parent
  - feedbackSlot render prop avoids role-specific logic inside MessageBubble itself
  - Greeting message (id==="greeting") excluded from feedback in InlineChat — it is a static local message, not a Mattea response
metrics:
  duration: "~8 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_changed: 7
---

# Phase 03 Plan 01: Feedback Buttons — Thumbs Up/Down Summary

**One-liner:** Thumbs up/down buttons on assistant messages, backed by PATCH /api/chatbot/conversations/[id]/feedback persisting to chat_sessions.user_feedback.

## Tasks Completed

| # | Name | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create feedback API route and FeedbackButtons component | 6a1688e | route.ts, FeedbackButtons.tsx |
| 2 | Wire FeedbackButtons into ChatPanel and InlineChat | db0977b | MessageBubble.tsx, MessageList.tsx, ChatPanel.tsx, InlineChat.tsx |
| - | Docs update | 2cc1b46 | docs/admin/chatbot.md, search-index.json |

## What Was Built

**PATCH /api/chatbot/conversations/[id]/feedback**
- Accepts `{ feedback: 'helpful' | 'not_helpful' }` in request body
- Maps to `'up'` / `'down'` and updates `chat_sessions.user_feedback` + `feedback_at`
- Returns 200 `{ success: true }`, 400 for invalid body, 500 on DB error
- Uses service role client (same pattern as other chatbot routes)

**FeedbackButtons component**
- `'use client'` component with `sessionId`, `visible`, `compact?` props
- Renders ThumbsUp / ThumbsDown from lucide-react
- Hover-reveal via `group-hover:opacity-60 hover:!opacity-100` (parent needs `group` class)
- After selection: both buttons disabled, "Thanks!" micro-confirmation appears
- Non-fatal fetch — errors swallowed silently
- Returns null when `visible=false` (during streaming)

**MessageBubble wiring**
- Added `feedbackSlot?: React.ReactNode` prop
- Added `group` class to outer assistant div (enables hover-reveal)
- Restructured inner div to `flex flex-col` to stack bubble + feedbackSlot vertically

**MessageList wiring**
- Added `sessionId?: string | null` prop
- Passes `FeedbackButtons` as `feedbackSlot` for every `role === 'assistant'` message
- `visible` is false only for the last message while actively streaming

**ChatPanel wiring**
- Passes `sessionId` to `MessageList`

**InlineChat wiring**
- Imports and renders `FeedbackButtons` in the message map
- Excludes greeting message (`id === 'greeting'`) from feedback
- `visible={msg.id !== streamingMsgId}` hides buttons during streaming

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None. Feedback writes to DB via real PATCH endpoint. No mock data or placeholders.

## Self-Check: PASSED

Files verified:
- [x] app/api/chatbot/conversations/[id]/feedback/route.ts — exists
- [x] app/components/chat/FeedbackButtons.tsx — exists
- [x] app/components/chat/MessageBubble.tsx — contains feedbackSlot, group class
- [x] app/components/chat/MessageList.tsx — imports FeedbackButtons, accepts sessionId
- [x] app/components/chat/ChatPanel.tsx — passes sessionId to MessageList
- [x] app/settings/help/InlineChat.tsx — imports FeedbackButtons, wires to message map

Commits verified:
- [x] 6a1688e — Task 1 commit
- [x] db0977b — Task 2 commit
- [x] 2cc1b46 — Docs commit

TypeScript: npx tsc --noEmit passes with 0 errors.
