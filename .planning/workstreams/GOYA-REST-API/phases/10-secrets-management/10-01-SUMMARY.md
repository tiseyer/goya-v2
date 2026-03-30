---
phase: 10-secrets-management
plan: "01"
subsystem: secrets-management
tags: [encryption, supabase, server-actions, aes-256-gcm]
dependency_graph:
  requires: []
  provides: [admin_secrets-table, encryption-service, secrets-crud-actions]
  affects: [app/admin/api-keys]
tech_stack:
  added: [lib/secrets/encryption.ts]
  patterns: [AES-256-GCM with auth tag, service-role-only DB access, server-only import guard]
key_files:
  created:
    - supabase/migrations/20260351_admin_secrets.sql
    - lib/secrets/encryption.ts
    - app/admin/api-keys/secrets-actions.ts
  modified:
    - .env.local.example
key_decisions:
  - "AES-256-GCM with auth tag appended to encrypted buffer — tamper-evident, no separate storage needed"
  - "SHA-256 key derivation from SECRETS_MASTER_KEY — ensures exactly 32 bytes regardless of input length"
  - "listSecrets select clause excludes encrypted_value and iv — no raw ciphertext leaks through list endpoint"
  - "getSecret decrypts only on explicit single-fetch — decryption is gated behind intentional call"
  - "admin_secrets RLS enabled with no policies — service-role-only access enforced at DB level, same pattern as api_keys"
  - "SecretCategory, SecretRow, SecretListItem types collocated in secrets-actions.ts — no separate types file for plan-scoped types"
metrics:
  duration: "3 minutes"
  completed_date: "2026-03-27"
  tasks_completed: 2
  files_changed: 4
---

# Phase 10 Plan 01: Secrets Management Backend Summary

**One-liner:** AES-256-GCM encrypted secrets backend with Supabase migration, server-only encryption service, and full CRUD server actions.

## What Was Built

Foundation layer for the Third Party Keys feature: a Supabase table for storing encrypted secrets, a server-side encryption/decryption service, and five server actions for full CRUD operations.

### admin_secrets Migration

`supabase/migrations/20260351_admin_secrets.sql` creates the `admin_secrets` table with:
- `id` (uuid PK), `key_name` (text UNIQUE NOT NULL), `encrypted_value` (text NOT NULL), `iv` (text NOT NULL)
- `description`, `category` (default 'Other'), timestamps, `created_by` FK to profiles
- `idx_admin_secrets_category` index for category filtering
- RLS enabled, no policies — service-role-only access identical to `api_keys` table pattern
- Applied via `supabase db query --linked` (avoids timestamp collision with db push)

### Encryption Service

`lib/secrets/encryption.ts` provides:
- `encrypt(plaintext)` — generates random 16-byte IV, AES-256-GCM cipher, appends 16-byte auth tag to ciphertext, returns base64-encoded `{ encrypted, iv }`
- `decrypt(encrypted, iv)` — extracts auth tag from last 16 bytes, deciphers remainder, returns UTF-8 plaintext
- Key derived from `SECRETS_MASTER_KEY` via SHA-256 (always 32 bytes)
- `import 'server-only'` guard prevents accidental client-side import
- Both functions synchronous; throw if `SECRETS_MASTER_KEY` missing at call time

### Secrets Server Actions

`app/admin/api-keys/secrets-actions.ts` exports:
- `listSecrets()` — selects `id, key_name, description, category, updated_at` only; never touches `encrypted_value` or `iv`
- `createSecret(name, value, category, description)` — validates inputs, encrypts value, inserts row with `created_by`
- `getSecret(id)` — UUID validation, fetches full row, decrypts on explicit call, returns `SecretListItem & { value }`
- `updateSecret(id, fields)` — UUID validation, re-encrypts if value provided, always sets `updated_at`
- `deleteSecret(id)` — UUID validation, hard delete (no audit trail per deferred SECR-F02)

All actions follow `actions.ts` patterns: `getSupabaseService() as any`, `revalidatePath('/admin/api-keys')`, try/catch returning `{ success: false, error }`.

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — this plan creates backend infrastructure only; no UI components with stub data.

## Self-Check: PASSED

- [x] `supabase/migrations/20260351_admin_secrets.sql` — exists
- [x] `lib/secrets/encryption.ts` — exists, exports `encrypt` and `decrypt`
- [x] `app/admin/api-keys/secrets-actions.ts` — exists, exports all 5 actions + 3 types
- [x] `.env.local.example` — updated with SECRETS_MASTER_KEY
- [x] Task 1 commit `52f1694` — verified in git log
- [x] Task 2 commit `826059a` — verified in git log
- [x] TypeScript: no errors in new files (pre-existing test errors unrelated to this plan)
- [x] `listSecrets` does not select `encrypted_value` or `iv`
- [x] Encryption roundtrip verified: encrypt → decrypt returns original plaintext
