---
project: GOYA v2 — Mattea Intelligence System
created: 2026-04-03
last_updated: 2026-04-03
---

# GOYA v2 — Mattea Intelligence System

## What This Is

An intelligence layer for Mattea (GOYA's AI assistant) that adds feedback loops, conversation memory, unanswered question escalation, and source tracking. Part of the GOYA v2 yoga association platform.

## Core Value

Mattea becomes smarter over time: users give feedback, unanswered questions become FAQ entries, and admins gain visibility into how the AI is being used across all surfaces.

## Context

**Platform:** GOYA v2 (Next.js 16, App Router, TypeScript, Tailwind CSS v4, Supabase)

**Mattea surfaces (3):**
1. Floating chat widget (bottom-right of every page)
2. Search overlay hint card (Cmd+K search)
3. Help page embedded chat (`/settings/help`)

**Existing admin pages:**
- `app/admin/chatbot/` — Chatbot Settings (Configuration, FAQ, Conversations, API Connections tabs)
- `app/admin/inbox/` — Admin Inbox (Credits & Hours, Verifications, Support Tickets, Teacher Upgrades, School Registrations, Events, Courses)

**Existing DB tables:** `chatbot_conversations`, `support_tickets`, `chatbot_faq` (exact names to be verified by schema research)

## Current Milestone: v1.23 Mattea Intelligence System

**Goal:** Add feedback, conversation history, unanswered question escalation, and source tracking to Mattea.

**Target features:**
- Conversation history on Help page (load previous chats)
- Thumbs up/down feedback on every Mattea response (all 3 surfaces)
- Unanswered question → support ticket pipeline with admin resolution (Add to FAQ / Reject)
- Source tracking (started_from: widget/search/help page)
- Admin visibility: feedback column, source column, ticket source filter

## Key Decisions

| # | Decision | Rationale | Date |
|---|----------|-----------|------|
| 1 | Feedback is per-conversation, not per-message | Simpler schema, sufficient granularity for FAQ improvement | 2026-04-03 |
| 2 | Unanswered detection via response phrase matching | No confidence score API available; phrase patterns are reliable | 2026-04-03 |
| 3 | "Add to FAQ" creates published entry directly | Reduces admin friction; admin already reviewed the answer | 2026-04-03 |
| 4 | Search hint feedback stored on same table if possible | Avoid schema fragmentation | 2026-04-03 |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition:**
1. Requirements invalidated? → Move to Out of Scope with reason
2. Requirements validated? → Move to Validated with phase reference
3. New requirements emerged? → Add to Active
4. Decisions to log? → Add to Key Decisions

**After each milestone:**
1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state
