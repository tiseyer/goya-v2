# Phase 4: Unanswered Question Pipeline - Context

**Gathered:** 2026-04-04
**Status:** Ready for planning

<domain>
## Phase Boundary

When Mattea cannot answer confidently it automatically creates a support ticket; admins can publish the question as FAQ or reject it with a reason; admins can filter tickets by source.

Requirements: UNQ-01, UNQ-02, UNQ-03, UNQ-04, UNQ-05

</domain>

<decisions>
## Implementation Decisions

### Unanswered Detection (UNQ-01)
- Detect via phrase matching in Mattea's response text
- Trigger phrases: "I don't have information on", "I'm not sure about", "This falls outside", "Please contact support", "I cannot help with"
- When detected: set `escalated = true` on conversation, create support ticket with `ticket_type = 'unanswered_question'`
- ticket_type column already exists from Phase 1 migration

### FAQ Generation (UNQ-02)
- New API route: `POST /api/chatbot/generate-answer`
- Body: `{ question: string }`
- Streams an LLM-generated FAQ answer using same LLM client as main chatbot
- System prompt: "You are generating a concise, helpful FAQ answer for the GOYA yoga association platform. Answer the following user question clearly and professionally, in 2-4 sentences."
- Returns streaming text response (same NDJSON pattern)

### Admin Resolution UI (UNQ-02, UNQ-03, UNQ-04)
For tickets with `ticket_type = 'unanswered_question'`, show 3 actions:

**"Mattea answers this"**:
- Opens inline panel below ticket row
- Shows user's question + auto-streamed AI answer
- Admin can edit the answer in a textarea
- Two buttons: "Add to FAQ" + "Cancel"
- "Add to FAQ" calls POST /api/chatbot/faq with { question, answer, status: 'published' }
- Marks ticket as resolved

**"Mattea won't answer this"**:
- Dropdown with reasons: "Out of scope (not yoga related)", "Sensitive / inappropriate", "Duplicate of existing FAQ", "Other"
- Sets ticket status: 'rejected', rejection_reason: <selected>

**"Cancel" / skip**:
- Ticket stays in pending

### Source Filter (UNQ-05)
- In Support Tickets tab, add sub-filter: "All" | "User submitted" | "Chatbot escalated"
- Filters on `ticket_type` column (NULL/manual vs 'unanswered_question')

### Claude's Discretion
- Streaming implementation details for generate-answer route
- Exact layout of inline panel
- How to handle edge cases (empty answer, LLM failure)

</decisions>

<code_context>
## Existing Code Insights

### Key Files
- `lib/chatbot/chat-service.ts` — main message handler, has escalation path
- `app/admin/inbox/` — admin inbox with Support Tickets tab
- `app/admin/chatbot/` — FAQ management (Configuration, FAQ tabs)
- `lib/chatbot/types.ts` — SupportTicket type has ticket_type, rejection_reason
- `app/api/chatbot/message/route.ts` — chatbot message API route

### Patterns
- NDJSON streaming for LLM responses
- Supabase service client for admin operations
- Support tickets already have escalation flow from chatbot

</code_context>

<specifics>
## Specific Ideas

No additional specific requirements beyond the milestone spec.

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
