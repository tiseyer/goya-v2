# Quick Task: Chatbot UI Improvements

**Date:** 2026-03-31
**Task ID:** 260331-kdt
**Status:** Complete

## Task Description

Chatbot UI improvements across 4 areas:
1. Toggle button icon swap (MessageCircle / X based on open state)
2. Chat window bottom border radius on desktop
3. Hide chatbot bubble and cookie consent on /admin/* routes
4. New Help page in user settings with support tickets list and inline chat

## Solution Summary

### 1. Toggle button always visible with icon swap
- `FloatingButton.tsx`: added `isOpen` prop, imports both `MessageCircle` and `X` from lucide-react, renders the appropriate icon, updates `aria-label` dynamically
- `ChatWidget.tsx`: removed `{!isOpen && (...)}` wrapper around `FloatingButton`, added `toggleChat()` function that calls `handleOpen` or `handleClose` based on state. Badges (Preview / Maintenance) still only render when `!isOpen`

### 2. Chat window rounded corners on all 4 sides
- `ChatPanel.tsx`: added `overflow-hidden` to the panel container className — ensures the `ChatInput` background (which previously caused visual flat bottom corners) is clipped by the parent's `md:rounded-2xl`

### 3. Hide chatbot and cookie consent on /admin routes
- `layout.tsx`: wrapped `<CookieConsent />` with `{!isAdmin && ...}` — belt-and-suspenders alongside the internal route exclusion already in CookieConsent. `<ChatWidgetLoader />` was already gated by `!isAdmin` (no change needed)

### 4. Help page with support tickets and inline chat
- `app/settings/components/SettingsShell.tsx`: added Help nav item with question-mark-circle Heroicons path
- `app/settings/help/actions.ts`: `getUserTickets()` server action — queries `support_tickets` table for current user's tickets
- `app/components/ui/ai-prompt-box.tsx`: `PromptInputBox` component — auto-resizing textarea, ArrowUp send button when content present, Mic icon with "Coming soon" tooltip otherwise
- `app/settings/help/InlineChat.tsx`: client component connecting to `/api/chatbot/message` via streaming SSE — same pattern as ChatPanel with separate `goya_help_chat_session_id` localStorage key
- `app/settings/help/page.tsx`: server component rendering tickets (with status badges) or empty state, plus `<InlineChat />`

## Files Modified

- `app/components/chat/FloatingButton.tsx`
- `app/components/chat/ChatWidget.tsx`
- `app/components/chat/ChatPanel.tsx`
- `app/layout.tsx`
- `app/settings/components/SettingsShell.tsx`
- `app/components/ui/ai-prompt-box.tsx` (new)
- `app/settings/help/actions.ts` (new)
- `app/settings/help/InlineChat.tsx` (new)
- `app/settings/help/page.tsx` (new)

## Commits

- `f637aa7` — feat(quick-260331-kdt): toggle icon swap, bottom border radius, admin hiding
- `8426ea3` — feat(quick-260331-kdt): Help page with support tickets and inline chat
