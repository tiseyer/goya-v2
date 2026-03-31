---
phase: quick
plan: 260331-kdt
subsystem: chatbot-ui, settings
tags: [chatbot, ui, settings, help-page, streaming]
dependency_graph:
  requires: []
  provides: [help-page, chatbot-toggle-icon-swap, inline-chat]
  affects: [app/components/chat, app/settings/help, app/layout.tsx]
tech_stack:
  added: []
  patterns: [streaming-SSE, server-actions, client-component]
key_files:
  created:
    - app/components/ui/ai-prompt-box.tsx
    - app/settings/help/actions.ts
    - app/settings/help/InlineChat.tsx
    - app/settings/help/page.tsx
  modified:
    - app/components/chat/FloatingButton.tsx
    - app/components/chat/ChatWidget.tsx
    - app/components/chat/ChatPanel.tsx
    - app/layout.tsx
    - app/settings/components/SettingsShell.tsx
decisions:
  - FloatingButton always rendered in ChatWidget (not gated by !isOpen), toggleChat() drives open/close
  - ChatPanel overflow-hidden approach for rounded corners — avoids child background bleed
  - Inline chat uses separate goya_help_chat_session_id localStorage key to avoid conflict with widget
  - Mic button shows Coming soon tooltip via CSS group-hover instead of @radix-ui/react-tooltip (no new deps needed)
metrics:
  duration: ~25min
  completed_date: 2026-03-31
  tasks: 3
  files: 9
---

# Phase quick Plan 260331-kdt: Chatbot UI Improvements Summary

**One-liner:** Toggle icon swap (MessageCircle/X), overflow-hidden bottom radius fix, admin-route gating for cookie consent, and new /settings/help page with support ticket list and streaming inline chat via PromptInputBox.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Toggle icon swap, bottom border radius, admin hiding | f637aa7 | FloatingButton.tsx, ChatWidget.tsx, ChatPanel.tsx, layout.tsx |
| 2 | Help page with support tickets and inline chat | 8426ea3 | SettingsShell.tsx, ai-prompt-box.tsx, actions.ts, InlineChat.tsx, page.tsx |
| 3 | Activity log and final verification | 052db44 | quick-task_ChatbotUIImprovements_31-03-2026.md |

## Changes Detail

### Task 1: Toggle icon swap + rounded corners + admin hiding

**FloatingButton.tsx** — Added `isOpen?: boolean` prop (default `false`). Imports both `MessageCircle` and `X` from lucide-react. Renders `<X>` when `isOpen=true`, `<MessageCircle>` when `false`. `aria-label` updates accordingly.

**ChatWidget.tsx** — Removed `{!isOpen && (...)}` conditional wrapper around `FloatingButton`. Always renders `<FloatingButton onClick={toggleChat} isOpen={isOpen} />`. Added `toggleChat()` function. Preview/Maintenance badges still only render when `!isOpen`.

**ChatPanel.tsx** — Added `overflow-hidden` to the panel container div className. This ensures the `ChatInput` child's `bg-[var(--background-secondary)]` is clipped by the parent's `md:rounded-2xl`, giving fully rounded corners on all 4 sides on desktop.

**layout.tsx** — Wrapped `<CookieConsent />` with `{!isAdmin && <CookieConsent />}`. CookieConsent already has internal route exclusion for /admin; this is belt-and-suspenders that avoids even loading the component tree on admin routes.

### Task 2: Help page

**SettingsShell.tsx** — Added `{ href: '/settings/help', label: 'Help', paths: [...] }` to NAV_ITEMS after Inbox. Icon: Heroicons question-mark-circle outline path.

**app/settings/help/actions.ts** — `getUserTickets()` server action. Gets current user via `createSupabaseServerClient()`, queries `support_tickets` table filtering by `user_id`, ordered by `created_at desc`. Returns typed `SupportTicket[]`. Returns `[]` on error (non-fatal).

**app/components/ui/ai-prompt-box.tsx** — `PromptInputBox` component. Auto-resizing textarea (max 120px). Shows `<ArrowUp>` send button when content present, `<Mic>` icon otherwise with CSS group-hover "Coming soon" tooltip. No new dependencies installed.

**app/settings/help/InlineChat.tsx** — Client component. Initializes session via `getOrCreateSession()` on mount using separate `goya_help_chat_session_id` localStorage key. Shows greeting message. Connects to `/api/chatbot/message` with streaming SSE — exact same token/done/escalation/error handling as ChatPanel. Auto-scrolls on new messages.

**app/settings/help/page.tsx** — Server component. Shows "Support" heading, "My Support Tickets" section with status badges (open=amber, in_progress=blue, resolved=green) or empty state card, then `<InlineChat />`.

## Deviations from Plan

None — plan executed exactly as written. The note about possibly installing `@radix-ui/react-tooltip` was handled by using a lightweight CSS-only tooltip (group-hover span) instead, requiring zero new dependencies.

## Known Stubs

None. All data flows are wired:
- Support tickets query against real `support_tickets` table
- InlineChat connects to live `/api/chatbot/message` endpoint with streaming
- Session persistence uses localStorage

## Self-Check: PASSED

Files verified:
- `app/components/chat/FloatingButton.tsx` — FOUND
- `app/components/chat/ChatWidget.tsx` — FOUND
- `app/components/chat/ChatPanel.tsx` — FOUND
- `app/layout.tsx` — FOUND
- `app/settings/components/SettingsShell.tsx` — FOUND
- `app/components/ui/ai-prompt-box.tsx` — FOUND
- `app/settings/help/actions.ts` — FOUND
- `app/settings/help/InlineChat.tsx` — FOUND
- `app/settings/help/page.tsx` — FOUND
- `activity/quick-tasks/quick-task_ChatbotUIImprovements_31-03-2026.md` — FOUND

Commits verified:
- f637aa7 — FOUND
- 8426ea3 — FOUND
- 052db44 — FOUND

`npx tsc --noEmit` — 2 pre-existing errors from untracked duplicate files with spaces in names (`"app/credits/page 2.tsx"` etc.) — not caused by this task. Zero new type errors introduced.
