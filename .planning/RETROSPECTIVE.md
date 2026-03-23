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

## Cross-Milestone Trends

| Milestone | Phases | Plans | Days | Parallel Agents Used |
|-----------|--------|-------|------|---------------------|
| v1.0 | 3 | 4 | 1 | Yes (Phase 3 Wave 1) |
