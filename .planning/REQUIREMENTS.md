# Requirements: GOYA v2

**Defined:** 2026-03-27
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.8 Requirements

Requirements for v1.8 AI-Support-System milestone. Each maps to roadmap phases.

### Encrypted Key Management

- [x] **KEYS-01**: Admin can store third-party API keys encrypted with AES-256-GCM in Supabase
- [x] **KEYS-02**: Server-side encryption/decryption service using SECRETS_MASTER_KEY env variable
- [x] **KEYS-03**: Admin can add AI provider keys with provider (OpenAI/Anthropic) and model selection
- [ ] **KEYS-04**: AI Providers section shows display name, provider, model, created date — never raw key
- [ ] **KEYS-05**: Admin can edit and delete AI provider keys
- [ ] **KEYS-06**: General third-party keys CRUD with category filter (Auth, Analytics, Payments, Other)
- [ ] **KEYS-07**: Third Party Keys tab in /admin/api-keys fully implemented (replaces placeholder)
- [x] **KEYS-08**: SECRETS_MASTER_KEY added to .env.local.example with openssl generation command

### Chat Widget

- [ ] **CHAT-01**: Floating chat button visible on all public pages, hidden on /admin/* routes
- [ ] **CHAT-02**: Chat window opens as 380x560px panel on desktop, fullscreen on mobile
- [ ] **CHAT-03**: Chat header with Mattea avatar, name, online indicator
- [ ] **CHAT-04**: Message bubbles (user right, Mattea left with avatar) with text input and send button
- [ ] **CHAT-05**: "New Chat" button starts fresh conversation, "Delete" button clears history
- [ ] **CHAT-06**: Opening greeting: "Namaste! I'm Mattea, your GOYA guide. How can I help you today?"
- [ ] **CHAT-07**: Logged-in users' chats persist by user ID in Supabase
- [ ] **CHAT-08**: Guest users' chats persist via anonymous session ID with cookie
- [ ] **CHAT-09**: Returning users see previous conversation, not blank chat
- [ ] **CHAT-10**: Escalation triggers when: low confidence, explicit human request, or 2 failed attempts
- [ ] **CHAT-11**: Escalation message shown to user with 48-hour response promise
- [ ] **CHAT-12**: Widget only visible when chatbot is_active in config (checked via public endpoint)

### Admin Chatbot

- [x] **ADMIN-01**: /admin/chatbot page with sidebar entry between Audit Log and API Keys
- [x] **ADMIN-02**: Four tabs styled like /admin/settings: Configuration, FAQ, Conversations, API Connections
- [x] **ADMIN-03**: Configuration: chatbot name, profile image upload, active toggle, AI key selector, system prompt, guest retention days
- [x] **ADMIN-04**: Default avatar downloaded from GOYA website and stored in Supabase storage
- [x] **ADMIN-05**: FAQ tab with search, Add FAQ button, table with Question/Answer/Status/Actions
- [x] **ADMIN-06**: FAQ inline editing with dropdown expand, Save/Cancel, Published/Draft toggle
- [ ] **ADMIN-07**: Conversations tab listing all sessions with user/guest info, message count, escalation badge
- [ ] **ADMIN-08**: Conversation viewer shows full read-only chat history
- [ ] **ADMIN-09**: Conversations filterable by all/logged-in/guests/escalated, searchable by name/ID
- [ ] **ADMIN-10**: API Connections tab with toggleable tools (Events, Teachers, Courses, FAQ)
- [ ] **ADMIN-11**: Each tool shows description and enable/disable toggle

### Support Tickets

- [ ] **SUPP-01**: Support Tickets tab added to /admin/inbox (third tab)
- [ ] **SUPP-02**: Table with User, Question, Created, Status (Open/In Progress/Resolved), Actions
- [ ] **SUPP-03**: View action opens escalated conversation with reply field
- [ ] **SUPP-04**: Admin reply stored and delivered to user (in-app or in widget for guests)
- [ ] **SUPP-05**: Status toggle between Open, In Progress, Resolved

### AI Backend

- [ ] **AI-01**: POST /api/chatbot/message endpoint accepting session_id, message, anonymous_id
- [ ] **AI-02**: Reads chatbot config (active key, model, system prompt, enabled tools) from DB
- [ ] **AI-03**: Decrypts selected AI provider key server-side using SECRETS_MASTER_KEY
- [ ] **AI-04**: Calls OpenAI or Anthropic based on provider, with streaming response
- [ ] **AI-05**: FAQ items injected as context in system prompt (XML-delimited)
- [ ] **AI-06**: Full conversation history passed for session continuity
- [ ] **AI-07**: Enabled tools registered as function definitions for AI provider
- [ ] **AI-08**: User and assistant messages saved to chat_messages table
- [ ] **AI-09**: Escalation detection creates support_ticket and returns escalation flag
- [ ] **AI-10**: Rate limited: max 20 messages per session per hour (distributed)
- [ ] **AI-11**: Public endpoint (no auth for guests) with session validation

### Infrastructure

- [x] **INFRA-01**: Supabase migration: secrets table with admin-only RLS
- [x] **INFRA-02**: Supabase migration: chatbot_config single-row upsert table
- [x] **INFRA-03**: Supabase migration: faq_items table with admin write, public read for chatbot
- [x] **INFRA-04**: Supabase migration: chat_sessions and chat_messages tables with session-owner RLS
- [x] **INFRA-05**: Supabase migration: support_tickets table with admin-only RLS and session FK
- [ ] **INFRA-06**: Guest chat cleanup cron endpoint for expired sessions
- [ ] **INFRA-07**: Node.js runtime for chat route (not Edge — crypto module required)

## Future Requirements

### Deferred to v2+

- **DEFER-01**: Voice input/output for chat widget
- **DEFER-02**: Fine-tuning from conversation history (GDPR compliance required)
- **DEFER-03**: Live agent handoff (real-time WebSocket) — async ticket escalation sufficient for current scale
- **DEFER-04**: pgvector embedding for FAQ items (RAG with cosine similarity search)
- **DEFER-05**: Confidence-gated responses based on cosine similarity threshold

## Out of Scope

| Feature | Reason |
|---------|--------|
| Multi-language chatbot | Single-language (English/German) sufficient for GOYA community |
| WhatsApp/Telegram integration | Web-only chatbot covers primary use case |
| Payment processing in chat | Handled via existing Stripe integration, not chatbot |
| User-specific tools (credits, enrollments) | Requires auth-gated tool access; defer to v2 |
| Notification preferences | Out of scope since v1.0 |
| Account deletion in settings | High-risk operation, deferred |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| KEYS-01 | Phase 12 | Complete |
| KEYS-02 | Phase 12 | Complete |
| KEYS-03 | Phase 12 | Complete |
| KEYS-04 | Phase 12 | Pending |
| KEYS-05 | Phase 12 | Pending |
| KEYS-06 | Phase 12 | Pending |
| KEYS-07 | Phase 12 | Pending |
| KEYS-08 | Phase 12 | Complete |
| CHAT-01 | Phase 14 | Pending |
| CHAT-02 | Phase 14 | Pending |
| CHAT-03 | Phase 14 | Pending |
| CHAT-04 | Phase 14 | Pending |
| CHAT-05 | Phase 14 | Pending |
| CHAT-06 | Phase 14 | Pending |
| CHAT-07 | Phase 14 | Pending |
| CHAT-08 | Phase 14 | Pending |
| CHAT-09 | Phase 14 | Pending |
| CHAT-10 | Phase 14 | Pending |
| CHAT-11 | Phase 14 | Pending |
| CHAT-12 | Phase 14 | Pending |
| ADMIN-01 | Phase 13 | Complete |
| ADMIN-02 | Phase 13 | Complete |
| ADMIN-03 | Phase 13 | Complete |
| ADMIN-04 | Phase 13 | Complete |
| ADMIN-05 | Phase 13 | Complete |
| ADMIN-06 | Phase 13 | Complete |
| ADMIN-07 | Phase 15 | Pending |
| ADMIN-08 | Phase 15 | Pending |
| ADMIN-09 | Phase 15 | Pending |
| ADMIN-10 | Phase 15 | Pending |
| ADMIN-11 | Phase 15 | Pending |
| SUPP-01 | Phase 15 | Pending |
| SUPP-02 | Phase 15 | Pending |
| SUPP-03 | Phase 15 | Pending |
| SUPP-04 | Phase 15 | Pending |
| SUPP-05 | Phase 15 | Pending |
| AI-01 | Phase 14 | Pending |
| AI-02 | Phase 14 | Pending |
| AI-03 | Phase 14 | Pending |
| AI-04 | Phase 14 | Pending |
| AI-05 | Phase 14 | Pending |
| AI-06 | Phase 14 | Pending |
| AI-07 | Phase 14 | Pending |
| AI-08 | Phase 14 | Pending |
| AI-09 | Phase 14 | Pending |
| AI-10 | Phase 14 | Pending |
| AI-11 | Phase 14 | Pending |
| INFRA-01 | Phase 12 | Complete |
| INFRA-02 | Phase 13 | Complete |
| INFRA-03 | Phase 13 | Complete |
| INFRA-04 | Phase 13 | Complete |
| INFRA-05 | Phase 13 | Complete |
| INFRA-06 | Phase 15 | Pending |
| INFRA-07 | Phase 14 | Pending |

**Coverage:**
- v1.8 requirements: 54 total
- Mapped to phases: 54
- Unmapped: 0

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after roadmap creation — all 54 requirements mapped*
