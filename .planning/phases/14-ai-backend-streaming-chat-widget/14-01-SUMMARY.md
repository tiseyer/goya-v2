---
phase: 14-ai-backend-streaming-chat-widget
plan: "01"
subsystem: chatbot-backend
tags: [ai, streaming, openai, anthropic, rate-limiting, escalation, faq]
dependency_graph:
  requires: [13-01, 13-02, 13-03]
  provides: [chatbot-api-endpoints, chat-service, rate-limiter, escalation-detector]
  affects: [chat-widget-plan-02]
tech_stack:
  added: [openai, "@anthropic-ai/sdk"]
  patterns: [json-line-streaming, sliding-window-rate-limit, keyword-escalation]
key_files:
  created:
    - lib/chatbot/chat-service.ts
    - lib/chatbot/rate-limit.ts
    - lib/chatbot/escalation.ts
    - app/api/chatbot/config/route.ts
    - app/api/chatbot/message/route.ts
  modified:
    - lib/chatbot/types.ts
    - package.json
decisions:
  - "In-memory sliding window for chat rate limit (20/session/hr) — same pattern as REST API, no external deps needed"
  - "JSON-line streaming format — each line is a JSON object (type: token|done|error|escalation) terminated by newline"
  - "Server-only import on chat-service.ts — crypto module must never reach client bundle"
  - "Escalation returns JSON response directly (no stream) — simplifies widget handling"
metrics:
  duration: ~10 min
  completed: 2026-03-29
  tasks_completed: 2
  files_created: 5
  files_modified: 2
---

# Phase 14 Plan 01: AI Backend — Streaming Chat & Service Modules Summary

**One-liner:** Provider-agnostic AI streaming backend with OpenAI/Anthropic SDK calls, FAQ context injection via XML, in-memory session rate limiting (20/hr), keyword+repeat escalation detection, and message persistence — exposed via two Next.js API routes.

## What Was Built

### Service Modules

**`lib/chatbot/types.ts`** — Extended with four new interfaces: `ChatMessage`, `ChatSession`, `ChatMessageRequest`, `ChatStreamResult`. Existing types preserved unchanged.

**`lib/chatbot/rate-limit.ts`** — In-memory sliding-window rate limiter keyed by session ID. `CHAT_RATE_LIMIT_MAX = 20`, `CHAT_RATE_LIMIT_WINDOW_MS = 3_600_000`. Purges stale entries every 500 calls. Returns 429 with `X-RateLimit-*` headers and `retry_after_seconds` on exceeded limit.

**`lib/chatbot/escalation.ts`** — Exports `detectEscalation(userMessage, recentMessages)`. Two triggers: (1) keyword match against 9 phrases ("talk to human", "real person", etc.), (2) if last 2 user history messages are >80% similar to current message (character overlap ratio).

**`lib/chatbot/chat-service.ts`** — Core `streamChatResponse()` function. Full flow: load config → resolve/create session → load history → detect escalation → decrypt provider key → build FAQ XML context → save user message → stream AI response → save assistant message. Supports `openai` and `anthropic` providers. Uses `TransformStream`-compatible `ReadableStream` with JSON-line output format.

### API Routes

**`app/api/chatbot/config/route.ts`** — `GET /api/chatbot/config`. Public, no auth. Returns `{ is_active, name, avatar_url }`. Includes `Cache-Control: public, s-maxage=60, stale-while-revalidate=300` to prevent DB hammering on widget mount.

**`app/api/chatbot/message/route.ts`** — `POST /api/chatbot/message`. `runtime = 'nodejs'` (required for crypto/decryption). `maxDuration = 60` for streaming. Validates message (non-empty, max 2000 chars). Optional auth check (guests allowed). Rate limits before AI call. Returns streaming `text/plain` for normal chat or `application/json` for escalation.

## Stream Format

Each response is newline-delimited JSON:
- Token: `{"type":"token","content":"word "}\n`
- Done: `{"type":"done","session_id":"uuid"}\n`
- Escalation: `{"type":"escalation","message":"...","session_id":"uuid"}\n`
- Error: `{"type":"error","message":"..."}\n`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all data paths are wired to real Supabase tables (`chatbot_config`, `chat_sessions`, `chat_messages`, `faq_items`, `admin_secrets`, `support_tickets`).

## Self-Check: PASSED

Files exist:
- lib/chatbot/chat-service.ts — FOUND
- lib/chatbot/rate-limit.ts — FOUND
- lib/chatbot/escalation.ts — FOUND
- app/api/chatbot/config/route.ts — FOUND
- app/api/chatbot/message/route.ts — FOUND

Commits:
- 301113b — feat(14-01): add AI SDKs and chatbot service modules
- 06586e1 — feat(14-01): create chatbot API route endpoints
