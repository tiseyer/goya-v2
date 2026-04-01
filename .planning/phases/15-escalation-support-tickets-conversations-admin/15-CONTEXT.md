# Phase 15: Escalation + Support Tickets + Conversations Admin - Context

**Gathered:** 2026-03-29
**Status:** Ready for planning

<domain>
## Phase Boundary

Complete the admin operations surface: Conversations tab (list + read-only viewer), Support Tickets tab in admin inbox (third tab with reply flow), API Connections tab with toggleable tools, and guest chat cleanup cron endpoint.

</domain>

<decisions>
## Implementation Decisions

### Conversations Tab (in /admin/chatbot)
- Replace the placeholder Conversations tab with a full implementation
- Table columns: User display name or "Guest" + anonymous ID, started at, last message at, message count, escalated (yes/no badge), Actions (View)
- Filter by: all / logged-in users / guests / escalated only — URL params or client-side state
- Search by user name or guest ID
- View opens a read-only conversation viewer showing full chat history — same bubble styling as widget but in an admin panel card
- Data fetched via server actions using getSupabaseService()

### Support Tickets Tab (in /admin/inbox)
- Add "Support Tickets" as third tab in existing /admin/inbox page — style exactly like School Registrations and Teacher Upgrades tabs
- Table columns: User (name or "Guest"), Question/Issue (truncated), Created, Status (Open/In Progress/Resolved), Actions (View, Resolve)
- View opens the full escalated chat conversation (read-only) plus a reply field below
- Reply: admin types response, clicks Send → stores reply as assistant message in chat_messages for that session + updates ticket status
- For logged-in users: reply appears in chat widget next time they open it (messages are in chat_messages)
- For guests: reply appears in chat widget when they return (same session via cookie)
- Status toggle: Open → In Progress → Resolved via click

### API Connections Tab (in /admin/chatbot)
- Replace the placeholder API Connections tab with toggleable tools
- Four tools minimum: Events (search upcoming events), Teachers (search teacher profiles), Courses (search academy courses), FAQ (always enabled, reads published items)
- Each tool: name, description, enable/disable toggle that persists to chatbot_config or a new chatbot_tools table
- Store enabled tools as JSON array in chatbot_config (add enabled_tools column) — simpler than a separate table

### Guest Cleanup Cron
- API route: /api/cron/chatbot-cleanup
- Reads guest_retention_days from chatbot_config
- Deletes chat_messages for expired guest sessions (anonymous_id IS NOT NULL AND created_at < NOW() - retention days)
- Deletes the chat_sessions themselves after messages are gone
- Protected by CRON_SECRET header check (existing pattern from credits-expiring cron)
- Add to vercel.json cron config: daily at 3am UTC

### Claude's Discretion
- Conversation viewer layout within admin card
- Status badge color mapping (Open=yellow, In Progress=blue, Resolved=green)
- Tool description text for each connection
- Reply input field styling

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- /admin/inbox/page.tsx — existing 2-tab inbox page to extend with third tab
- /admin/chatbot/page.tsx — existing 4-tab page, Conversations and API Connections are placeholders
- MessageBubble component from app/components/chat/ — reusable for conversation viewer
- chatbot-actions.ts — existing server actions, extend with conversation/ticket queries
- Existing cron pattern: /api/cron/credits-expiring with CRON_SECRET verification

### Established Patterns
- URL-driven tab navigation (?tab= param)
- Server component data fetching with getSupabaseService()
- Optimistic status updates via server actions
- Admin-only RLS or service-role access for admin data

### Integration Points
- /admin/inbox/page.tsx — add Support Tickets tab
- /admin/chatbot/page.tsx — replace Conversations and API Connections placeholders
- chatbot_config table — add enabled_tools column (jsonb)
- chat_sessions + chat_messages — read for conversations, write for admin replies
- support_tickets table — CRUD for ticket management
- vercel.json — add cron entry

</code_context>

<specifics>
## Specific Ideas

- User spec: Support ticket reply should notify user (in-app notification or email for logged-in; show in widget for guests)
- User spec: Conversation viewer same read-only style for both /admin/chatbot Conversations and /admin/inbox Support Tickets
- User spec: FAQ tool always enabled (no toggle)
- User spec: Model tools after existing API endpoints — evaluate which internal data connections make sense

</specifics>

<deferred>
## Deferred Ideas

- User-specific tools (credits, enrollments) — requires auth-gated tool access, v2
- Real-time notifications for new support tickets
- Webhook notifications for escalations
- pgvector FAQ embedding — v2

</deferred>
