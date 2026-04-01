# Phase 14: AI Backend + Streaming Chat Widget - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Build the AI chat backend route (POST /api/chatbot/message) and floating chat widget. The route decrypts provider keys, streams AI responses, injects FAQ context, persists messages, detects escalation, and enforces rate limits. The widget appears on all public pages with desktop panel and mobile fullscreen modes, supports logged-in and guest sessions, and handles streaming display.

</domain>

<decisions>
## Implementation Decisions

### AI Backend Architecture
- Use direct OpenAI/Anthropic SDKs with manual streaming — admin controls the key via encrypted secrets from Phase 12, not AI Gateway
- In-memory Map with session-based sliding window rate limiting (20 msg/session/hour) — matches existing REST API pattern, sufficient for single-instance Vercel deployment
- FAQ context injection: concatenate all published FAQ items as XML-delimited block in system prompt (`<faq_context>...</faq_context>`) — no embeddings, simple and effective for <100 items
- Escalation detection: keyword matching ("talk to human", "speak to someone", "help from a person") + consecutive same-question detection (2 attempts) + explicit user request. On trigger: create support_ticket, return escalation flag to widget

### Chat Widget Design
- Mount ChatWidget conditionally in `app/layout.tsx` — check pathname doesn't start with `/admin`
- Guest session persistence: UUID cookie (`goya_chat_session`) via `cookies()` API — no Supabase anon auth
- Chat state: local useState in widget + fetch conversation history on widget open
- Streaming: append tokens to assistant message in real-time via fetch streaming (ReadableStream)
- Widget dimensions: 380x560px on desktop (bottom-right), fullscreen on mobile (via media query)

### Session & Persistence
- Public config endpoint: GET /api/chatbot/config returns { is_active, name, avatar_url } — no secrets exposed
- Save user message to DB immediately before AI call, save assistant message in onFinish after streaming completes
- Conversation history: send last 20 messages to AI provider as context
- Node.js runtime required (not Edge) — crypto module needed for key decryption

### Claude's Discretion
- Exact streaming implementation details (SSE vs ReadableStream)
- Widget animation/transition on open/close
- Error message styling in chat bubbles
- Loading indicator while waiting for first token

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/secrets/encryption.ts` — AES-256-GCM decrypt for provider API keys
- `lib/secrets/ai-providers.ts` — provider/model constants and validation
- `app/admin/chatbot/chatbot-actions.ts` — getChatbotConfig, FAQ CRUD actions
- `lib/chatbot/types.ts` — ChatbotConfig, FaqItem types
- Existing rate limiter pattern from `lib/api/middleware/rate-limit.ts`

### Established Patterns
- API routes at `app/api/` with per-route auth composition
- Server actions for admin mutations, API routes for public endpoints
- getSupabaseService() for service-role DB access
- Cookie management via Next.js cookies() API

### Integration Points
- `app/layout.tsx` — mount ChatWidget conditionally
- `chatbot_config` table — read is_active, selected_key_id, system_prompt
- `admin_secrets` table — decrypt provider API key at inference time
- `faq_items` table — read published items for context injection
- `chat_sessions` + `chat_messages` tables — persist conversations
- `support_tickets` table — create on escalation

</code_context>

<specifics>
## Specific Ideas

- User spec: Opening greeting "Namaste! I'm Mattea, your GOYA guide. How can I help you today?"
- User spec: Header with Mattea's profile image + name + online indicator
- User spec: Two header buttons: "New Chat" (clears current, starts fresh) and trash icon (delete chat history)
- User spec: Escalation message: "That's a great question - I'll check with our team and get back to you, usually within 48 hours."
- User spec: Rate limit max 20 messages per session per hour
- User spec: Chat bubbles — user right, Mattea left with avatar
- User spec: Widget only on public pages, not /admin/* routes
- System prompt from chatbot_config includes pre-filled Mattea persona

</specifics>

<deferred>
## Deferred Ideas

- Tool use (Events, Teachers, Courses search) → Phase 15 API Connections tab
- Conversations admin viewer → Phase 15
- Support tickets admin tab → Phase 15
- Guest chat cleanup cron → Phase 15

</deferred>
