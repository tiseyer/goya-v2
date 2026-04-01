# Phase 13: Chat Schema + Admin Chatbot Config + FAQ - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Create all Supabase migrations for the chatbot system (chatbot_config, faq_items, chat_sessions, chat_messages, support_tickets), build the /admin/chatbot page with 4 tabs (Configuration, FAQ, Conversations, API Connections), implement chatbot configuration CRUD, and FAQ management with inline editing.

</domain>

<decisions>
## Implementation Decisions

### Admin Chatbot Page Structure
- Chatbot sidebar entry positioned between Audit Log and API Keys in AdminShell NAV_ITEMS
- Tab implementation uses URL-driven `?tab=` params matching the `/admin/api-keys` pattern (Link components, searchParams on server)
- Configuration tab saves via server action with toast notification — matches admin settings pattern
- Default Mattea avatar downloaded from https://globalonlineyogaassociation.org/wp-content/uploads/2026/03/mattea.jpg on first config save if no avatar exists, stored in Supabase storage bucket `chatbot-avatars`
- Four tabs: Configuration (default), FAQ, Conversations, API Connections
- Conversations and API Connections tabs show "Coming in Phase 15" placeholder (built in later phases)

### FAQ Management UI
- Inline editing via accordion-style row expansion: click Edit → row expands below with Question and Answer textareas + Save and Cancel buttons
- Status toggle: click Published/Draft badge to toggle instantly via server action with optimistic update
- Search across both question and answer text, client-side filter
- "Add FAQ" button top-right, same style as Events admin page "Add New Event" button
- Table columns: Question (truncated), Answer (truncated), Status (Published/Draft toggle), Created, Created By, Actions (Edit, Delete)

### Migration Schema Decisions
- chatbot_config: single-row upsert table with columns: id, name (default 'Mattea'), avatar_url, is_active (default false), system_prompt (text, pre-filled), selected_key_id (FK to admin_secrets), guest_retention_days (default 5), created_at, updated_at
- faq_items: id, question (text), answer (text), status ('published'/'draft'), created_by (FK to profiles), created_at, updated_at — RLS: admin write, public read for published items via chatbot API
- chat_sessions: id, user_id (nullable FK to profiles), anonymous_id (nullable text), created_at, last_message_at, is_escalated (default false), expires_at (nullable) — RLS: session owner (user_id match or service role for anonymous)
- chat_messages: id, session_id (FK to chat_sessions), role ('user'/'assistant'), content (text), created_at — RLS: inherits from session ownership
- support_tickets: id, session_id (FK to chat_sessions), user_id (nullable), anonymous_id (nullable), question_summary (text), status ('open'/'in_progress'/'resolved'), created_at, resolved_at, resolved_by (nullable FK to profiles) — RLS: admin only

### Claude's Discretion
- Configuration form field ordering and layout within the tab
- Toast notification styling and placement (follow existing pattern)
- FAQ empty state copy and design
- Conversations/API Connections placeholder page content

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- AdminShell with NAV_ITEMS array — insert new entry with type: 'link', href, label, paths
- URL-driven tab pattern from /admin/api-keys/page.tsx — Link components, searchParams-based active state
- Server actions pattern from secrets-actions.ts — 'use server', getSupabaseService(), optimistic UI
- Toggle component from admin settings — role="switch", teal accent when on
- Toast from admin settings — fixed bottom-right, auto-dismiss at 5s
- Section card pattern from admin settings — bg-white rounded-xl border shadow-sm

### Established Patterns
- Service role Supabase client (getSupabaseService()) for admin-only tables
- Server actions for mutations, server components for initial data fetch
- Optimistic UI updates in client components
- Migration naming: YYYYMMDD_description.sql (sequential day numbers)
- RLS pattern: ENABLE ROW LEVEL SECURITY, policies via is_admin() function or no policies (service-role only)

### Integration Points
- AdminShell NAV_ITEMS — add chatbot entry at index 9 (between Audit Log and API Keys)
- admin_secrets table — chatbot_config.selected_key_id FK references admin_secrets.id
- Supabase storage — new bucket 'chatbot-avatars' for Mattea profile image
- profiles table — FKs from faq_items.created_by, support_tickets.user_id, support_tickets.resolved_by

</code_context>

<specifics>
## Specific Ideas

- User spec: System prompt pre-fill with the full Mattea prompt (warm, knowledgeable, yoga community values, FAQ knowledge base, escalation behavior)
- User spec: FAQ table modeled after existing Events admin page (Add New button, table with Edit/Delete/Status toggle)
- User spec: All tab designs modeled after existing Settings page tab style (/admin/settings)
- User spec: AI Provider Key selector dropdown populated from encrypted AI keys created in Phase 12, showing display names (e.g. "Till's Test Key - GPT-4o")

</specifics>

<deferred>
## Deferred Ideas

- Conversations tab full implementation → Phase 15
- API Connections tab full implementation → Phase 15
- Chat widget integration → Phase 14
- AI backend route → Phase 14

</deferred>
