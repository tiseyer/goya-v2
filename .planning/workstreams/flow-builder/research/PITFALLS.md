# Flow Builder Pitfalls

**Domain:** Interactive flow builder with drag-drop editor, branching logic, actions engine, flow player
**Researched:** 2026-03-27
**Project:** GOYA v2 — adding to existing Next.js 16 + Supabase platform

---

## Critical Pitfalls

Mistakes that cause rewrites or production incidents.

---

### Pitfall 1: JSONB Schema Without a Version Field

**Phase:** Schema design (Phase 1)

**What goes wrong:** `flow_steps.elements` and `flows.conditions` are stored as JSONB. You start with one shape — `{ type: "text_input", label: "...", required: true }` — and ship it. Six weeks later you add `placeholder` and `validation_regex`. Rows saved before the change are missing these keys. Code that reads them crashes or silently produces wrong output.

**Why it happens:** JSONB gives no schema enforcement. Every row can have a different shape. There is no migration path unless you planned for one from the start.

**Consequences:** Backfill migrations on prod data. Code needs conditional branches for every version. Old flow runs produce incorrect results. Audit trail of what a user actually saw becomes unreliable.

**Prevention:**
- Include a `schema_version: 1` field in every JSONB object from day one
- Add a Supabase check constraint: `elements @> '{"schema_version": 1}'::jsonb` as a baseline guard
- Write a TypeScript discriminated union per version and a `migrateElement(raw)` function that upgrades old shapes at read time
- When the shape changes: bump the version integer, keep the old types, write a migration function — never silently assume the new shape

**Detection:** Any code that accesses `element.label` without first checking `element.schema_version` is a landmine. Add an ESLint rule or a Zod schema to enforce the parse-before-use pattern.

---

### Pitfall 2: Conditions Stored as JSONB Without Index — Full Table Scan on Every Page Load

**Phase:** Schema design (Phase 1) / Flow player (Phase 4)

**What goes wrong:** `flows.conditions` is a JSONB column. The server-side condition evaluator loads all active flows and filters in application code: `flows.filter(f => evaluateConditions(f.conditions, user))`. At 10 flows this is fine. At 100 flows with a busy login page it becomes a slow query + expensive application logic loop on every authenticated page load.

**Why it happens:** The requirement is "server-side condition evaluation for security," which is correct. But it means every page load potentially queries and evaluates every active flow. Without a GIN index and careful query design, PostgreSQL cannot use the JSONB column efficiently.

**Consequences:** Page load latency degrades linearly with the number of active flows. Supabase query time spikes. The "active flows" query becomes a top offender in the dashboard.

**Prevention:**
- Add a GIN index on `flows.conditions` at schema creation: `CREATE INDEX flows_conditions_gin ON flows USING GIN (conditions)`
- Add a partial index on `flows.is_active` so the active-flow query is cheap
- Pre-filter in SQL as much as possible (role, explicit user_id checks) before pulling rows into application code
- Cache the result of `getActiveFlowForUser(userId)` in the request context or a short-lived server-side cache (React cache, or a 30-second per-user cache) — re-evaluating per navigation event, not per render

**Detection:** Enable `EXPLAIN ANALYZE` on the `getActiveFlowForUser` query before shipping Phase 4. If you see Seq Scan on the flows table, add the index.

---

### Pitfall 3: Flow Graph Allows Cycles — Infinite Loop at Runtime

**Phase:** Flow editor / validation (Phase 2 or 3)

**What goes wrong:** The admin accidentally (or intentionally) connects Step C back to Step A via a branch condition. The flow player enters an infinite loop, hammering the database with `flow_responses` inserts, or just crashes with a stack overflow.

**Why it happens:** A directed graph without cycle detection allows any edge. The editor has no guard. The player has no depth limit.

**Consequences:** User session hangs. If actions fire on every step (Kit.com tag, email), they fire infinitely until the session ends. If the action is a Stripe checkout, you have a serious incident.

**Prevention:**
- Implement cycle detection (DFS/topological sort) in the save path, not just the UI: `POST /api/admin/flows/:id` must reject a graph with cycles
- Add a max-step-traversal limit in the flow player: if `stepCount > 200`, abort and log an error
- The editor UI should visually indicate when a branch creates a back-edge (color the arrow red)
- Unit-test the cycle detection function with at least: linear chain, diamond branch, single-step self-loop, A→B→C→A

**Detection:** In Phase 2 testing, deliberately create a cycle and verify the API rejects it with a 422 and a helpful error message.

---

### Pitfall 4: Actions Fire on Every Step Re-Visit (No Idempotency Guard)

**Phase:** Actions engine (Phase 5)

**What goes wrong:** A user goes back to a previous step using the "Back" button and then "Next" again. The actions bound to that step fire a second time: a Kit.com tag is applied again (harmless), an email is sent again (bad), a Stripe checkout session is created again (very bad).

**Why it happens:** The actions engine fires on `step_completed` events. The flow player doesn't distinguish between first-visit and re-visit. There's no idempotency record.

**Consequences:** Duplicate emails to the user. Multiple Stripe sessions for the same flow run. Kit.com receives duplicate subscriber updates. Users notice.

**Prevention:**
- Store a `flow_action_executions` record with `(flow_run_id, step_id, action_type)` as a unique key
- Before executing any action, check if this record exists — if it does, skip execution
- For Stripe: use a deterministic idempotency key derived from `flow_run_id + step_id + action_type`, not a random UUID
- For Kit.com: the API is already upsert-based for subscriber creation, so tag application is the main risk — check Kit's tag endpoint behavior
- For emails: gate on the `flow_action_executions` record; never send based on a raw step completion event

**Detection:** In Phase 5 testing, run a flow, go back two steps, go forward again — verify no duplicate emails in the test inbox and no duplicate Stripe sessions in the dashboard.

---

### Pitfall 5: Onboarding Migration Breaks In-Progress Users

**Phase:** Onboarding migration (Phase 7)

**What goes wrong:** The migration deploys. Users who started the hardcoded onboarding at `app/onboarding/` mid-session (or even mid-day) now hit the new flow player. Their URL (`/onboarding/student/step-3`) no longer exists. They get a 404 or are dropped back to the start of a flow they've already partially completed.

**Why it happens:** There's no coordination between "remove old onboarding routes" and "preserve in-progress state." The migration is a flag-day cutover, not a phased transition.

**Consequences:** Users lose progress. Support tickets. For a yoga community, trust damage outweighs the technical cost.

**Prevention:**
- Do NOT remove `app/onboarding/` routes in the same deploy as the flow player launch
- Phase 7 should be: (1) seed the three flow templates, (2) route new users to the flow player, (3) let existing in-progress users finish the old path, (4) remove old routes only after no active sessions remain (check `onboarding_status` in the DB for users mid-flow)
- Add a migration that checks `onboarding_status` — users who are `in_progress` but not `complete` should be treated as needing a flow assignment, not silently ignored
- Keep the old `app/onboarding/` routes behind a feature flag for at least one release cycle

**Detection:** Before Phase 7 ships, query: `SELECT count(*) FROM users WHERE onboarding_status = 'in_progress'`. If non-zero, plan a soft cutover path for those users.

---

### Pitfall 6: dnd-kit Touch/Scroll Conflict in the Admin Editor

**Phase:** Admin drag-drop editor (Phase 2)

**What goes wrong:** The admin editor is used on a tablet. The step list is scrollable. Using `PointerSensor` (the default), touch-dragging a step also scrolls the page — the browser's touch scroll behavior intercepts the drag. After the first scroll interaction, the container becomes non-scrollable until the user taps elsewhere.

**Why it happens:** Pointer events on touch devices cannot have `preventDefault()` called reliably on `touchmove`. The only reliable fix is `touch-action: none` on the draggable handle, but this must be scoped narrowly or it kills scrolling for the whole list.

**Consequences:** Admin editor is unusable on iPad/tablet. Steps can't be reordered by touch.

**Prevention:**
- Use a dedicated drag handle (a grip icon element) on each step card
- Set `touch-action: none` only on the handle element, not the whole card
- Use `TouchSensor` with an activation delay constraint (e.g., 250ms press) rather than `PointerSensor` alone for touch devices
- Test on an actual touch device or BrowserStack before Phase 2 sign-off — this does not reproduce in browser DevTools touch simulation

**Detection:** Confirmed dnd-kit GitHub issue #272 and #435 describe this exact pattern. The fix is well-known but must be intentionally implemented.

---

## Moderate Pitfalls

### Pitfall 7: Orphaned Steps Not Reachable From Any Branch

**Phase:** Flow editor validation (Phase 2/3)

**What goes wrong:** Admin deletes a branch connection but forgets the target step. The step exists in the DB but no branch points to it. The flow player can never reach it. The admin sees no warning. Analytics show the step has 0 visits even though the flow is live.

**Prevention:**
- On save, run a reachability check: BFS/DFS from the start step, collect all reachable step IDs, compare to all step IDs in the flow. Warn (don't block) on unreachable steps.
- Display orphaned steps with a visual indicator (dashed border, warning icon) in the editor canvas.

---

### Pitfall 8: Flow Player State Lost on Browser Refresh

**Phase:** Flow player (Phase 4)

**What goes wrong:** User is halfway through a 10-step onboarding flow. They refresh the page (or the browser crashes). They return to step 1. All answers are gone.

**Why it happens:** Flow player state is held in React component state (`useState`). Nothing is persisted server-side until "Submit."

**Prevention:**
- Persist `flow_runs` to the database at step completion, not just at flow completion
- On player initialization, check for an existing `in_progress` `flow_run` for this `(user_id, flow_id)` and resume from the last completed step
- For anonymous users: use `localStorage` as a fallback, keyed by `flow_id`

**Phase:** This must be designed in Phase 4 schema — `flow_runs` needs `current_step_id` and `completed_step_ids[]` columns.

---

### Pitfall 9: Multiple Concurrent Flow Runs for the Same User + Flow

**Phase:** Flow player (Phase 4) / Condition evaluator

**What goes wrong:** User opens two tabs. Tab A starts a flow run. Tab B also starts a flow run. Now there are two `in_progress` rows in `flow_runs` for `(user_id, flow_id)`. Condition evaluator logic breaks (which run is "current"?). Actions fire twice.

**Prevention:**
- Add a partial unique index: `UNIQUE (user_id, flow_id) WHERE status = 'in_progress'`
- The `startFlowRun` API endpoint should use an upsert or a `SELECT FOR UPDATE` guard to prevent the race condition
- If a second start request arrives for an already-in-progress run, return the existing run rather than creating a new one

---

### Pitfall 10: Condition Evaluator Leaks Admin-Only Data to Client

**Phase:** Condition evaluator / API design (Phase 1 / Phase 4)

**What goes wrong:** The server API returns the full `flows.conditions` JSONB to the client as part of the response. Conditions contain role checks, subscription tier checks, feature flags — information the user shouldn't see. A savvy user inspects the API response and learns which subscription tiers exist, or can spoof conditions client-side.

**Why it happens:** `getActiveFlowForUser` returns the full flow row, and the frontend just renders from it.

**Prevention:**
- The API endpoint must return only the resolved "active flow" result — the step content, not the condition logic
- Never return `flows.conditions` to the client
- Conditions are evaluated server-side (already planned per PROJECT.md) — enforce this in code review with a rule: no `conditions` field in any type exported to the client-side

---

### Pitfall 11: JSONB Conditions Compared Against Wrong Types

**Phase:** Condition evaluator (Phase 1 / Phase 3)

**What goes wrong:** A condition stores `{ "field": "subscription_tier", "operator": "equals", "value": "pro" }`. The evaluator compares `user.subscription_tier === condition.value`. Looks fine. But JSONB is type-sensitive: `"12345"` and `12345` are different. A numeric ID stored as a number in one place and a string in another silently fails the equality check.

**Prevention:**
- Define the condition schema with explicit TypeScript types and Zod validation at the API boundary
- In the evaluator, coerce both sides to the same type before comparing (e.g., always `String(userValue) === String(conditionValue)` for IDs; always number comparison for numeric fields)
- Write unit tests for every condition operator with both string and number value variants

---

## Minor Pitfalls

### Pitfall 12: Step Order as Floating Point / Array Index (Not Integer Sequence)

**Phase:** Schema (Phase 1)

**What goes wrong:** Step order is stored as an array index or floating point to support "insert between." After enough re-orderings, you get `order: 1.000000000001` floating point drift, or an array that has to be re-indexed on every drag.

**Prevention:**
- Use integer `position` column with gaps (10, 20, 30) so you can insert between without touching all rows
- On drag-complete, only update the moved row's position to the midpoint integer; periodically re-normalize if positions converge

---

### Pitfall 13: Flow Analytics Double-Counting Step Views

**Phase:** Analytics (Phase 6)

**What goes wrong:** The player fires a "step viewed" event on mount. If the user navigates back and forward, each visit fires the event. Analytics show 3x the expected view count for a middle step.

**Prevention:**
- Record `step_views` with a `flow_run_id + step_id` uniqueness check, or use an "first visit" flag per step per run
- Distinguish between `step_entered` (fires every time) and `step_completed_first_time` (fires once per run per step)

---

### Pitfall 14: Display Type Z-Index Conflicts With Existing Admin Shell

**Phase:** Flow player integration (Phase 4)

**What goes wrong:** A modal or notification flow player renders with `z-index: 50`. The existing `AdminShell` sidebar also uses high z-index values. On admin-facing flows (preview mode), the flow overlaps the sidebar incorrectly.

**Prevention:**
- Audit existing z-index values in `globals.css` and `AdminShell` before implementing the flow player overlay
- Use a portal (`ReactDOM.createPortal`) to render modal/fullscreen display types into `document.body`, bypassing stacking context issues

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Schema design | JSONB without version field | Add `schema_version` to all JSONB objects from day one |
| Phase 1: Schema design | Missing GIN index on conditions | Add `CREATE INDEX ... USING GIN (conditions)` in migration |
| Phase 2: Drag-drop editor | Touch/scroll conflict on tablet | Use dedicated drag handle with `touch-action: none` |
| Phase 2: Flow graph save | Cycle in step graph | Implement DFS cycle detection in the save API |
| Phase 3: Condition builder | Type coercion bugs | Zod schema + explicit coercion in evaluator |
| Phase 4: Flow player | State lost on refresh | Persist step progress to `flow_runs` at each step completion |
| Phase 4: Flow player | Concurrent run race condition | Partial unique index `(user_id, flow_id) WHERE status = 'in_progress'` |
| Phase 4: Flow player | Admin data leaking to client | Never return `conditions` JSONB in player API responses |
| Phase 5: Actions engine | Duplicate emails/Stripe sessions | `flow_action_executions` idempotency table; deterministic Stripe idempotency keys |
| Phase 5: Actions engine | Kit.com tag spam on back-navigation | Gate tag actions on `flow_action_executions` record, not raw step events |
| Phase 6: Analytics | Double-counted step views | Unique constraint on `(flow_run_id, step_id)` in step view table |
| Phase 7: Onboarding migration | Breaking in-progress users | Phased cutover: new users first, old routes remain behind flag |
| Phase 7: Onboarding migration | Orphaned `in_progress` onboarding records | Query and handle before removing old routes |

---

## Sources

- [When To Avoid JSONB In A PostgreSQL Schema — Heap](https://www.heap.io/blog/when-to-avoid-jsonb-in-a-postgresql-schema)
- [PostgreSQL anti-patterns: Unnecessary json/hstore dynamic columns — EDB](https://www.enterprisedb.com/blog/postgresql-anti-patterns-unnecessary-jsonhstore-dynamic-columns)
- [Zero-Downtime PostgreSQL JSONB Migration — Medium](https://medium.com/@shinyjai2011/zero-downtime-postgresql-jsonb-migration-a-practical-guide-for-scalable-schema-evolution-9f74124ef4a1)
- [Supabase RLS Performance and Best Practices](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [Supabase Performance and Security Advisors](https://supabase.com/docs/guides/database/database-advisors?queryGroups=lint&lint=0003_auth_rls_initplan)
- [dnd-kit Touch Sensor Documentation](https://docs.dndkit.com/api-documentation/sensors/touch)
- [dnd-kit issue #272: mobile loses scroll focus in sortable within scrollable div](https://github.com/clauderic/dnd-kit/issues/272)
- [dnd-kit issue #435: PointerSensor does not work well on touch devices](https://github.com/clauderic/dnd-kit/issues/435)
- [dnd-kit Sortable — nested SortableContext documentation](https://docs.dndkit.com/presets/sortable)
- [React + dnd-kit tree-list drag and drop — DEV Community](https://dev.to/fupeng_wang/react-dnd-kit-implement-tree-list-drag-and-drop-sortable-225l)
- [Stripe Idempotent Requests](https://docs.stripe.com/api/idempotent_requests)
- [Stripe Blog: Nobody likes being charged twice](https://stripe.dev/blog/because-nobody-likes-being-charged-twice)
- [Kit Developer Documentation: Create a Subscriber](https://developers.kit.com/api-reference/subscribers/create-a-subscriber)
- [Salesforce: Infinite Loop in Flow — Trailhead Community](https://trailhead.salesforce.com/trailblazer-community/feed/0D54S00000HCjj1SAD)
- [Salesforce: Optimize Flow Architecture for performance and scalability — Elements.cloud](https://elements.cloud/blog/optimize-your-salesforce-flow-architecture-for-better-performance-and-scalability/)
