---
workstream: ai-super-helper
milestone: v1.23
milestone_name: Mattea Intelligence System
status: in_progress
created: 2026-04-03
last_updated: 2026-04-04T09:21:00Z
---

# Project State

## Project Reference

See: .planning/workstreams/ai-super-helper/PROJECT.md (updated 2026-04-03)

**Core value:** Mattea becomes smarter over time — feedback loops, unanswered question escalation to FAQ, and admin visibility into all AI surfaces
**Current focus:** Phase 4 — Unanswered Question Pipeline

## Current Position

Phase: 4 of 5 (Unanswered Question Pipeline)
Plan: 1 of TBD in current phase (04-01 complete)
Status: In progress
Last activity: 2026-04-04 — Plan 04-01 complete: Unanswered phrase detection auto-creates support tickets; source filter added to admin Support Tickets tab

Progress: [████████░░] ~60%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: ~7 minutes
- Total execution time: ~33 minutes

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-schema-infrastructure | 2 complete | ~11 min | ~5.5 min |
| 02-source-tracking | 1 complete | ~8 min | ~8 min |
| 03-feedback | 2 complete | ~14 min | ~7 min |
| 04-unanswered-question-pipeline | 1 complete | ~8 min | ~8 min |

**Recent Trend:**
- Last 5 plans: 01-02, 02-01, 03-01, 03-02, 04-01
- Trend: Steady ~8 min/plan

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- Feedback is per-conversation, not per-message (simpler schema)
- Unanswered detection via response phrase matching (no confidence score API)
- "Add to FAQ" creates published entry directly — no draft step
- Search hint feedback stored on same conversations table if possible
- started_from DEFAULT is 'chat_widget' (matches enum: chat_widget/search_hint/help_page)
- user_feedback is nullable (NULL = no feedback given)
- rejection_reason is nullable (only set on rejection)
- getOrCreateSession started_from is optional; all callers now pass correct value (Phase 2 complete)
- useChatStream manages its own streaming state; callers receive setMessages to seed history
- message_id emitted on escalation chunk too (not just done), so all assistant messages are DB-targetable
- MatteaSearchHint is fire-and-forget and NOT a useChatStream consumer
- FeedbackButtons is self-contained — manages its own fetch state, no callback needed to parent
- feedbackSlot render prop used on MessageBubble to avoid role-specific logic in the bubble itself
- Greeting message excluded from feedback in InlineChat (static local, not a Mattea response)
- Search hint session created lazily on first thumb click (ensureSession), not pre-created on render
- sessionPromiseRef deduplicates concurrent ensureSession calls
- onBeforeSubmit prop on FeedbackButtons enables dynamic session acquisition without breaking existing callers
- UNANSWERED_PHRASES phrase matching runs post-stream on fullContent in both OpenAI and Anthropic branches; no confidence score API needed
- ticketTypeFilter is a separate second param on listSupportTickets (not merged into statusFilter) to preserve backward compat with existing callers

### Pending Todos

None.

### Blockers/Concerns

- Search hint (MatteaSearchHint) — RESOLVED in 03-02. Session created lazily via ensureSession on first thumb click.
- `npx supabase db push` is blocked by out-of-order local migrations; use `npx supabase db query --linked -f <file>` for future migrations in this workstream.

## Session Continuity

Last session: 2026-04-04T09:21:00Z
Stopped at: Plan 04-01 complete — all tasks committed (084af0b, ca900f8)
Resume file: None — continue with next plan in phase 04
