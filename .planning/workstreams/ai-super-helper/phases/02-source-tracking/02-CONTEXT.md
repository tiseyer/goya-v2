# Phase 2: Source Tracking - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

Every conversation records which Mattea surface created it, and admins can see that source in the Conversations table.

Requirements: SRC-01, SRC-02

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — low-complexity infrastructure phase.

Key facts from Phase 1:
- `started_from` column already exists on `chat_sessions` with DEFAULT 'chat_widget' and CHECK constraint ('chat_widget', 'search_hint', 'help_page')
- `getOrCreateSession` in `lib/chatbot/chat-actions.ts` already accepts optional `started_from` parameter
- Three surfaces: ChatPanel (widget), InlineChat (help page), MatteaSearchHint (search hint)
- ChatPanel and InlineChat use `useChatStream` hook which calls `getOrCreateSession`
- MatteaSearchHint is fire-and-forget (doesn't use the hook)

What remains:
- Each surface must pass the correct `started_from` value when creating sessions
- Admin Conversations table must show a "Started from" column

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `lib/chatbot/chat-actions.ts` — getOrCreateSession already has started_from param
- `lib/chatbot/useChatStream.ts` — shared hook used by ChatPanel and InlineChat
- `app/components/chat/ChatPanel.tsx` — floating widget surface
- `app/settings/help/InlineChat.tsx` — help page surface
- `app/components/search/MatteaSearchHint.tsx` — search hint surface (fire-and-forget)
- `app/admin/chatbot/` — admin conversations table

</code_context>

<specifics>
## Specific Ideas

No specific requirements — pass correct started_from values from each surface.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
