# Feature Research

**Domain:** AI chatbot support system — yoga community platform (GOYA v2)
**Researched:** 2026-03-27
**Confidence:** MEDIUM-HIGH (core patterns HIGH from official docs and multiple verified sources; specific implementation details MEDIUM)

---

## Context

This research covers the *new* milestone features only. Existing features (admin panel, REST API, API key management) are already built. The six feature domains are:

1. Encrypted third-party key manager (extend existing `/admin/api-keys`)
2. Chatbot configuration (persona, system prompt, model selection)
3. FAQ knowledge base (admin-managed, RAG-powered)
4. Conversation management (history, guest vs. auth persistence)
5. Tool-use / function-calling integration
6. Escalation to human support (ticket creation)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features that must exist or the product feels broken/incomplete.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Chat UI with streaming responses | Users expect instant feedback, not loading spinners | LOW | Vercel AI SDK `useChat` hook handles this; `streamText` on server side |
| Conversation context (multi-turn) | A chatbot that forgets previous messages in the same session is unusable | LOW | Vercel AI SDK manages `messages[]` array automatically |
| Guest chat (no login required) | Public visitors need to ask basic questions; forcing login kills top-of-funnel | MEDIUM | Session ID stored in `localStorage` or cookie; no user_id FK, only session_id |
| Authenticated chat persistence | Logged-in users expect history to survive page refreshes and return visits | MEDIUM | Link conversation rows to `auth.users.id`; query on mount |
| FAQ knowledge base (admin-managed) | Chatbot must answer domain questions accurately; hallucination without grounding is a liability | HIGH | RAG pattern: embed FAQ entries, cosine similarity search, inject context into system prompt. Supabase has `pgvector` extension for this |
| "Talk to a human" escalation path | Users must be able to exit the bot; hiding this creates frustration and distrust | LOW | Button or intent detection → ticket creation; async is fine |
| Encrypted storage of third-party API keys | Admin enters OpenAI (or other) key; storing plaintext in DB is a security failure | MEDIUM | AES-256-GCM encryption at application layer before insert; decrypt only at inference time server-side |
| Admin UI to manage third-party keys | Admin needs CRUD for provider keys (OpenAI, Anthropic, etc.) without DB access | LOW | Extend existing `/admin/api-keys` tab shell (Third Party Keys tab is already a placeholder) |
| Chatbot on/off switch | Admin must be able to disable the bot entirely (e.g., for maintenance or during a crisis) | LOW | Single `site_settings` row flag; check on every chat request |

### Differentiators (Competitive Advantage)

Features that elevate above generic chatbot implementations.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Named persona ("Mattea") with configurable system prompt | Feels native to the yoga brand rather than a generic AI widget | LOW | Admin-editable `system_prompt` in `site_settings` or dedicated `chatbot_config` table; prepended to every conversation |
| Tool-use: look up real platform data (events, courses, members) | Bot can answer "What workshops are happening this week?" with live data — not just static FAQ | HIGH | Define tool schemas for existing REST API endpoints; LLM decides when to call them; server executes and returns results |
| FAQ entry management in admin panel | Non-technical admin can add/edit/delete FAQ entries that feed the RAG knowledge base | MEDIUM | CRUD admin UI + auto-embedding on save (background job or inline); admins don't need to understand RAG |
| Context-aware responses for authenticated users | "Your next class is Tuesday at 6pm" — chatbot uses user account data | HIGH | Pass `user_id` to server action; tool can query user's enrollments, credits, etc. |
| Escalation creates structured support ticket | Handoff to inbox creates a real ticket (not just "email us") — ties into existing admin inbox | MEDIUM | On escalation intent: create row in `support_tickets` table with conversation transcript; admin sees it in inbox |
| Confidence-gated responses | Bot declines to answer when retrieval confidence is low and routes to FAQ or escalation | MEDIUM | Score cosine similarity; if below threshold, route to canned "I don't know, here's the FAQ" response |

### Anti-Features (Commonly Requested, Often Problematic)

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Real-time typing indicator ("Mattea is typing...") | Feels more human | Requires WebSocket infrastructure; streaming responses already give immediate feedback — the overhead is not worth it | Streaming tokens via SSE already achieves "feels alive" effect |
| Voice input/output | Modern, multimodal | Very high complexity (Web Speech API + TTS integration), accessibility edge cases, mobile inconsistency — doubles scope | Defer to v2+; text chat covers 95% of support use cases |
| Multi-language chatbot | Inclusive | LLMs handle translation naturally; building explicit language detection and routing is over-engineering | Let the LLM respond in the user's language without building infrastructure for it |
| Chatbot learns from conversations | Sounds powerful | Fine-tuning on user data requires data governance, GDPR compliance, model retraining pipelines — massive scope increase | Use RAG to add new FAQ entries instead; fast, auditable, reversible |
| Multiple chatbot personas per page/section | Flexible | Config explosion, confusing UX, UI complexity — one persona per platform is correct for a community product | One well-tuned persona beats three mediocre ones |
| Full-text search across all conversation history | Admin power feature | Search over encrypted/sensitive chat history raises privacy concerns; not MVP | Export/audit individual conversations on request; search FAQ knowledge base instead |
| Live agent chat (real-time handoff) | "True" omnichannel support | Requires persistent WebSocket connections, agent queue management, presence indicators — this is a separate product | Async ticket escalation: bot creates ticket, admin responds via existing inbox |

---

## Feature Dependencies

```
[Encrypted Key Storage]
    └──required by──> [Chatbot Inference] (must decrypt key server-side to call LLM)
                           └──required by──> [FAQ RAG] (needs LLM for embedding + completion)
                           └──required by──> [Tool Use] (needs LLM to decide tool calls)
                           └──required by──> [Conversation Persistence] (needs inference to exist first)

[FAQ Knowledge Base (admin CRUD)]
    └──feeds──> [RAG Retrieval] (embedding vectors stored in pgvector)
                    └──enhances──> [Chatbot Inference] (context injection into system prompt)

[Chatbot Config (persona, system prompt)]
    └──required by──> [Chatbot Inference] (prepended to every request)

[Conversation Persistence]
    └──splits into──> [Guest sessions] (session_id only)
                      [Auth sessions] (session_id + user_id)
    └──required by──> [Escalation] (needs conversation transcript to create ticket)

[Tool Use / Function Calling]
    └──depends on──> [Chatbot Inference] (LLM must support tool/function schema)
    └──depends on──> [Existing REST API] (tools call internal API endpoints)
    └──enhances──> [Auth Chat] (user-specific tools need user_id from session)

[Escalation to Human]
    └──depends on──> [Conversation Persistence] (transcript must exist to attach to ticket)
    └──writes to──> [Existing Admin Inbox] (creates support_tickets row)
```

### Dependency Notes

- **Encrypted Key Storage is the critical path blocker:** Nothing works until the admin can store a provider API key securely and the server can decrypt it at inference time.
- **FAQ/RAG requires pgvector:** Supabase supports the `pgvector` extension natively — enable it via migration. No external vector DB needed for this scale.
- **Tool use requires auth context:** Guest users can use read-only tools (list events, list courses). User-specific tools (check my credits, my enrollments) require an authenticated session.
- **Escalation is a write-path to existing inbox:** Reuses existing `support_tickets` or `inbox` table structure — no new ticket system needed if one exists.

---

## MVP Definition

### Launch With (v1)

Minimum viable product to validate the chatbot concept.

- [ ] Encrypted third-party key storage — admin enters OpenAI key, it is stored encrypted, never exposed
- [ ] Chatbot configuration — admin sets persona name, system prompt, model (e.g., `gpt-4o-mini`)
- [ ] FAQ knowledge base CRUD (admin) — add/edit/delete FAQ entries, auto-embed on save
- [ ] RAG retrieval — cosine similarity search injects relevant FAQ chunks into system prompt
- [ ] Chat UI with streaming — guest and authenticated users can chat with Mattea
- [ ] Guest session persistence (within browser session via `localStorage`) — guest chat survives page refresh within same visit
- [ ] Authenticated conversation persistence (Supabase rows) — logged-in users see their history on return
- [ ] Escalation button — "Talk to a human" creates a support ticket with conversation transcript

### Add After Validation (v1.x)

Features to add once core chatbot is working and users are engaging.

- [ ] Tool use (read-only) — bot can call `GET /api/v1/events` and `GET /api/v1/courses` to answer live questions — add when users ask "what's happening this week?" type questions
- [ ] User-specific tools — bot can look up a logged-in user's credits, enrollments — add when retention/support tickets show users asking account-specific questions
- [ ] Confidence-gated responses — route low-confidence answers to escalation — add once you have enough conversation data to tune the threshold
- [ ] Admin conversation review — admin can read escalated conversation transcripts from inbox

### Future Consideration (v2+)

Features to defer until product-market fit is confirmed.

- [ ] Voice input/output — after confirming text chat engagement is high
- [ ] Fine-tuning / learning from conversations — requires data governance work
- [ ] Multi-language explicit routing — LLM handles this naturally; explicit routing is premature
- [ ] Live agent handoff (real-time) — after confirming async tickets are insufficient

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Encrypted key storage | HIGH (security gate) | MEDIUM | P1 |
| Chatbot config (persona, system prompt) | HIGH | LOW | P1 |
| FAQ knowledge base (admin CRUD) | HIGH | MEDIUM | P1 |
| RAG retrieval (pgvector) | HIGH | MEDIUM | P1 |
| Chat UI with streaming | HIGH | LOW | P1 |
| Guest session persistence | HIGH | LOW | P1 |
| Auth conversation persistence | HIGH | MEDIUM | P1 |
| Escalation → ticket | HIGH | MEDIUM | P1 |
| Tool use: read-only public data | MEDIUM | HIGH | P2 |
| Tool use: user-specific data | MEDIUM | HIGH | P2 |
| Confidence-gated responses | MEDIUM | MEDIUM | P2 |
| Admin conversation review | LOW | LOW | P2 |
| Voice input/output | LOW | VERY HIGH | P3 |
| Chatbot learns from conversations | LOW (risky) | VERY HIGH | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Implementation Notes by Domain

### Encrypted Key Storage

**Pattern:** AES-256-GCM at application layer (not Supabase Vault, which requires SQL function exposure).

Use Node.js `crypto.createCipheriv('aes-256-gcm', key, iv)` with a 256-bit `ENCRYPTION_SECRET` env var. Store: `{ iv, authTag, ciphertext }` as a single JSON column. Decrypt server-side only, never expose to client.

**Existing hook:** `/admin/api-keys` already has a three-tab shell with "Third Party Keys" as a placeholder tab. This is where admin CRUD for provider keys lands — no new page needed, just activate the tab.

**Confidence:** HIGH — pattern verified against Node.js crypto docs and Supabase community discussions.

### FAQ Knowledge Base + RAG

**Pattern:** pgvector extension in Supabase. Table: `faq_entries (id, question, answer, embedding vector(1536), created_at)`. On admin save, call OpenAI `text-embedding-3-small` (or configured model), store embedding. At inference, embed user query, run `ORDER BY embedding <-> query_embedding LIMIT 5`, inject top results into system prompt as context.

**Confidence:** HIGH — official Vercel AI SDK RAG guide uses this exact pattern.

### Chat Persistence

**Schema approach:**
- `chat_sessions (id, user_id nullable, session_key, created_at, updated_at)`
- `chat_messages (id, session_id FK, role [user|assistant|tool], content, tool_calls jsonb, created_at)`

Guest: `session_key` generated in browser, stored in `localStorage`, sent as header. No `user_id`. Server creates/retrieves session by key.
Auth: Same flow but `user_id` populated from Supabase session. On first auth chat, check if existing guest session can be linked.

**Confidence:** MEDIUM — pattern derived from supabase-community/vercel-ai-chatbot reference implementation and Vercel AI SDK discussion threads.

### Tool Use / Function Calling

**Pattern:** Define tool schemas using Vercel AI SDK `tool()` helper. Tools map to existing REST API internal calls (not HTTP — direct service function calls to avoid auth overhead). LLM returns tool call request, server executes, result injected back into conversation.

Example tools for v1.x:
- `getUpcomingEvents(limit, category)` → calls `listEvents()` service directly
- `getCourses(level, access)` → calls `listCourses()` service directly
- `getUserCredits(userId)` → calls credits service (authenticated only)

**Confidence:** HIGH — Vercel AI SDK tool calling is the primary documented pattern; internal service calls are an architecture decision, not a constraint.

### Escalation

**Pattern:** Either explicit button ("Talk to a human") or intent detection (`user says "speak to agent"`, `"I want help from a person"`). On trigger:
1. Collect conversation transcript from `chat_messages`
2. Create row in existing `support_tickets` (or inbox) table with transcript as JSONB
3. Return confirmation message to user with expected response time
4. Admin sees ticket in existing inbox with full chat history attached

**Confidence:** MEDIUM — depends on whether a `support_tickets` table already exists in the schema. If not, needs migration.

---

## Competitor Feature Analysis

| Feature | Intercom | Crisp | Tidio | Our Approach |
|---------|----------|-------|-------|--------------|
| RAG knowledge base | Yes (Articles integration) | Yes (MagicReply) | Yes (Lyro AI) | Yes — pgvector, admin-managed |
| Guest chat | Yes | Yes | Yes | Yes — session_key in localStorage |
| Persona config | Basic | Basic | Basic | Yes — named "Mattea", full system prompt |
| Tool use | Limited | No | No | Yes (v1.x) — differentiator |
| Encrypted third-party keys | N/A (SaaS) | N/A (SaaS) | N/A (SaaS) | Yes — bring-your-own-key is a core requirement |
| Human escalation | Yes (live agent) | Yes (live agent) | Yes (live agent) | Async ticket — simpler, fits existing inbox |

The key differentiator from SaaS competitors: bring-your-own-key model. Users control their LLM provider and cost, not a per-seat subscription. This is only viable because we control the full stack.

---

## Sources

- [Vercel AI SDK RAG Chatbot Guide](https://sdk.vercel.ai/docs/guides/rag-chatbot) — official, HIGH confidence
- [Vercel AI SDK Tool Calling](https://ai-sdk.dev/cookbook/guides/rag-chatbot) — official, HIGH confidence
- [supabase-community/vercel-ai-chatbot](https://github.com/supabase-community/vercel-ai-chatbot) — reference implementation, HIGH confidence
- [Chatbot to Human Handoff: Complete Guide (2025)](https://www.spurnow.com/en/blogs/chatbot-to-human-handoff) — MEDIUM confidence
- [Chatbot Escalation Best Practices — Cobbai](https://cobbai.com/blog/chatbot-escalation-best-practices) — MEDIUM confidence
- [How to encrypt API keys in Supabase — GitHub Discussion](https://github.com/orgs/supabase/discussions/22583) — MEDIUM confidence
- [Supabase Vault — Makerkit Guide](https://makerkit.dev/blog/tutorials/supabase-vault) — MEDIUM confidence
- [API Key Management Best Practices — OneUptime](https://oneuptime.com/blog/post/2026-02-20-api-key-management-best-practices/view) — MEDIUM confidence
- [A strategic guide to chatbot escalation 2025 — eesel AI](https://www.eesel.ai/blog/chatbot-escalation) — MEDIUM confidence
- [FAQ Chatbot Ultimate Guide — Botpress](https://botpress.com/blog/faq-chatbot) — MEDIUM confidence

---

*Feature research for: AI chatbot support system (GOYA v2 — Mattea milestone)*
*Researched: 2026-03-27*
