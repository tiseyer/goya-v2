# Architecture Research

**Domain:** AI chatbot integration into existing Next.js + Supabase community platform
**Researched:** 2026-03-27
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          Browser / Client                               │
│  ┌───────────────────┐  ┌─────────────────────┐  ┌──────────────────┐  │
│  │  ChatWidget        │  │  Admin Chatbot Page  │  │  Admin Inbox      │  │
│  │  (floating panel)  │  │  /admin/chatbot/*    │  │  + Tickets tab    │  │
│  │  useChat() hook    │  │  (Config/FAQ/Convos)  │  │                  │  │
│  └────────┬──────────┘  └──────────┬──────────┘  └────────┬─────────┘  │
└───────────┼───────────────────────┼──────────────────────┼────────────┘
            │ POST /api/chat         │ Server Actions        │ Server Actions
┌───────────┼───────────────────────┼──────────────────────┼────────────┐
│                          Next.js App Router (Server)                   │
│  ┌────────▼──────────┐  ┌────────▼──────────┐  ┌────────▼──────────┐  │
│  │  /api/chat/route   │  │  Chatbot Config    │  │  Ticket Service   │  │
│  │  streamText()      │  │  Server Actions    │  │  (new)            │  │
│  │  tool definitions  │  │  FAQ CRUD          │  │                   │  │
│  │  rate limiter      │  │  Key CRUD          │  │                   │  │
│  └────────┬──────────┘  └────────┬──────────┘  └────────┬──────────┘  │
│           │                      │                       │             │
│  ┌────────▼──────────────────────▼───────────────────────▼──────────┐  │
│                         Service Layer  lib/ai/*                      │  │
│  ┌────────────────┐  ┌──────────────┐  ┌────────────┐  ┌──────────┐  │  │
│  │  chat.ts       │  │  secrets.ts  │  │  faq.ts    │  │  tools/  │  │  │
│  │  (conversation │  │  (AES-256    │  │  (context  │  │  (tool   │  │  │
│  │   persistence) │  │   encrypt)   │  │   injection│  │   defs)  │  │  │
│  └────────┬───────┘  └──────┬───────┘  └─────┬──────┘  └────┬─────┘  │  │
└───────────┼─────────────────┼─────────────────┼──────────────┼────────┘
            │                 │                 │              │
┌───────────┼─────────────────┼─────────────────┼──────────────┼────────┐
│                          Supabase                                      │
│  ┌────────▼───────┐  ┌─────▼──────────┐  ┌────▼────────┐             │
│  │  chat_sessions  │  │  secrets        │  │  faqs       │             │
│  │  chat_messages  │  │  (AES-256 blob) │  │  chatbot    │             │
│  │  support_tickets│  │  admin-only RLS │  │  _config    │             │
│  └─────────────────┘  └────────────────┘  └─────────────┘             │
└────────────────────────────────────────────────────────────────────────┘
            │
┌───────────▼────────────────────────────────────────────────────────────┐
│                       External AI Providers                             │
│  ┌─────────────────┐  ┌──────────────────────────────────────────────┐ │
│  │  OpenAI / Claude │  │  Keys loaded at runtime from secrets table   │ │
│  │  (via AI SDK v6) │  │  via AES-256 decrypt + SECRETS_MASTER_KEY   │ │
│  └─────────────────┘  └──────────────────────────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Existing or New |
|-----------|----------------|-----------------|
| `ChatWidget` | Floating chat UI on public pages; `useChat()` hook; guest/user session init | NEW client component |
| `/api/chat/route.ts` | Streaming AI endpoint; rate limiting (20/session/hr); tool dispatch; FAQ injection | NEW route handler |
| `lib/ai/chat.ts` | Chat session CRUD; message persistence; guest expiry query | NEW service |
| `lib/ai/secrets.ts` | AES-256-GCM encrypt/decrypt around `SECRETS_MASTER_KEY`; load active AI key at runtime | NEW service |
| `lib/ai/faq.ts` | Fetch published FAQs; format as system context; relevance filter | NEW service |
| `lib/ai/tools/` | Tool definitions for Events, Teachers, Courses, FAQ lookups | NEW, one file per tool domain |
| `app/admin/chatbot/` | Four-tab admin page: Config, FAQ, Conversations, API Connections | NEW admin section |
| `app/admin/inbox/SupportTicketsTab.tsx` | New tab in existing Inbox page; list/detail/respond for escalated tickets | NEW tab in EXISTING page |
| Supabase tables | `secrets`, `chatbot_config`, `faqs`, `chat_sessions`, `chat_messages`, `support_tickets` | NEW migrations |
| Vercel Cron | Guest chat expiry cleanup — extend existing `vercel.json` crons | EXTEND existing |

---

## Recommended Project Structure

New files only — all additions sit alongside existing patterns:

```
lib/
├── ai/
│   ├── chat.ts              # Session/message CRUD (mirrors lib/api/services/ pattern)
│   ├── secrets.ts           # AES-256-GCM encrypt/decrypt, key loader
│   ├── faq.ts               # FAQ context builder
│   ├── tools/
│   │   ├── events.ts        # Tool: query upcoming events via existing lib/events-data
│   │   ├── teachers.ts      # Tool: query teacher profiles via existing lib/members-data
│   │   ├── courses.ts       # Tool: query courses via existing lib/api/services/courses
│   │   └── faq.ts           # Tool: search FAQ entries
│   └── rate-limit.ts        # Chat-specific rate limiter (session+user keyed, 20/hr)

app/
├── api/
│   └── chat/
│       └── route.ts         # POST — streaming AI endpoint
├── admin/
│   └── chatbot/
│       ├── layout.tsx        # Tab shell (Config / FAQ / Conversations / API Connections)
│       ├── page.tsx          # Redirect → /admin/chatbot/config
│       ├── config/
│       │   └── page.tsx     # Name, avatar, active toggle, system prompt, AI key selector
│       ├── faq/
│       │   └── page.tsx     # FAQ table with inline create/edit/delete, publish toggle
│       ├── conversations/
│       │   └── page.tsx     # Conversation list + detail drawer, filters
│       └── api-connections/
│           └── page.tsx     # Toggleable tool switches (Events, Teachers, Courses, FAQ)
└── components/
    └── chat/
        ├── ChatWidget.tsx    # Floating panel (client component, useChat hook)
        ├── ChatPanel.tsx     # Desktop drawer variant
        └── ChatMobile.tsx    # Full-screen mobile variant

supabase/migrations/
├── 20260401_secrets.sql           # secrets table, admin-only RLS
├── 20260402_chatbot_config.sql    # chatbot_config singleton table
├── 20260403_faqs.sql              # faqs table with published status
├── 20260404_chat_sessions.sql     # chat_sessions + chat_messages
└── 20260405_support_tickets.sql   # support_tickets linked to chat_sessions
```

### Structure Rationale

- **`lib/ai/`:** Mirrors the existing `lib/api/services/` pattern — business logic isolated from route handlers, testable independently.
- **`lib/ai/tools/`:** Each tool domain in its own file. Tools are registered in `/api/chat/route.ts` as an object passed to `streamText`. New tools can be added without touching the route.
- **`app/admin/chatbot/`:** Follows `app/admin/api-keys/` folder-per-feature pattern. Tab shell via URL-based routing (matching existing `?tab=` pattern used in inbox/users).
- **`app/components/chat/`:** Widget lives in shared components, not under a route, because it is mounted in the root `app/layout.tsx` and visible across all public pages.
- **New migrations:** Numbered above existing `20260350_*`, one concern per file.

---

## Architectural Patterns

### Pattern 1: Encrypted Secrets at Rest (AES-256-GCM)

**What:** Third-party API keys are encrypted with AES-256-GCM before insertion into Supabase. Decryption happens server-side at runtime using `SECRETS_MASTER_KEY` from environment variables. The plaintext key never leaves the server process.

**When to use:** Any time a third-party credential (AI provider key, OAuth secret) must be stored in the DB and retrieved for server-side calls.

**Trade-offs:** Adds one decrypt operation per AI request (negligible ~0.1ms). Master key rotation requires re-encrypting all stored secrets. Single point of failure is `SECRETS_MASTER_KEY` — must be stored in Vercel env vars, not in codebase.

**Example:**
```typescript
// lib/ai/secrets.ts
import { createCipheriv, createDecipheriv, randomBytes } from 'crypto';

const ALGO = 'aes-256-gcm';

export function encryptSecret(plaintext: string): string {
  const key = Buffer.from(process.env.SECRETS_MASTER_KEY!, 'hex'); // 32 bytes
  const iv = randomBytes(12);
  const cipher = createCipheriv(ALGO, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  // Store iv + tag + ciphertext as base64 for Supabase text column
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decryptSecret(stored: string): string {
  const key = Buffer.from(process.env.SECRETS_MASTER_KEY!, 'hex');
  const buf = Buffer.from(stored, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const ciphertext = buf.subarray(28);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return decipher.update(ciphertext) + decipher.final('utf8');
}

export async function loadActiveAiKey(): Promise<{ provider: string; key: string; model: string }> {
  const supabase = getSupabaseService() as any;
  const { data } = await supabase
    .from('chatbot_config')
    .select('ai_provider, ai_model, secret_id')
    .single();
  const { data: secret } = await supabase
    .from('secrets')
    .select('encrypted_value')
    .eq('id', data.secret_id)
    .single();
  return { provider: data.ai_provider, model: data.ai_model, key: decryptSecret(secret.encrypted_value) };
}
```

### Pattern 2: Session-Keyed Chat Persistence (User + Guest)

**What:** Every chat conversation has a `chat_sessions` row identified by a UUID. Authenticated users link sessions to their `user_id`. Guests receive a session UUID stored in a cookie (`goya_chat_session`) with a 30-day max-age. Messages store in `chat_messages` keyed to `session_id`. The AI route loads prior messages via `initialMessages` in the AI SDK `useChat` hook to restore context.

**When to use:** Whenever you need to restore conversation state across page reloads without requiring authentication.

**Trade-offs:** Guest sessions accumulate indefinitely without a cleanup job. The cron job (see below) handles expiry. Cookie-based guest IDs are deleted if user clears cookies — this is acceptable for support chat.

**Example:**
```typescript
// Simplified — in app/api/chat/route.ts
export async function POST(req: NextRequest) {
  // 1. Rate limit check (session + user keyed)
  // 2. Resolve session: cookie for guests, auth.getUser() for members
  const session = await resolveOrCreateChatSession(req);

  // 3. Load prior messages for context continuity
  const history = await getChatMessages(session.id);

  // 4. Load active AI key + config from secrets table
  const { provider, model, key } = await loadActiveAiKey();

  // 5. Build context: system prompt + FAQ entries + tool availability from chatbot_config
  const systemPrompt = await buildSystemPrompt();

  // 6. Stream response
  const result = streamText({
    model: getModel(provider, model, key),
    system: systemPrompt,
    messages: [...history, ...newMessages],
    tools: await getEnabledTools(),  // filtered by API Connections config
    maxSteps: 3,
  });

  // 7. Persist user + assistant messages after stream completes
  result.onFinish(async ({ response }) => {
    await persistMessages(session.id, response.messages);
    await checkEscalationTriggers(session.id, response);
  });

  return result.toDataStreamResponse();
}
```

### Pattern 3: Escalation Detection + Support Ticket Creation

**What:** After each AI response, `checkEscalationTriggers()` inspects the conversation for escalation signals: (a) explicit user request ("talk to human", "speak to someone"), (b) AI confidence marker in structured output, (c) N consecutive unanswered turns. When triggered, a `support_tickets` row is created linked to the `chat_session_id`, and the session is flagged `escalated: true`.

**When to use:** Any support chatbot that must route complex/emotional issues to human staff.

**Trade-offs:** False-positive escalations are better than missed ones — lean toward triggering. The admin inbox is the human review surface; no email notification needed in MVP.

**Example:**
```typescript
// lib/ai/chat.ts
const ESCALATION_PHRASES = ['speak to', 'talk to human', 'real person', 'agent', 'support team'];

export async function checkEscalationTriggers(sessionId: string, response: CoreAssistantMessage) {
  const lastUserMessage = getLastUserMessage(response);
  const phraseMatch = ESCALATION_PHRASES.some(p => lastUserMessage.toLowerCase().includes(p));
  const lowConfidence = response.text?.includes('[ESCALATE]'); // structured signal in system prompt

  if (phraseMatch || lowConfidence) {
    await createSupportTicket(sessionId);
    await markSessionEscalated(sessionId);
  }
}
```

### Pattern 4: Per-Route Composition for Chat Auth (mirrors API pattern)

**What:** `/api/chat/route.ts` does NOT rely on middleware. It composes session validation + chat-specific rate limiting inline, matching the existing `validateApiKey + rateLimit` composition in `/api/v1/*` routes. This is consistent with the decision recorded in PROJECT.md: "Per-route auth composition for API."

**When to use:** All new API routes in this codebase.

**Trade-offs:** Slightly more boilerplate per route vs middleware. Gain: explicit, testable, no hidden behavior.

---

## Data Flow

### Chat Request Flow (Authenticated User)

```
User types message in ChatWidget
    ↓
useChat() → POST /api/chat  { messages, sessionId }
    ↓
rate-limit.ts  →  exceeded? → 429 response
    ↓
resolveOrCreateChatSession()  →  session row in chat_sessions (user_id = auth.uid())
    ↓
getChatMessages(sessionId)    →  load prior messages
    ↓
loadActiveAiKey()             →  decrypt key from secrets table
    ↓
buildSystemPrompt()           →  chatbot_config.system_prompt + faq.ts context
    ↓
getEnabledTools()             →  filter tools by chatbot_config.enabled_tools[]
    ↓
streamText({ model, system, messages, tools })  →  AI provider API
    ↓
stream chunks → toDataStreamResponse() → browser (text delta events)
    ↓ (after stream finishes)
persistMessages(sessionId, response.messages)
    ↓
checkEscalationTriggers()     →  create support_ticket if triggered
```

### Chat Request Flow (Guest)

```
Guest loads page with ChatWidget
    ↓
ChatWidget reads cookie 'goya_chat_session'
    ↓ if missing
Server Action: createGuestSession()  →  chat_sessions row (user_id = null, anonymous_id = uuid)
    ↓ set-cookie: goya_chat_session=<uuid>; Max-Age=2592000; HttpOnly; SameSite=Lax
    ↓
Same flow as above — sessionId resolves from cookie value
```

### Admin Secrets Write Flow

```
Admin fills in API key in /admin/chatbot/api-connections (or /admin/settings/keys)
    ↓
Server Action: saveSecret({ name, provider, plaintext })
    ↓
encryptSecret(plaintext)  →  base64(iv + tag + ciphertext)
    ↓
INSERT INTO secrets (name, category, encrypted_value)  — admin-only RLS
    ↓
Return secret id → store in chatbot_config.secret_id
```

### Guest Chat Expiry (Cron)

```
Vercel Cron: 0 3 * * *  →  /api/cron/chat-cleanup
    ↓
DELETE FROM chat_messages WHERE session_id IN (
  SELECT id FROM chat_sessions
  WHERE user_id IS NULL
  AND created_at < now() - interval '30 days'
)
    ↓
DELETE FROM chat_sessions WHERE user_id IS NULL AND created_at < now() - 30 days
```

---

## New vs Modified: Explicit Inventory

### New Files

| File | Type | Notes |
|------|------|-------|
| `lib/ai/chat.ts` | Service | Session/message CRUD |
| `lib/ai/secrets.ts` | Service | AES-256-GCM, key loader |
| `lib/ai/faq.ts` | Service | Context builder |
| `lib/ai/rate-limit.ts` | Utility | 20 msg/session/hr sliding window |
| `lib/ai/tools/events.ts` | Tool | Calls existing events-data.ts |
| `lib/ai/tools/teachers.ts` | Tool | Calls existing members-data.ts |
| `lib/ai/tools/courses.ts` | Tool | Calls existing services/courses.ts |
| `lib/ai/tools/faq.ts` | Tool | Direct Supabase query on faqs table |
| `app/api/chat/route.ts` | Route Handler | POST streaming endpoint |
| `app/api/cron/chat-cleanup/route.ts` | Cron Handler | Guest session expiry |
| `app/admin/chatbot/layout.tsx` | Layout | Tab shell |
| `app/admin/chatbot/page.tsx` | Page | Redirect to /config |
| `app/admin/chatbot/config/page.tsx` | Page | Chatbot configuration |
| `app/admin/chatbot/faq/page.tsx` | Page | FAQ management |
| `app/admin/chatbot/conversations/page.tsx` | Page | Conversation viewer |
| `app/admin/chatbot/api-connections/page.tsx` | Page | Tool toggles + key management |
| `app/components/chat/ChatWidget.tsx` | Component | Floating chat panel |
| `app/components/chat/ChatPanel.tsx` | Component | Desktop panel |
| `app/components/chat/ChatMobile.tsx` | Component | Mobile fullscreen |
| 5× migration files | Supabase | secrets, chatbot_config, faqs, chat_sessions/messages, support_tickets |

### Modified Files

| File | Change | Reason |
|------|--------|--------|
| `app/layout.tsx` | Mount `<ChatWidget />` | Make chat available on all public pages |
| `app/admin/inbox/page.tsx` | Add "Support Tickets" tab | Escalation entry point |
| `app/admin/inbox/SupportTicketsTab.tsx` | New file, imported in inbox page | Tab content |
| `app/admin/components/AdminShell.tsx` | Add "Chatbot" nav item to sidebar | Navigation |
| `vercel.json` | Add `chat-cleanup` cron entry | Guest expiry |
| `package.json` | Add `ai` (Vercel AI SDK v6) | Chat streaming |

---

## Integration Points

### With Existing Services

| Existing Service | How New Code Integrates | Notes |
|-----------------|------------------------|-------|
| `lib/api/services/courses.ts` | Chat tool calls `listCourses()` directly | No duplication — reuses existing service |
| `lib/members-data.ts` | Teachers tool queries teacher profiles | Read-only, RLS-safe |
| `lib/events-data.ts` | Events tool queries upcoming events | Read-only |
| `getSupabaseService()` | secrets.ts, chat.ts use service role client | Matches existing pattern |
| `lib/api/middleware.ts` | Chat rate limiter is a new module — does NOT extend API middleware | Separate concern: session-based vs key-based |
| Admin Inbox page | New SupportTicketsTab component plugged into existing tab router | URL param: `?tab=tickets` |
| Vercel Cron | New chat-cleanup cron follows identical pattern to credits-expiring | Same `CRON_SECRET` check |
| Resend email | Not triggered in MVP — escalated tickets surface in admin inbox only | Defer email notification to future milestone |

### External Service Integration

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| OpenAI | `openai(model)` from `@ai-sdk/openai` — key from decrypted secrets | HIGH confidence — official AI SDK |
| Anthropic | `anthropic(model)` from `@ai-sdk/anthropic` — key from decrypted secrets | HIGH confidence — official AI SDK |
| AI SDK v6 | `streamText`, `useChat`, `tool()` from `ai` package | Current version as of 2026-03 |

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-1k users | Current monolith fine. In-memory chat rate limiter matches existing in-memory API rate limiter. |
| 1k-10k users | In-memory rate limiter breaks on multi-instance deployment. Move to Supabase-backed rate limit table (same solution needed for API rate limiter too). |
| 10k+ users | `/api/chat` is the bottleneck — move to edge function or add AI response caching for repeated FAQ queries. |

### Scaling Priorities

1. **First bottleneck:** AI streaming latency (~1-3s to first token). Deploy `/api/chat` with `export const runtime = 'nodejs'` and `export const maxDuration = 60`. Edge runtime not suitable here (Node.js crypto required for AES decrypt).
2. **Second bottleneck:** Supabase connection pool under high concurrent chat load. Use connection pooler (already configured if using Supabase hosted).

---

## Anti-Patterns

### Anti-Pattern 1: Decrypting AI Keys in Client Components

**What people do:** Pass decrypted key from a server action to a client component to initialize the AI SDK client-side.
**Why it's wrong:** Exposes plaintext API key in the browser (network tab, JS bundle). Key can be extracted and used outside the platform.
**Do this instead:** Always call the AI provider from the `/api/chat` route handler (server-side). The client only receives streamed text deltas via the AI SDK `useChat` hook — the key never leaves the server.

### Anti-Pattern 2: Storing Plaintext Keys in Supabase

**What people do:** Store OpenAI/Anthropic keys directly in a `site_settings` or `secrets` table as plaintext text columns.
**Why it's wrong:** Anyone with database access (including Supabase dashboard) can read the keys. RLS alone is insufficient for secrets.
**Do this instead:** Encrypt with AES-256-GCM before insert; decrypt at runtime using `SECRETS_MASTER_KEY` from Vercel env. Only the decrypted value exists briefly in server memory.

### Anti-Pattern 3: Creating a New AdminShell for Chatbot Pages

**What people do:** Build a new layout component for the chatbot admin section because it has its own tabs.
**Why it's wrong:** Duplicates the AdminShell sidebar, breaks navigation consistency, doubles maintenance surface.
**Do this instead:** `app/admin/chatbot/layout.tsx` wraps children in a tab bar only. The AdminShell is inherited from `app/admin/layout.tsx`. Matches the existing pattern: `app/admin/api-keys/` has no nested layout.

### Anti-Pattern 4: Extending the API Rate Limiter for Chat

**What people do:** Reuse `lib/api/middleware.ts`'s `rateLimit()` with a new limit for chat sessions.
**Why it's wrong:** API rate limiting is keyed by API key ID. Chat is keyed by session ID (or user ID). Different concerns, different state.
**Do this instead:** New `lib/ai/rate-limit.ts` module with session/user keying and 20/hr limit. Same sliding-window algorithm, separate Map instance.

---

## Build Order Recommendation

Based on dependencies between components:

1. **Migrations first** — `secrets`, `chatbot_config`, `faqs`, `chat_sessions/messages`, `support_tickets`. Everything else depends on these tables.
2. **`lib/ai/secrets.ts`** — blocks encrypted key management UI and the AI route.
3. **Admin chatbot Config + API Connections pages** — allow admins to configure keys and enable tools before the chat widget is built.
4. **`lib/ai/faq.ts` + FAQ admin page** — populate knowledge base before the AI route uses it.
5. **`/api/chat/route.ts` + `lib/ai/chat.ts`** — core AI backend, depends on secrets + FAQ services.
6. **`lib/ai/tools/`** — tool definitions registered in the route; build after route skeleton exists.
7. **`ChatWidget` + layout.tsx mount** — frontend chat UI, depends on `/api/chat` being live.
8. **`lib/ai/rate-limit.ts`** — add after basic flow works; avoids premature optimization blocking the happy path.
9. **Admin Conversations page** — viewing chat history; depends on `chat_messages` being populated.
10. **Support Tickets tab in Admin Inbox** — depends on escalation logic in the AI route.
11. **Vercel Cron: chat-cleanup** — add last; operational concern.

---

## Sources

- [Vercel AI SDK v6 Documentation](https://ai-sdk.dev/docs/introduction) — HIGH confidence (official, current)
- [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — HIGH confidence (official)
- [Supabase Vault / Securing Data](https://supabase.com/docs/guides/database/secure-data) — HIGH confidence (official)
- [WebSearch: AES-256 encryption in Next.js + Supabase patterns 2025] — MEDIUM confidence (verified against Node.js crypto docs)
- Existing GOYA v2 codebase patterns: `lib/api/middleware.ts`, `lib/api/services/`, `app/api/cron/credits-expiring/`, `app/admin/inbox/page.tsx`, `app/admin/api-keys/` — HIGH confidence (direct code inspection)

---
*Architecture research for: AI chatbot (Mattea) + encrypted secrets + FAQ + tool-use + support tickets in GOYA v2*
*Researched: 2026-03-27*
