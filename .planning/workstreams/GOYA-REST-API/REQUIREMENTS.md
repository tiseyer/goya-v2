# Requirements: GOYA REST API — Open Gates

**Defined:** 2026-03-25
**Core Value:** External services can programmatically access and manage all GOYA v2 entities through a secure, documented REST API.

## v1.6 Requirements

Requirements for the Open Gates milestone. Each maps to roadmap phases.

### Auth & Infrastructure

- [x] **AUTH-01**: API key table (`api_keys`) stores key hash, name, permissions, created_by, last_used, active
- [x] **AUTH-02**: Middleware validates API keys on all `/api/v1/` routes
- [x] **AUTH-03**: Rate limiting enforced per key (100 req/min)
- [x] **AUTH-04**: All responses follow consistent format: `{ success, data, error, meta }`
- [x] **AUTH-05**: `/api/v1/health` endpoint returns status + version without auth
- [x] **AUTH-06**: Admin-only endpoints check for admin role in addition to API key
- [x] **AUTH-07**: Shared route handler factory reduces repetition across endpoints
- [x] **AUTH-08**: Business logic lives in `/lib/api/` service files, not route handlers
- [x] **AUTH-09**: Supabase service role client used for all API operations (bypass RLS)

### Users

- [x] **USER-01**: GET `/users` lists users with filters (role, membership status, date range, search)
- [x] **USER-02**: GET `/users/:id` returns full user profile
- [ ] **USER-03**: PATCH `/users/:id` updates role, status, membership
- [ ] **USER-04**: GET `/users/:id/credits` returns credit & teaching hours
- [ ] **USER-05**: GET `/users/:id/certifications` returns user certifications
- [ ] **USER-06**: GET `/users/:id/verifications` returns user verifications

### Events

- [ ] **EVNT-01**: GET `/events` lists events with filters (date range, status, type)
- [ ] **EVNT-02**: GET `/events/:id` returns event details
- [ ] **EVNT-03**: POST `/events` creates an event
- [ ] **EVNT-04**: PATCH `/events/:id` updates an event
- [ ] **EVNT-05**: DELETE `/events/:id` deletes an event
- [ ] **EVNT-06**: POST `/events/:id/registrations` registers a user for an event
- [ ] **EVNT-07**: DELETE `/events/:id/registrations/:userId` unregisters a user

### Courses

- [ ] **CRSE-01**: GET `/courses` lists courses with filters
- [ ] **CRSE-02**: GET `/courses/:id` returns course details
- [ ] **CRSE-03**: POST `/courses` creates a course
- [ ] **CRSE-04**: PATCH `/courses/:id` updates a course
- [ ] **CRSE-05**: DELETE `/courses/:id` deletes a course
- [ ] **CRSE-06**: GET `/courses/:id/enrollments` lists enrollments
- [ ] **CRSE-07**: POST `/courses/:id/enrollments` enrolls a user
- [ ] **CRSE-08**: PATCH `/courses/:id/enrollments/:userId` updates progress/completion

### Credits

- [ ] **CRED-01**: GET `/credits` lists submissions with filters (status, user, date)
- [ ] **CRED-02**: GET `/credits/:id` returns credit details
- [ ] **CRED-03**: POST `/credits` creates a credit submission
- [ ] **CRED-04**: PATCH `/credits/:id` updates status (approve/reject/pending)
- [ ] **CRED-05**: GET `/credits/summary/:userId` returns total hours by category

### Verifications

- [ ] **VERF-01**: GET `/verifications` lists verifications with filters
- [ ] **VERF-02**: GET `/verifications/:id` returns verification details
- [ ] **VERF-03**: POST `/verifications` creates a verification
- [ ] **VERF-04**: PATCH `/verifications/:id` updates verification status
- [ ] **VERF-05**: DELETE `/verifications/:id` deletes a verification

### Analytics

- [ ] **ANLY-01**: GET `/analytics/overview` returns key metrics (total members, active, new this month)
- [ ] **ANLY-02**: GET `/analytics/memberships` returns membership stats over time
- [ ] **ANLY-03**: GET `/analytics/revenue` returns revenue data
- [ ] **ANLY-04**: GET `/analytics/engagement` returns course/event participation rates
- [ ] **ANLY-05**: GET `/analytics/credits` returns credit submission stats

### Add-ons

- [ ] **ADON-01**: GET `/addons` lists available add-ons
- [ ] **ADON-02**: GET `/addons/:id` returns add-on details
- [ ] **ADON-03**: POST `/addons` creates an add-on
- [ ] **ADON-04**: PATCH `/addons/:id` updates an add-on
- [ ] **ADON-05**: DELETE `/addons/:id` deletes an add-on
- [ ] **ADON-06**: GET `/addons/users/:userId` returns add-ons assigned to user
- [ ] **ADON-07**: POST `/addons/users/:userId` assigns add-on to user
- [ ] **ADON-08**: DELETE `/addons/users/:userId/:addonId` removes add-on from user

### Admin Settings

- [ ] **ADMN-01**: GET `/admin/settings` returns all settings
- [ ] **ADMN-02**: PATCH `/admin/settings` updates settings (bulk)
- [ ] **ADMN-03**: GET `/admin/settings/:key` returns single setting
- [ ] **ADMN-04**: PATCH `/admin/settings/:key` updates single setting

### Webhooks (Incoming)

- [ ] **WHKN-01**: POST `/webhooks/trigger` accepts generic event with type + payload
- [ ] **WHKN-02**: POST `/webhooks/payment` accepts payment events
- [ ] **WHKN-03**: POST `/webhooks/notify` sends notification to user(s)

### Pagination & Sorting

- [ ] **PAGE-01**: Every list endpoint supports `page`, `limit`, `sort`, `order` query params

### Audit Logging

- [ ] **AUDT-01**: All write operations log to `audit_log` table via `logAudit()`

### Admin UI

- [ ] **AKUI-01**: Admin page at `/admin/api-keys` for creating API keys
- [ ] **AKUI-02**: Admin page at `/admin/api-keys` for revoking API keys
- [ ] **AKUI-03**: Admin page at `/admin/api-keys` for viewing API key usage

### Documentation

- [ ] **DOCS-01**: `API_DOCS.md` documents every endpoint with example request/response

## Future Requirements

None — full spec included in v1.6.

## Out of Scope

| Feature | Reason |
|---------|--------|
| OAuth2 / JWT token auth | API keys sufficient for Make.com and similar integrations |
| GraphQL API | REST covers all use cases; GraphQL adds complexity |
| WebSocket real-time endpoints | Not needed for external automation services |
| API versioning beyond v1 | Build v1 first, version when breaking changes needed |
| Public developer portal | API_DOCS.md sufficient for initial external consumers |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | Phase 1 | Complete |
| AUTH-02 | Phase 1 | Done |
| AUTH-03 | Phase 1 | Done |
| AUTH-04 | Phase 1 | Complete |
| AUTH-05 | Phase 1 | Pending |
| AUTH-06 | Phase 1 | Done |
| AUTH-07 | Phase 1 | Pending |
| AUTH-08 | Phase 1 | Pending |
| AUTH-09 | Phase 1 | Complete |
| PAGE-01 | Phase 1 | Pending |
| AUDT-01 | Phase 1 | Pending |
| USER-01 | Phase 2 | Complete |
| USER-02 | Phase 2 | Complete |
| USER-03 | Phase 2 | Pending |
| USER-04 | Phase 2 | Pending |
| USER-05 | Phase 2 | Pending |
| USER-06 | Phase 2 | Pending |
| EVNT-01 | Phase 3 | Pending |
| EVNT-02 | Phase 3 | Pending |
| EVNT-03 | Phase 3 | Pending |
| EVNT-04 | Phase 3 | Pending |
| EVNT-05 | Phase 3 | Pending |
| EVNT-06 | Phase 3 | Pending |
| EVNT-07 | Phase 3 | Pending |
| CRSE-01 | Phase 4 | Pending |
| CRSE-02 | Phase 4 | Pending |
| CRSE-03 | Phase 4 | Pending |
| CRSE-04 | Phase 4 | Pending |
| CRSE-05 | Phase 4 | Pending |
| CRSE-06 | Phase 4 | Pending |
| CRSE-07 | Phase 4 | Pending |
| CRSE-08 | Phase 4 | Pending |
| CRED-01 | Phase 5 | Pending |
| CRED-02 | Phase 5 | Pending |
| CRED-03 | Phase 5 | Pending |
| CRED-04 | Phase 5 | Pending |
| CRED-05 | Phase 5 | Pending |
| VERF-01 | Phase 5 | Pending |
| VERF-02 | Phase 5 | Pending |
| VERF-03 | Phase 5 | Pending |
| VERF-04 | Phase 5 | Pending |
| VERF-05 | Phase 5 | Pending |
| ANLY-01 | Phase 6 | Pending |
| ANLY-02 | Phase 6 | Pending |
| ANLY-03 | Phase 6 | Pending |
| ANLY-04 | Phase 6 | Pending |
| ANLY-05 | Phase 6 | Pending |
| ADON-01 | Phase 7 | Pending |
| ADON-02 | Phase 7 | Pending |
| ADON-03 | Phase 7 | Pending |
| ADON-04 | Phase 7 | Pending |
| ADON-05 | Phase 7 | Pending |
| ADON-06 | Phase 7 | Pending |
| ADON-07 | Phase 7 | Pending |
| ADON-08 | Phase 7 | Pending |
| ADMN-01 | Phase 7 | Pending |
| ADMN-02 | Phase 7 | Pending |
| ADMN-03 | Phase 7 | Pending |
| ADMN-04 | Phase 7 | Pending |
| WHKN-01 | Phase 7 | Pending |
| WHKN-02 | Phase 7 | Pending |
| WHKN-03 | Phase 7 | Pending |
| AKUI-01 | Phase 8 | Pending |
| AKUI-02 | Phase 8 | Pending |
| AKUI-03 | Phase 8 | Pending |
| DOCS-01 | Phase 8 | Pending |

**Coverage:**
- v1.6 requirements: 55 total
- Mapped to phases: 55
- Unmapped: 0

---
*Requirements defined: 2026-03-25*
*Last updated: 2026-03-25 after roadmap creation*
