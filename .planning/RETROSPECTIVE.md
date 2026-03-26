# GOYA v2 — Retrospective

## Milestone: v1.0 — User Settings

**Shipped:** 2026-03-23
**Phases:** 3 | **Plans:** 4 | **Tasks:** 5

### What Was Built

- Role-branched Settings entry in desktop + mobile profile dropdowns; old Profile Settings and Subscriptions entries removed
- Collapsible sidebar-navigated SettingsShell at `/settings` mirroring AdminShell (4 routes, auth guard, exact-match nav detection)
- Full profile settings form migrated to Settings > General with impersonation-safe server action
- Server-side Subscriptions page with live DB data (status badge, role, MRN, member-since)
- Polished "Coming Soon" placeholders for Connections and Inbox

### What Worked

- **Parallel execution** — Plans 03-01 and 03-02 ran concurrently in isolated worktrees, completing in ~2 min combined with no conflicts
- **Plan specificity** — Plans included exact code snippets, class names, and acceptance criteria; executors needed zero guesswork
- **Isolation pattern** — Settings shell inheriting from AdminShell meant zero UI invention, faster execution, consistent result
- **Server component for Subscriptions** — right call; no client-side loading state needed for static membership info

### What Was Inefficient

- Phase 2 ROADMAP.md checkbox wasn't updated after completion — caused false "Planned" status at milestone close (fixed manually)
- Some SUMMARY.md files had no `one_liner` YAML field, causing MILESTONES.md entries to show "One-liner:" placeholder
- SHELL-01 through SHELL-04 remained unchecked in REQUIREMENTS.md after Phase 2 completed — traceability drift

### Patterns Established

- SettingsShell mirrors AdminShell: same collapse mechanism, same active-state tokens, separate localStorage key
- Exact match (`pathname === '/settings'`) for root route, `startsWith` for sub-routes — prevents over-activation
- Settings layout handles auth guard — individual pages don't need their own redirect logic

### Key Lessons

- Verify ROADMAP.md checkbox state after each phase completion — `roadmap_complete: false` in `roadmap analyze` signals drift
- SUMMARY.md frontmatter `one_liner:` field must be present or MILESTONES.md gets "One-liner:" noise
- Human UAT items (3 items requiring authenticated session) should be tested before milestone close in future milestones

### Cost Observations

- Sessions: 1 day, single GSD session
- Model mix: Sonnet 4.6 for all executor and verifier agents
- Notable: Phase 3 parallel execution (2 agents simultaneously) was the most efficient unit — 2 plans in time of 1

---

## Milestone: v1.2 — Stripe Admin & Shop

**Shipped:** 2026-03-24
**Phases:** 6 (8–13) | **Plans:** 17 | **Tasks:** 47
**Files:** 90 changed | **Lines:** +12,325

### What Was Built

- 5 Stripe mirror tables + webhook_events idempotency table + bridge columns with admin/moderator RLS
- Server-only Stripe SDK singleton + webhook endpoint with HMAC signature verification
- 15 Stripe event type handlers with idempotent upserts (PostgreSQL 23505 dedup), Vercel Cron for deferred events, admin sync with cursor pagination
- Collapsible Shop nav group in AdminShell sidebar
- Products admin: dnd-kit sortable table, CRUD, price immutability (archive+create pattern), visibility rules (show-to/don't-show-to)
- Orders admin: filters/search/bulk actions, detail with chronological event timeline, refund (full/partial), subscription cancel (schedule/immediate), customer journey
- Coupons admin: create/edit with bidirectional Stripe sync, manual user assignment, role/product restrictions, redemption history
- Analytics dashboard: 42 unit-tested pure metric functions (funnel, ARR with subscription dedup, time-series bucketing), Recharts charts, role filter, CSV export

### What Worked

- **TDD for analytics** — 42 unit tests for pure computation functions meant the UI page just imported and rendered. Zero logic bugs at integration time.
- **Worktree isolation** — All executor agents ran in worktrees, preventing merge conflicts between parallel plans within a wave.
- **Phase 12 gap closure** — Phase 12-07 fixed the createLocalProduct stub and coupon test assertion — the verification→gap→closure cycle caught real bugs.
- **Write-partitioning pattern** — GOYA owns `priority`, `requires_any_of`, `hidden_if_has_any`, `is_active`; Stripe owns payment/billing. Clear boundaries prevented webhook conflicts.
- **Integration check** — Spawned integration checker verified all 37 requirements have working cross-phase wiring and 6/6 E2E flows connect end-to-end.

### What Was Inefficient

- Many SUMMARY.md files had empty or broken `one_liner` fields — MILESTONES.md auto-extraction produced noise (fixed manually)
- REQUIREMENTS.md traceability table had 12 stale "Pending" entries for completed work — checkboxes not updated during execution
- Phase 9 ROADMAP.md showed "1/2 In Progress" despite both plans having summaries — checkbox state drift
- Migration timestamp collision (two files share `20260341_` prefix) — works but risks future Supabase runner errors

### Patterns Established

- Supabase as cache layer, Stripe as source of truth — all admin pages read from local tables, write-through to Stripe
- `getAnnualMultiplier` helper for ARR computation across interval types (month→12, year→1, week→52, day→365)
- URL search param filters pattern (OrdersFilters, AnalyticsFilters) — consistent across admin pages
- Stripe price immutability: create new price + archive old, never update amount in place

### Key Lessons

- Lock Recharts version exactly (`3.8.0` not `^3.8.0`) — React 19 regression in 3.7.x was a real issue
- `request.text()` not `request.json()` for Stripe webhooks — parsing breaks HMAC signature verification
- Module-level Supabase instantiation crashes builds when env vars are unavailable — use lazy singletons
- Pure computation functions + TDD is the ideal pattern for analytics: testable without infrastructure, importable by any UI

### Cost Observations

- Sessions: ~2 days, multiple GSD sessions across phases
- Model mix: Opus 4.6 orchestrator + Sonnet 4.6 for executor/verifier agents
- Notable: Phase 13 analytics completed in 2 waves with 1 agent each — fast due to clean dependencies and small scope

---

## Cross-Milestone Trends

| Milestone | Phases | Plans | Days | Parallel Agents Used |
|-----------|--------|-------|------|---------------------|
| v1.0 | 3 | 4 | 1 | Yes (Phase 3 Wave 1) |
| v1.2 | 6 | 17 | 2 | Yes (worktree isolation) |
