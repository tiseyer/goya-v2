# Phase 1: Schema & Infrastructure - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning
**Mode:** Auto-generated (infrastructure phase — discuss skipped)

<domain>
## Phase Boundary

The database schema is correct and complete, the existing column-name bug is fixed, and all three Mattea surfaces share one streaming hook.

Requirements: INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05

</domain>

<decisions>
## Implementation Decisions

### Claude's Discretion
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from research (PITFALLS.md):
- Fix `question` → `question_summary` column bug in chat-service.ts (INFRA-03)
- `started_from` column needs DEFAULT 'chat_widget' to avoid breaking getOrCreateSession
- Extract `useChatStream` hook from ChatPanel, InlineChat, MatteaSearchHint (INFRA-04)
- Server `done` chunk must include `message_id` for feedback targeting (INFRA-05)

</decisions>

<code_context>
## Existing Code Insights

### Key Files (from Pitfalls research)
- `app/components/chatbot/ChatPanel.tsx` — duplicated stream loop
- `app/components/chatbot/InlineChat.tsx` — duplicated stream loop
- `app/components/search/MatteaSearchHint.tsx` — duplicated stream loop
- `lib/chat-service.ts` — contains the question_summary bug (line ~110)
- `supabase/migrations/` — existing migration files

### Established Patterns
- NDJSON streaming for chat responses
- `crypto.randomUUID()` for client-side message IDs (needs server ID return)
- Supabase service client for DB operations

### Integration Points
- `getOrCreateSession` server action — will need `started_from` parameter
- `chat_messages` table — server inserts need to return ID in done chunk
- `support_tickets` table — needs new columns

</code_context>

<specifics>
## Specific Ideas

No specific requirements — infrastructure phase. Refer to ROADMAP phase description and success criteria.

</specifics>

<deferred>
## Deferred Ideas

None — infrastructure phase.

</deferred>
