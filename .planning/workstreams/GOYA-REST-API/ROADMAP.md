# Roadmap: GOYA REST API — Open Gates (v1.6)

## Overview

Build a complete REST API under `/api/v1/` that exposes every GOYA entity to external services. The foundation phase establishes auth, middleware, rate limiting, and shared patterns — everything else builds on top. Entities are delivered in dependency order (Users first, then the entities that reference them). Analytics, Add-ons, Admin Settings, and Webhooks are consolidated in a single phase since they share no cross-dependencies. The milestone closes with an Admin UI for key management and a full API reference document.

## Phases

- [x] **Phase 1: Foundation** - API key system, middleware, rate limiting, response format, health endpoint, handler factory, service layer, pagination, audit logging
- [ ] **Phase 2: Users** - Full users API with profile sub-resources (credits, certifications, verifications)
- [ ] **Phase 3: Events** - Events CRUD with registration management
- [ ] **Phase 4: Courses** - Courses CRUD with enrollment management
- [ ] **Phase 5: Credits & Verifications** - Credits CRUD with summary endpoint + verifications CRUD
- [ ] **Phase 6: Analytics** - Five analytics aggregation endpoints
- [ ] **Phase 7: Add-ons, Admin Settings & Webhooks** - Add-ons CRUD with user assignments, admin settings, incoming webhook endpoints
- [ ] **Phase 8: Admin UI & Documentation** - API key management page in admin panel + full API reference

## Phase Details

### Phase 1: Foundation
**Goal**: External clients can authenticate with API keys and receive consistent, rate-limited responses — all infrastructure for every subsequent phase is in place
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, AUTH-04, AUTH-05, AUTH-06, AUTH-07, AUTH-08, AUTH-09, PAGE-01, AUDT-01
**Success Criteria** (what must be TRUE):
  1. A request with a valid API key to any `/api/v1/` route succeeds; a request with an invalid or missing key returns 401 with the standard error format
  2. After 100 requests per minute from a single key the API returns 429 Too Many Requests
  3. Every response — success or error — follows `{ success, data, error, meta }` exactly
  4. `GET /api/v1/health` responds with status + version without requiring any API key
  5. All list endpoints accept `page`, `limit`, `sort`, `order` params and return paginated results; every write operation produces an `audit_log` row
**Plans**: 4 plans
Plans:
- [x] 01-01-PLAN.md — API keys migration, response types, response helpers
- [x] 01-02-PLAN.md — Handler factory and pagination utilities
- [x] 01-03-PLAN.md — API key validation, rate limiting, permission middleware
- [x] 01-04-PLAN.md — Health endpoint and migration push

### Phase 2: Users
**Goal**: Callers can list, retrieve, and update users plus read their associated credits, certifications, and verifications
**Depends on**: Phase 1
**Requirements**: USER-01, USER-02, USER-03, USER-04, USER-05, USER-06
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/users` returns a paginated list filterable by role, membership status, date range, and search term
  2. `GET /api/v1/users/:id` returns the full user profile; an unknown ID returns 404
  3. `PATCH /api/v1/users/:id` updates role, status, or membership and produces an audit log entry
  4. Sub-resource endpoints (`/credits`, `/certifications`, `/verifications`) each return the correct data for the given user
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — API keys migration, response types, response helpers
- [ ] 01-02-PLAN.md — Handler factory and pagination utilities
- [ ] 01-03-PLAN.md — API key validation, rate limiting, permission middleware
- [ ] 01-04-PLAN.md — Health endpoint and migration push

### Phase 3: Events
**Goal**: Callers can create, read, update, and delete events and manage user registrations
**Depends on**: Phase 2
**Requirements**: EVNT-01, EVNT-02, EVNT-03, EVNT-04, EVNT-05, EVNT-06, EVNT-07
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/events` returns events filterable by date range, status, and type with pagination
  2. `POST /api/v1/events` creates an event and returns the new record; `DELETE /api/v1/events/:id` removes it
  3. `POST /api/v1/events/:id/registrations` registers a user; `DELETE /api/v1/events/:id/registrations/:userId` unregisters them; both log to audit
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — API keys migration, response types, response helpers
- [ ] 01-02-PLAN.md — Handler factory and pagination utilities
- [ ] 01-03-PLAN.md — API key validation, rate limiting, permission middleware
- [ ] 01-04-PLAN.md — Health endpoint and migration push

### Phase 4: Courses
**Goal**: Callers can manage courses and track learner enrollment progress through the API
**Depends on**: Phase 2
**Requirements**: CRSE-01, CRSE-02, CRSE-03, CRSE-04, CRSE-05, CRSE-06, CRSE-07, CRSE-08
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/courses` returns courses filterable with pagination; `GET /api/v1/courses/:id` returns full detail
  2. `POST /api/v1/courses` creates a course; `PATCH /api/v1/courses/:id` updates it; `DELETE /api/v1/courses/:id` removes it — all with audit entries
  3. `GET /api/v1/courses/:id/enrollments` lists enrollees; `POST` enrolls a user; `PATCH /courses/:id/enrollments/:userId` updates progress or completion status
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — API keys migration, response types, response helpers
- [ ] 01-02-PLAN.md — Handler factory and pagination utilities
- [ ] 01-03-PLAN.md — API key validation, rate limiting, permission middleware
- [ ] 01-04-PLAN.md — Health endpoint and migration push

### Phase 5: Credits & Verifications
**Goal**: Callers can submit, review, and manage CPD credit records and verification records
**Depends on**: Phase 2
**Requirements**: CRED-01, CRED-02, CRED-03, CRED-04, CRED-05, VERF-01, VERF-02, VERF-03, VERF-04, VERF-05
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/credits` returns submissions filterable by status, user, and date; `GET /credits/summary/:userId` returns total hours broken down by category
  2. `POST /api/v1/credits` creates a submission; `PATCH /credits/:id` updates status (approve/reject/pending) with an audit log row
  3. Verifications endpoints (`GET`, `POST`, `PATCH`, `DELETE`) are fully functional with consistent response format and audit logging for writes
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — API keys migration, response types, response helpers
- [ ] 01-02-PLAN.md — Handler factory and pagination utilities
- [ ] 01-03-PLAN.md — API key validation, rate limiting, permission middleware
- [ ] 01-04-PLAN.md — Health endpoint and migration push

### Phase 6: Analytics
**Goal**: Callers can retrieve aggregated platform metrics across members, memberships, revenue, engagement, and credits
**Depends on**: Phase 1
**Requirements**: ANLY-01, ANLY-02, ANLY-03, ANLY-04, ANLY-05
**Success Criteria** (what must be TRUE):
  1. `GET /api/v1/analytics/overview` returns total members, active members, and new-this-month count
  2. `GET /api/v1/analytics/memberships` and `/revenue` return time-series stats without making live Stripe API calls
  3. `GET /api/v1/analytics/engagement` and `/credits` return participation and submission statistics derived from local Supabase tables
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — API keys migration, response types, response helpers
- [ ] 01-02-PLAN.md — Handler factory and pagination utilities
- [ ] 01-03-PLAN.md — API key validation, rate limiting, permission middleware
- [ ] 01-04-PLAN.md — Health endpoint and migration push

### Phase 7: Add-ons, Admin Settings & Webhooks
**Goal**: Callers can manage add-on products, assign them to users, read/update admin settings, and trigger internal actions via incoming webhooks
**Depends on**: Phase 2
**Requirements**: ADON-01, ADON-02, ADON-03, ADON-04, ADON-05, ADON-06, ADON-07, ADON-08, ADMN-01, ADMN-02, ADMN-03, ADMN-04, WHKN-01, WHKN-02, WHKN-03
**Success Criteria** (what must be TRUE):
  1. Add-on CRUD endpoints create, update, and delete add-on records; user-assignment endpoints correctly add and remove add-ons for a given user
  2. `GET /api/v1/admin/settings` returns all settings; `PATCH` updates them in bulk or individually — admin role check enforced on all four endpoints
  3. All three webhook endpoints (`/trigger`, `/payment`, `/notify`) accept valid payloads and return 200; malformed payloads return 400
**Plans**: 4 plans
Plans:
- [ ] 01-01-PLAN.md — API keys migration, response types, response helpers
- [ ] 01-02-PLAN.md — Handler factory and pagination utilities
- [ ] 01-03-PLAN.md — API key validation, rate limiting, permission middleware
- [ ] 01-04-PLAN.md — Health endpoint and migration push

### Phase 8: Admin UI & Documentation
**Goal**: Admins can manage API keys through the admin panel and every API endpoint is documented with example requests and responses
**Depends on**: Phase 1
**Requirements**: AKUI-01, AKUI-02, AKUI-03, DOCS-01
**Success Criteria** (what must be TRUE):
  1. Admin can navigate to `/admin/api-keys`, create a new key (choosing a name and permissions), and copy the generated key value exactly once
  2. Admin can revoke any existing key from the list and see its status update immediately; key usage (last used, request count) is visible
  3. `API_DOCS.md` documents every endpoint with method, path, auth requirements, query params, request body, and example response
**UI hint**: yes

## Progress

**Execution Order:** Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Foundation | 4/4 | Complete | 2026-03-25 |
| 2. Users | 0/? | Not started | - |
| 3. Events | 0/? | Not started | - |
| 4. Courses | 0/? | Not started | - |
| 5. Credits & Verifications | 0/? | Not started | - |
| 6. Analytics | 0/? | Not started | - |
| 7. Add-ons, Admin Settings & Webhooks | 0/? | Not started | - |
| 8. Admin UI & Documentation | 0/? | Not started | - |
