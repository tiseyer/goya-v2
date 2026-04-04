# Architecture Patterns: Mattea Intelligence System

**Project:** GOYA v2 — Mattea Intelligence System (v1.23)
**Researched:** 2026-04-03
**Confidence:** HIGH — based on direct codebase inspection

---

## Existing Architecture (What's Already There)

Before describing what to build, this is the system as it stands:

### Data Layer

```
chatbot_config         — single-row config (name, system_prompt, is_active, etc.)
chat_sessions          — one row per conversation (user_id | anonymous_id, is_escalated, last_message_at)
chat_messages          — all messages (session_id FK, role: user|assistant, content)
support_tickets        — escalated conversations (session_id FK, question_summary, status, resolved_by)
faq_items              — FAQ entries (question, answer, status: published|draft, category)
```

### Service Layer

```
lib/chatbot/chat-service.ts     — streamChatResponse(): main AI call + session + persistence
lib/chatbot/chat-actions.ts     — getOrCreateSession(), getChatHistory(), deleteSession(), getAnonymousId()
lib/chatbot/escalation.ts       — detectEscalation(): keyword match + repeated-question detection
lib/chatbot/rate-limit.ts       — in-memory rate limiter (20 msg/hour per identity)
```

### API Routes

```
POST /api/chatbot/message       — public streaming endpoint; calls streamChatResponse()
POST /api/search/mattea-hint    — standalone AI call for search overlay (no session, no persistence)
GET  /api/chatbot/config        — public config (name, avatar_url, is_active)
```

### UI Surfaces

```
app/components/chat/ChatPanel.tsx          — floating widget (bottom-right, all pages)
app/settings/help/InlineChat.tsx           — help page embedded chat
app/components/search/MatteaSearchHint.tsx — search overlay hint card (Cmd+K)
```

### Admin Surfaces

```
app/admin/chatbot/ConversationsTab.tsx     — list + view sessions
app/admin/chatbot/chatbot-actions.ts       — listConversations(), getConversationMessages(), FAQ CRUD
app/admin/inbox/SupportTicketsTab.tsx      — list tickets, cycle status
app/admin/inbox/actions.ts                 — listSupportTickets(), updateTicketStatus(), replyToTicket()
```

---

## New Features and Their Integration Points

### Feature 1: Source Tracking (`started_from`)

**What it is:** Record where each chat session was initiated (widget, search_hint, help_page).

**Where it hooks in:**

The source is known at session creation time, at the client surface layer. The cleanest integration is:

1. Add `started_from text CHECK (started_from IN ('widget', 'search_hint', 'help_page'))` column to `chat_sessions`.
2. Pass `started_from` as an optional field in `getOrCreateSession()` in `lib/chatbot/chat-actions.ts` and persist it on INSERT.
3. Each surface passes its own value:
   - `ChatPanel.tsx` → `'widget'`
   - `InlineChat.tsx` → `'help_page'`
   - `MatteaSearchHint.tsx` → `'search_hint'` (currently fires a fire-and-forget POST to `/api/chatbot/message` — this should create or tag a session)
4. Surface the `started_from` column in `ConversationListItem` type and display it as a column in `ConversationsTab`.
5. Add a "Source" filter option to `ConversationsTab` filter dropdown (alongside the existing all/users/guests/escalated).

**Search hint special case:** The hint card currently does a fire-and-forget POST without any session management. Feedback for the search hint needs a session ID. The cleanest approach is to make the search hint create a session (or receive one from the search overlay's context) and pass `started_from: 'search_hint'` at creation time. This means the search hint must have access to `anonymousId` at the point of session creation, which requires wiring through from `GlobalSearchOverlay`.

**Modified files:**
- `supabase/migrations/` — new migration adding `started_from` column
- `lib/chatbot/chat-actions.ts` — add `startedFrom` param to `getOrCreateSession()`
- `lib/chatbot/types.ts` — add `started_from` to `ChatSession` and `ConversationListItem`
- `ChatPanel.tsx` — pass `startedFrom: 'widget'`
- `InlineChat.tsx` — pass `startedFrom: 'help_page'`
- `MatteaSearchHint.tsx` — requires session wiring (see below)
- `app/admin/chatbot/ConversationsTab.tsx` — add Source column + filter

---

### Feature 2: Thumbs Up / Down Feedback

**What it is:** Per-session thumbs up/down collected after the conversation ends (or at any point). Decision already made: feedback is per-conversation, not per-message.

**Where it hooks in:**

The simplest schema integration is a column on `chat_sessions` (not a separate table), since feedback is 1:1 with session per the key decision:

```sql
ALTER TABLE chat_sessions
  ADD COLUMN feedback text CHECK (feedback IN ('positive', 'negative')),
  ADD COLUMN feedback_at timestamptz;
```

This avoids schema fragmentation for a per-session signal. A separate table would only be warranted if per-message feedback were needed in the future — that is out of scope per KEY DECISION #1.

**Client-side submission path:**

1. A new Server Action `submitSessionFeedback(sessionId: string, value: 'positive' | 'negative')` in `lib/chatbot/chat-actions.ts`. Uses service role to UPDATE `chat_sessions`.
2. Each chat surface shows thumbs after the first assistant message arrives (or after escalation). A small `FeedbackBar` client component renders thumb buttons and calls the action.
3. Once submitted, buttons become disabled (optimistic: immediately). No undo.
4. The `FeedbackBar` receives `sessionId` as a prop. All three surfaces already hold `sessionId` in state.

**For the search hint surface:** The hint does not currently have a session. To collect feedback, the hint must create a session (see Source Tracking above — they share the same session-wiring need). Once that session exists, the hint card can show a feedback row.

**Admin visibility:**

- `ConversationsTab` adds a "Feedback" column showing a thumbs-up, thumbs-down, or empty cell.
- `ConversationListItem` type gains `feedback: 'positive' | 'negative' | null`.
- `listConversations()` in `chatbot-actions.ts` selects the new columns.

**New files:**
- `app/components/chat/FeedbackBar.tsx` — shared feedback component used by all 3 surfaces

**Modified files:**
- `supabase/migrations/` — new migration adding `feedback`, `feedback_at` to `chat_sessions`
- `lib/chatbot/chat-actions.ts` — new `submitSessionFeedback()` action
- `lib/chatbot/types.ts` — update `ChatSession`, `ConversationListItem`
- `ChatPanel.tsx` — render `<FeedbackBar>` after first assistant message
- `InlineChat.tsx` — render `<FeedbackBar>` after first assistant message
- `MatteaSearchHint.tsx` — render inline feedback (smaller variant)
- `app/admin/chatbot/ConversationsTab.tsx` — add Feedback column

---

### Feature 3: Unanswered Question Escalation → FAQ Pipeline

**What it is:** When Mattea cannot answer a question, the response is detected as "unanswered" and creates a support ticket. Admin can then resolve via "Add to FAQ" (creates a published FAQ entry directly) or "Reject" (marks ticket resolved without action).

**Detection approach:** Phrase matching on the assistant response (KEY DECISION #2). This happens in `streamChatResponse()` in `chat-service.ts` after the AI stream completes, by checking `fullContent` against an unanswered-phrases list.

**Where it hooks in:**

The existing escalation path (`detectEscalation()`) already creates a `support_tickets` row. The unanswered detection is a separate, parallel path — it fires on the AI response (not the user message), and it creates a different type of ticket. There are two ways to model this:

**Option A:** Add a `ticket_type` column to `support_tickets` (`'human_requested' | 'unanswered'`). Reuse the existing table and admin UI. Add type-specific resolution actions.

**Option B:** Keep `support_tickets` for human-request escalations, add a new `chatbot_unanswered` table for unanswered questions.

**Recommendation: Option A.** The tables are structurally identical, the admin inbox already has the SupportTicketsTab UI, and reusing it avoids duplicating the entire admin workflow. A `ticket_type` discriminator is sufficient.

**Resolution actions:**

Add two new Server Actions to `app/admin/inbox/actions.ts`:

- `addTicketToFaq(ticketId, question, answer)` — inserts into `faq_items` with status `'published'` (KEY DECISION #3), then marks ticket resolved.
- `rejectTicket(ticketId)` — marks ticket resolved with no FAQ action.

The existing `TicketViewer.tsx` receives new buttons: "Add to FAQ" and "Reject". "Add to FAQ" opens an inline form pre-populated with the original question (from `question_summary`) and an editable answer field before submitting.

**Detection logic:** A new `detectUnanswered(content: string): boolean` function in `lib/chatbot/escalation.ts` (or a new `lib/chatbot/unanswered.ts` file). Pattern matching against phrases like:
- "I don't have information on that"
- "I'm not sure about"
- "I don't know"
- "I couldn't find"
- "you may want to contact"

Called in `streamChatResponse()` after `fullContent` is assembled (in the `done` handler inside the stream, before `controller.close()`). If detected, inserts a `support_tickets` row with `ticket_type: 'unanswered'`.

**Modified files:**
- `supabase/migrations/` — add `ticket_type` column to `support_tickets`
- `lib/chatbot/escalation.ts` (or new `lib/chatbot/unanswered.ts`) — `detectUnanswered()` 
- `lib/chatbot/chat-service.ts` — call `detectUnanswered()` after stream completes, insert ticket if matched
- `lib/chatbot/types.ts` — add `ticket_type` to `SupportTicket`
- `app/admin/inbox/actions.ts` — `addTicketToFaq()`, `rejectTicket()`
- `app/admin/inbox/TicketViewer.tsx` — add Add to FAQ / Reject buttons + inline form
- `app/admin/inbox/SupportTicketsTab.tsx` — filter by ticket_type if needed

---

### Feature 4: Conversation History on Help Page

**What it is:** When a logged-in user returns to `/settings/help`, they see their previous conversation restored instead of starting blank.

**Current state:** `InlineChat.tsx` already calls `getOrCreateSession()` with `existingSessionId` from `localStorage` and restores messages if found. This feature is **substantially already built.** The `getChatHistory()` function exists and works.

**Gaps to close:**

1. The help page currently uses a per-surface localStorage key (`goya_help_chat_session_id`). For authenticated users, sessions should persist server-side without relying solely on localStorage. The `user_id` FK on `chat_sessions` already enables this — `getOrCreateSession()` could look up the user's most recent session when no localStorage key is present (for a returning user on a new device/browser).

2. A "New Chat" / "Clear History" control on InlineChat. `ChatPanel` already has this via `handleNewChat()` / `handleDeleteHistory()`. `InlineChat` needs the same pattern surfaced in the UI.

3. Visual treatment for restored history — a subtle "From your last visit" divider before restored messages.

**Modified files:**
- `lib/chatbot/chat-actions.ts` — optional: add `getLatestSessionForUser(userId)` lookup fallback
- `app/settings/help/InlineChat.tsx` — add New Chat control, add "From your last visit" divider
- `app/settings/help/HelpPageClient.tsx` — minor: may need to thread any new session control props

---

## Data Flow Summary

```
User types message
      │
      ├─ (widget)      ChatPanel.tsx
      ├─ (help page)   InlineChat.tsx
      └─ (search hint) MatteaSearchHint.tsx ──► needs session wiring
              │
              ▼
      POST /api/chatbot/message
      { session_id, message, anonymous_id }
              │
              ▼
      streamChatResponse() [chat-service.ts]
      ├─ Resolve/create chat_sessions row    ◄── NEW: persist started_from
      ├─ Load chat_messages history
      ├─ detectEscalation() → support_tickets (ticket_type: 'human_requested')
      ├─ Call AI provider → stream tokens
      ├─ Persist chat_messages (user + assistant)
      └─ detectUnanswered(fullContent)       ◄── NEW: → support_tickets (ticket_type: 'unanswered')
              │
              ▼
      Client receives stream
      ├─ Renders tokens into message bubble
      └─ Shows FeedbackBar when first assistant message arrives  ◄── NEW
              │
              ▼ (user clicks thumb)
      submitSessionFeedback(sessionId, value)  ◄── NEW
      → UPDATE chat_sessions SET feedback = value
```

```
Admin opens /admin/inbox → Support Tickets tab
      │
      ├─ Sees ticket_type badge: "Human Request" vs "Unanswered"
      ├─ Filters: all | open | in_progress | resolved | unanswered  ◄── NEW filter
      │
      └─ Opens TicketViewer
             ├─ [existing] Status cycle, Reply
             ├─ [NEW for unanswered] Add to FAQ → addTicketToFaq()
             └─ [NEW for unanswered] Reject → rejectTicket()
```

```
Admin opens /admin/chatbot → Conversations tab
      │
      ├─ Source column: widget | search_hint | help_page   ◄── NEW column
      ├─ Feedback column: 👍 | 👎 | —                      ◄── NEW column
      └─ Source filter dropdown option                       ◄── NEW filter option
```

---

## Component Inventory

### New Files to Create

| File | Type | Purpose |
|------|------|---------|
| `app/components/chat/FeedbackBar.tsx` | Client component | Thumbs +/- buttons, shared by all 3 surfaces |
| `lib/chatbot/unanswered.ts` | Server utility | `detectUnanswered(content): boolean` |
| `supabase/migrations/YYYYMMDD_chatbot_feedback_source.sql` | Migration | Add `started_from`, `feedback`, `feedback_at` to `chat_sessions` |
| `supabase/migrations/YYYYMMDD_support_tickets_type.sql` | Migration | Add `ticket_type` to `support_tickets` |

### Modified Files

| File | What Changes |
|------|-------------|
| `lib/chatbot/types.ts` | Add `started_from`, `feedback` to `ChatSession`; add `ticket_type` to `SupportTicket`; add `started_from`, `feedback` to `ConversationListItem` |
| `lib/chatbot/chat-actions.ts` | `getOrCreateSession()` accepts `startedFrom`; new `submitSessionFeedback()` action |
| `lib/chatbot/chat-service.ts` | Call `detectUnanswered()` after stream, insert ticket if matched |
| `app/components/chat/ChatPanel.tsx` | Render `<FeedbackBar>` after first assistant msg; pass `startedFrom: 'widget'` to session |
| `app/settings/help/InlineChat.tsx` | Render `<FeedbackBar>`, add New Chat control, pass `startedFrom: 'help_page'` |
| `app/components/search/MatteaSearchHint.tsx` | Wire session creation with `startedFrom: 'search_hint'`, render compact feedback |
| `app/components/search/GlobalSearchOverlay.tsx` | Thread `anonymousId` to hint card for session creation |
| `app/admin/chatbot/ConversationsTab.tsx` | Add Source + Feedback columns, add Source filter |
| `app/admin/chatbot/chatbot-actions.ts` | `listConversations()` selects new columns |
| `app/admin/inbox/actions.ts` | New `addTicketToFaq()`, `rejectTicket()` actions |
| `app/admin/inbox/TicketViewer.tsx` | Add ticket_type badge + Add to FAQ / Reject controls |
| `app/admin/inbox/SupportTicketsTab.tsx` | Optional unanswered filter |

---

## Suggested Build Order

Dependencies drive this order. Each phase produces working, shippable code.

### Phase 1: Schema foundation (no UI)
Add both migrations. Zero risk, reversible. Everything else depends on schema.

- Migration: `started_from`, `feedback`, `feedback_at` on `chat_sessions`
- Migration: `ticket_type` on `support_tickets`
- Update `lib/chatbot/types.ts` to reflect new columns
- Run `npx supabase db push`

### Phase 2: Source tracking end-to-end
Low complexity, high value for all downstream admin work. Tests that session wiring works.

- `getOrCreateSession()` accepts and persists `startedFrom`
- `ChatPanel` + `InlineChat` pass their respective values
- `ConversationsTab` shows Source column (query change is trivial)
- Source filter in conversations tab

Skip the search hint `started_from` for now — it needs session wiring that's more involved (Phase 4).

### Phase 3: Feedback on widget + help page
Session ID is already available in both `ChatPanel` and `InlineChat`. This is the easiest feedback path.

- `submitSessionFeedback()` Server Action
- `FeedbackBar.tsx` component
- Wire into `ChatPanel` and `InlineChat`
- `ConversationsTab` Feedback column

### Phase 4: Search hint session wiring
The search hint currently fires fire-and-forget. This phase gives it a real session, enabling both `started_from: 'search_hint'` and feedback.

- Thread `anonymousId` into `GlobalSearchOverlay` → `MatteaSearchHint`
- Search hint calls `getOrCreateSession()` on first answer received
- Pass `startedFrom: 'search_hint'`
- Compact `FeedbackBar` in the hint card

This phase is kept separate because it touches `GlobalSearchOverlay` and has more surface area risk.

### Phase 5: Unanswered detection + FAQ pipeline
Depends on schema (Phase 1) and ticket table being in place.

- `lib/chatbot/unanswered.ts` with phrase detection
- Wire into `chat-service.ts` after stream completes
- `addTicketToFaq()` + `rejectTicket()` actions
- `TicketViewer` Add to FAQ form + Reject button
- `SupportTicketsTab` type badge and filter

### Phase 6: Help page history improvements
`InlineChat` already restores history via localStorage. This phase polishes the experience.

- New Chat control in `InlineChat`
- "From your last visit" divider
- Optional: server-side fallback session lookup for returning users on new devices

---

## Architecture Constraints and Pitfalls

### RLS is service-role-only for chat ops
All chat session reads/writes in `chat-service.ts` use `getSupabaseService()` (service role). The RLS policies on `chat_sessions` and `chat_messages` only cover user-scoped SELECT. The `submitSessionFeedback()` action must also use service role — do not use the user-scoped client for this write.

### No message-level feedback IDs in stream
The streaming protocol returns a `done` event with `session_id`. There are no per-message IDs in the stream protocol. `FeedbackBar` receives `sessionId` as a prop from the surface component's state — it does not need to be derived from the stream. This is consistent with KEY DECISION #1 (per-session feedback).

### Search hint session has no persistence today
`MatteaSearchHint` calls `/api/chatbot/message` fire-and-forget. That endpoint creates a new session each time (no `session_id` passed). This means every search hint question currently creates an orphaned session. Phase 4 should also clean this up — the hint should either (a) not create a session until the user clicks Reply, or (b) create a session that persists feedback. Option (b) is recommended because it enables feedback without requiring navigation to the help page.

### `ticket_type` defaults
Existing tickets in `support_tickets` will have `ticket_type = NULL` after migration. The `listSupportTickets()` query and `SupportTicketsTab` must handle `NULL` gracefully (treat as `'human_requested'` for backward compatibility). Migration should set `DEFAULT 'human_requested'` and backfill existing rows.

### `detectUnanswered()` must run after full stream
In `chat-service.ts`, the unanswered detection runs inside the stream's `start()` callback after the for-await loop completes. This is the same location where the assistant message is persisted. The ticket insert should happen in the same block to keep session_id in scope. Do not attempt to detect before `fullContent` is assembled.

### Feedback from search hint needs careful UX
The search hint card is ephemeral — it closes when the user navigates away. Feedback must be submitted immediately on click (not on close/unmount). The `submitSessionFeedback()` call should happen in the click handler, not as a cleanup effect.

---

## Sources

- Direct inspection: `lib/chatbot/chat-service.ts`, `chat-actions.ts`, `escalation.ts`, `types.ts`
- Direct inspection: `app/api/chatbot/message/route.ts`, `app/api/search/mattea-hint/route.ts`
- Direct inspection: `app/components/chat/ChatPanel.tsx`, `app/settings/help/InlineChat.tsx`, `app/components/search/MatteaSearchHint.tsx`
- Direct inspection: `app/admin/chatbot/ConversationsTab.tsx`, `chatbot-actions.ts`
- Direct inspection: `app/admin/inbox/SupportTicketsTab.tsx`, `actions.ts`
- Direct inspection: `supabase/migrations/20260358_chat_sessions_messages.sql`, `20260359_support_tickets.sql`
- Project decisions from `.planning/workstreams/ai-super-helper/PROJECT.md`
