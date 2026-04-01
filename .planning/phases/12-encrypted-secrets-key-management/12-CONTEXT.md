# Phase 12: Encrypted Secrets + Key Management - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Add a dedicated "AI Providers" section to the existing Third Party Keys tab at `/admin/api-keys`. The general secrets manager (categories, CRUD, encryption) already exists from v1.7. This phase extends it with provider/model-aware AI key management.

</domain>

<decisions>
## Implementation Decisions

### AI Providers Section Structure
- Store AI provider keys in the same `admin_secrets` table with new nullable `provider` and `model` columns — reuses existing AES-256-GCM encryption service
- AI Providers section renders at the top of the Third Party Keys tab with its own "Add AI Provider Key" button; general third-party keys section below
- Provider/model data hardcoded in a constants file: OpenAI (gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo), Anthropic (claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5)
- Use modal for add/edit AI provider keys — extends existing SecretModal pattern with provider and model dropdowns

### Migration & Schema Updates
- ALTER TABLE migration adding nullable `provider` (text) and `model` (text) columns to `admin_secrets` — backward compatible with existing general secrets
- Distinguish AI keys from general secrets via `category = 'AI' AND provider IS NOT NULL`
- Model dropdown populated client-side on provider select — no API call needed for hardcoded list

### Claude's Discretion
- UI layout details for the two-section split (AI Providers + General Keys)
- Modal field ordering and validation behavior
- How the "Add AI Provider Key" modal differs visually from the general "Add Secret" modal

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/secrets/encryption.ts` — AES-256-GCM encrypt/decrypt service (server-only)
- `app/admin/api-keys/SecretsTab.tsx` — existing full CRUD UI with category pills, search, SecretModal
- `app/admin/api-keys/actions.ts` — server actions for secrets CRUD
- `app/admin/api-keys/page.tsx` — URL-driven tab shell (?tab=keys|secrets|endpoints)

### Established Patterns
- Service role Supabase client (`getSupabaseService()`) for admin-only tables
- Server actions (`'use server'`) for mutations, server components for initial data fetch
- Optimistic UI updates in client components
- Category badges with colored pills (existing in SecretsTab)
- SecretModal for add/edit with masked value field

### Integration Points
- `admin_secrets` table — add `provider` and `model` columns
- SecretsTab component — split into AI Providers section + General Keys section
- SecretModal — extend with provider/model dropdowns for AI category
- `.env.local.example` — SECRETS_MASTER_KEY already present

</code_context>

<specifics>
## Specific Ideas

- User spec: AI provider model lists are OpenAI (gpt-4o, gpt-4o-mini, gpt-4-turbo, gpt-3.5-turbo) and Anthropic (claude-opus-4-5, claude-sonnet-4-5, claude-haiku-4-5)
- Display: show display name, provider, model, created date, created by — never raw key
- Model FAQ list UI after existing Events admin page pattern (Add New button, table with Edit/Delete/Status toggle)
- Model all tab designs after existing Settings page tab style (/admin/settings)

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
