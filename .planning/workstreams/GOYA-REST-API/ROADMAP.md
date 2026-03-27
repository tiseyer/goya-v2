# Roadmap: GOYA REST API — API Settings Page (v1.7)

## Overview

Extend `/admin/api-keys` into a three-tab admin interface. The existing API key management moves into an "Own Keys" tab, a new encrypted secrets manager covers third-party API keys with AES-256 encryption and full CRUD, and an auto-scanned endpoint documentation tab exposes all 49 routes grouped by domain. Phases follow dependency order: tab structure first (unlocks the shell), secrets in the middle (backend then UI), endpoints last (pure read-only UI scan).

## Phases

- [x] **Phase 9: Tab Shell & Own Keys Migration** - Three-tab layout at `/admin/api-keys` with existing key management moved into Own Keys tab (completed 2026-03-27)
- [x] **Phase 10: Secrets Management** - Encrypted secrets table, encryption service, CRUD API routes, and full secrets admin UI (completed 2026-03-27)
- [x] **Phase 11: Endpoints Documentation** - Auto-scanned endpoint documentation tab with search, filter, and grouped display

## Phase Details

### Phase 9: Tab Shell & Own Keys Migration
**Goal**: Admins can navigate between three tabs at `/admin/api-keys` and all existing API key functionality works unchanged inside the Own Keys tab
**Depends on**: Nothing (first phase of milestone)
**Requirements**: TABS-01, TABS-02, KEYS-01, KEYS-02
**Success Criteria** (what must be TRUE):
  1. Admin can click between Own Keys, Third Party Keys, and Endpoints tabs and each tab renders without error
  2. Tab navigation uses the same design tokens, spacing, and interaction patterns as other admin tabbed interfaces in the codebase
  3. All existing API key create, list, and revoke functionality works identically inside the Own Keys tab as it did before migration
  4. No regression: existing API keys created before this migration remain valid and visible
**Plans:** 1 plan
Plans:
- [x] 09-01-PLAN.md — Tab shell with URL-based switching and Own Keys migration

**UI hint**: yes

### Phase 10: Secrets Management
**Goal**: Admins can securely store, view, create, edit, delete, and search third-party API secrets — values are always encrypted at rest and never exposed in bulk
**Depends on**: Phase 9
**Requirements**: SECR-01, SECR-02, SECR-03, SECR-04, SECR-05, SECR-06, SECR-07, SECR-08, SECR-09, SECR-10, SECR-11
**Success Criteria** (what must be TRUE):
  1. Admin can view the secrets list showing name, category, description, and last updated — no raw values are visible in the list
  2. Admin can create a new secret via modal with name, value, category, and description — the value is stored encrypted, never in plaintext
  3. Admin can edit an existing secret with pre-filled name/description/category and a masked value field; submitting a new value replaces the encrypted secret
  4. Admin can delete a secret after confirming a dialog; the secret is removed from the database
  5. Admin can filter by category (Auth, Analytics, Payments, AI, Other) and search by name; the list updates immediately
**Plans:** 2/2 plans complete
Plans:
- [x] 10-01-PLAN.md — Migration, encryption service, and server actions (backend foundation)
- [x] 10-02-PLAN.md — Secrets management UI with table, modals, filter, search, and seed data

**UI hint**: yes

### Phase 11: Endpoints Documentation
**Goal**: Admins can browse, search, and filter all REST API endpoints auto-discovered from the codebase — no manual maintenance required
**Depends on**: Phase 9
**Requirements**: ENDP-01, ENDP-02, ENDP-03, ENDP-04
**Success Criteria** (what must be TRUE):
  1. The Endpoints tab displays all discovered routes (~49 endpoints) without any manual data entry
  2. Each endpoint row shows method, path, auth type, and a description
  3. Endpoints are grouped under domain headers (Health, Users, Events, Courses, Credits, Verifications, Analytics, Add-ons, Admin, Webhooks)
  4. Admin can type in a search box or pick a category filter and only matching endpoints are shown
**Plans:** 1 plan
Plans:
- [x] 11-01-PLAN.md — Endpoint registry, EndpointsTab component with search/filter/grouped display

**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 9 -> 10 -> 11

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 9. Tab Shell & Own Keys Migration | 1/1 | Complete | 2026-03-27 |
| 10. Secrets Management | 2/2 | Complete    | 2026-03-27 |
| 11. Endpoints Documentation | 1/1 | Complete | 2026-03-27 |
