# Phase 1: Schema & Infrastructure - Research

**Researched:** 2026-04-03
**Domain:** Supabase schema migrations, NDJSON streaming protocol, React custom hooks
**Confidence:** HIGH — all findings verified by direct codebase inspection

---

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
All implementation choices are at Claude's discretion — pure infrastructure phase. Use ROADMAP phase goal, success criteria, and codebase conventions to guide decisions.

Key constraints from research (PITFALLS.md):
- Fix `question` → `question_summary` column bug in chat-service.ts (INFRA-03)
- `started_from` column needs DEFAULT 'chat_widget' to avoid breaking getOrCreateSession
- Extract `useChatStream` hook from ChatPanel, InlineChat, MatteaSearchHint (INFRA-04)
- Server `done` chunk must include `message_id` for feedback targeting (INFRA-05)

### Claude's Discretion
All implementation choices deferred to Claude (infrastructure phase).

### Deferred Ideas (OUT OF SCOPE)
None — infrastructure phase.
</user_constraints>

---

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | DB migration adds `started_from`, `user_feedback`, `feedback_at` to conversations table | Schema verified; DEFAULT 'widget' required to avoid NOT NULL violation on existing rows |
| INFRA-02 | DB migration adds `ticket_type`, `rejection_reason` to support_tickets table | Schema verified; CHECK constraint and DEFAULT 'human_escalation' required |
| INFRA-03 | Fix existing bug where chat-service.ts writes to `question` instead of `question_summary` | Bug confirmed at line 112; fix is a one-line column name change |
| INFRA-04 | Extract shared `useChatStream` hook from 3 duplicated stream loops | All three loops confirmed identical NDJSON state machine; extraction is safe |
| INFRA-05 | Server returns `message_id` in streaming done chunk | Insert+select pattern available in Supabase; done chunk currently emits only `session_id` |
</phase_requirements>

---

## Summary

This phase is purely infrastructural — no user-visible features. It establishes the DB schema and shared code patterns that every subsequent phase depends on. All five requirements are tightly interdependent: the migration (INFRA-01, INFRA-02) must land before any feedback or ticket logic, the bug fix (INFRA-03) must be in the same migration PR to avoid creating more broken records, the shared hook (INFRA-04) must be extracted before any new stream event types are added, and the `message_id` return (INFRA-05) must be wired into the shared hook so that all three surfaces receive it automatically.

The codebase uses Supabase with a service-role client cast to `any`, which means TypeScript will not catch column-name mistakes. Every DB insert must be manually cross-checked against migration files. The streaming protocol is NDJSON over a single `ReadableStream` — each chunk is a newline-terminated JSON object. The three client components (ChatPanel, InlineChat, MatteaSearchHint) contain near-identical `handleSend` functions with the same reader loop; the only differences are localStorage keys, UI elements, and whether an `anonymous_id` is included in the POST body.

**Primary recommendation:** Do the migration and bug fix first (Tasks 1+2 together), then extract the hook (Task 3), then wire `message_id` into the hook and server (Task 4). Validate TypeScript compiles clean after each task.

---

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Supabase (service client) | existing | DB writes from server | Already used throughout chat-service.ts and chat-actions.ts |
| Next.js App Router | existing | Route handlers + Server Actions | Established project pattern |
| React hooks | existing | Client state machine | Project uses functional components throughout |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `crypto.randomUUID()` | Web API | Client-side message IDs | Temporary IDs for optimistic UI before server ID arrives |
| `ReadableStream` + NDJSON | Web API | Streaming chat responses | Existing streaming protocol — do not change the wire format |

### Alternatives Considered
None — this is a pure infrastructure phase working within the existing stack. No new dependencies are introduced.

**Installation:** No new packages required for this phase.

---

## Architecture Patterns

### Recommended Project Structure
```
lib/
├── chatbot/
│   ├── chat-service.ts      # Server: streaming handler (INFRA-03, INFRA-05 changes here)
│   ├── chat-actions.ts      # Server Actions: session CRUD (INFRA-01 affects getOrCreateSession)
│   ├── types.ts             # Shared types (add ChatStreamChunk type)
│   └── useChatStream.ts     # NEW: extracted client hook (INFRA-04)
supabase/
└── migrations/
    └── 20260405_mattea_intelligence_schema.sql  # NEW: INFRA-01 + INFRA-02
app/components/chat/
└── ChatPanel.tsx            # Refactored to use useChatStream
app/settings/help/
└── InlineChat.tsx           # Refactored to use useChatStream
app/components/search/
└── MatteaSearchHint.tsx     # Uses hook only for the streaming variant (see Pitfall 10)
```

### Pattern 1: Supabase INSERT with returned ID

To satisfy INFRA-05, the assistant message insert must return the DB-assigned `id` so it can be emitted in the `done` chunk.

**Current pattern (no ID returned):**
```typescript
await supabase.from('chat_messages').insert({
  session_id: resolvedSessionId,
  role: 'assistant',
  content: fullContent,
})
controller.enqueue(encodeChunk({ type: 'done', session_id: resolvedSessionId }))
```

**Required pattern (ID returned):**
```typescript
const { data: insertedMsg } = await supabase
  .from('chat_messages')
  .insert({ session_id: resolvedSessionId, role: 'assistant', content: fullContent })
  .select('id')
  .single()

controller.enqueue(encodeChunk({
  type: 'done',
  session_id: resolvedSessionId,
  message_id: insertedMsg?.id ?? null,
}))
```

This pattern applies to BOTH the OpenAI and Anthropic branches in `chat-service.ts`. The escalation path (`isEscalated`) also saves an assistant message and should emit `message_id` for consistency.

### Pattern 2: useChatStream hook interface

The hook replaces the duplicated `handleSend` body. It owns the fetch, NDJSON reader loop, and state machine. Callers supply configuration and receive state + a send function.

```typescript
// lib/chatbot/useChatStream.ts
'use client'

interface UseChatStreamOptions {
  sessionId: string | null
  anonymousId?: string | null
  onSessionUpdate?: (sessionId: string) => void
}

interface UseChatStreamReturn {
  messages: Message[]
  setMessages: React.Dispatch<React.SetStateAction<Message[]>>
  isTyping: boolean
  isStreaming: boolean
  isEscalated: boolean
  isRateLimited: boolean
  sendMessage: (text: string) => Promise<void>
  abort: () => void
}

export function useChatStream(options: UseChatStreamOptions): UseChatStreamReturn
```

The hook emits `message_id` from the `done` event onto the corresponding `Message` object in state, so feedback phases can read it.

### Pattern 3: Migration file naming

The project uses sequential numeric timestamps: `20260405_mattea_intelligence_schema.sql`. The migration must be a single file covering both INFRA-01 (`chat_sessions` columns) and INFRA-02 (`support_tickets` columns) to keep the schema change atomic. The bug fix (INFRA-03) is a code change only, not a migration.

### Pattern 4: Message type extension

The local `Message` interface in `ChatPanel.tsx` and `InlineChat.tsx` currently has `{ id, role, content }`. After hook extraction, add `message_id?: string` to carry the server-assigned DB row ID:

```typescript
interface Message {
  id: string          // client-side UUID for React keys
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
  message_id?: string // server DB row ID, populated after done event
}
```

The hook sets `message_id` on the assistant `Message` object when the `done` event arrives.

### Anti-Patterns to Avoid
- **Touching MatteaSearchHint's stream logic without verifying it creates DB rows:** MatteaSearchHint (`handleContinue`) fires a fire-and-forget POST to `/api/chatbot/message` when the user clicks "Reply", then redirects to the help page. It does not consume the response stream at all. The hook refactor should NOT wrap this fire-and-forget call — leave `MatteaSearchHint` as-is for INFRA-04 (it is not a true streaming consumer). The hook is for ChatPanel and InlineChat only.
- **NOT NULL constraint without DEFAULT:** Adding `started_from text NOT NULL` without `DEFAULT 'widget'` immediately breaks `getOrCreateSession`, which does not yet pass `started_from`.
- **Copying the existing ticket insert:** Line 112 of chat-service.ts uses `question: message` — this is the bug. New code must use `question_summary`.
- **Relying on TypeScript to catch column-name mistakes:** The service client is cast to `any`. Column names must be verified manually against migration files.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| NDJSON parsing | Custom streaming parser | Existing buffer + `split('\n')` pattern already in all three components | It already works; extracting it into the hook is the goal |
| DB insert + ID return | Custom retry logic | Supabase `.insert().select('id').single()` | Standard Supabase pattern — one round trip |
| Session ID persistence | Custom cookie/storage layer | Existing `localStorage.setItem(LS_KEY, ...)` pattern | Already handles cross-navigation restore |

**Key insight:** This phase is extraction and repair, not invention. Every new pattern is a simplification or correction of an existing one.

---

## Common Pitfalls

### Pitfall 1: MatteaSearchHint is NOT a streaming consumer
**What goes wrong:** MatteaSearchHint's `handleContinue` fires a fire-and-forget POST — it never reads the response. Wrapping it in `useChatStream` would add a reader loop around a response that nobody consumes, and would complicate the "Reply" click handler unnecessarily.
**Why it happens:** The component was listed as one of "three streaming surfaces" in the requirements, but its role is different — it only sends, it does not stream-receive.
**How to avoid:** INFRA-04 applies to ChatPanel and InlineChat only. MatteaSearchHint keeps its standalone fire-and-forget POST.
**Warning signs:** If the hook refactor adds a `reader` or `buffer` to MatteaSearchHint, something is wrong.

### Pitfall 2: `started_from` NOT NULL without DEFAULT breaks existing code immediately
**What goes wrong:** `getOrCreateSession` in `chat-actions.ts` (line 53) inserts `{ user_id, anonymous_id, is_escalated }` with no `started_from`. Adding the column as NOT NULL without a DEFAULT causes a DB-level constraint violation on every new session creation.
**Why it happens:** The insert does not yet know about the new column.
**How to avoid:** Migration SQL must use `DEFAULT 'widget'`. Update `getOrCreateSession` to accept and pass `started_from` in the same PR.
**Warning signs:** Session creation errors after migration is applied.

### Pitfall 3: Duplicate insert paths in chat-service.ts
**What goes wrong:** chat-service.ts has three places that insert assistant messages: (1) escalation path at line 102, (2) OpenAI stream completion at line 217, (3) Anthropic stream completion at line 269. INFRA-05 requires that the `done` chunk includes `message_id`. All three insert locations must be updated to use `.select('id').single()` and emit `message_id`. Missing one means that surface silently returns `message_id: null`.
**How to avoid:** Search for all `from('chat_messages').insert` calls and update each.

### Pitfall 4: `message_id` in done chunk but not stored in Message state
**What goes wrong:** The server emits `message_id` in the `done` event, but the client hook doesn't update the corresponding `Message` object. Later feedback phases call an action with `message_id` from state — but it's still `undefined`.
**How to avoid:** In the hook, on receiving `type: 'done'`, update the `Message` object that was being streamed: `setMessages(prev => prev.map(m => m.id === assistantMsgId ? { ...m, message_id: data.message_id } : m))`.

### Pitfall 5: TypeScript won't catch wrong column names
**What goes wrong:** The Supabase service client is cast to `any` throughout the codebase. `npx tsc --noEmit` passes even with wrong column names.
**How to avoid:** Before every DB insert, manually open the corresponding migration SQL file and verify column names. This is a hard rule for this milestone (from PITFALLS.md Pitfall 12).

---

## Code Examples

### Migration: INFRA-01 (chat_sessions additions)
```sql
-- Source: direct inspection of 20260358_chat_sessions_messages.sql
ALTER TABLE chat_sessions
  ADD COLUMN started_from text NOT NULL DEFAULT 'widget',
  ADD COLUMN user_feedback text CHECK (user_feedback IN ('up', 'down')),
  ADD COLUMN feedback_at timestamptz;
```

Note: `user_feedback` is nullable (no feedback = NULL). `started_from` is NOT NULL with DEFAULT.

### Migration: INFRA-02 (support_tickets additions)
```sql
-- Source: direct inspection of 20260359_support_tickets.sql
ALTER TABLE support_tickets
  ADD COLUMN ticket_type text NOT NULL DEFAULT 'human_escalation'
    CHECK (ticket_type IN ('human_escalation', 'unanswered_question')),
  ADD COLUMN rejection_reason text;
```

Note: `rejection_reason` is nullable (only set when admin rejects).

### Bug Fix: INFRA-03 (chat-service.ts line 112)
```typescript
// BEFORE (bug):
await supabase.from('support_tickets').insert({
  session_id: resolvedSessionId,
  user_id: userId ?? null,
  question: message,   // <-- WRONG: column does not exist
  status: 'open',
})

// AFTER (fix):
await supabase.from('support_tickets').insert({
  session_id: resolvedSessionId,
  user_id: userId ?? null,
  question_summary: message,   // <-- CORRECT: matches migration 20260359
  status: 'open',
})
```

### INFRA-05: Assistant message insert with ID return (both providers)
```typescript
// Source: Supabase JS SDK standard pattern
const { data: insertedMsg } = await supabase
  .from('chat_messages')
  .insert({
    session_id: resolvedSessionId,
    role: 'assistant',
    content: fullContent,
  })
  .select('id')
  .single()

controller.enqueue(encodeChunk({
  type: 'done',
  session_id: resolvedSessionId,
  message_id: insertedMsg?.id ?? null,
}))
```

### INFRA-04: Hook extraction skeleton
```typescript
// lib/chatbot/useChatStream.ts
'use client'

import { useState, useRef } from 'react'

export interface StreamMessage {
  id: string           // client UUID, React key
  role: 'user' | 'assistant' | 'escalation' | 'rate-limit'
  content: string
  message_id?: string  // server DB row ID, set after done event
}

export interface UseChatStreamOptions {
  sessionId: string | null
  anonymousId?: string | null
  onSessionUpdate?: (newSessionId: string) => void
}

export function useChatStream(options: UseChatStreamOptions) {
  const [messages, setMessages] = useState<StreamMessage[]>([])
  const [isTyping, setIsTyping] = useState(false)
  const [isStreaming, setIsStreaming] = useState(false)
  const [isEscalated, setIsEscalated] = useState(false)
  const [isRateLimited, setIsRateLimited] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)

  async function sendMessage(text: string) {
    // ... NDJSON fetch + reader loop, identical to existing handleSend bodies
    // On 'done': update Message with message_id from data.message_id
  }

  function abort() {
    abortControllerRef.current?.abort()
  }

  return { messages, setMessages, isTyping, isStreaming, isEscalated, isRateLimited, sendMessage, abort }
}
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Duplicated stream loops per surface | Single `useChatStream` hook | Phase 1 (this phase) | Future event types added once, not three times |
| `question` column name in ticket insert | `question_summary` (correct) | Phase 1 bug fix | Admin inbox previews will show actual question text |
| `done` chunk has only `session_id` | `done` chunk has `session_id` + `message_id` | Phase 1 | Enables feedback targeting in Phase 3 |

---

## Open Questions

1. **`started_from` value for InlineChat (help page)**
   - What we know: ChatPanel is the widget. MatteaSearchHint is search. InlineChat is the help page.
   - What's unclear: The PITFALLS.md says DEFAULT 'widget' but the column should distinguish widget from help. Pitfall 3 says "widget | search | help" as the enum values, but the CONTEXT.md says `chat_widget / search_hint / help_page`.
   - Recommendation: Use `'chat_widget'`, `'search_hint'`, `'help_page'` as the values (matching CONTEXT.md). DEFAULT should be `'chat_widget'` for historical rows. The CHECK constraint should list all three.

2. **MatteaSearchHint fire-and-forget: does it write a session/message row?**
   - What we know: The `handleContinue` function posts to `/api/chatbot/message` with `{ message: query, source: 'search_hint' }` and discards the response.
   - What's unclear: Whether the server actually creates a session+message row for this call (it would, since `streamChatResponse` is always called). But the client never captures the `session_id` from the done chunk.
   - Recommendation: For Phase 1, leave this as-is. Phase 3 (feedback) will need to resolve this — either capture the session_id from the hint's POST response, or create a separate lightweight hint feedback table. Flag for Phase 3 planning per PITFALLS.md Pitfall 10.

---

## Environment Availability

Step 2.6: SKIPPED — this phase is purely code and migration changes. No new external dependencies, services, or CLI tools are required beyond the existing Supabase setup.

---

## Project Constraints (from CLAUDE.md)

| Directive | Impact on This Phase |
|-----------|---------------------|
| `npx tsc --noEmit` must pass with 0 errors before any commit | All new code and the hook must typecheck. Add proper types to the hook's return value and the `StreamMessage` interface. |
| Never commit broken TypeScript | Each task should be independently compilable. |
| `PageContainer` for all page content sections | Not applicable — no UI changes in Phase 1. |
| After completing any task, update relevant `docs/` files | After Phase 1: update `docs/developer/` with notes on `useChatStream` hook API and the `message_id` streaming protocol change. |
| Activity file required | Create `activity/vX-X-X_MatteasIntelligenceSystem_DD-MM-YYYY.md` if not already created. |
| LOG.md for errors | If migration fails or TS errors arise, log to LOG.md under Open Issues. |

---

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | TypeScript compiler (`tsc --noEmit`) — no automated test suite detected |
| Config file | `tsconfig.json` |
| Quick run command | `npx tsc --noEmit` |
| Full suite command | `npx tsc --noEmit` |

No Jest, Vitest, or Playwright configuration was found in the project. The primary validation gate is TypeScript compilation.

### Phase Requirements → Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| INFRA-01 | Migration adds columns without breaking session creation | manual-only | Apply migration, run app, verify session creates | N/A |
| INFRA-02 | Migration adds columns with correct CHECK constraint | manual-only | Apply migration, inspect schema via Supabase Studio | N/A |
| INFRA-03 | Ticket insert uses `question_summary` | compile | `npx tsc --noEmit` (partial — cast to `any` means manual review also required) | ✅ |
| INFRA-04 | Hook extracted; ChatPanel and InlineChat compile using it | compile | `npx tsc --noEmit` | ✅ |
| INFRA-05 | `done` chunk includes `message_id` | compile + manual | `npx tsc --noEmit`, then inspect stream output in browser DevTools | ✅ |

### Wave 0 Gaps
- [ ] No automated tests exist for chat streaming behavior — manual browser DevTools inspection required for INFRA-05 verification
- [ ] No migration test harness — apply via `npx supabase db push` and verify in Supabase Studio

*(Note: `npx supabase db push` is the project standard per MEMORY.md — always run after creating a migration file.)*

---

## Sources

### Primary (HIGH confidence)
- Direct inspection: `lib/chatbot/chat-service.ts` — confirmed bug at line 112, confirmed insert locations, confirmed `done` chunk shape
- Direct inspection: `lib/chatbot/chat-actions.ts` — confirmed `getOrCreateSession` insert, confirmed no `started_from` parameter
- Direct inspection: `lib/chatbot/types.ts` — confirmed `ChatStreamResult`, `SupportTicket`, `ChatMessage` types
- Direct inspection: `app/components/chat/ChatPanel.tsx` — confirmed duplicated stream loop (lines 182–266)
- Direct inspection: `app/settings/help/InlineChat.tsx` — confirmed duplicated stream loop (lines 173–255), identical to ChatPanel
- Direct inspection: `app/components/search/MatteaSearchHint.tsx` — confirmed fire-and-forget pattern, NOT a streaming consumer
- Direct inspection: `supabase/migrations/20260358_chat_sessions_messages.sql` — confirmed schema: no `started_from`, `user_feedback`, `feedback_at` columns
- Direct inspection: `supabase/migrations/20260359_support_tickets.sql` — confirmed schema: `question_summary` is correct column name, no `ticket_type` or `rejection_reason`
- Direct inspection: `lib/hooks/` — confirmed project hook convention (`lib/hooks/` directory, `'use client'` at top)
- Direct inspection: `.planning/workstreams/ai-super-helper/research/PITFALLS.md` — HIGH confidence domain pitfalls from prior codebase research

### Secondary (MEDIUM confidence)
- MEMORY.md: `npx supabase db push` is the standard migration apply command for this project

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — verified by direct file inspection
- Architecture: HIGH — based on confirmed existing patterns in codebase
- Pitfalls: HIGH — based on direct codebase inspection (PITFALLS.md sourced from same)

**Research date:** 2026-04-03
**Valid until:** 2026-05-03 (stable schema + established patterns)
