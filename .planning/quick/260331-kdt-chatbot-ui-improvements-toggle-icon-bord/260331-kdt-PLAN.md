---
phase: quick
plan: 260331-kdt
type: execute
wave: 1
depends_on: []
files_modified:
  - app/components/chat/ChatWidget.tsx
  - app/components/chat/FloatingButton.tsx
  - app/components/chat/ChatPanel.tsx
  - app/layout.tsx
  - app/components/CookieConsent.tsx
  - app/settings/components/SettingsShell.tsx
  - app/settings/help/page.tsx
  - app/settings/help/actions.ts
  - app/components/ui/ai-prompt-box.tsx
  - app/settings/help/InlineChat.tsx
  - activity/quick-tasks/quick-task_ChatbotUIImprovements_31-03-2026.md
autonomous: true
requirements: []
must_haves:
  truths:
    - "Chatbot toggle button is always visible (bottom-right) on non-admin pages regardless of chat open/closed state"
    - "Toggle button shows MessageCircle icon when chat is closed, X icon when chat is open"
    - "Chat window has rounded corners on all four sides on desktop"
    - "Neither chatbot bubble nor cookie settings button appear on /admin/* routes"
    - "User settings sidebar has a Help nav item"
    - "Help page shows user's support tickets with status badges"
    - "Help page has an inline chat interface connected to the same Mattea chatbot API"
  artifacts:
    - path: "app/components/chat/ChatWidget.tsx"
      provides: "Always-visible toggle with icon swap"
    - path: "app/components/chat/FloatingButton.tsx"
      provides: "Accepts isOpen prop, renders X or MessageCircle"
    - path: "app/components/chat/ChatPanel.tsx"
      provides: "Rounded bottom corners on desktop"
    - path: "app/layout.tsx"
      provides: "Conditional hiding of CookieConsent on admin routes"
    - path: "app/settings/help/page.tsx"
      provides: "Help page with tickets + inline chat"
    - path: "app/components/ui/ai-prompt-box.tsx"
      provides: "PromptInputBox component (simplified)"
  key_links:
    - from: "app/settings/help/InlineChat.tsx"
      to: "/api/chatbot/message"
      via: "fetch POST with streaming"
      pattern: "fetch.*api/chatbot/message"
---

<objective>
Chatbot UI improvements: (1) toggle button stays visible with icon swap, (2) chat window bottom border radius, (3) hide chatbot+cookie on admin routes, (4) new Help page in user settings with support tickets list and inline chat.

Purpose: Improve chatbot UX and add a dedicated Help page for logged-in users to view tickets and chat inline.
Output: Updated chat widget behavior, new Help settings page with inline chat.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@CLAUDE.md
@app/components/chat/ChatWidget.tsx
@app/components/chat/FloatingButton.tsx
@app/components/chat/ChatPanel.tsx
@app/components/chat/ChatInput.tsx
@app/components/chat/MessageBubble.tsx
@app/components/chat/MessageList.tsx
@app/components/chat/ChatHeader.tsx
@app/components/CookieConsent.tsx
@app/layout.tsx
@app/settings/components/SettingsShell.tsx
@app/settings/layout.tsx
@lib/chatbot/chat-actions.ts
@supabase/migrations/20260359_support_tickets.sql

<interfaces>
<!-- ChatWidget currently hides FloatingButton when isOpen=true (line 105-106) -->
<!-- FloatingButton takes { onClick } — needs isOpen prop added -->
<!-- ChatPanel className has md:rounded-2xl but no bottom rounding (line 339) -->
<!-- CookieConsent already excludes /admin via EXCLUDED_PREFIXES (line 10-20) — confirmed working -->
<!-- layout.tsx line 102: {!isAdmin && <ChatWidgetLoader />} — already hides chat on admin -->
<!-- support_tickets table: id, session_id, user_id, question_summary, status (open|in_progress|resolved), created_at -->
<!-- SettingsShell NAV_ITEMS array at line 7: General, Subscriptions, Connections, Inbox -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Chatbot toggle icon swap, bottom border radius, and admin hiding</name>
  <files>
    app/components/chat/ChatWidget.tsx,
    app/components/chat/FloatingButton.tsx,
    app/components/chat/ChatPanel.tsx,
    app/layout.tsx,
    app/components/CookieConsent.tsx
  </files>
  <action>
**1a. FloatingButton — accept isOpen prop, swap icon:**

In `app/components/chat/FloatingButton.tsx`:
- Add `isOpen` boolean prop to the interface (default false).
- Import `X` from lucide-react alongside `MessageCircle`.
- When `isOpen` is true, render `<X size={24} />` instead of `<MessageCircle size={24} />`.
- Update aria-label: "Close chat" when open, "Open chat with Mattea" when closed.

**1b. ChatWidget — always show FloatingButton:**

In `app/components/chat/ChatWidget.tsx`:
- Remove the `{!isOpen && (...)}` conditional wrapping around `<FloatingButton>` and badges (lines 105-118).
- Always render `<FloatingButton onClick={toggleChat} isOpen={isOpen} />` where `toggleChat` is a new function that calls `handleOpen` if closed, `handleClose` if open.
- Keep badges rendering only when `!isOpen` (they should hide when chat panel is open).
- The FloatingButton must always render regardless of `isOpen` state.

**1c. ChatPanel — add bottom border radius on desktop:**

In `app/components/chat/ChatPanel.tsx`:
- The existing className at line 338-339 has `md:rounded-2xl`. This already applies border-radius to all four corners on desktop. However, inspect if a child element (like ChatInput at the bottom) clips the corners.
- If ChatInput's background creates visual flat corners, add `rounded-b-2xl` (or `md:rounded-b-2xl`) to the ChatInput wrapper div in `ChatInput.tsx`, specifically the outer div with `border-t`. Also add `overflow-hidden` to the ChatPanel container if not present to ensure child backgrounds don't bleed past the rounded corners.
- The simplest fix: add `overflow-hidden` to the ChatPanel container div className (after `md:rounded-2xl`). This ensures the ChatInput background respects the parent's rounded corners.

**1d. Hide CookieConsent on admin routes:**

In `app/layout.tsx`:
- The ChatWidgetLoader is already gated with `{!isAdmin && <ChatWidgetLoader />}` (line 102) -- no change needed there.
- Wrap `<CookieConsent />` (line 105) with the same `{!isAdmin && ...}` conditional: `{!isAdmin && <CookieConsent />}`.
- Note: CookieConsent already has internal route exclusion for /admin, but this is belt-and-suspenders and avoids even loading the component on admin routes.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - FloatingButton always visible, shows X when chat open, MessageCircle when closed
    - Clicking button toggles chat open/closed
    - Chat window has visually rounded corners on all 4 sides (desktop)
    - Neither chatbot nor cookie button render on /admin/* routes
  </done>
</task>

<task type="auto">
  <name>Task 2: Help page with support tickets and inline chat</name>
  <files>
    app/settings/components/SettingsShell.tsx,
    app/settings/help/page.tsx,
    app/settings/help/actions.ts,
    app/components/ui/ai-prompt-box.tsx,
    app/settings/help/InlineChat.tsx
  </files>
  <action>
**2a. Add Help nav item to SettingsShell:**

In `app/settings/components/SettingsShell.tsx`:
- Add a new entry to `NAV_ITEMS` array after "Inbox":
  ```
  {
    href: '/settings/help',
    label: 'Help',
    paths: ['M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z'],
  }
  ```
  This is the question-mark-circle icon path from Heroicons (outline).

**2b. Create server actions for support tickets:**

Create `app/settings/help/actions.ts`:
- `'use server'` directive.
- Import `createSupabaseServerClient` from `@/lib/supabaseServer`.
- Export `getUserTickets()`: get current user via `supabase.auth.getUser()`, then query `support_tickets` table where `user_id = user.id`, ordered by `created_at desc`, select `id, question_summary, status, created_at`. Return typed array.

**2c. Create simplified PromptInputBox component:**

Create `app/components/ui/ai-prompt-box.tsx` as a `'use client'` component:
- A textarea with auto-resize (like existing ChatInput pattern).
- A send button (ArrowUp icon from lucide-react) that appears when textarea has content.
- Props: `onSend: (message: string) => void`, `disabled?: boolean`, `placeholder?: string`.
- Style: full-width, rounded-2xl border, bg-[var(--background-secondary)], focus ring with goya-primary. Match GOYA design system.
- Enter sends (shift+Enter for newline). Max height ~120px.
- No mic button, no file attachments, no toggle buttons — keep it minimal.

**2d. Create InlineChat client component:**

Create `app/settings/help/InlineChat.tsx` as a `'use client'` component:
- Import `getCurrentUserId`, `getAnonymousId`, `getOrCreateSession` from `@/lib/chatbot/chat-actions`.
- Import `MessageBubble` from `@/app/components/chat/MessageBubble`.
- Import `TypingIndicator` from `@/app/components/chat/TypingIndicator`.
- Import the `ai-prompt-box` PromptInputBox component.
- State: messages array (same Message type as ChatPanel), isTyping, isStreaming, sessionId.
- On mount: call `getOrCreateSession` (same pattern as ChatPanel lines 49-93) with user's identity. Use `goya_help_chat_session_id` as a separate localStorage key so it doesn't conflict with the widget.
- `handleSend`: POST to `/api/chatbot/message` with streaming (copy the exact streaming logic from ChatPanel lines 121-282 — same fetch, same SSE parsing, same token/done/escalation/error handling).
- Layout: `flex flex-col` with a fixed height of `h-[500px]` (or min-h-[400px] max-h-[600px]).
  - Top: heading "Start a Conversation" as h3 text-lg font-semibold text-foreground mb-0 inside the chat area header.
  - Middle: scrollable message list area (flex-1 overflow-y-auto) displaying MessageBubble components. Include the Mattea greeting as first message (same as MessageList: "Namaste! I'm Mattea, your GOYA guide. How can I help you today?"). Auto-scroll on new messages.
  - Bottom: PromptInputBox pinned at bottom with border-t.
- Style the container with `border border-[var(--goya-border)] rounded-2xl overflow-hidden bg-[var(--goya-surface)]`.

**2e. Create Help page:**

Create `app/settings/help/page.tsx` as a server component:
- Import `getUserTickets` from `./actions`.
- Import `InlineChat` from `./InlineChat`.
- Import `PageContainer` from `@/app/components/ui/PageContainer`.
- Layout:
  - Wrap content in a div with `p-6 md:p-8` (consistent with other settings pages).
  - Heading: `<h1 className="text-2xl font-bold text-foreground">Support</h1>`
  - Section 1: "My Support Tickets"
    - `<h2 className="text-lg font-semibold text-foreground mt-6 mb-3">My Support Tickets</h2>`
    - Fetch tickets via `await getUserTickets()`.
    - If no tickets: show empty state card with text "No support tickets yet." in a rounded-xl border card, text-foreground-secondary, centered.
    - If tickets exist: render a list of cards (rounded-xl border border-[var(--goya-border)] p-4 bg-white) each showing:
      - `question_summary` as the title (text-sm font-medium).
      - Status badge: `open` = amber/yellow bg, `in_progress` = blue bg, `resolved` = green bg. Use inline rounded-full px-2 py-0.5 text-xs font-medium badges.
      - `created_at` formatted as readable date (e.g., "Mar 31, 2026"). Use `new Date(ticket.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })`.
  - Section 2: Inline Chat
    - `<h2 className="text-lg font-semibold text-foreground mt-8 mb-3">Start a Conversation</h2>` (this heading is OUTSIDE the InlineChat, above it).
    - Render `<InlineChat />`.

Install missing dependency before implementation:
```bash
npm install @radix-ui/react-tooltip --legacy-peer-deps
```
Note: `@radix-ui/react-dialog` is NOT needed since we stripped the image preview dialog. Only install `@radix-ui/react-tooltip` if the simplified PromptInputBox needs it — if not (since we stripped mic/tooltips), skip the install entirely. The simplified version likely needs zero new deps.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -30</automated>
  </verify>
  <done>
    - /settings/help route loads with "Support" heading
    - "My Support Tickets" section renders tickets or empty state
    - Inline chat connects to /api/chatbot/message and streams responses
    - SettingsShell sidebar shows "Help" nav item
    - Help page uses GOYA design system (brand colors, rounded corners, typography)
  </done>
</task>

<task type="auto">
  <name>Task 3: Activity log and final verification</name>
  <files>
    activity/quick-tasks/quick-task_ChatbotUIImprovements_31-03-2026.md
  </files>
  <action>
Create `activity/quick-tasks/quick-task_ChatbotUIImprovements_31-03-2026.md` with:
- Task description: "Chatbot UI improvements — toggle icon swap, bottom border radius, admin route hiding, Help page with inline chat"
- Status: Complete
- Solution summary listing all 4 changes made
- Files modified list

Run final type check: `npx tsc --noEmit`
Run dev server briefly to confirm no runtime errors on /settings/help.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | head -20</automated>
  </verify>
  <done>
    - Activity log created at correct path
    - `npx tsc --noEmit` passes with zero errors
    - All 4 improvements implemented and type-safe
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero type errors
2. Visual: On non-admin page, chatbot toggle visible at all times; icon swaps between MessageCircle/X
3. Visual: Chat window has rounded corners on all 4 sides (desktop)
4. Visual: On /admin/* routes, no chatbot bubble, no cookie button
5. Visual: /settings/help shows tickets section + inline chat
6. Functional: Inline chat on Help page sends/receives messages via same Mattea API
</verification>

<success_criteria>
- Toggle button always visible, icon changes based on chat state
- Chat window bottom corners are rounded on desktop
- Admin routes show neither chatbot nor cookie button
- /settings/help accessible from settings sidebar, shows tickets + working inline chat
- `npx tsc --noEmit` passes
- Activity log written
</success_criteria>

<output>
After completion, create `.planning/quick/260331-kdt-chatbot-ui-improvements-toggle-icon-bord/260331-kdt-SUMMARY.md`
</output>
