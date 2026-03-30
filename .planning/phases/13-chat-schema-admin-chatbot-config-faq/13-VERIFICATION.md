---
phase: 13-chat-schema-admin-chatbot-config-faq
verified: 2026-03-27T00:00:00Z
status: passed
score: 14/14 must-haves verified
gaps: []
human_verification:
  - test: "Navigate to /admin/chatbot and verify full interactive flow"
    expected: "Configuration tab pre-populated with Mattea defaults, save persists, FAQ CRUD operations work end-to-end, placeholder tabs show Coming in Phase 15"
    why_human: "Supabase storage avatar auto-fetch, toast feedback, optimistic status toggle with revert, and multi-step form save require a running browser session"
---

# Phase 13: Chat Schema + Admin Chatbot Config + FAQ Verification Report

**Phase Goal:** The database schema for all chatbot features is in place and admins can configure the chatbot persona and manage the FAQ knowledge base before the AI backend exists
**Verified:** 2026-03-27
**Status:** PASSED
**Re-verification:** No — initial verification

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | All four migrations apply without error | VERIFIED | Files 20260356–20260359 exist with correct DDL; commits c7b1a85 confirmed |
| 2 | chatbot_config supports single-row upsert with all required columns | VERIFIED | Migration has all 9 columns, FK to admin_secrets, updated_at trigger, default Mattea row |
| 3 | faq_items has admin write + public read RLS for published items | VERIFIED | `CREATE POLICY "Anyone can read published FAQ items" USING (status = 'published')` present |
| 4 | chat_sessions and chat_messages exist with session-owner RLS | VERIFIED | Both tables created with correct EXISTS-subquery RLS policy for messages |
| 5 | support_tickets exists with admin-only RLS (no policies) | VERIFIED | RLS enabled, no policies — service role only |
| 6 | Server actions can read/write chatbot_config and faq_items | VERIFIED | All 8 actions use `getSupabaseService()`, return typed results, call `revalidatePath` |
| 7 | Admin can navigate to /admin/chatbot via sidebar between Audit Log and API Keys | VERIFIED | AdminShell.tsx line 108: `label: 'Chatbot'`, positioned at line 108 between lines 99 (Audit Log) and 116 (API Keys) |
| 8 | Admin sees four tabs: Configuration, FAQ, Conversations, API Connections | VERIFIED | page.tsx renders four `<Link>` tabs with correct `?tab=` hrefs and active styling |
| 9 | Admin can edit chatbot name, toggle active, select AI key, edit system prompt, set retention days | VERIFIED | ConfigurationTab.tsx renders all five fields with validation, state, and save handler |
| 10 | Admin can upload a profile image with local preview | VERIFIED | `handleAvatarChange` calls `URL.createObjectURL`, file stored in state for upload on save |
| 11 | Configuration saves persist to database with success toast | VERIFIED | `handleSave` calls `saveChatbotConfig`, shows toast "Configuration saved" auto-dismissed at 5s |
| 12 | Conversations and API Connections tabs show placeholder content | VERIFIED | Both render `<PlaceholderTab title="Coming in Phase 15" ...>` |
| 13 | Admin can see FAQ table and manage entries (search, add, edit, toggle, delete) | VERIFIED | FaqTab, FaqRow, FaqModal all wired; all CRUD via server actions |
| 14 | Only one FAQ row expanded at a time | VERIFIED | `expandedId` state in FaqTab passed as `isExpanded` to FaqRow; `handleExpand` sets one ID or null |

**Score:** 14/14 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `supabase/migrations/20260356_chatbot_config.sql` | chatbot_config table | VERIFIED | All 9 columns, FK REFERENCES admin_secrets, RLS enabled, default Mattea row, updated_at trigger |
| `supabase/migrations/20260357_faq_items.sql` | faq_items with RLS | VERIFIED | Public SELECT policy for `status = 'published'`, updated_at trigger |
| `supabase/migrations/20260358_chat_sessions_messages.sql` | chat_sessions + chat_messages | VERIFIED | Both tables, user_id RLS on sessions, EXISTS subquery RLS on messages, indexes on user_id and session_id |
| `supabase/migrations/20260359_support_tickets.sql` | support_tickets admin-only | VERIFIED | RLS enabled, no policies, session_id FK, resolved_by FK |
| `lib/chatbot/types.ts` | ChatbotConfig, FaqItem, FaqStatus exports | VERIFIED | All three types exported; FaqItem includes optional `creator_name` |
| `app/admin/chatbot/chatbot-actions.ts` | 8 server actions | VERIFIED | `'use server'` + `import 'server-only'`, all 8 actions exported, use getSupabaseService, revalidatePath on mutations |
| `app/admin/chatbot/page.tsx` | Server component with tab routing | VERIFIED | No 'use client', reads `searchParams`, parallel fetch of config + aiKeys + faqItems |
| `app/admin/chatbot/ConfigurationTab.tsx` | Config form with all fields | VERIFIED | 'use client', 3 sections, all fields, avatar preview, toggle, validation, toast |
| `app/admin/chatbot/PlaceholderTab.tsx` | Reusable placeholder | VERIFIED | Accepts title + body, renders section card |
| `app/admin/chatbot/FaqTab.tsx` | FAQ table with search/toolbar/empty state | VERIFIED | 'use client', initialItems prop, search filter, 6-column table, empty state, single-row expand guard |
| `app/admin/chatbot/FaqRow.tsx` | Inline expand/collapse edit | VERIFIED | Collapsed + expanded rows, optimistic status toggle, inline delete confirmation |
| `app/admin/chatbot/FaqModal.tsx` | Add FAQ modal | VERIFIED | Backdrop-blur overlay, Escape key close, createFaqItem call, onCreated callback |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `20260356_chatbot_config.sql` | `admin_secrets` table | `REFERENCES admin_secrets(id)` | WIRED | Line 7: `selected_key_id uuid REFERENCES admin_secrets(id) ON DELETE SET NULL` |
| `chatbot-actions.ts` | `lib/chatbot/types.ts` | import types | WIRED | Line 6: `import type { ChatbotConfig, FaqItem, FaqStatus } from '@/lib/chatbot/types'` |
| `page.tsx` | `chatbot-actions.ts` | server-side data fetch | WIRED | Line 2: `import { getChatbotConfig, listFaqItems } from './chatbot-actions'`; both called in Promise.all |
| `ConfigurationTab.tsx` | `chatbot-actions.ts` | saveChatbotConfig + uploadChatbotAvatar | WIRED | Line 6: both imported and called in handleSave |
| `AdminShell.tsx` | `/admin/chatbot` | NAV_ITEMS entry | WIRED | Line 107: `href: '/admin/chatbot'` confirmed in NAV_ITEMS |
| `FaqTab.tsx` | `chatbot-actions.ts` | listFaqItems | WIRED | via page.tsx server fetch; initialItems prop populated from faqResult |
| `FaqRow.tsx` | `chatbot-actions.ts` | updateFaqItem, toggleFaqStatus, deleteFaqItem | WIRED | Line 5: all three imported and called in handlers |
| `FaqModal.tsx` | `chatbot-actions.ts` | createFaqItem | WIRED | Line 5: imported and called in handleSave |
| `page.tsx` | `FaqTab.tsx` | import and render for faq tab | WIRED | Line 7: `import FaqTab from './FaqTab'`; line 94: `{activeTab === 'faq' && <FaqTab initialItems={initialFaqItems} />}` |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `ConfigurationTab.tsx` | `config` prop (name, is_active, etc.) | `getChatbotConfig()` → `chatbot_config` table via service role | Yes — `.select('*').single()` against live table | FLOWING |
| `ConfigurationTab.tsx` | `aiKeys` prop | `listAiProviderKeys()` → `admin_secrets` table | Yes — existing action from Phase 12 | FLOWING |
| `FaqTab.tsx` | `initialItems` prop | `listFaqItems()` → `faq_items` table with profiles join | Yes — `.select('*, profiles!created_by(full_name)').order(...)` | FLOWING |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for migration files (no runnable entry point without a live DB connection). TypeScript compilation verified instead.

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compilation — no errors in chatbot files | `npx tsc --noEmit` (filtered to chatbot) | No output (clean) | PASS |
| All 6 commits documented in SUMMARYs exist in git log | `git log --oneline` grep | c7b1a85, 1cc2b54, a21bce9, 70da19a, 9c93721, 2024108 all found | PASS |
| chatbot_config migration has REFERENCES admin_secrets | grep on migration file | Line 7 confirmed | PASS |
| faq_items has public read RLS policy | grep on migration file | `USING (status = 'published')` confirmed | PASS |
| FaqRow imports all 3 server actions it uses | grep on FaqRow.tsx | updateFaqItem, toggleFaqStatus, deleteFaqItem imported line 5 | PASS |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| INFRA-02 | 13-01 | Supabase migration: chatbot_config single-row upsert table | SATISFIED | 20260356_chatbot_config.sql exists with all columns, FK, trigger, default row |
| INFRA-03 | 13-01 | Supabase migration: faq_items table with admin write, public read for chatbot | SATISFIED | 20260357_faq_items.sql with public read RLS policy for published items |
| INFRA-04 | 13-01 | Supabase migration: chat_sessions and chat_messages with session-owner RLS | SATISFIED | 20260358_chat_sessions_messages.sql with both tables and correct RLS |
| INFRA-05 | 13-01 | Supabase migration: support_tickets with admin-only RLS and session FK | SATISFIED | 20260359_support_tickets.sql with RLS enabled, no policies, session_id FK |
| ADMIN-01 | 13-02 | /admin/chatbot page with sidebar entry between Audit Log and API Keys | SATISFIED | AdminShell.tsx NAV_ITEMS at line 108 (between Audit Log at 99, API Keys at 116) |
| ADMIN-02 | 13-02 | Four tabs styled like /admin/settings: Configuration, FAQ, Conversations, API Connections | SATISFIED | page.tsx renders four Link tabs with teal active border styling |
| ADMIN-03 | 13-02 | Configuration: chatbot name, profile image upload, active toggle, AI key selector, system prompt, guest retention days | SATISFIED | ConfigurationTab.tsx renders all six fields with validation |
| ADMIN-04 | 13-02 | Default avatar downloaded from GOYA website and stored in Supabase storage | SATISFIED | saveChatbotConfig auto-fetches from MATTEA_AVATAR_URL when avatar_url is null |
| ADMIN-05 | 13-03 | FAQ tab with search, Add FAQ button, table with Question/Answer/Status/Actions | SATISFIED | FaqTab.tsx renders search, Add FAQ (bg-[#4e87a0]), 6-column table, empty state |
| ADMIN-06 | 13-03 | FAQ inline editing with dropdown expand, Save/Cancel, Published/Draft toggle | SATISFIED | FaqRow.tsx: inline expand, Save Changes/Discard Changes, optimistic badge toggle, inline delete confirm |

No orphaned requirements — all 10 IDs claimed by plans are accounted for. ADMIN-07/08/09 and INFRA-06/07 are correctly mapped to Phase 15/14 in REQUIREMENTS.md and are not claimed by Phase 13 plans.

---

## Anti-Patterns Found

No blockers or warnings found.

- `placeholder=` attribute matches in ConfigurationTab, FaqTab, FaqModal are HTML input placeholder text — not stub implementations.
- `PlaceholderTab` for Conversations/API Connections is intentional by design (Phase 15 scope) and documented in PLAN and SUMMARY as known stubs.
- No `return null`, empty handlers, or hardcoded empty arrays that flow to user-visible output.
- No TODO/FIXME/HACK comments in any phase 13 file.

---

## Human Verification Required

### 1. Full /admin/chatbot Interactive Flow

**Test:** Log in as admin, navigate to /admin/chatbot
**Expected:**
1. Sidebar shows "Chatbot" between Audit Log and API Keys
2. Configuration tab loads pre-populated with Mattea defaults (name, system prompt, retention 5 days)
3. If no avatar was previously set, the Mattea avatar from the GOYA CDN should be auto-fetched and displayed on first save
4. Edit name, toggle active, change system prompt, click Save Configuration — success toast appears and persists on page refresh
5. FAQ tab: empty state shows "No FAQ entries yet" with Add FAQ button
6. Click Add FAQ, fill question + answer, save — entry appears at top of table as Draft
7. Click status badge — optimistic toggle to Published
8. Click Edit — row expands inline with textareas, Save Changes collapses and updates
9. Click Delete — inline "Sure?" + red Delete + "Keep Entry" shown; Delete removes row
10. Conversations and API Connections tabs show "Coming in Phase 15" placeholder cards

**Why human:** Avatar CDN fetch, Supabase storage upload, toast auto-dismiss timing, optimistic status revert on network failure, and multi-step save interactions require a running browser and live database.

---

## Gaps Summary

No gaps. All 14 observable truths are verified. All 12 required artifacts exist and are substantive (not stubs). All 9 key links are wired. All 10 requirement IDs are satisfied. TypeScript compiles clean with no errors in phase 13 files. Six commits documented in SUMMARYs all confirmed in git log.

The one known intentional stub — PlaceholderTab for Conversations and API Connections tabs — is by design (Phase 15 scope) and does not block this phase's goal.

---

_Verified: 2026-03-27_
_Verifier: Claude (gsd-verifier)_
