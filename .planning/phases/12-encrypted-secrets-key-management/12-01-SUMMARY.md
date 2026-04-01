---
phase: 12-encrypted-secrets-key-management
plan: "01"
subsystem: secrets-backend
tags: [migration, server-actions, ai-providers, encryption]
dependency_graph:
  requires: []
  provides: [admin_secrets.provider, admin_secrets.model, AI_PROVIDERS, listAiProviderKeys, createAiProviderKey, updateAiProviderKey]
  affects: [app/admin/api-keys/secrets-actions.ts, lib/secrets/ai-providers.ts]
tech_stack:
  added: []
  patterns: [AES-256-GCM encryption, Supabase service-role queries, provider/model validation constants]
key_files:
  created:
    - supabase/migrations/20260352_add_ai_provider_columns.sql
    - lib/secrets/ai-providers.ts
  modified:
    - app/admin/api-keys/secrets-actions.ts
decisions:
  - "listSecrets filters provider IS NULL — AI keys excluded from general secrets view"
  - "seedSecrets no longer seeds ANTHROPIC_API_KEY — AI keys use dedicated createAiProviderKey flow"
  - "Applied migration directly via supabase db query --linked due to out-of-order migration conflict"
metrics:
  duration: "~5 minutes"
  completed: "2026-03-27"
  tasks_completed: 2
  files_created: 2
  files_modified: 1
---

# Phase 12 Plan 01: Migration + AI Provider Backend Summary

**One-liner:** AES-256-GCM encrypted AI provider key backend with provider/model validation constants and three new server actions separating AI keys from general secrets.

## What Was Built

### Migration (supabase/migrations/20260352_add_ai_provider_columns.sql)

Added two nullable columns to `admin_secrets`:
- `provider text` — AI provider name (openai, anthropic), NULL for general secrets
- `model text` — AI model identifier, NULL for general secrets
- Index on `provider` column with partial index (`WHERE provider IS NOT NULL`) for efficient AI key queries
- Applied directly via `supabase db query --linked`

### AI Provider Constants (lib/secrets/ai-providers.ts)

Typed constants module:
- `AiProviderName` union type: `'openai' | 'anthropic'`
- `AI_PROVIDERS` array with OpenAI (gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo) and Anthropic (claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5)
- `getModelsForProvider(providerId)` — returns model list for a provider
- `isValidProvider(provider)` — type guard
- `isValidModel(provider, model)` — validates model belongs to provider

### Extended Server Actions (app/admin/api-keys/secrets-actions.ts)

New exports:
- `AiProviderKeyItem` type — metadata shape for AI key list items
- `listAiProviderKeys()` — queries WHERE provider IS NOT NULL, returns metadata only
- `createAiProviderKey(displayName, value, provider, model)` — validates provider/model, encrypts value, sets category 'AI'
- `updateAiProviderKey(id, fields)` — supports key_name, value, model updates with UUID validation

Existing function modifications:
- `listSecrets` — now filters `.is('provider', null)` to exclude AI keys from general list
- `seedSecrets` — removed ANTHROPIC_API_KEY entry; AI keys use dedicated flow

## Deviations from Plan

### Auto-handled: Migration push via --linked flag

- **Found during:** Task 1
- **Issue:** `npx supabase db push` failed because older local migrations (20260341_webhook_events.sql) had policy conflicts on the remote DB. The `--include-all` flag attempted to replay already-applied migrations causing errors.
- **Fix:** Applied migration directly using `npx supabase db query --linked -f supabase/migrations/20260352_add_ai_provider_columns.sql` which executed only our migration against the remote database. Migration applied cleanly, columns verified via REST API.
- **Files modified:** None (same migration file, different apply method)
- **Impact:** Migration is applied on remote. The older migration file conflict (20260341) is a pre-existing issue deferred to deferred-items.md.

## Known Stubs

None — this plan is backend-only. No UI components or data rendering.

## Self-Check: PASSED

- FOUND: supabase/migrations/20260352_add_ai_provider_columns.sql
- FOUND: lib/secrets/ai-providers.ts
- FOUND: app/admin/api-keys/secrets-actions.ts
- FOUND commit: 5336703 (feat(12-01): migration + AI provider constants)
- FOUND commit: 1cf895a (feat(12-01): extend server actions for AI provider keys)
