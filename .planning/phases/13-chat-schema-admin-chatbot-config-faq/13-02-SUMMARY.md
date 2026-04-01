---
phase: 13-chat-schema-admin-chatbot-config-faq
plan: "02"
subsystem: admin-chatbot-ui
tags: [next.js, tailwind, server-component, client-component, chatbot, admin-ui]
dependency_graph:
  requires: [chatbot_config table from Phase 13-01, chatbot-actions server actions from 13-01, listAiProviderKeys from Phase 12]
  provides: [/admin/chatbot page with 4 tabs, ConfigurationTab form, PlaceholderTab component, Chatbot sidebar entry]
  affects: [Phase 13-03 FAQ UI (will replace FAQ placeholder tab), Phase 14 chat widget (links to admin config)]
tech_stack:
  added: []
  patterns: [searchParams server component tab routing, use client form with server action calls, URL.createObjectURL avatar preview, inline validation with toast feedback]
key_files:
  created:
    - app/admin/chatbot/page.tsx
    - app/admin/chatbot/ConfigurationTab.tsx
    - app/admin/chatbot/PlaceholderTab.tsx
  modified:
    - app/admin/components/AdminShell.tsx
decisions:
  - "FAQ tab renders PlaceholderTab until Plan 03 wires FaqTab — avoids import cycle without stub complexity"
  - "uploadChatbotAvatar already updates avatar_url in DB, so saveChatbotConfig needs no avatar_url argument on normal saves"
  - "Select disabled when aiKeys is empty, shows single disabled option per UI-SPEC"
metrics:
  duration: "6 minutes"
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 13 Plan 02: Admin Chatbot Config Page Summary

**One-liner:** /admin/chatbot page with four-tab shell (searchParams routing), full Configuration form (name, avatar upload with local preview, active toggle, AI key selector, system prompt, retention days) backed by server actions, and PlaceholderTab for Conversations and API Connections tabs.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Add sidebar entry and create page shell with tab routing | a21bce9 | AdminShell.tsx, page.tsx, PlaceholderTab.tsx |
| 2 | Build the Configuration tab with all form fields | 70da19a | ConfigurationTab.tsx |

## What Was Built

### Sidebar Entry

Chatbot nav item inserted between Audit Log and API Keys in AdminShell NAV_ITEMS (index 9). Uses chat-bubble SVG path. `href: '/admin/chatbot'`.

### /admin/chatbot Page (page.tsx)

Server component that reads `searchParams.tab` and renders one of four tabs:
- `config` (default) → `<ConfigurationTab config={config} aiKeys={aiKeys} />`
- `faq` → temporary PlaceholderTab (Plan 03 will replace with FaqTab import)
- `conversations` → PlaceholderTab "Coming in Phase 15"
- `api-connections` → PlaceholderTab "Coming in Phase 15"

Fetches `getChatbotConfig()` and `listAiProviderKeys()` in parallel via `Promise.all`. Page heading: "Chatbot Settings" with subheading per UI-SPEC copywriting contract. Tab bar matches api-keys/page.tsx pattern exactly (`border-b-2 border-[#00B5A3]` active, `border-transparent` inactive).

### ConfigurationTab (ConfigurationTab.tsx)

`'use client'` component with three section cards:

**Identity:** Chatbot Name (text input, placeholder "e.g. Mattea", max 100 chars), Profile Image (file input with `URL.createObjectURL` local preview), Active toggle (`role="switch"`, `bg-[#00B5A3]` on / `bg-[#E5E7EB]` off, label "Active"/"Inactive").

**AI Configuration:** AI Provider Key select (populated from aiKeys, disabled option when empty: "No AI provider keys found — add one in API Keys"), System Prompt textarea (`min-h-[120px] resize-y`) with helper text.

**Guest Settings:** Guest Session Retention (days) number input (min 1, max 365) with helper text.

Save handler:
1. Client validates name required, system prompt required, retention 1-365
2. If avatar file selected: calls `uploadChatbotAvatar(formData)` — on failure shows inline error and stops
3. Calls `saveChatbotConfig(...)` with all five config fields
4. Shows toast "Configuration saved" on success, "Failed to save. Please try again." on failure
5. Toast auto-dismisses after 5s (matches settings page pattern)

### PlaceholderTab (PlaceholderTab.tsx)

Reusable component accepting `title` and `body` props. Renders as a section card (`bg-white rounded-xl border border-[#E5E7EB] shadow-sm`) with centered content.

## Deviations from Plan

None — plan executed exactly as written. The temporary ConfigurationTab stub was committed as part of Task 1 (staged alongside page.tsx) and replaced in Task 2.

## Known Stubs

- `app/admin/chatbot/page.tsx` FAQ tab renders PlaceholderTab with "FAQ tab loading..." — intentional stub. Plan 03 will replace this with the real FaqTab import.

## Self-Check: PASSED

- [x] app/admin/components/AdminShell.tsx contains href '/admin/chatbot' between Audit Log and API Keys
- [x] app/admin/chatbot/page.tsx is a server component (no 'use client'), reads searchParams
- [x] page.tsx renders four tab links with correct ?tab= hrefs
- [x] app/admin/chatbot/PlaceholderTab.tsx accepts title and body props
- [x] Conversations and API Connections tabs render PlaceholderTab with "Coming in Phase 15"
- [x] app/admin/chatbot/ConfigurationTab.tsx starts with 'use client'
- [x] Three section cards: Identity, AI Configuration, Guest Settings
- [x] Active toggle uses role="switch", bg-[#00B5A3] when on
- [x] Avatar upload shows local preview via URL.createObjectURL
- [x] Save button shows "Saving..." when saving, disabled:opacity-50
- [x] Toast auto-dismisses after 5s
- [x] Commits a21bce9 and 70da19a exist in git log
- [x] npx tsc --noEmit shows no new errors in chatbot files
