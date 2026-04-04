# Phase 3: Feedback - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can rate any Mattea response with thumbs up or down on all three surfaces, and admins can see the rating in the Conversations table.

Requirements: FEED-01, FEED-02, FEED-03, FEED-04

</domain>

<decisions>
## Implementation Decisions

### Feedback UI
- Thumbs appear after every Mattea assistant message, ONLY when streaming is complete
- Two small icon buttons: thumbs up + thumbs down
- Styling: `opacity-60 hover:opacity-100 transition-opacity`, small (3.5-4px icons)
- After clicking: highlight selected thumb, disable both buttons, show micro-confirmation "Thanks for your feedback"
- Feedback is per-conversation (not per-message) — clicking on any message's thumbs sets the whole conversation rating

### API
- `PATCH /api/chatbot/conversations/[id]/feedback` with body `{ feedback: 'helpful' | 'not_helpful' }`
- Updates `user_feedback` and `feedback_at` on the chat_sessions row
- No auth required beyond being the session owner

### Surface Coverage
- FEED-01: Floating chat widget (ChatPanel.tsx) — uses useChatStream hook, has message_id
- FEED-02: Search hint (MatteaSearchHint.tsx) — fire-and-forget, may need its own feedback path
- FEED-03: Help page (InlineChat.tsx) — uses useChatStream hook, has message_id

### Admin Conversations Table
- FEED-04: New "Feedback" column showing thumbs up (green) / thumbs down (red) / — (no feedback)
- Positioned after the existing columns

### Claude's Discretion
- Icon library choice (Lucide, Heroicons, or inline SVG)
- Exact placement within message bubble vs below
- How to handle search hint feedback (may need separate endpoint since it doesn't create full sessions)

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `lib/chatbot/useChatStream.ts` — shared hook, has message_id in done chunk
- `app/components/chat/ChatPanel.tsx` — widget surface, uses useChatStream
- `app/settings/help/InlineChat.tsx` — help page, uses useChatStream
- `app/components/search/MatteaSearchHint.tsx` — fire-and-forget, own stream
- `app/admin/chatbot/ConversationsTab.tsx` — admin table, already has Source column
- `lib/chatbot/types.ts` — ChatSession has user_feedback, feedback_at fields

### Patterns
- NDJSON streaming with done chunk containing session_id and message_id
- Admin table uses colored badges for Source column (same pattern for Feedback)

</code_context>

<specifics>
## Specific Ideas

From milestone spec:
```tsx
<div className="flex gap-2 mt-2 opacity-60 hover:opacity-100 transition-opacity">
  <button onClick={() => submitFeedback('helpful')} className="p-1 rounded hover:bg-slate-100">
    <ThumbsUp className="w-3.5 h-3.5 text-slate-400 hover:text-green-500" />
  </button>
  <button onClick={() => submitFeedback('not_helpful')} className="p-1 rounded hover:bg-slate-100">
    <ThumbsDown className="w-3.5 h-3.5 text-slate-400 hover:text-red-400" />
  </button>
</div>
```

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
