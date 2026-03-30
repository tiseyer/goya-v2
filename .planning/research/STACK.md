# Stack Research

**Domain:** AI chatbot with encrypted key management, tool-use, and real-time chat persistence
**Researched:** 2026-03-27
**Confidence:** HIGH (npm versions verified via registry, AI SDK v6 part types verified via official docs)

---

## Context

This research covers ONLY new additions to the existing GOYA v2 stack. Existing stack (Next.js 16, React 19, TypeScript 5, Tailwind 4, Supabase, Stripe, Resend, Vercel) is validated and unchanged.

Five capability gaps need filling:

1. **AI inference** — streaming chat responses with OpenAI/Anthropic
2. **Tool use** — structured function calling so the AI can take actions
3. **Encrypted key storage** — AES-256 encryption for user-supplied third-party API keys
4. **Anonymous sessions** — cookie-based session identity for unauthenticated users
5. **Chat persistence** — store and reload conversation history from Supabase

---

## Recommended Stack

### Core Technologies (NEW)

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| `ai` | ^6.0.140 | Vercel AI SDK core — streamText, tool(), UIMessage types | Official Vercel library built for Next.js App Router; unified API across providers; streaming built-in; tool-use native; actively maintained |
| `@ai-sdk/react` | ^3.0.142 | useChat hook for client-side streaming UI | Part of same SDK; provides useChat with correct React 19 compatibility and DefaultChatTransport |
| `@ai-sdk/openai` | ^3.0.48 | OpenAI provider adapter for AI SDK | Official adapter; typed, zero-config once env var set |
| `@ai-sdk/anthropic` | ^3.0.64 | Anthropic provider adapter for AI SDK | Official adapter; allows switching between GPT and Claude without changing call site |
| `zod` | ^4.3.6 | Schema validation for tool inputs and API contracts | Required by AI SDK for tool input schemas; Zod v4 is confirmed compatible with AI SDK v6 (verified) |

### Supporting Libraries (NEW)

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `iron-session` | ^8.0.4 | Cookie-based anonymous sessions — encrypted, stateless | For unauthenticated users who need a persistent session ID before they log in; handles encryption and secure cookie flags automatically |
| `uuid` | ^13.0.0 | Generate session and message IDs | Generate anonymous session IDs on first visit; generate server-side message IDs for persistence consistency |

### No New Library Needed

| Capability | Approach | Rationale |
|------------|----------|-----------|
| AES-256-GCM encryption | Node.js built-in `crypto` module | Node.js `crypto.createCipheriv('aes-256-gcm', ...)` is standard, audited, and zero-dependency; no third-party encryption library is needed or recommended |
| Chat message persistence | Existing `@supabase/supabase-js` | Standard DB insert/select via existing client; no additional library needed |
| Streaming HTTP responses | Next.js App Router + AI SDK | `streamText().toUIMessageStreamResponse()` returns a standard `Response`; Next.js handles it natively |

---

## Installation

```bash
# AI inference and tool use
npm install ai @ai-sdk/react @ai-sdk/openai @ai-sdk/anthropic zod

# Anonymous sessions
npm install iron-session uuid
```

---

## Integration Points

### AI SDK with Next.js App Router

Route handler pattern (Node.js runtime, not Edge — required for crypto module):

```typescript
// app/api/chat/route.ts
import { streamText, convertToModelMessages, UIMessage, tool, validateUIMessages } from 'ai';
import { openai } from '@ai-sdk/openai';
import { z } from 'zod';

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();
  const validated = validateUIMessages(messages);

  const result = streamText({
    model: openai('gpt-4.1'),        // current capable OpenAI model for chat
    messages: await convertToModelMessages(validated),
    tools: {
      lookupFaq: tool({
        description: 'Look up FAQ answer by topic',
        inputSchema: z.object({ topic: z.string() }),
        execute: async ({ topic }) => { /* ... */ },
      }),
    },
    onFinish: ({ messages: allMessages }) => {
      // persist to Supabase here — call result.consumeStream() without await
      // to ensure save completes even if client disconnects
    },
  });

  return result.toUIMessageStreamResponse();
}
```

Client component pattern (AI SDK v6 uses `DefaultChatTransport`, not `api` string):

```typescript
// 'use client'
import { useChat } from '@ai-sdk/react';
import { DefaultChatTransport } from 'ai';

const { messages, sendMessage, status } = useChat({
  transport: new DefaultChatTransport({ api: '/api/chat' }),
});
// status values: 'ready' | 'submitted' | 'streaming'
// sendMessage({ text: input }) — not handleSubmit (removed in v6)
```

### AI SDK v6 UIMessage Part Types

In AI SDK v6, tool parts are namespaced by tool name. The part type is `tool-<toolName>`, not `tool-invocation` (that was v5). This is a breaking change from v5.

```typescript
// Rendering tool parts in the chat UI
message.parts?.map((part, i) => {
  if (part.type === 'text') {
    // render part.text — use a markdown renderer for assistant messages
    return <span key={i}>{part.text}</span>;
  }
  // Tool parts: type is "tool-lookupFaq", "tool-createTicket", etc.
  if (part.type.startsWith('tool-')) {
    const toolName = part.type.replace('tool-', '');
    if (part.state === 'output-available') {
      return <ToolResult key={i} name={toolName} output={part.output} />;
    }
    return <span key={i} className="animate-pulse">Running {toolName}...</span>;
  }
  // Skip 'step-start', handle 'reasoning' if needed
  return null;
});
```

### AES-256-GCM Encryption Pattern (Node.js crypto, no library)

```typescript
// lib/encryption.ts
import { randomBytes, createCipheriv, createDecipheriv } from 'crypto';

const ALGORITHM = 'aes-256-gcm';
const KEY = Buffer.from(process.env.ENCRYPTION_KEY!, 'hex'); // 32-byte key from hex

export function encrypt(plaintext: string): string {
  const iv = randomBytes(12); // 96-bit IV for GCM
  const cipher = createCipheriv(ALGORITHM, KEY, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag(); // 16-byte auth tag
  return Buffer.concat([iv, tag, encrypted]).toString('base64');
}

export function decrypt(ciphertext: string): string {
  const buf = Buffer.from(ciphertext, 'base64');
  const iv = buf.subarray(0, 12);
  const tag = buf.subarray(12, 28);
  const encrypted = buf.subarray(28);
  const decipher = createDecipheriv(ALGORITHM, KEY, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8');
}
```

Generate the key once: `openssl rand -hex 32` — store result as `ENCRYPTION_KEY` env var.

### iron-session Anonymous Session Pattern

```typescript
// lib/session.ts
import { getIronSession, SessionOptions } from 'iron-session';
import { cookies } from 'next/headers';

export interface SessionData {
  anonymousId?: string;
}

const sessionOptions: SessionOptions = {
  cookieName: 'goya_session',
  password: process.env.SESSION_SECRET!,  // 32+ char random string
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 30, // 30 days
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
```

### Chat Persistence with Supabase

No new library. Pattern: insert messages in `onFinish` callback using the existing Supabase client. Link rows to either `user_id` (authenticated) or `anonymous_session_id` (from iron-session). Call `result.consumeStream()` (without await) before returning the response so the save completes even when the client disconnects mid-stream.

---

## Alternatives Considered

| Recommended | Alternative | Why Not |
|-------------|-------------|---------|
| `ai` (Vercel AI SDK v6) | Direct `openai` npm package | AI SDK provides streaming abstraction, useChat hook, tool-use, and UIMessage normalization — all would need to be hand-rolled with the raw OpenAI client |
| `@ai-sdk/openai` + `@ai-sdk/anthropic` direct | Vercel AI Gateway | Gateway is an optional routing layer requiring additional Vercel permissions setup; direct provider keys are simpler and the correct starting point for GOYA v2; adopt gateway later when multi-provider failover or spend caps are needed |
| `@ai-sdk/openai` + `@ai-sdk/anthropic` direct | Single provider only | GOYA needs flexibility to choose the best model per use case (cost, capability); AI SDK makes switching one line |
| Node.js `crypto` for AES | `crypto-js`, `node-forge`, third-party | Built-in crypto is audited by the Node.js security team; third-party libraries add attack surface with zero benefit for server-side encryption |
| `iron-session` for anonymous sessions | JWT in cookie (jose) | iron-session handles cookie encryption and secure flags automatically, with native Next.js App Router support; jose requires manual implementation of the same concerns |
| `iron-session` for anonymous sessions | Supabase anonymous auth | Supabase anonymous auth provisions a real DB user per visitor — creates orphan accounts at scale; a session cookie suffices for anonymous chat identity |
| Zod v4 | Zod v3 | AI SDK v6 is confirmed compatible with Zod v4.1.8+; Zod v4 is 14x faster with a 57% smaller core; no reason to pin v3 |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `langchain` / `llamaindex` | Massive dependency trees, frequent breaking changes, abstracts too much; AI SDK v6 covers all needed patterns natively | Vercel AI SDK |
| `openai` package directly | Lacks streaming UI helpers, no useChat, no tool-use normalization, no multi-provider | `ai` + `@ai-sdk/openai` |
| Edge Runtime for chat route | Node.js `crypto` module is NOT available in Edge Runtime — AES-256-GCM requires it | Node.js runtime (default) — do NOT add `export const runtime = 'edge'` to any chat or encryption route |
| AI SDK v5 | v5's compatibility bridge with v6 was removed in Next.js 16.2; starting on v6 avoids a forced migration mid-project | `ai@^6.0.140` |
| v5-era part types (`tool-invocation`, `tool-result`) | These part type names were removed in AI SDK v6; using them silently renders nothing | Check `part.type.startsWith('tool-')` and use `part.type.replace('tool-', '')` for the tool name |

---

## Stack Patterns by Variant

**If using only OpenAI (simpler):**
- Drop `@ai-sdk/anthropic`
- Model: `openai('gpt-4.1')` for chat, `openai('gpt-4.1-mini')` for lower-cost FAQ lookups
- Still keep `@ai-sdk/openai` for the typed adapter

**If switching to Anthropic:**
- Drop `@ai-sdk/openai`, add `@ai-sdk/anthropic`
- Model: `anthropic('claude-sonnet-4.6')` — one line change at the call site

**If adding streaming tool results to UI:**
- Use `useChat` with `DefaultChatTransport`
- Iterate `message.parts` — tool parts have type `tool-<toolName>` (NOT `tool-invocation`)
- Render `state === 'output-available'` for completed results, loading state otherwise

**If supporting authenticated + anonymous users:**
- Check Supabase session first; fall back to iron-session anonymous ID
- Link chat sessions in DB to `user_id` OR `anonymous_session_id`, never both null

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `ai@^6.0.140` | React 19.2.3 | Confirmed compatible — Vercel AI SDK 6 + Next.js 16 officially supported |
| `ai@^6.0.140` | Next.js 16.1.6 | AI SDK 6 required for Next.js 16.2+; 16.1.6 is compatible |
| `ai@^6.0.140` | `zod@^4.3.6` | Zod v4.1.8+ required for AI SDK 5+; v4.3.6 satisfies this |
| `iron-session@^8.0.4` | Next.js App Router | v8 redesigned specifically for App Router — uses `getIronSession(await cookies(), opts)` |
| Node.js `crypto` | Vercel Node.js Runtime | Available in all Node.js runtimes; NOT in Edge Runtime |

---

## Required Environment Variables

```bash
# AI Providers — direct keys, not AI Gateway OIDC
# (AI Gateway is an optional Vercel add-on; adopt when failover/spend-caps are needed)
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...

# Encryption key for AES-256-GCM (generate: openssl rand -hex 32)
ENCRYPTION_KEY=<64-char hex string>

# Session secret for iron-session (generate: openssl rand -base64 32)
SESSION_SECRET=<32+ char random string>
```

---

## Sources

- [ai-sdk.dev — Getting started with Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router) — Package names, route handler pattern, DefaultChatTransport (HIGH)
- [ai-sdk.dev — UIMessage reference](https://ai-sdk.dev/docs/reference/ai-sdk-core/ui-message) — v6 part types including `tool-<toolName>` pattern (HIGH)
- [ai-sdk.dev — Tools and Tool Calling](https://ai-sdk.dev/docs/ai-sdk-core/tools-and-tool-calling) — tool() function signature, inputSchema, execute (HIGH)
- [ai-sdk.dev — Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — onFinish, consumeStream, validateUIMessages (HIGH)
- [ai-sdk.dev — Zod TypeScript performance](https://ai-sdk.dev/docs/troubleshooting/typescript-performance-zod) — Zod v4.1.8+ required for AI SDK 5+ (HIGH)
- [vercel.com/docs/ai-gateway](https://vercel.com/docs/ai-gateway) — Gateway is optional, requires permissions setup; BYOK with no token markup (HIGH)
- [npm registry — `npm view ai version`](https://www.npmjs.com/package/ai) — ai@6.0.140 verified (HIGH)
- [npm registry — `npm view iron-session version`](https://www.npmjs.com/package/iron-session) — iron-session@8.0.4 verified (HIGH)
- [github.com/vvo/iron-session](https://github.com/vvo/iron-session) — v8 App Router API, cookie options (HIGH)
- [nodejs.org/api/crypto](https://nodejs.org/api/crypto.html) — AES-256-GCM built-in crypto API (HIGH)
- [vercel.com/blog/ai-sdk-6](https://vercel.com/blog/ai-sdk-6) — AI SDK 6 release notes, React 19 / Next.js 16 compatibility (HIGH)

---

*Stack research for: AI chatbot, encrypted key management, tool-use, anonymous sessions*
*Researched: 2026-03-27*
