---
phase: 12-encrypted-secrets-key-management
plan: "02"
subsystem: admin-ui
tags: [ai-providers, secrets-ui, react-components, modal]
dependency_graph:
  requires: [12-01]
  provides: [AiProvidersSection, AiProviderModal, SecretsTab.two-section-layout]
  affects: [app/admin/api-keys/SecretsTab.tsx, app/admin/api-keys/page.tsx]
tech_stack:
  added: []
  patterns: [table-with-inline-delete, modal-with-dropdowns, optimistic-UI, parallel-server-fetch]
key_files:
  created:
    - app/admin/api-keys/AiProvidersSection.tsx
    - app/admin/api-keys/AiProviderModal.tsx
  modified:
    - app/admin/api-keys/SecretsTab.tsx
    - app/admin/api-keys/page.tsx
decisions:
  - "AiProvidersSection uses same formatRelative helper copied locally — not extracted to shared util (premature abstraction for 2 callers)"
  - "Actions column right-aligned in AiProvidersSection — consistent with table layout conventions"
metrics:
  duration: "~2 minutes"
  completed: "2026-03-27"
  tasks_completed: 2
  files_created: 2
  files_modified: 2
---

# Phase 12 Plan 02: AI Providers UI Summary

**One-liner:** Two-section Third Party Keys tab with AI Providers table (add/edit/delete with provider-model dropdowns) above the existing General Keys section.

## What Was Built

### AiProvidersSection (app/admin/api-keys/AiProvidersSection.tsx)

`'use client'` component accepting `initialKeys: AiProviderKeyItem[]`:
- Section heading row with "AI Providers" (left) and "Add AI Provider Key" button (right)
- Empty state: lock SVG icon + "No AI provider keys yet" heading + "Add an OpenAI or Anthropic key to power the chatbot." body
- Table with Name, Provider (120px), Model (160px), Added (140px), Actions columns
- Model displayed as purple badge (`bg-purple-100 text-purple-700`)
- Inline delete confirmation: "Sure?" + red "Delete" + "Keep Key" cancel (per UI-SPEC copywriting contract)
- Optimistic removal on delete; refreshes from server after save via `handleRefresh`
- Renders `AiProviderModal` when `modalState` is not null

### AiProviderModal (app/admin/api-keys/AiProviderModal.tsx)

`'use client'` modal component for add/edit AI provider keys:
- Provider select: OpenAI / Anthropic — disabled in edit mode (provider cannot change)
- Model select: populated dynamically by `getModelsForProvider(provider)`, resets on provider change
- API Key field: `type="password"` `autoComplete="new-password"`, required on create, optional on edit
- Display Name field: optional text input, placeholder "e.g. Production OpenAI Key"
- Submit labels: "Add Provider Key" (create) / "Update Key" (edit)
- Cancel button: "Discard" (not "Cancel")
- Error display matches SecretModal pattern
- Calls `createAiProviderKey` on create, `updateAiProviderKey` on edit

### SecretsTab refactor (app/admin/api-keys/SecretsTab.tsx)

- Added `initialAiKeys: AiProviderKeyItem[]` to props interface
- Imports `AiProvidersSection` and renders it at the top of the return JSX
- `<div className="mt-8 mb-4" />` divider between AI Providers and General Keys sections
- All existing general secrets CRUD (filter pills, search, table, SecretModal) unchanged

### page.tsx update (app/admin/api-keys/page.tsx)

- Added `listAiProviderKeys` import alongside `listSecrets`
- Parallel fetch with `Promise.all([listSecrets(), listAiProviderKeys()])`
- Passes `initialAiKeys` prop to `SecretsTab`

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all UI is wired to real server actions from 12-01. Data flows from DB through `listAiProviderKeys` → `page.tsx` → `SecretsTab` → `AiProvidersSection`.

## Self-Check: PASSED

- FOUND: app/admin/api-keys/AiProvidersSection.tsx
- FOUND: app/admin/api-keys/AiProviderModal.tsx
- FOUND: app/admin/api-keys/SecretsTab.tsx (modified)
- FOUND: app/admin/api-keys/page.tsx (modified)
- FOUND commit: c41af75 (feat(12-02): AiProvidersSection and AiProviderModal components)
- FOUND commit: aa8821c (feat(12-02): refactor SecretsTab and page.tsx for two-section layout)
