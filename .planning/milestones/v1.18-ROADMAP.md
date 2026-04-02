# Roadmap: v1.18 Analytics & Tracking System

**Created:** 2026-04-01
**Phases:** 5
**Requirements:** 27 (100% mapped)

---

## Phase 1: Analytics Navigation Restructure

**Goal:** Reorder admin analytics tabs to Visitors -> Users -> Shop.

**Requirements:** NAV-01

**Plans:** 1 plan

Plans:
- [ ] 01-01-PLAN.md -- Reorder analytics nav children and add Users tab entry

**Success Criteria:**
1. Analytics nav shows tabs in order: Visitors, Users, Shop
2. All existing Shop analytics functionality intact

---

## Phase 2: Users Analytics Tab

**Goal:** Build users analytics with stat cards, growth chart, and recent signups.

**Requirements:** USER-01, USER-02, USER-03, USER-04, USER-05, USER-06

**Plans:** 1 plan

Plans:
- [ ] 02-01-PLAN.md -- Server-side stat cards, growth chart with filters, recent signups table

**Success Criteria:**
1. Stat cards show role-based counts excluding faux/robot users
2. Area chart shows cumulative member growth with time and role filter pills
3. Recent signups table shows 10 latest real users with admin links

---

## Phase 3: Visitors Analytics Tab (GA4)

**Goal:** GA4 Data API integration with traffic dashboard.

**Requirements:** VIS-01, VIS-02, VIS-03, VIS-04, VIS-05, VIS-06, VIS-07, VIS-08, VIS-09, VIS-10

**Plans:** 1 plan

Plans:
- [ ] 03-01-PLAN.md -- GA4 client library, visitors page with stats/charts/tables, fallback UI

**Success Criteria:**
1. GA4 client authenticates with service account
2. Stats row shows 6 metrics with trend indicators
3. Traffic chart, top pages, sources, countries, and devices tables render
4. Graceful fallback when GA4 not configured

---

## Phase 4: GA4 Event Tracking

**Goal:** Tracking utility and implementation across key app flows.

**Requirements:** EVT-01, EVT-02, EVT-03, EVT-04, EVT-05, EVT-06, EVT-07, EVT-08, EVT-09

**Success Criteria:**
1. lib/analytics/events.ts exports Analytics object with 20+ predefined events
2. Auth, onboarding, shop, school, content, profile, connection, search flows instrumented
3. Events fire correctly with gtag when GA4 is loaded

---

## Phase 5: Setup Documentation

**Goal:** Manual GA4 setup guide for admins.

**Requirements:** DOC-01

**Success Criteria:**
1. docs/analytics-manual-setup.md covers conversion events, property ID setup, event verification, audiences, reports

---

**Coverage:**
- NAV: 1/1 -> Phase 1
- USER: 6/6 -> Phase 2
- VIS: 10/10 -> Phase 3
- EVT: 9/9 -> Phase 4
- DOC: 1/1 -> Phase 5
- Total: 27/27 (100%) ✓
