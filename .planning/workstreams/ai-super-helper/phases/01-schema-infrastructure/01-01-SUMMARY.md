---
phase: 01-schema-infrastructure
plan: 01
subsystem: chatbot
tags: [schema, migration, bug-fix, types]
requirements: [INFRA-01, INFRA-02, INFRA-03]

dependency_graph:
  requires: []
  provides:
    - chat_sessions.started_from column
    - chat_sessions.user_feedback column
    - chat_sessions.feedback_at column
    - support_tickets.ticket_type column
    - support_tickets.rejection_reason column
    - getOrCreateSession started_from parameter
  affects:
    - lib/chatbot/chat-actions.ts
    - lib/chatbot/chat-service.ts
    - lib/chatbot/types.ts
    - app/admin/inbox/actions.ts

tech_stack:
  added: []
  patterns:
    - SQL ALTER TABLE with DEFAULT values and CHECK constraints
    - Optional TypeScript parameter with DB-level default fallback

key_files:
  created:
    - supabase/migrations/20260405_mattea_intelligence_schema.sql
  modified:
    - lib/chatbot/chat-service.ts
    - lib/chatbot/chat-actions.ts
    - lib/chatbot/types.ts
    - app/admin/inbox/actions.ts

decisions:
  - started_from DEFAULT is 'chat_widget' (not 'widget') to match enum values chat_widget/search_hint/help_page
  - user_feedback is nullable (NULL = no feedback given yet)
  - rejection_reason is nullable (only populated on rejection)
  - Existing callers of getOrCreateSession NOT updated — parameter is optional, Phase 2 wires it at call sites
  - Migration applied via supabase db query --linked -f (not db push) due to out-of-order local migrations

metrics:
  duration: ~8 minutes
  completed: 2026-04-04
  tasks_completed: 2
  tasks_total: 2
  files_modified: 4
  files_created: 1
---

# Phase 01 Plan 01: Schema & Infrastructure — Mattea Intelligence Schema

Schema additions enabling source tracking, user feedback, and ticket classification for the Mattea Intelligence System, plus a data-corruption bug fix.

## What Was Built

**Migration `20260405_mattea_intelligence_schema.sql`** — adds five columns across two tables:
- `chat_sessions.started_from` — tracks where a conversation originated (chat_widget / search_hint / help_page). NOT NULL with DEFAULT 'chat_widget' so all existing rows are backfilled correctly.
- `chat_sessions.user_feedback` — nullable 'up' | 'down' (NULL = no feedback given). CHECK constraint enforced at DB level.
- `chat_sessions.feedback_at` — nullable timestamptz, populated when feedback is recorded.
- `support_tickets.ticket_type` — 'human_escalation' | 'unanswered_question'. NOT NULL with DEFAULT 'human_escalation' so all existing tickets classify correctly.
- `support_tickets.rejection_reason` — nullable text, only set when a ticket is rejected.

**Bug fix in `chat-service.ts`** — support_tickets insert used column name `question` which does not exist in the schema. Corrected to `question_summary`. This prevented ALL support ticket creation from ever succeeding.

**`getOrCreateSession` updated in `chat-actions.ts`** — accepts optional `started_from` parameter; inserts `started_from: params.started_from ?? 'chat_widget'` so new sessions record their source. Existing callers require no changes.

**TypeScript types updated in `lib/chatbot/types.ts`** — `ChatSession` and `SupportTicket` interfaces updated to match the new schema columns.

## Tasks

| Task | Status | Commit |
|------|--------|--------|
| Task 1: Create migration and fix column-name bug | Complete | b0f81e1 |
| Task 2: Update getOrCreateSession and types | Complete | 15111e6 |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Type error in app/admin/inbox/actions.ts after SupportTicket interface update**
- **Found during:** Task 2 TypeScript verification
- **Issue:** `app/admin/inbox/actions.ts` constructs `SupportTicket[]` objects in a `.map()` call that did not include the newly required `ticket_type` and `rejection_reason` fields. After adding these to the interface, TypeScript reported TS2322.
- **Fix:** Added `ticket_type: (r.ticket_type ?? 'human_escalation')` and `rejection_reason: r.rejection_reason ?? null` to the mapped object. The `?? 'human_escalation'` fallback handles any existing DB rows that predate the migration.
- **Files modified:** `app/admin/inbox/actions.ts`
- **Commit:** 15111e6

**2. [Rule 3 - Blocking] Worktree behind develop — chatbot files absent**
- **Found during:** Task 1 setup
- **Issue:** Worktree branch `worktree-agent-a27bf46b` was behind `develop` — all chatbot-related files (lib/chatbot/, migration 20260358/20260359) were missing.
- **Fix:** Ran `git merge develop --no-edit` in the worktree to bring it up to date before starting.
- **Commit:** Merge commit (pre-task)

**3. [Deviation - Migration method] Used `supabase db query --linked -f` instead of `supabase db push`**
- **Reason:** `db push` detected out-of-order local migrations and refused to proceed. The constraint in the plan specified `npx supabase db query --linked -f <migration_file>` as the fallback — this was used and the migration applied cleanly.

## Known Stubs

None — all code paths are wired to real DB columns. The `started_from` parameter is optional in `getOrCreateSession` so existing callers continue to work; wiring specific values at call sites is Phase 2 work (source tracking), not a stub.

## Self-Check: PASSED

- [x] `supabase/migrations/20260405_mattea_intelligence_schema.sql` exists
- [x] `grep "question_summary" lib/chatbot/chat-service.ts` — found at line 112
- [x] `grep "started_from" lib/chatbot/chat-actions.ts` — found at lines 23 and 58
- [x] `grep "started_from" lib/chatbot/types.ts` — found at line 44
- [x] `npx tsc --noEmit` — 0 errors
- [x] Migration applied to remote DB via `supabase db query --linked`
- [x] Commits b0f81e1 and 15111e6 exist
