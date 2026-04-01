---
phase: 8
slug: db-foundation
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-23
---

# Phase 8 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Supabase CLI + psql (SQL migrations — no Jest/Vitest needed) |
| **Config file** | `supabase/config.toml` |
| **Quick run command** | `npx supabase db push --dry-run` |
| **Full suite command** | `npx supabase db push` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every migration file written:** Run `npx supabase db push --dry-run` to verify SQL syntax
- **After each migration applied:** Query Supabase to confirm table exists and RLS policies are active
- **Before `/gsd:verify-work`:** All 3 migration files applied, all tables + columns + policies verified
- **Max feedback latency:** ~30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | Status |
|---------|------|------|-------------|-----------|-------------------|--------|
| 08-01-01 | 01 | 1 | DB-01 | sql | `npx supabase db push` | ⬜ pending |
| 08-01-02 | 01 | 1 | DB-02 | sql | `npx supabase db push` | ⬜ pending |
| 08-01-03 | 01 | 1 | DB-03 | sql | `npx supabase db push` | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

*No test framework setup needed — this phase is pure SQL migrations. Verification is done via Supabase CLI and direct DB queries.*

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| RLS blocks non-admin read | DB-01 | Requires authenticated Supabase session with non-admin user | In Supabase Table Editor, attempt to SELECT from `stripe_products` as a regular user — expect 0 rows (RLS blocked) |
| RLS allows admin read | DB-01 | Requires authenticated session with admin role | In Supabase Table Editor as admin user — expect query to work |
| UNIQUE constraint prevents duplicate event | DB-02 | Requires INSERT test against live DB | Run two INSERTs with same `stripe_event_id` — second should return 0 affected rows with ON CONFLICT DO NOTHING |
| Bridge columns are nullable | DB-03 | Visual inspection of schema | In Supabase Table Editor: `products.stripe_product_id` and `profiles.stripe_customer_id` should show "nullable" |

---

## Validation Sign-Off

- [ ] All migration files apply cleanly via `npx supabase db push`
- [ ] All 6 tables present in Supabase with correct columns
- [ ] RLS policies active on all new tables
- [ ] Bridge columns exist as nullable on products and profiles
- [ ] `webhook_events.stripe_event_id` has UNIQUE constraint
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
