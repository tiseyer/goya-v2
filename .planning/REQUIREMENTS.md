# Requirements: GOYA v2 — v1.19 Global Search

**Defined:** 2026-04-03
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.19 Requirements

Requirements for Global Search milestone. Each maps to roadmap phases.

### Search Overlay UI

- [x] **SRCH-01**: User can open a centered search overlay by clicking the search icon in the nav header
- [x] **SRCH-02**: User can close the overlay via Esc key, X button, or clicking outside the backdrop
- [x] **SRCH-03**: User sees category filter pills (All / Members / Events / Courses / Pages) that toggle search scope
- [x] **SRCH-04**: User can navigate results with arrow keys and open highlighted result with Enter
- [x] **SRCH-05**: User sees results grouped by category with best match highlighted at top
- [x] **SRCH-06**: User sees contextual action icons on result rows (message icon for members, map/directions icon for members with full address)
- [x] **SRCH-07**: User on mobile sees a full-screen overlay with input at bottom and horizontally scrollable filter pills
- [x] **SRCH-08**: Opening the overlay (via click or keyboard shortcut) auto-focuses the search input, ready to type immediately

### Search API

- [ ] **SAPI-01**: User can search members by full_name returning id, full_name, avatar_url, role, city, country, has_full_address
- [ ] **SAPI-02**: User can search events by title, tags, description, and date patterns
- [ ] **SAPI-03**: User can search courses by title, tags, description
- [ ] **SAPI-04**: User can search pages from a role-filtered static page registry
- [ ] **SAPI-05**: Admin/moderator can search members by email and MRN
- [ ] **SAPI-06**: Admin/moderator sees admin-only pages in search results
- [ ] **SAPI-07**: Search returns up to 20 results per category

### Page Registry

- [ ] **PREG-01**: Static page registry maps all navigable pages with role visibility rules
- [ ] **PREG-02**: Teacher/school users see school-related pages they own in search results

### Integration & Performance

- [ ] **INTG-01**: User can open search with Cmd+K (Mac) / Ctrl+K (Windows/Linux) from any page
- [ ] **INTG-02**: Search input is debounced (200ms) with loading skeleton during fetch
- [ ] **INTG-03**: User sees appropriate empty states ("Keep typing...", "No results", placeholder)
- [ ] **INTG-04**: Results are cached in component state keyed by query string

## Future Requirements

Deferred to future release. Tracked but not in current roadmap.

### Search Enhancements

- **SRCH-F01**: Full-text search with PostgreSQL tsvector for better ranking
- **SRCH-F02**: Recent searches history (persisted per user)
- **SRCH-F03**: Text highlight — bold or accent-color the matched portion of result titles

## Out of Scope

| Feature | Reason |
|---------|--------|
| Full-text search (tsvector/pg_trgm) | ilike sufficient for v1; FTS is an optimization for later |
| Search analytics/tracking | Not needed for MVP — can add when usage data matters |
| Fuzzy/typo-tolerant search | Complexity not justified for v1; ilike covers exact substring |
| Saved searches / bookmarks | Low priority — simple search covers core need |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| SRCH-01 | Phase 51 | Complete |
| SRCH-02 | Phase 51 | Complete |
| SRCH-03 | Phase 51 | Complete |
| SRCH-04 | Phase 51 | Complete |
| SRCH-05 | Phase 51 | Complete |
| SRCH-06 | Phase 51 | Complete |
| SRCH-07 | Phase 51 | Complete |
| SRCH-08 | Phase 51 | Complete |
| SAPI-01 | Phase 52 | Complete |
| SAPI-02 | Phase 52 | Complete |
| SAPI-03 | Phase 52 | Complete |
| SAPI-04 | Phase 52 | Complete |
| SAPI-05 | Phase 52 | Complete |
| SAPI-06 | Phase 52 | Complete |
| SAPI-07 | Phase 52 | Complete |
| PREG-01 | Phase 52 | Complete |
| PREG-02 | Phase 52 | Complete |
| INTG-01 | Phase 53 | Complete |
| INTG-02 | Phase 54 | Complete |
| INTG-03 | Phase 54 | Complete |
| INTG-04 | Phase 54 | Complete |

**Coverage:**
- v1.19 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0

---
*Requirements defined: 2026-04-03*
*Last updated: 2026-04-03 after roadmap created (phases 51-54)*
