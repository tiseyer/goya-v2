---
phase: 14
plan: "02"
subsystem: chat-widget-ui
tags: [chat, widget, ui, components, floating-button, streaming]
dependency_graph:
  requires: []
  provides: [chat-widget-ui, floating-button, chat-panel, message-bubbles]
  affects: [app/layout.tsx]
tech_stack:
  added: []
  patterns: [use-client, dynamic-import, css-custom-properties, lucide-react]
key_files:
  created:
    - app/components/chat/FloatingButton.tsx
    - app/components/chat/ChatHeader.tsx
    - app/components/chat/MessageBubble.tsx
    - app/components/chat/TypingIndicator.tsx
    - app/components/chat/MessageList.tsx
    - app/components/chat/ChatInput.tsx
    - app/components/chat/ChatPanel.tsx
    - app/components/chat/ChatWidget.tsx
  modified:
    - app/layout.tsx
decisions:
  - ChatWidget uses ssr:false dynamic import — client-side only, avoids SSR bundle cost
  - ChatInput disabled during isTyping in mock mode — prevents double sends before Plan 03 wires real API
  - FloatingButton hidden when panel open (not rendered behind panel) — avoids z-index conflicts
metrics:
  duration_seconds: 215
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_changed: 9
requirements: [CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-12]
---

# Phase 14 Plan 02: Chat Widget UI Components Summary

**One-liner:** Full floating chat widget UI (8 components) with mock interactions, mounted in root layout via dynamic import, hidden on admin pages.

---

## What Was Built

Complete visual surface for the GOYA chat widget — all 8 client components following the 14-UI-SPEC.md contract exactly. Widget is visually complete with mock send behavior; real streaming API wiring happens in Plan 03.

### Components Created

| Component | Description |
|-----------|-------------|
| `FloatingButton.tsx` | 56x56px fixed bottom-right circle, MessageCircle icon, aria-label="Open chat with Mattea" |
| `ChatHeader.tsx` | 56px header with avatar, name, online dot, new/delete/close buttons + inline delete confirm |
| `MessageBubble.tsx` | 4 role variants (user, assistant, escalation, rate-limit) with stepIn animation |
| `TypingIndicator.tsx` | Staggered 3-dot pulse with Mattea avatar, aria-label="Mattea is typing" |
| `MessageList.tsx` | Scrollable list with auto-scroll, greeting bubble, aria-live="polite" |
| `ChatInput.tsx` | Auto-expand textarea (max 3 rows), Enter sends, Shift+Enter newline, disabled state |
| `ChatPanel.tsx` | 380x560 desktop / 100dvh mobile, role="dialog", Escape closes, mock send with 1s delay |
| `ChatWidget.tsx` | Fetches /api/chatbot/config on mount, renders null when is_active=false |

### Layout Integration

`app/layout.tsx` updated with:
- `dynamic(() => import('./components/chat/ChatWidget'), { ssr: false })` — lazy-loaded, not in main SSR bundle
- `isAdmin` derived from existing `pathname` variable
- `{!isAdmin && <ChatWidget />}` inside `ClientProviders`, before `CookieConsent`

---

## Deviations from Plan

None — plan executed exactly as written.

---

## Known Stubs

| Stub | File | Reason |
|------|------|--------|
| Mock send response | `app/components/chat/ChatPanel.tsx` lines 66-78 | Intentional — Plan 03 replaces with real streaming API call to /api/chatbot/message |
| `sessionId` state initialized but unused | `app/components/chat/ChatPanel.tsx` | Intentional — Plan 03 sends sessionId to API |

These stubs are expected and documented. The widget's visual goal (Plan 02) is fully achieved. Real API wiring is Plan 03's responsibility.

---

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| Task 1 | `37b633a` | feat(14-02): create all 8 chat widget UI components |
| Task 2 | `7a53fdc` | feat(14-02): mount ChatWidget in root layout |

---

## Self-Check: PASSED
