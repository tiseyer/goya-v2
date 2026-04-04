# Domain Pitfalls — Mattea Intelligence System

**Domain:** Adding feedback, conversation history, unanswered question escalation, and source tracking to an existing chatbot
**Project:** GOYA v2 — v1.23 Mattea Intelligence System
**Researched:** 2026-04-03
**Confidence:** HIGH — based on direct codebase inspection of all affected files

---

## Critical Pitfalls

Mistakes in this category cause silent data loss, broken state, or require schema rewrites.

---

### Pitfall 1: Feedback Targeting a Client-Side Message ID, Not a DB Row

**What goes wrong:** The `Message` type in `ChatPanel.tsx` and `InlineChat.tsx` uses `crypto.randomUUID()` to generate client-side IDs for every message — including the first token chunk, which is created before the server has written the full assistant message to `chat_messages`. If the thumbs feedback button calls an action with this client-side ID, it references a UUID that does not exist in the database.

**Why it happens:** The streaming architecture is: token arrives → new `Message` object created with a local UUID → message appended to state. The server-assigned DB row ID for that assistant message is never surfaced back to the client in the current stream protocol. The `done` chunk sends `session_id` but not `message_id`.

**Consequences:** Every feedback write silently fails or inserts orphaned rows with a foreign key to nowhere, depending on whether `chat_messages.id` is required. The entire feedback feature appears to work in the UI but stores nothing useful.

**Prevention:** Extend the `done` chunk to include the server-assigned `message_id` of the assistant message that was just persisted. In `chat-service.ts`, after the `supabase.from('chat_messages').insert(...)` call, select the inserted row's `id` and emit it in the `done` event: `{ type: 'done', session_id, message_id }`. The client stores this `message_id` on the in-memory `Message` object and passes it when submitting feedback.

**Phase:** Feedback implementation phase. Must be resolved before feedback buttons are wired up.

---

### Pitfall 2: Three Surfaces, Three Duplicated `handleSend` Implementations

**What goes wrong:** `ChatPanel.tsx`, `InlineChat.tsx`, and `MatteaSearchHint.tsx` each contain their own full copy of the streaming fetch + NDJSON parse loop. Adding feedback to a "done" event requires touching all three identically. Missing one surface means partial rollout — feedback works in the widget but not the help page, or vice versa.

**Why it happens:** The streaming loop was copied rather than extracted. There is currently no shared chat hook.

**Consequences:** Inconsistent behavior across surfaces, maintenance burden on every future protocol change, high probability of a bug being fixed in one surface but not the others.

**Prevention:** Extract the streaming logic into a single `useChatStream` hook before adding any new event type. The hook handles the fetch, NDJSON parse, state machine (typing → streaming → done), and surfaces a callback for each event type (`onToken`, `onDone`, `onEscalation`, `onError`). All three surfaces call the same hook. Feedback handling then lives in `onDone` in one place.

**Phase:** Should be the first task in the implementation milestone, before feedback or history work begins.

---

### Pitfall 3: `started_from` Source Column Added After Rows Already Exist

**What goes wrong:** Adding a `started_from` column (`widget | search | help`) to `chat_sessions` without a migration default means all existing rows have `NULL`, and the admin filter for "Source: Widget" returns zero historical results. Worse, if the column is added as `NOT NULL` without a default, all existing `getOrCreateSession` calls break immediately because they do not pass the new field.

**Why it happens:** The `getOrCreateSession` server action in `chat-actions.ts` inserts `{ user_id, anonymous_id, is_escalated: false }` — it has no `started_from` parameter. Adding the column without updating this insert causes a DB-level NOT NULL violation.

**Consequences:** Either all new session creation silently fails (NOT NULL without default), or the column exists but is useless for filtering pre-existing sessions (nullable with no backfill strategy).

**Prevention:** Add `started_from text NOT NULL DEFAULT 'widget'` in the migration. Update `getOrCreateSession` to accept and pass the value. Each call site (`ChatWidget`, `InlineChat`, search hint) passes its own literal. Migration default of `'widget'` is a reasonable historical assumption since the widget was the only surface during initial development.

**Phase:** Schema migration phase. Must be in the migration, not left for the application layer.

---

### Pitfall 4: Unanswered Question Detection Uses a Field That Does Not Exist Yet

**What goes wrong:** The current escalation flow in `chat-service.ts` creates a `support_tickets` row with `question_summary` set to the raw user message. The new "unanswered question" escalation is a different trigger — phrase-matching the AI's response (e.g. "I don't know", "I'm not sure") — but the `support_tickets` table has no column to distinguish an unanswered-question ticket from a human-requested-escalation ticket. Admins see all tickets in one undifferentiated list with no way to apply the "Add to FAQ" action only to the unanswered ones.

**Why it happens:** The existing ticket schema was designed for human-escalation only. No `ticket_type` or equivalent column exists.

**Consequences:** Admins must read the full conversation to understand whether a ticket came from a user asking for a human or from Mattea failing to answer. "Add to FAQ" action applied to a human-escalation ticket creates a nonsensical FAQ entry. Admin workflow is broken at the design level.

**Prevention:** Add `ticket_type text NOT NULL DEFAULT 'human_escalation' CHECK (ticket_type IN ('human_escalation', 'unanswered_question'))` to the migration that extends `support_tickets`. The admin ticket list filters or badges by type. "Add to FAQ" action is only rendered for `unanswered_question` tickets.

**Phase:** Schema migration phase, before any escalation detection work.

---

### Pitfall 5: `question` Column vs `question_summary` Mismatch (Existing Bug to Avoid Repeating)

**What goes wrong:** `chat-service.ts` line 110 currently inserts `{ question: message, status: 'open' }` into `support_tickets`, but the schema (migration 20260359) defines the column as `question_summary`. This is an existing latent bug where the insert silently drops the question text (Supabase ignores unknown columns by default with the service role client). Any new code that extends ticket creation must use `question_summary`, not `question`.

**Why it happens:** Column was renamed at schema time but the insert in `chat-service.ts` was not updated.

**Consequences:** All existing escalated tickets have `NULL` in `question_summary`, making the admin inbox's truncated preview useless. New ticket creation code copying the existing pattern will repeat the same mistake.

**Prevention:** Fix this in the same migration PR that adds new ticket columns. Verify that `question_summary` is the correct column name against the migration file before writing any ticket insert. Do not copy the existing insert pattern from `chat-service.ts` — it is wrong.

**Phase:** Must be fixed in the migration/schema phase as a prerequisite, not left as a follow-up.

---

## Moderate Pitfalls

---

### Pitfall 6: Feedback Submitted While Stream Is Still In Progress

**What goes wrong:** If the thumbs-down button is rendered while the assistant message is still streaming (i.e., before the `done` event arrives), the user can submit feedback before `message_id` is available. The feedback write either uses `null` or a stale ID.

**Prevention:** Render feedback buttons only after `isStreaming` is false and `message_id` has been received from the `done` event. Gate the button's `disabled` state on both conditions. This is a UI-layer concern but requires the `message_id` timing to be correct first (see Pitfall 1).

**Phase:** Feedback UI phase.

---

### Pitfall 7: Conversation History Loads All Sessions When User Wants "This Surface's History"

**What goes wrong:** `ChatPanel` stores its session ID under `goya_chat_session_id` in localStorage. `InlineChat` stores under `goya_help_chat_session_id`. If the milestone adds a "load previous conversations" feature on the Help page, naively listing all sessions for `user_id` will mix widget conversations with help-page conversations, confusing the chronological view.

**Why it happens:** The `started_from` column does not yet exist (see Pitfall 3). Without it, sessions cannot be filtered by surface.

**Prevention:** Implement `started_from` before building any cross-session history UI. The Help page history loader should filter to `started_from = 'help'` sessions only. The widget does not need history loading (it already restores the single active session from localStorage).

**Phase:** Source tracking migration must precede conversation history UI work.

---

### Pitfall 8: "Add to FAQ" Action Creates a Duplicate Entry Silently

**What goes wrong:** The admin resolves a ticket and clicks "Add to FAQ". If Mattea was asked a similar question multiple times and each generated a separate unanswered-question ticket, clicking "Add to FAQ" on each creates duplicate FAQ entries with near-identical questions. The FAQ grows polluted and contradictory answers start appearing in the AI context.

**Why it happens:** There is no deduplication check before inserting a new `faq_items` row. The existing FAQ insert path (via `chatbot-actions.ts`) does not check for existing entries with similar questions.

**Prevention:** Before inserting, query `faq_items` for an exact-match `question` (case-insensitive). If a match exists, surface a warning to the admin and offer to update the existing entry rather than creating a new one. A fuzzy/semantic match is out of scope — exact match covers the most common case.

**Phase:** Admin FAQ resolution phase.

---

### Pitfall 9: Escalation Detection Fires on the AI's Own Response Text

**What goes wrong:** The current `detectEscalation` function in `escalation.ts` only checks the user's message. The new "unanswered question" detection must check the AI's response text. If the detection runs inside the stream's `start()` callback (after `fullContent` is assembled), it is straightforward. But if it is accidentally placed before the AI call, it checks an empty string and never fires.

**Prevention:** The detection for unanswered responses must run inside the stream's post-completion block, after `fullContent` is fully assembled, not in the pre-stream request phase. Keep the two escalation types as separate code paths: keyword escalation (pre-AI, existing) and unanswered-question detection (post-AI, new). Do not merge them into a single `detectEscalation` call.

**Phase:** Unanswered question detection phase.

---

### Pitfall 10: Feedback on the Search Hint Is a Different Code Path

**What goes wrong:** The search hint (`MatteaSearchHint.tsx`, backed by `/api/search/mattea-hint/route.ts`) is a different route handler from `/api/chatbot/message`. It does not use sessions or `chat_messages`. Adding feedback to the search hint requires either (a) a separate feedback mechanism that does not reference a `chat_messages` row, or (b) refactoring the hint to write a session and message row. Treating it as identical to the widget/help-page flow will result in FK violations.

**Prevention:** Decide up front whether the search hint creates a session/message row (heavier, more consistent) or uses a separate lightweight `hint_feedback` mechanism. Given the project decision that feedback is per-conversation, the cleaner path is to have the search hint also create a session + message row on send, making it consistent. Confirm this before writing any feedback action.

**Phase:** Scope clarification needed at the start of the feedback phase.

---

## Minor Pitfalls

---

### Pitfall 11: `updated_at` Not Bumped on `chat_sessions` When Feedback Is Written

**What goes wrong:** The admin conversations list sorts by `last_message_at`. If feedback is recorded as a write to a separate `feedback` column on `chat_sessions`, the timestamp columns are not automatically updated. Admin view appears stale.

**Prevention:** Use a DB trigger or explicitly update `last_message_at` when feedback is recorded (or leave feedback on a separate table and do not use it for sort ordering).

**Phase:** Minor — address during feedback schema design.

---

### Pitfall 12: The `question` Column Bug in `chat-service.ts` Causes TypeScript to Not Catch It

**What goes wrong:** `chat-service.ts` uses `// eslint-disable-next-line @typescript-eslint/no-explicit-any` and casts the Supabase client to `any`. Type errors on wrong column names are silently swallowed. This pattern exists throughout the codebase and means new DB writes with wrong column names will also pass `npx tsc --noEmit`.

**Prevention:** When writing new DB inserts in this codebase, manually cross-check column names against migration files. Do not rely on TypeScript to catch column-name mistakes here. Consider this a hard rule for the milestone: every new `insert` or `update` must be verified against the migration file before committing.

**Phase:** Applies to all phases that touch DB writes.

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|---|---|---|
| Schema migration | `NOT NULL` on `started_from` breaks existing session creation immediately | Add with `DEFAULT 'widget'`, update `getOrCreateSession` in the same PR |
| Schema migration | Wrong column name in existing `support_tickets` insert | Fix `question` → `question_summary` in `chat-service.ts` as part of the migration PR |
| Schema migration | No `ticket_type` means admin cannot distinguish escalation types | Add `ticket_type` column before writing any detection logic |
| Shared hook extraction | Skipping this creates 3x maintenance burden for every event type added | Extract `useChatStream` as first task; do not add features before this |
| Feedback UI | Thumbs rendered before `message_id` is available from stream | Gate on `done` event + `message_id` received |
| Feedback UI | Client-side UUID used instead of DB row ID | `done` chunk must include `message_id` from server |
| Unanswered detection | Detection placed before AI call | Must run post-stream, after `fullContent` assembled |
| FAQ creation | Duplicate entries from repeated tickets | Exact-match deduplication check before insert |
| Search hint feedback | Assumes same session/message infrastructure | Verify hint route creates message rows, or design separate lightweight path |
| Conversation history | Lists all sessions regardless of surface | `started_from` filter must exist before history UI is built |

---

## Sources

All findings derived from direct inspection of:
- `/lib/chatbot/chat-service.ts` — stream handler, escalation flow, ticket insert
- `/lib/chatbot/chat-actions.ts` — session creation, history loading
- `/lib/chatbot/escalation.ts` — detection logic
- `/lib/chatbot/types.ts` — type definitions
- `/app/api/chatbot/message/route.ts` — route handler
- `/app/components/chat/ChatPanel.tsx` — widget client state machine
- `/app/settings/help/InlineChat.tsx` — help page client state machine
- `/app/admin/chatbot/ConversationsTab.tsx` — admin conversation list
- `/app/admin/inbox/SupportTicketsTab.tsx` — admin ticket list
- `/app/components/chat/MessageBubble.tsx` — message rendering
- `/supabase/migrations/20260358_chat_sessions_messages.sql` — sessions/messages schema
- `/supabase/migrations/20260359_support_tickets.sql` — tickets schema
- `/supabase/migrations/20260357_faq_items.sql` — FAQ schema
