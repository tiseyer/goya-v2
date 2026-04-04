# Phase 5: Conversation History - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

Users on the Help page can see and reload their previous conversations, and start fresh when needed.

Requirements: HIST-01, HIST-02, HIST-03

</domain>

<decisions>
## Implementation Decisions

### Conversation List (HIST-01)
- Fetch user's previous help-page conversations via API
- Show as a dropdown or list between chat area and Help & Guides section
- Each entry shows: first message preview + relative date
- Only show help_page conversations (filter by started_from = 'help_page')
- If no previous conversations, hide the dropdown entirely

### Load Previous Conversation (HIST-02)
- Selecting a conversation loads its messages into the chat area
- Messages fetched from chat_messages table for that session
- Preserve the chat UI state (scrolled to bottom, input enabled)

### New Conversation (HIST-03)
- "New chat" button resets to empty state
- Does NOT delete history — just starts a fresh session
- Previous conversations remain accessible in the dropdown

### Claude's Discretion
- Exact UI component choice (dropdown vs sidebar list vs tabs)
- How to handle pagination if user has many conversations
- Loading state while fetching conversation messages

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `app/settings/help/InlineChat.tsx` — help page chat, uses useChatStream
- `app/settings/help/page.tsx` or `HelpPageClient.tsx` — help page layout
- `lib/chatbot/chat-actions.ts` — getOrCreateSession, has started_from
- `lib/chatbot/types.ts` — ChatSession, ChatMessage types

### Patterns
- useChatStream hook manages session state
- Sessions stored in localStorage for persistence
- Messages stored in chat_messages table

</code_context>

<specifics>
## Specific Ideas

From milestone spec:
- Show a select or custom dropdown labeled "Previous conversations"
- Each option shows first message preview + relative date
- "New chat" button resets to empty

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
