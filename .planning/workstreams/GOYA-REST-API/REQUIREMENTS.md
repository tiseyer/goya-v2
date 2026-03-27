# Requirements: GOYA v2 — API Settings Page

**Defined:** 2026-03-27
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.7 Requirements

Requirements for the API Settings Page milestone. Each maps to roadmap phases.

### Tab Structure

- [ ] **TABS-01**: Admin can navigate between Own Keys, Third Party Keys, and Endpoints tabs at `/admin/api-keys`
- [ ] **TABS-02**: Tab navigation matches existing admin design patterns and tokens

### Own Keys

- [ ] **KEYS-01**: Existing API key create/list/revoke functionality works within the Own Keys tab
- [ ] **KEYS-02**: No regression in existing API key management behavior

### Secrets Management

- [ ] **SECR-01**: Admin can view a list of stored third-party secrets showing name, category, description, and last updated — never raw values
- [ ] **SECR-02**: Admin can create a new secret with name, value, category, and description via modal
- [ ] **SECR-03**: Admin can edit an existing secret with pre-filled fields and masked value with option to update
- [ ] **SECR-04**: Admin can delete a secret with confirmation dialog
- [ ] **SECR-05**: Admin can filter secrets by category (Auth, Analytics, Payments, AI, Other)
- [ ] **SECR-06**: Admin can search secrets by name
- [ ] **SECR-07**: Secrets are encrypted at rest using AES-256 with SECRETS_MASTER_KEY
- [ ] **SECR-08**: Supabase migration creates secrets table with admin-only RLS
- [ ] **SECR-09**: Raw decrypted values only returned on explicit single-key fetch, never in bulk list
- [ ] **SECR-10**: SECRETS_MASTER_KEY added to .env.local.example with generation instructions
- [ ] **SECR-11**: Pre-populated category structure with placeholder entries for known keys (Google OAuth, GA4, Clarity, Meta Pixel, Anthropic, etc.)

### Endpoints Documentation

- [ ] **ENDP-01**: Endpoints tab auto-scans `/app/api/**` and displays all discovered routes (~49 endpoints)
- [ ] **ENDP-02**: Each endpoint shows method, path, auth type, and description
- [ ] **ENDP-03**: Endpoints are grouped by domain category (Auth, Users, Events, Courses, Credits, Shop, Admin, Webhooks, External API)
- [ ] **ENDP-04**: Admin can search and filter endpoints by name, path, or category

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Secrets Enhancements

- **SECR-F01**: Secret rotation reminders and expiry tracking
- **SECR-F02**: Audit log for secret access and modifications
- **SECR-F03**: Secret versioning and rollback

### Endpoints Enhancements

- **ENDP-F01**: Interactive API playground (try endpoints from the UI)
- **ENDP-F02**: Request/response schema documentation per endpoint

## Out of Scope

| Feature | Reason |
|---------|--------|
| Moving Stripe keys from .env to secrets table | Stripe keys deeply integrated via existing env vars — noted in UI |
| Secret sharing between team members | Single-admin system, not needed |
| API endpoint testing/playground | Complexity — deferred to future milestone |
| Webhook management UI | Separate concern from API settings |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| TABS-01 | — | Pending |
| TABS-02 | — | Pending |
| KEYS-01 | — | Pending |
| KEYS-02 | — | Pending |
| SECR-01 | — | Pending |
| SECR-02 | — | Pending |
| SECR-03 | — | Pending |
| SECR-04 | — | Pending |
| SECR-05 | — | Pending |
| SECR-06 | — | Pending |
| SECR-07 | — | Pending |
| SECR-08 | — | Pending |
| SECR-09 | — | Pending |
| SECR-10 | — | Pending |
| SECR-11 | — | Pending |
| ENDP-01 | — | Pending |
| ENDP-02 | — | Pending |
| ENDP-03 | — | Pending |
| ENDP-04 | — | Pending |

**Coverage:**
- v1.7 requirements: 19 total
- Mapped to phases: 0
- Unmapped: 19 ⚠️

---
*Requirements defined: 2026-03-27*
*Last updated: 2026-03-27 after initial definition*
