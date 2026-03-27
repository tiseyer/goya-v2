# Project Research Summary

**Project:** GOYA v2 — Mattea AI Chatbot Milestone
**Domain:** AI chatbot with encrypted key management, RAG knowledge base, tool-use, and mixed-auth persistence on Next.js + Supabase
**Researched:** 2026-03-27
**Confidence:** HIGH

## Executive Summary

This milestone adds a fully-featured AI support chatbot ("Mattea") to the existing GOYA v2 yoga community platform. The research confirms a clear, well-documented implementation path using Vercel AI SDK v6 (`ai@^6.0.140`) on top of the existing Next.js 16 + Supabase stack. The recommended approach: encrypted third-party key storage (AES-256-GCM via Node.js `crypto`, no new library), RAG-based FAQ retrieval using Supabase pgvector, streaming chat via `streamText` + `useChat`, and async escalation to the existing admin inbox. No new backend infrastructure is required beyond npm packages, Supabase migrations, and a distributed rate limiter. The bring-your-own-key model — where admins store their own OpenAI/Anthropic keys encrypted in the DB — is the defining differentiator versus SaaS chatbot competitors.

The architecture follows a strict "encryption at application layer" pattern: API keys are AES-256-GCM encrypted before any DB write and decrypted server-side only at inference time. This means the master key lives exclusively in Vercel environment variables and never touches the database or client bundle. The AI route runs Node.js runtime (not Edge — required for `crypto` module) with `maxDuration = 60`, which is the single most important Vercel configuration not to miss. Tools call existing platform services directly (not via HTTP) to avoid auth overhead.

The two highest-risk areas are security and correctness of the encryption/session layer. Using AES-256-CBC instead of GCM, leaking the master key via a `NEXT_PUBLIC_` prefix, or using a plain UUID cookie as a solo RLS anchor are all mistakes that look correct until they aren't — and recovery from any of them requires rotating every stored credential. The mitigations are known and straightforward if applied from the start. All other risks (rate limiter bypass, streaming timeout, escalation transcript loss) are medium-severity and recoverable post-deploy with no data migration.

---

## Key Findings

### Recommended Stack

The existing GOYA v2 stack (Next.js 16, React 19, TypeScript 5, Supabase, Stripe, Vercel) is unchanged. Five new capabilities require five targeted additions: Vercel AI SDK v6 for inference and streaming, `@ai-sdk/openai` + `@ai-sdk/anthropic` provider adapters for multi-provider flexibility, Zod v4 for tool input schemas (required by AI SDK v6), `iron-session@^8.0.4` for anonymous cookie sessions, and `uuid@^13` for ID generation. AES-256-GCM encryption uses Node.js built-in `crypto` — no third-party encryption library is warranted. Chat persistence uses existing `@supabase/supabase-js`.

**Core technologies (new):**
- `ai@^6.0.140`: Streaming chat via `streamText`, `useChat`, `tool()`, `UIMessage` — official Vercel library, built for Next.js App Router
- `@ai-sdk/openai` + `@ai-sdk/anthropic`: Provider adapters — switching models is one line change at the call site
- `zod@^4.3.6`: Tool input schemas — required by AI SDK v6; v4 is 14x faster than v3
- `iron-session@^8.0.4`: Encrypted, stateless cookie sessions for anonymous users — native App Router support
- Node.js `crypto` (built-in): AES-256-GCM encryption — zero dependencies, audited by Node.js security team

**Critical version notes:**
- AI SDK v6 requires Zod v4.1.8+; confirmed compatible with React 19 and Next.js 16
- Node.js runtime required for chat route — Edge runtime lacks `crypto` module; never add `export const runtime = 'edge'` to any route that decrypts secrets
- AI SDK v6 tool part types changed: `tool-<toolName>` (not `tool-invocation` from v5)

See `.planning/research/STACK.md` for full integration code patterns.

### Expected Features

Encrypted key storage is the critical path dependency: nothing works until the admin can store a provider API key securely and the server can decrypt it at inference time. All other features cascade from this.

**Must have (table stakes):**
- Encrypted third-party key storage — AES-256-GCM; admin enters OpenAI/Anthropic key, never stored plaintext
- Chatbot configuration (persona name "Mattea", system prompt, model selector, on/off switch)
- FAQ knowledge base CRUD (admin-managed, auto-embedded via pgvector on save)
- RAG retrieval — cosine similarity search injects top 3-5 relevant FAQ chunks into system prompt
- Streaming chat UI — guest and authenticated users can chat; `useChat` hook with `DefaultChatTransport`
- Guest session persistence — session UUID in `localStorage`/cookie, survives page refresh within visit
- Authenticated conversation persistence — linked to `user_id`, survives return visits
- Escalation to human — "Talk to a human" button creates support ticket with full transcript in existing admin inbox

**Should have (competitive differentiators, v1.x):**
- Tool use: read-only public data (events, courses, teachers) — bot answers "what's happening this week?" with live data
- User-specific tools — credits, enrollments for authenticated users
- Confidence-gated responses — cosine similarity threshold triggers escalation when answer quality is low

**Defer (v2+):**
- Voice input/output — doubles scope, text chat covers 95% of support cases
- Fine-tuning from conversations — data governance, GDPR compliance, retraining pipeline
- Live agent handoff (real-time) — async ticket escalation sufficient for this scale

See `.planning/research/FEATURES.md` for full dependency map and prioritization matrix.

### Architecture Approach

New code is entirely additive: a `lib/ai/` service layer (mirroring existing `lib/api/services/`), a `POST /api/chat` streaming route, an `app/admin/chatbot/` four-tab admin section, a floating `ChatWidget` mounted in `app/layout.tsx`, and five Supabase migrations. The existing inbox, admin shell, and Vercel cron config each receive one small extension. Nothing in the existing REST API, auth, or billing flows is modified.

**Major components:**
1. `/api/chat/route.ts` — streaming AI endpoint; composes session resolution, rate limiting, secret decryption, FAQ injection, tool dispatch, and persistence in one Node.js route handler
2. `lib/ai/secrets.ts` — AES-256-GCM encrypt/decrypt; loads active AI key from `secrets` table at inference time
3. `lib/ai/faq.ts` — pgvector cosine similarity search; formats top results as XML-delimited context block injected into system prompt
4. `lib/ai/tools/` — one file per tool domain (events, teachers, courses, faq); call existing service functions directly, not via HTTP
5. `app/components/chat/ChatWidget.tsx` — floating chat panel mounted globally; handles guest/auth session init, `useChat` streaming, tool result rendering
6. `app/admin/chatbot/` — four-tab admin section: Config, FAQ, Conversations, API Connections
7. Supabase tables: `secrets`, `chatbot_config`, `faqs`, `chat_sessions`, `chat_messages`, `support_tickets`

Build order from ARCHITECTURE.md: migrations → secrets service → admin config/API connections UI → FAQ service + admin UI → `/api/chat` route → tools → `ChatWidget` → rate limiter → conversations admin → escalation + support tickets tab → cron cleanup.

See `.planning/research/ARCHITECTURE.md` for full data flow diagrams and file inventory.

### Critical Pitfalls

Ten pitfalls were identified. The five most critical:

1. **AES-256-CBC instead of GCM** — CBC has no integrity check; tampered ciphertext decrypts silently. Use GCM exclusively; store `iv` (12B) + `auth_tag` (16B) + `ciphertext` per record. Recovery requires re-encrypting all secrets and rotating all provider keys.

2. **SECRETS_MASTER_KEY leaked to client bundle** — Prefixing with `NEXT_PUBLIC_` or importing the encryption module in any `'use client'` file exposes the master key to every visitor. Add a build-time `typeof window !== 'undefined'` guard in the encryption module; keep it in `lib/server/` or `lib/ai/`.

3. **Anonymous guest cookie as sole RLS anchor** — A plain UUID cookie is spoofable. Use Supabase anonymous sign-in (`supabase.auth.signInAnonymously()`) so RLS checks `auth.uid()` from a JWT, not an application-passed cookie value. This is the correct architectural decision before the schema is created.

4. **In-memory rate limiter for chat endpoint** — Vercel runs multiple serverless instances; in-memory counters don't share state. Use Upstash Redis (`@upstash/ratelimit`) or Vercel KV for distributed rate limiting on the chat route. The existing in-memory limiter is fine for the REST API but not for chatbot.

5. **Prompt injection via FAQ content** — FAQ entries are injected into the LLM system prompt. Always delimit with XML tags (`<faq_context>...</faq_context>`) and instruct the model to treat the block as data. Sanitise FAQ content at write time. This is OWASP LLM Top 10 2025 LLM01.

Additional pitfalls: streaming timeout without `maxDuration = 60`, decrypted API keys in error logs, tool calls with write-permission keys, escalation tickets with no transcript link, and shared Supabase client across requests. See `.planning/research/PITFALLS.md` for full detail including the "Looks Done But Isn't" verification checklist.

---

## Implications for Roadmap

Based on the dependency chain identified in FEATURES.md and the build order from ARCHITECTURE.md, five phases are recommended.

### Phase 1: Encrypted Secrets Infrastructure + Admin Key Management

**Rationale:** Encrypted key storage is the critical path blocker — all AI inference depends on being able to decrypt a valid provider key at runtime. This must ship first, even before the chat UI exists.
**Delivers:** Admin can store OpenAI/Anthropic API keys encrypted; server can load and decrypt them at inference time; Third Party Keys tab in `/admin/api-keys` is activated.
**Addresses:** Encrypted key storage (P1 table stakes); Admin UI for keys (P1 table stakes)
**Avoids:** AES-256-CBC pitfall, SECRETS_MASTER_KEY client bundle exposure, plaintext keys in Supabase
**Stack:** Node.js `crypto` (built-in), 1× Supabase migration (`secrets` table, admin-only RLS)
**Research flag:** Standard pattern — well-documented in Node.js crypto docs and existing STACK.md code samples. Skip research phase.

### Phase 2: Chat Foundation — Database Schema + Guest/Auth Sessions

**Rationale:** Schema must exist before the AI route can persist messages. The guest session architectural decision (Supabase anonymous auth vs cookie UUID) must be locked in here — changing it after messages are stored requires data migration.
**Delivers:** `chatbot_config`, `chat_sessions`, `chat_messages`, `support_tickets` migrations; guest session init via Supabase anonymous auth; per-request Supabase client pattern established.
**Addresses:** Guest session persistence, authenticated conversation persistence (P1 table stakes)
**Avoids:** Anonymous cookie as sole RLS anchor pitfall, shared Supabase client across requests
**Stack:** `iron-session@^8.0.4` (or Supabase anon auth), existing `@supabase/supabase-js`
**Research flag:** Supabase anonymous auth is the correct architectural choice per PITFALLS.md. Verify `supabase.auth.signInAnonymously()` flow and RLS policy structure before implementing. May benefit from a focused research pass.

### Phase 3: AI Backend Route + Streaming Chat UI

**Rationale:** Core product value. Requires Phase 1 (secrets) and Phase 2 (session/schema). This phase wires everything together: streaming inference, FAQ RAG injection, persistence, and rate limiting. The `ChatWidget` also lands here.
**Delivers:** `POST /api/chat` streaming endpoint; `ChatWidget` mounted in `app/layout.tsx`; end-to-end chat working for guests and authenticated users; Vercel AI SDK `useChat` integration.
**Addresses:** Chat UI with streaming, RAG retrieval, chatbot config/persona (all P1 table stakes)
**Avoids:** Streaming timeout (needs `maxDuration = 60`), in-memory rate limiter (needs Upstash/Vercel KV), decrypted key in logs, AI SDK v5 part type names
**Stack:** `ai@^6.0.140`, `@ai-sdk/openai`, `@ai-sdk/anthropic`, `zod@^4.3.6`, Upstash Redis or Vercel KV
**Research flag:** Distributed rate limiting setup (Upstash vs Vercel KV) needs a quick implementation check. AI SDK v6 streaming patterns are well-documented; standard.

### Phase 4: FAQ Knowledge Base + Tool Use

**Rationale:** FAQ and tool use both enhance the core AI route from Phase 3. FAQ can be built independently of tool use; tool use requires the route skeleton. FAQ is higher priority (P1 table stakes vs P2 for tools).
**Delivers:** Admin FAQ CRUD with auto-embedding on save; pgvector cosine similarity retrieval; tool definitions for events/courses/teachers/FAQ; admin "API Connections" page with tool toggles.
**Addresses:** FAQ knowledge base (P1 table stakes), tool use for public data (P2 differentiator)
**Avoids:** Prompt injection via FAQ (XML delimiter pattern required), tool write-permission pitfall (read-only tools with dedicated API key), full FAQ corpus injected on every turn (top-3-5 only)
**Stack:** OpenAI `text-embedding-3-small` for embeddings, Supabase pgvector extension, existing service functions for direct tool calls
**Research flag:** pgvector setup and embedding workflow in Supabase is well-documented via official Vercel AI SDK RAG guide. Standard pattern; skip research phase.

### Phase 5: Escalation + Admin Chatbot Management UI

**Rationale:** Escalation requires chat_sessions to exist (Phase 2) and active conversations (Phase 3). Admin conversations view requires messages to be populated. This phase completes the admin surface and the support handoff loop.
**Delivers:** Escalation detection triggers support ticket creation with full transcript; Support Tickets tab in admin inbox; admin `chatbot/conversations` page; guest session expiry cron.
**Addresses:** "Talk to a human" escalation (P1 table stakes), admin conversation review (P2), chatbot on/off switch
**Avoids:** Escalation tickets missing transcript (must include `chat_session_id` FK and admin inbox renders linked conversation), context loss when guest upgrades to member
**Stack:** Existing admin inbox pattern, Vercel Cron (extend `vercel.json`), existing Supabase `support_tickets` schema
**Research flag:** Standard admin UI pattern — matches existing inbox tab structure. No research phase needed.

### Phase Ordering Rationale

- Phases 1 and 2 must precede Phase 3 because the AI route requires decryptable keys and a persisted session schema.
- Phase 4 (FAQ + tools) follows Phase 3 because tools are registered inside the route handler — the route skeleton must exist first.
- Phase 5 (escalation + admin management) follows Phase 3 because it depends on populated conversations and the AI route's `onFinish` callback.
- FAQ (Phase 4) is split from escalation (Phase 5) because they have no mutual dependency and separating them keeps each phase focused.

### Research Flags

Phases needing deeper research during planning:
- **Phase 2:** Supabase anonymous auth RLS pattern — verify `is_anonymous: true` JWT, correct policy syntax, and session merge on sign-in before schema is locked.
- **Phase 3:** Distributed rate limiting — choose between Upstash Redis and Vercel KV; check pricing and setup complexity for this project's scale.

Phases with standard patterns (skip research phase):
- **Phase 1:** AES-256-GCM with Node.js `crypto` — complete code in STACK.md and ARCHITECTURE.md.
- **Phase 4:** pgvector + embedding workflow — covered by official Vercel AI SDK RAG guide.
- **Phase 5:** Admin UI and cron — follows existing patterns from inbox and credits-expiring cron.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified via npm registry; AI SDK v6 patterns verified against official docs; version compatibility confirmed |
| Features | MEDIUM-HIGH | Core patterns HIGH (official docs); escalation and chat persistence patterns MEDIUM (community reference implementations) |
| Architecture | HIGH | Based on existing GOYA v2 codebase patterns + official Vercel AI SDK architecture docs; build order is logical and dependency-validated |
| Pitfalls | HIGH | Critical pitfalls verified against OWASP LLM Top 10 2025, official Supabase security docs, and Vercel timeout documentation |

**Overall confidence:** HIGH

### Gaps to Address

- **Supabase anonymous auth session merge on sign-in:** Research confirmed this is the correct approach for guest-to-auth upgrade, but the exact implementation (carrying `chat_session_id` through the upgrade flow, Supabase merge API) needs verification during Phase 2 planning.
- **Support tickets schema:** Research assumes a `support_tickets` table either exists or will be created. If a conflicting inbox schema already exists in the codebase, the migration design may need adjustment. Verify against current schema before Phase 5 planning.
- **Upstash vs Vercel KV for distributed rate limiting:** Both work; the choice affects cost and integration complexity. Resolve during Phase 3 planning based on current Vercel plan and existing dependencies.
- **Embedding model selection:** Research recommends `text-embedding-3-small` for FAQ embeddings. Confirm this is available on the admin's OpenAI key tier; `text-embedding-ada-002` is the fallback.

---

## Sources

### Primary (HIGH confidence)
- [ai-sdk.dev — Getting started with Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)
- [ai-sdk.dev — UIMessage reference + tool part types](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message)
- [ai-sdk.dev — Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence)
- [ai-sdk.dev — Tools and Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling)
- [Vercel AI SDK RAG Chatbot Guide](https://sdk.vercel.ai/docs/guides/rag-chatbot)
- [Vercel blog — AI SDK 6 release notes](https://vercel.com/blog/ai-sdk-6)
- [Supabase Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)
- [Supabase Advanced Auth — Session Leakage](https://supabase.com/docs/guides/auth/server-side/advanced-guide)
- [OWASP LLM Top 10 2025 — LLM01 Prompt Injection](https://genai.owasp.org/llmrisk/llm01-prompt-injection/)
- [Vercel AI SDK — Timeout Troubleshooting](https://ai-sdk.dev/docs/troubleshooting/timeout-on-vercel)
- [Vercel Functions — Max Duration](https://vercel.com/docs/functions/configuring-functions/duration)
- [nodejs.org/api/crypto — AES-256-GCM](https://nodejs.org/api/crypto.html)
- [github.com/vvo/iron-session — v8 App Router API](https://github.com/vvo/iron-session)

### Secondary (MEDIUM confidence)
- [supabase-community/vercel-ai-chatbot](https://github.com/supabase-community/vercel-ai-chatbot) — chat persistence schema patterns
- [Upstash Rate Limiting for Next.js](https://upstash.com/blog/nextjs-ratelimiting) — distributed rate limiter pattern
- [Chatbot to Human Handoff Guide 2025](https://www.spurnow.com/en/blogs/chatbot-to-human-handoff) — escalation patterns
- [Supabase Vault — Makerkit Guide](https://makerkit.dev/blog/tutorials/supabase-vault) — encryption alternatives considered
- [FAQ Chatbot Ultimate Guide — Botpress](https://botpress.com/blog/faq-chatbot) — feature landscape

---
*Research completed: 2026-03-27*
*Ready for roadmap: yes*
