# Feature Landscape: Interactive Flow Builder

**Domain:** In-app flow builder (onboarding wizards, quizzes, notifications, popups, banners)
**Researched:** 2026-03-27
**Reference products:** Typeform, Appcues, Userflow, Formsort, Intercom Tours, Chameleon

---

## Table Stakes

Features users (admins) expect. Missing = system feels incomplete or broken.

| Feature | Why Expected | Complexity | Dependency on Existing |
|---------|--------------|------------|------------------------|
| Multi-step flows with sequential navigation | Core metaphor — every tool has it | Low | None |
| Multiple choice / single select element | Most common question type | Low | None |
| Short text / long text input element | Needed for open-ended capture | Low | None |
| Yes/No element | Simplest branch trigger | Low | None |
| Statement / info screen (no input) | Needed for welcome and info steps | Low | None |
| Linear step-by-step progression | Default path — no branching needed to function | Low | None |
| Flow triggered on page load | Simplest trigger, needed to replace hardcoded onboarding | Low | None |
| Flow shown as modal or fullscreen | Two most common display types | Low | None |
| Admin creates/edits flows | Core admin function | Medium | AdminShell pattern |
| Flow active/inactive toggle | Admin needs to turn flows on/off without deleting | Low | Admin CRUD patterns |
| Per-user response storage | Required for "don't show again" and profile saving | Medium | Supabase users table |
| "Don't show again" / completion tracking | Without this, flows repeat on every load | Medium | Per-user response storage |
| Basic targeting by user role | Already in system — flows should be role-aware | Low | Role system (`student`, `teacher`, etc.) |
| Flow preview mode for admin | Without preview, admins cannot test before publishing | Medium | None |
| Step-level completion tracking | Required for analytics and partial completion | Medium | Per-user response storage |

---

## Differentiators

Features that set a flow builder apart from a basic wizard. Not expected by default, but valuable.

| Feature | Value Proposition | Complexity | Dependency |
|---------|-------------------|------------|------------|
| Conditional branching (answer-based routing) | Different paths for different users — enables onboarding role selection | High | Per-user response storage |
| Conditions on flow display (not just role) | Show only to users with incomplete profiles, first login, etc. | High | Supabase profile + auth data |
| Rating scale / NPS element | Enables satisfaction surveys and feedback collection | Low | None |
| Image/picture choice element | Typeform-style visual selection for role or preference choice | Medium | None |
| Multiple triggers (login, delay, scroll, exit intent) | Richer control over when flows appear | Medium | None |
| Actions engine: save answer to user profile | Directly enriches profiles from flow responses | Medium | Supabase profiles table |
| Actions engine: trigger email via Kit.com | Send follow-up email after flow completion | Medium | Kit.com integration (graceful fallback) |
| Actions engine: redirect to URL | Navigate to next step or external resource after flow | Low | None |
| Actions engine: trigger another flow | Chain flows together — advanced journey building | High | Flow engine itself |
| Actions engine: Stripe checkout redirect | Monetize upgrades inline in a flow | Medium | Stripe integration |
| Priority ordering for multiple flows | When multiple flows could show, admins control which fires first | Low | None |
| Flow display as banner (top of screen) | Non-interruptive announcements — different UX from modal | Medium | None |
| Flow display as notification (corner toast) | Lightweight nudge pattern | Medium | None |
| Flow display as slideout panel | Sidebar flows — less disruptive than modal | Medium | None |
| Per-user flow management in admin | Admin can reset, skip, or force-complete a flow for a specific user | Medium | Admin CRUD + user management |
| Analytics: completion rate per flow | Core metric for flow health | Medium | Step tracking |
| Analytics: drop-off by step | Shows which step loses users | Medium | Step tracking |
| Analytics: response distribution per element | Shows answer breakdown per question | Medium | Response storage |
| Flow templates (seeded starting points) | Reduces admin effort for common patterns (onboarding, survey) | Low | Flow schema |

---

## Anti-Features

Features to explicitly NOT build for v1.0 (risk: wasted time, complexity debt).

| Anti-Feature | Why Avoid | What to Do Instead |
|--------------|-----------|-------------------|
| A/B testing between flow variants | Adds statistical complexity and infrastructure overhead | Explicitly out of scope; defer until analytics baseline is established |
| Flow versioning / revision history | Requires audit log infrastructure and UI complexity | Defer; admin can duplicate before editing if needed |
| Webhook-triggered flows | External event ingestion surface; scope and security overhead | Defer; UI triggers cover all v1.0 cases |
| Multi-language / i18n content | i18n on dynamic admin-created content requires full i18n system | Defer; GOYA v2 is English-first |
| Public embed / iframe sharing | External embedding means unauthenticated surface and origin security | Defer; flows are internal to GOYA platform only |
| AI-generated follow-up questions (Typeform-style) | Requires LLM API calls per response; expensive and complex | Defer; not needed for onboarding/quiz flows |
| Payment element inside a flow step | Stripe embedded in a step is a complex surface | Use actions engine to redirect to Stripe Checkout instead |
| Video response recording | Complex media pipeline (upload, storage, moderation) | Defer; text/choice elements cover the use case |
| Real-time collaboration on flows | Two admins editing simultaneously — needs CRDTs or locking | Defer; single-admin platform, not needed |
| Automated triggers from 3rd-party events (Stripe events, Kit webhooks) | External event bus integration — major surface | Defer; webhook-triggered flows are out of scope |

---

## Element Type Inventory

Based on Typeform, Formsort, Appcues analysis. These are the element types the player needs to render.

### Core (Table Stakes)

| Element Type | Input | Use Case | Notes |
|--------------|-------|----------|-------|
| `statement` | None | Welcome screen, info, transition | No answer stored |
| `short_text` | String | Name, email, free text | Optional validation |
| `long_text` | String (multiline) | Bio, goals, feedback | |
| `single_choice` | One option | Role selection, preference | Pill/card style (Typeform) |
| `multiple_choice` | Array of options | Topics, interests | Pill/card style |
| `yes_no` | Boolean | Simple binary question | Maps to `single_choice` with 2 options |

### Standard (Ship in v1.0)

| Element Type | Input | Use Case | Notes |
|--------------|-------|----------|-------|
| `rating` | Integer 1–5 or 1–10 | Satisfaction, self-assessment | Star or number scale |
| `nps` | Integer 0–10 | Net Promoter Score | Standard 0-10 fixed |
| `dropdown` | One option | Country, year, long lists | Different UX from choice pills |
| `picture_choice` | One or many options | Visual role or preference selection | Requires image URL per option |

### Defer to v2

| Element Type | Why Defer |
|--------------|-----------|
| `date` | Not needed for onboarding/quiz flows |
| `address` | No location use case in v1.0 |
| `file_upload` | Complex storage pipeline |
| `ranking` | Niche; adds sorting UX complexity |
| `matrix` / Likert | Useful for surveys but adds layout complexity |
| `number` | Numeric input; overlap with rating |
| `payment` | Replaced by redirect action |

---

## Display Type Inventory

The 5 display types the player must support.

| Display Type | Description | Trigger Fit | Interruptive? | Use Case |
|--------------|-------------|-------------|---------------|----------|
| `fullscreen` | Takes over entire viewport | Page load, login event | Yes | Onboarding wizard, role selection |
| `modal` | Centered overlay with backdrop | Page load, delay | Yes | Announcements, surveys, feature intro |
| `slideout` | Slides in from side (usually right) | Scroll, click | Partial | Feature discovery, contextual help |
| `banner` | Sticky horizontal bar (top/bottom) | Page load, persistent | Minimal | Announcements, upgrade prompts, notices |
| `notification` | Toast in corner | Delay, event | No | Lightweight nudges, confirmation prompts |

---

## Trigger Type Inventory

When flows activate for a user.

| Trigger | Complexity | Standard Behavior | Priority for v1.0 |
|---------|------------|-------------------|-------------------|
| `page_load` | Low | Fires when page matching URL conditions loads | Required |
| `login` | Low | Fires on first authenticated page load of session | Required (replaces hardcoded onboarding) |
| `delay` | Low | Fires N seconds after page load | Required |
| `manual` | Low | Admin triggers for a specific user from admin panel | Required (per-user management) |
| `scroll` | Medium | Fires when user scrolls past N% of page | Standard |
| `exit_intent` | Medium | Fires when cursor moves toward browser chrome | Standard |
| `element_click` | Medium | Fires when a specific DOM element is clicked | Standard |
| `session_count` | Medium | Fires on Nth session | Standard |
| `profile_incomplete` | Medium | Fires when profile fields are missing | GOYA-specific, high value |
| `webhook` | High | External event fires a flow | Explicitly out of scope v1.0 |

---

## Condition Type Inventory

What the server-side condition evaluator checks before showing a flow.

| Condition | Data Source | Example | Notes |
|-----------|-------------|---------|-------|
| `user_role` | Auth/profiles table | role = 'student' | Already in system |
| `onboarding_completed` | Profiles table | onboarding_completed = false | High value for replacement |
| `flow_not_completed` | Flow responses | user hasn't completed flow X | Required to prevent re-shows |
| `profile_field` | Profiles table | bio is null | Drives incomplete-profile triggers |
| `subscription_status` | Stripe/subscriptions | plan = 'free' | Enables upgrade flows |
| `page_url` | Request context | path matches /dashboard | Contextual targeting |
| `session_count` | Sessions/analytics | first session | New vs returning users |
| `date_range` | Server time | between Jan 1 and Jan 31 | Time-limited promotions |
| `user_attribute_custom` | JSONB metadata | metadata.yoga_level set | Advanced segmentation |

Condition logic: AND between conditions in same group. Multiple groups = OR between groups. This matches Formsort/Appcues patterns and covers all GOYA use cases.

---

## Actions Engine Inventory

What can fire when a step is completed or a flow finishes.

| Action Type | When Fires | Complexity | Dependency |
|-------------|------------|------------|------------|
| `save_to_profile` | Step/flow complete | Medium | Supabase profiles table |
| `redirect_url` | Flow complete | Low | None |
| `trigger_flow` | Flow complete | High | Flow engine |
| `send_kit_email` | Flow complete | Medium | Kit.com API |
| `stripe_checkout` | Button click in flow | Medium | Stripe integration |
| `mark_onboarding_complete` | Flow complete | Low | Profiles table field |
| `dismiss_flow` | User dismisses | Low | Response tracking |

---

## Analytics Metrics (Standard Industry Patterns)

| Metric | How Measured | Benchmark (B2C) | Notes |
|--------|--------------|-----------------|-------|
| Flow completion rate | Completions / starts | 30–50% | Lower = friction somewhere |
| Step drop-off rate | Starts on step N+1 / completions of step N | — | Identify worst step |
| Time per step | Average seconds on step | — | Long = confused; short = skipped |
| Response distribution | Count per answer option | — | Informs segmentation |
| Flow impressions | Times shown to users | — | Volume metric |
| Unique users reached | Distinct users who saw flow | — | Coverage metric |

---

## Feature Dependencies

```
Per-user response storage
  → "Don't show again" / completion tracking
  → Step-level drop-off analytics
  → Conditional display (flow_not_completed condition)
  → Actions engine: save_to_profile

Conditional branching
  → Per-user response storage (need answers to branch on)
  → Step-level completion tracking

Conditions engine
  → Server-side evaluation (security requirement in PROJECT.md)
  → user_role condition (requires auth/profiles table access)

Actions engine: trigger_flow
  → Full flow engine (circular dependency — must handle gracefully)

Flow templates / seed data
  → Complete schema (must come last in build order)
```

---

## MVP Recommendation

### Must-have for v1.0 (table stakes + highest-value differentiators)

1. Element types: `statement`, `short_text`, `long_text`, `single_choice`, `multiple_choice`, `yes_no`, `rating`
2. Display types: all 5 (`fullscreen`, `modal`, `slideout`, `banner`, `notification`)
3. Triggers: `page_load`, `login`, `delay`, `manual`
4. Conditions: `user_role`, `onboarding_completed`, `flow_not_completed`, `page_url`
5. Actions: `save_to_profile`, `redirect_url`, `mark_onboarding_complete`, `dismiss_flow`
6. Analytics: completion rate, step drop-off, response distribution
7. Admin UI: create/edit/preview/activate flows
8. Per-user flow management in admin

### Defer to v2

- `picture_choice` element (useful but not needed for text-based onboarding)
- `nps` element (no NPS campaign in v1.0 scope)
- `stripe_checkout` action (Stripe redirect covers the v1.0 case)
- `trigger_flow` action (complex circular dependency)
- `send_kit_email` action (graceful fallback means build last)
- `scroll`, `exit_intent`, `element_click` triggers (page_load + login covers all v1.0 flows)
- `subscription_status` condition (defer until Stripe conditions are tested)

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Element types | HIGH | Verified against Typeform official docs and Formsort docs |
| Display types | HIGH | Consistent across Appcues, Intercom, Userflow |
| Trigger types | MEDIUM | Verified for page_load/login/delay; exit_intent/scroll from multiple WebSearch sources |
| Condition patterns | HIGH | Formsort docs confirmed operator patterns; GOYA-specific conditions from PROJECT.md context |
| Actions engine | MEDIUM | Common patterns verified; `trigger_flow` complexity from engineering analysis |
| Analytics metrics | HIGH | Consistent across Appcues, Whatfix, Userflow analytics docs |
| Anti-features | HIGH | Engineering complexity reasoning, confirmed by project scope decisions |

---

## Sources

- [Appcues Flow Building Patterns](https://www.appcues.com/university/appcues-basics/flow-building)
- [Appcues Features Overview](https://userpilot.com/blog/appcues-features/)
- [Typeform Question Types](https://help.typeform.com/hc/en-us/articles/360051789692-Question-types)
- [Typeform Spring 2025 Updates](https://www.typeform.com/blog/spring-cleaning-for-your-forms)
- [Formsort Conditions and Logic](https://docs.formsort.com/conditions-and-logic)
- [Formsort Steps Architecture](https://docs.formsort.com/creating-flows/building-a-new-flow/steps)
- [Userflow Flow Builder Basics](https://help.userflow.com/docs/flow-builder-basics)
- [Userflow Analytics](https://help.userflow.com/docs/analytics)
- [12 Must-Track User Onboarding Metrics](https://whatfix.com/blog/user-onboarding-metrics/)
- [Onboarding Funnel Analysis](https://www.fullsession.io/blog/onboarding-funnel-analysis/)
- [Appcues Onboarding Metrics and KPIs](https://www.appcues.com/blog/user-onboarding-metrics-and-kpis)
- [Product Tour UI/UX Patterns](https://www.appcues.com/blog/product-tours-ui-patterns)
- [Salesforce Flow Builder Pitfalls 2025](https://www.getclientell.com/blogs/salesforce-flow-builder-best-practices-and-pitfalls)
