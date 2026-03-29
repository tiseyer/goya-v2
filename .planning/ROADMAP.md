# Roadmap: GOYA v2

## Milestones

- ✅ **v1.0 User Settings** - Phases 1-3 (shipped 2026-03-23)
- ✅ **v1.1 Connections & Inbox** - Phases 4-7 (shipped 2026-03-24)
- ✅ **v1.2 Stripe Admin & Shop** - Phases 8-13 (shipped 2026-03-24)
- ✅ **v1.3 Subscriptions & Teacher Upgrade** - Phases 14-20 (shipped 2026-03-26)
- ✅ **v1.6 Open Gates REST API** - Phases 1-11 (shipped 2026-03-27)
- 🚧 **v1.8 AI-Support-System** - Phases 12-15 (in progress)

## Phases

<details>
<summary>✅ v1.0–v1.7 (Phases 1–11) — SHIPPED</summary>

Phases 1–11 covered User Settings, Connections & Inbox, Stripe Admin & Shop, Subscriptions & Teacher Upgrade, and the Open Gates REST API milestone. All shipped. See MILESTONES.md for details.

</details>

### 🚧 v1.8 AI-Support-System (In Progress)

**Milestone Goal:** Add an AI-powered support chatbot ("Mattea") with encrypted third-party key management, admin configuration, FAQ knowledge base, tool-use capabilities, and escalation-to-human workflow.

- [x] **Phase 12: Encrypted Secrets + Key Management** - Secrets infrastructure and Third Party Keys admin UI
- [x] **Phase 13: Chat Schema + Admin Chatbot Config + FAQ** - All database migrations, chatbot config page, and FAQ management (completed 2026-03-29)
- [ ] **Phase 14: AI Backend + Streaming Chat Widget** - AI route, streaming, chat widget, rate limiting
- [ ] **Phase 15: Escalation + Support Tickets + Conversations Admin** - Escalation flow, support tickets, conversations viewer, cron cleanup

## Phase Details

### Phase 12: Encrypted Secrets + Key Management
**Goal**: Admin can securely store and manage third-party API keys encrypted with AES-256-GCM, and the server can decrypt them at inference time
**Depends on**: Phase 11 (REST API milestone complete)
**Requirements**: KEYS-01, KEYS-02, KEYS-03, KEYS-04, KEYS-05, KEYS-06, KEYS-07, KEYS-08, INFRA-01
**Success Criteria** (what must be TRUE):
  1. Admin can navigate to /admin/api-keys and see the Third Party Keys tab fully implemented (not a placeholder)
  2. Admin can add an OpenAI or Anthropic key by selecting provider and model — the raw key is never shown after save
  3. Admin can edit the display name/model and delete AI provider keys from the AI Providers section
  4. Admin can add, categorize (Auth/Analytics/Payments/Other), and delete general third-party keys
  5. Server-side decryption service reads SECRETS_MASTER_KEY from env and can round-trip encrypt/decrypt any stored secret
**Plans**: 2 plans
Plans:
- [x] 12-01-PLAN.md — Migration + AI provider constants + server actions
- [x] 12-02-PLAN.md — AI Providers UI section + SecretsTab refactor + human-verify
**UI hint**: yes

### Phase 13: Chat Schema + Admin Chatbot Config + FAQ
**Goal**: The database schema for all chatbot features is in place and admins can configure the chatbot persona and manage the FAQ knowledge base before the AI backend exists
**Depends on**: Phase 12
**Requirements**: INFRA-02, INFRA-03, INFRA-04, INFRA-05, ADMIN-01, ADMIN-02, ADMIN-03, ADMIN-04, ADMIN-05, ADMIN-06
**Success Criteria** (what must be TRUE):
  1. Admin can access /admin/chatbot via the sidebar (positioned between Audit Log and API Keys) and see four tabs: Configuration, FAQ, Conversations, API Connections
  2. Admin can configure chatbot name, upload a profile image, toggle active/inactive, select the AI key, edit the system prompt, and set guest retention days — changes persist on save
  3. Admin can create, edit, and delete FAQ entries with Published/Draft status toggle via inline row expansion
  4. Admin can search FAQ entries and filter by status; table shows Question, Answer, Status, and action buttons
  5. All five Supabase migrations are applied: secrets, chatbot_config, faq_items, chat_sessions/chat_messages, support_tickets
**Plans**: 3 plans
Plans:
- [x] 13-01-PLAN.md — All 4 Supabase migrations + chatbot types + server actions
- [x] 13-02-PLAN.md — Chatbot page shell + sidebar entry + Configuration tab
- [x] 13-03-PLAN.md — FAQ tab with search, inline editing, add modal + human-verify
**UI hint**: yes

### Phase 14: AI Backend + Streaming Chat Widget
**Goal**: Users and guests can chat with Mattea in real time via a floating widget; the AI route streams responses using the configured provider key, injects FAQ context, and persists all messages
**Depends on**: Phase 13
**Requirements**: AI-01, AI-02, AI-03, AI-04, AI-05, AI-06, AI-07, AI-08, AI-09, AI-10, AI-11, CHAT-01, CHAT-02, CHAT-03, CHAT-04, CHAT-05, CHAT-06, CHAT-07, CHAT-08, CHAT-09, CHAT-10, CHAT-11, CHAT-12, INFRA-07
**Success Criteria** (what must be TRUE):
  1. A floating chat button is visible on all public pages (hidden on /admin/*) and opens a 380x560px panel on desktop or fullscreen on mobile, showing the Mattea avatar, name, and online indicator
  2. A logged-in user can send a message, receive a streamed response from OpenAI or Anthropic, refresh the page, and see the full conversation history restored
  3. A guest user can chat using an anonymous session persisted via cookie, and returning in the same session sees prior messages
  4. After two failed attempts or an explicit "talk to a human" request, the widget shows the escalation message with a 48-hour response promise and creates a support ticket
  5. The chat widget is hidden when the chatbot is_active flag is false in the config, verified by checking the public config endpoint
  6. The AI route enforces a 20-message-per-session-per-hour distributed rate limit and runs on Node.js runtime (not Edge)
**Plans**: 4 plans
Plans:
- [ ] 14-01-PLAN.md — AI SDKs, chat service layer, rate limiter, escalation detection, API routes
- [ ] 14-02-PLAN.md — Chat widget UI components (8 files) + layout mount
- [ ] 14-03-PLAN.md — Wire widget to streaming backend, session management, persistence
- [ ] 14-04-PLAN.md — Human verification of complete chat flow
**UI hint**: yes

### Phase 15: Escalation + Support Tickets + Conversations Admin
**Goal**: Admins can review all chat conversations, manage escalated support tickets from within the inbox, and a cron job automatically purges expired guest sessions
**Depends on**: Phase 14
**Requirements**: SUPP-01, SUPP-02, SUPP-03, SUPP-04, SUPP-05, ADMIN-07, ADMIN-08, ADMIN-09, ADMIN-10, ADMIN-11, INFRA-06
**Success Criteria** (what must be TRUE):
  1. Admin can open the Conversations tab on /admin/chatbot and see all chat sessions with user/guest info, message count, and escalation badge; sessions are filterable by all/logged-in/guests/escalated and searchable by name or ID
  2. Admin can click any conversation to see the full read-only chat history
  3. Admin can open /admin/inbox, navigate to the Support Tickets tab, see all escalated tickets with status (Open/In Progress/Resolved), and toggle status
  4. Admin can view an escalated conversation from the support ticket, type a reply, and the reply is delivered to the user in the widget (or stored for guest retrieval)
  5. The API Connections tab in /admin/chatbot lists the four tools (Events, Teachers, Courses, FAQ) each with a description and enable/disable toggle that persists to the DB
  6. The guest cleanup cron endpoint purges chat sessions older than the configured retention days when triggered
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 12 → 13 → 14 → 15

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 12. Encrypted Secrets + Key Management | v1.8 | 2/2 | Complete    | 2026-03-27 |
| 13. Chat Schema + Admin Chatbot Config + FAQ | v1.8 | 3/3 | Complete    | 2026-03-29 |
| 14. AI Backend + Streaming Chat Widget | v1.8 | 0/4 | Not started | - |
| 15. Escalation + Support Tickets + Conversations Admin | v1.8 | 0/TBD | Not started | - |
