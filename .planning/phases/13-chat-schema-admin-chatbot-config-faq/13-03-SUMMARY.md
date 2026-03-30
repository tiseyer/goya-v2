---
phase: 13-chat-schema-admin-chatbot-config-faq
plan: "03"
subsystem: admin-chatbot-faq-ui
tags: [next.js, tailwind, use-client, chatbot, faq, admin-ui, inline-editing, optimistic-updates]
dependency_graph:
  requires: [faq_items table from Phase 13-01, chatbot-actions server actions from 13-01, /admin/chatbot page shell from 13-02]
  provides: [FaqTab component, FaqRow component, FaqModal component, wired FAQ tab on /admin/chatbot]
  affects: [Phase 14 chat widget (FAQ knowledge base entries), admin FAQ management workflow]
tech_stack:
  added: []
  patterns: [optimistic status toggle with revert-on-failure, inline expand/collapse row edit, single-row-expanded guard, inline delete confirmation, prepend-on-create for fresh items at top]
key_files:
  created:
    - app/admin/chatbot/FaqTab.tsx
    - app/admin/chatbot/FaqRow.tsx
    - app/admin/chatbot/FaqModal.tsx
  modified:
    - app/admin/chatbot/page.tsx
decisions:
  - "FaqTab handles expandedId state centrally — passing isExpanded and onExpand to FaqRow keeps single-row constraint enforced at parent level"
  - "Unused createFaqItem/deleteFaqItem imports removed from FaqTab — child components (FaqRow, FaqModal) own their server action calls directly"
metrics:
  duration: "5 minutes"
  completed_date: "2026-03-29"
  tasks_completed: 2
  files_created: 3
  files_modified: 1
---

# Phase 13 Plan 03: FAQ Management UI Summary

**One-liner:** Three client components (FaqTab with search/table/empty-state, FaqRow with inline expand-edit/optimistic status toggle/inline delete confirm, FaqModal for new entry creation) wired into /admin/chatbot page with server-fetched initial data.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | Build FaqTab, FaqRow, and FaqModal components | 9c93721 | FaqTab.tsx, FaqRow.tsx, FaqModal.tsx |
| 2 | Wire FaqTab into chatbot page | 2024108 | page.tsx |

## What Was Built

### FaqTab (FaqTab.tsx)

`'use client'` component accepting `{ initialItems: FaqItem[] }`.

- **Toolbar:** Search input (with Search icon from lucide-react, `max-w-sm`) + "Add FAQ" button (`bg-[#4e87a0]`). Client-side filter on question and answer text.
- **Table:** `overflow-x-auto` wrapper, `w-full min-w-[640px]`. Header: `bg-slate-50 text-xs font-semibold uppercase tracking-widest text-[#6B7280]`. 6 columns: Question (30%), Answer (25%), Status, Created, By, Actions.
- **Empty state:** ClipboardList icon + "No FAQ entries yet" heading + body + "Add FAQ" button (shown when items.length === 0 and no search query).
- **Search no-results:** "No FAQ entries match your search." centered text (shown when filtered to 0 but items.length > 0).
- **State:** `items`, `search`, `showModal`, `expandedId` (only one row expanded at a time). `handleExpand` enforces single-row constraint.

### FaqRow (FaqRow.tsx)

`'use client'` component accepting `{ item, isExpanded, onExpand, onDelete, onUpdate }`.

- **Collapsed:** Truncated question/answer (`line-clamp-1`), clickable status badge (Published: `bg-emerald-50 text-emerald-700`, Draft: `bg-yellow-50 text-yellow-700`), formatted date, creator name, Edit/Delete action buttons.
- **Status toggle:** Optimistic — swaps `optimisticStatus` immediately, calls `toggleFaqStatus` in background, reverts on failure. Badge `opacity-60` during save.
- **Expanded edit area:** Rendered as second `<tr>` with `colspan={6}`. `bg-slate-50 border-t border-slate-200`. Question + Answer textareas, "Save Changes" (primary) + "Discard Changes" (text).
- **Delete flow:** Click "Delete" shows inline "Sure?" + red "Delete" + "Keep Entry" within the same row. Row fades to 50% opacity during deletion. On success: calls `onDelete(id)`.

### FaqModal (FaqModal.tsx)

`'use client'` component accepting `{ open, onClose, onCreated }`.

- `fixed inset-0 z-50` with `backdrop-blur-sm bg-black/30`. Closes on Escape key and backdrop click.
- `max-w-md` card with section header ("Add FAQ Entry"), Question input + Answer textarea, Save FAQ / Discard buttons.
- Calls `createFaqItem` on save, passes result to `onCreated` callback on success.

### page.tsx Wiring

- Added `listFaqItems` import alongside `getChatbotConfig`.
- Added to `Promise.all` parallel fetch: `faqResult`.
- `initialFaqItems = faqResult.success ? faqResult.items : []`.
- FAQ tab now renders `<FaqTab initialItems={initialFaqItems} />` (PlaceholderTab stub removed).

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing critical] Removed unused server action imports from FaqTab**
- **Found during:** Task 1 verification
- **Issue:** FaqTab initially imported `createFaqItem` and `deleteFaqItem` directly — these are owned by FaqModal and FaqRow respectively, creating unnecessary coupling and potential lint warnings.
- **Fix:** Removed the unused imports. FaqRow and FaqModal call their own server actions directly.
- **Files modified:** app/admin/chatbot/FaqTab.tsx

## Known Stubs

None — all CRUD operations are fully wired to server actions.

## Self-Check

- [x] app/admin/chatbot/FaqTab.tsx exists, starts with 'use client', accepts initialItems prop
- [x] FaqTab has search input placeholder "Search FAQ entries..." and "Add FAQ" button bg-[#4e87a0]
- [x] FaqTab renders 6-column table: Question, Answer, Status, Created, By, Actions
- [x] FaqTab table header has bg-slate-50 text-xs font-semibold uppercase tracking-widest text-[#6B7280]
- [x] Empty state renders "No FAQ entries yet" with ClipboardList icon and "Add FAQ" button
- [x] Search no-results renders "No FAQ entries match your search."
- [x] app/admin/chatbot/FaqRow.tsx exists, starts with 'use client'
- [x] FaqRow collapsed view has line-clamp-1 truncation for question and answer
- [x] Status badge: Published bg-emerald-50 text-emerald-700, Draft bg-yellow-50 text-yellow-700
- [x] Expanded area renders Question + Answer textareas + "Save Changes" + "Discard Changes"
- [x] Delete shows inline "Sure?" + "Delete" (red) + "Keep Entry"
- [x] app/admin/chatbot/FaqModal.tsx exists, starts with 'use client'
- [x] Modal has backdrop-blur-sm, max-w-md, "Add FAQ Entry" title
- [x] Modal has Question input + Answer textarea + "Save FAQ" + "Discard"
- [x] app/admin/chatbot/page.tsx imports FaqTab and listFaqItems
- [x] page.tsx calls listFaqItems() in Promise.all
- [x] FAQ tab renders FaqTab with initialItems prop (no more PlaceholderTab for faq)
- [x] npx tsc --noEmit shows no chatbot-specific errors
- [x] Commits 9c93721 and 2024108 exist in git log

## Self-Check: PASSED
