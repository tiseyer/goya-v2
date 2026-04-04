# Feature Landscape: Mattea Intelligence System

**Domain:** AI chatbot feedback, history, escalation, and analytics
**Researched:** 2026-04-03
**Scope:** NEW features only — feedback, conversation history, unanswered question escalation, source tracking

---

## Table Stakes

Features users and admins expect in any system that adds intelligence to a chatbot. Missing any of these makes the product feel incomplete or professional.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Thumbs up/down on AI responses | Standard in every major AI product (ChatGPT, Claude, Gemini). Users expect a feedback affordance. | Low | Per-conversation (already decided). Standard icons — no custom iconography. |
| Feedback persisted to DB | Feedback with no storage is pointless. Admins need to query it. | Low | Requires a `feedback` column or separate row on `chatbot_conversations`. |
| Admin view of feedback per conversation | Without admin visibility, feedback provides zero signal. | Low | Column or badge in existing ConversationsTab. |
| Unanswered question detection | Every production chatbot system flags conversations where the AI failed to answer. | Medium | Via phrase matching (already decided): "I don't know", "I'm not sure", "I don't have information about", etc. |
| Unanswered questions queue for admin | Industry-standard: flag > queue > review > action. Witivio, Dante AI, Landbot all provide this. | Medium | A dedicated sub-section in admin/chatbot or admin/inbox. |
| "Add to FAQ" action from unanswered queue | Direct pipeline from failure to knowledge base improvement. This is the core value loop. | Medium | Creates published `chatbot_faq` entry directly (already decided). |
| "Dismiss / Reject" action on unanswered queue | Admins need a way to close out-of-scope or spam questions without acting on them. | Low | Marks queue item resolved without creating FAQ. |
| Source tracking (widget / search / help) | Cannot improve the product without knowing which surface generates what. Baseline analytics. | Low | `started_from` enum on `chatbot_conversations`. Set at conversation creation, never changes. |
| Source visible in admin conversations view | Without surfacing source in the table, tracking it is useless. | Low | Column addition to ConversationsTab. |

---

## Differentiators

Features that add meaningful value above the baseline. Not universally expected, but significantly improve the system.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Conversation history on Help page | Users don't want to re-explain context. Loading previous sessions on `/settings/help` makes the help experience feel continuous and professional. | Medium | Requires a "previous conversations" list UI in HelpPageClient. Session ID linkage to user. Load-on-select, not auto-loaded. |
| Source filter in admin conversations | When source is tracked, filtering by surface helps admins identify surface-specific failure patterns. | Low | Filter dropdown addition to ConversationsTab — trivial once source column exists. |
| Feedback filter in admin conversations | Filter to show only negatively-rated conversations. Focuses admin review effort. | Low | Same — trivial once feedback column exists. |
| "Reject with reason" on unanswered queue | Logging why a question was rejected improves future triage. "Out of scope", "spam", "duplicate". | Low-Medium | Optional enum reason field on rejection. A nice-to-have, not blocking. |
| Unanswered question source attribution | Knowing that unanswered questions mostly come from the search hint surface vs. the help page guides content strategy. | Low | Derived from `started_from` — no extra work if source tracking is built first. |

---

## Anti-Features

Features to explicitly NOT build in this milestone.

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| Per-message feedback | The project already decided feedback is per-conversation. Per-message requires schema fragmentation, more UI surface area on every message bubble, and adds complexity disproportionate to signal quality for this use case. | Keep thumbs at conversation level. |
| Free-text feedback comments | "What went wrong?" text fields are rarely filled, increase friction, and create unstructured data requiring NLP to process. | Thumbs alone is sufficient signal at this scale. |
| Automatic FAQ creation (no admin review) | AI-generated answers that failed once should not auto-publish as FAQ answers. Quality degrades, trust erodes. | Always require admin "Add to FAQ" action. |
| Confidence score display to users | No confidence score API is available (already decided). Displaying uncertainty estimates without a reliable source misleads users. | Use phrase-based unanswered detection on the backend; surface nothing to users. |
| Conversation summarization / memory injection | Cross-session memory injection into the AI prompt is a separate capability requiring LLM context management, not a feedback or history problem. | Load previous conversation transcripts for user review only — do not inject into AI context. |
| Real-time admin dashboard with live stats | A live analytics dashboard is a full product feature. This milestone is about data collection, not analytics consumption. | Columns and filters in existing admin views are sufficient. |
| Email notifications for unanswered questions | Notification systems are a separate concern. Admins can check the queue. | Queue badge/count in admin UI if needed. |

---

## Feature Dependencies

```
Source tracking (started_from column)
  └─> Source column in ConversationsTab
  └─> Source filter in ConversationsTab
  └─> Unanswered question source attribution (derived, free)

Thumbs feedback (feedback column on conversations)
  └─> Feedback column/badge in ConversationsTab
  └─> Feedback filter in ConversationsTab

Unanswered question detection (phrase matching on AI response)
  └─> Unanswered questions queue (admin view)
      └─> "Add to FAQ" action (creates chatbot_faq entry)
      └─> "Dismiss / Reject" action (marks resolved)

Conversation history (session list on help page)
  → No dependency on the above; independent feature
  → Depends on user_id linkage on chatbot_conversations (verify schema)
```

**Critical dependency to verify:** Conversation history requires `chatbot_conversations` rows to be linked to `auth.users` by `user_id`. If anonymous sessions are not linked, history cannot be scoped per user. Schema research must confirm this.

---

## MVP Recommendation

Build in this order, each phase unblocking the next:

1. **Source tracking** — lowest complexity, unblocks source column, source filter, and unanswered attribution. No UI work beyond a column addition. Build first.
2. **Feedback** — low complexity, unblocks admin feedback column and filter. Thumbs UI on all 3 surfaces.
3. **Unanswered question pipeline** — detection + queue + Add to FAQ + Reject. Core value loop. Build as a unit; splitting detection from the admin queue produces half-finished work.
4. **Conversation history** — independent, medium complexity, depends on schema verification. Build last to avoid blocking on schema unknowns.

**Defer:**
- "Reject with reason" dropdown: build the Reject action first; add reason enum in a follow-up if admins request it.
- Source filter / feedback filter: trivially added once columns exist — include in the same phase as the columns, not a separate phase.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Table stakes features | HIGH | Consistent across Witivio, Dante AI, Landbot, ChatGPT — industry pattern is clear |
| Anti-features rationale | HIGH | Project decisions already made; rationale verified against UX research |
| Feature ordering / dependencies | MEDIUM | Based on schema assumptions; schema research must confirm user_id linkage |
| Conversation history UX patterns | HIGH | PatternFly and AI SDK docs show clear drawer/list pattern |
| Phrase-matching detection | MEDIUM | Reliable as a heuristic; exact phrases need empirical tuning against Mattea's actual response patterns |

---

## Sources

- [PatternFly: Chatbot Conversation History](https://www.patternfly.org/patternfly-ai/chatbot/chatbot-conversation-history/) — UI patterns for conversation history drawer
- [Dante AI: Handling Unanswered Questions](https://www.dante-ai.com/news/faq-unanswered-questions-in-ai-chatbots) — export, review, retrain workflow
- [Witivio: Unanswered Questions Admin](https://docs.witivio.com/solutions/virtual-agent-studio/chatbot/inbox/unanswered_questions.html) — create/add-alternative/delete admin actions
- [NN/g: AI Chatbot UX](https://www.nngroup.com/articles/chatbots/) — feedback UX patterns
- [AI SDK UI: Chatbot Message Persistence](https://ai-sdk.dev/docs/ai-sdk-ui/chatbot-message-persistence) — conversation history implementation
- [Mind the Product: UX Best Practices for AI Chatbots](https://www.mindtheproduct.com/deep-dive-ux-best-practices-for-ai-chatbots/) — feedback placement patterns
- [eesel.ai: Chatbot Escalation Guide](https://www.eesel.ai/blog/chatbot-escalation) — escalation pipeline patterns
