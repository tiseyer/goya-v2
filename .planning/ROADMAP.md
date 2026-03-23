# Roadmap: GOYA v2 — Milestone v1.0 User Settings

## Overview

This milestone consolidates user-facing settings into a dedicated Settings section. Phase 1 refactors the profile dropdown to expose Settings entry points appropriate to each role. Phase 2 builds the Settings shell — a sidebar-navigated layout mirroring Admin Settings. Phase 3 populates the four settings pages: General and Subscriptions with existing content migrated in, Connections and Inbox as placeholders.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Dropdown Refactor** - Add role-branched Settings entry to profile dropdown and remove old shortcuts
- [ ] **Phase 2: Settings Shell** - Build sidebar-navigated Settings layout at `app/settings/` matching Admin Settings
- [ ] **Phase 3: Settings Pages** - Populate four settings pages (General, Subscriptions, Connections, Inbox)

## Phase Details

### Phase 1: Dropdown Refactor
**Goal**: Users can reach Settings from the profile dropdown, with placement appropriate to their role
**Depends on**: Nothing (first phase)
**Requirements**: NAV-01, NAV-02, NAV-03, NAV-04, NAV-05
**Success Criteria** (what must be TRUE):
  1. Any logged-in user can click "Settings" in the profile dropdown and land on `/settings`
  2. Admin and Moderator users see "Settings" immediately above "Admin Settings" in the dropdown
  3. Regular users (student, teacher, wellness_practitioner) see "Settings" between the two dropdown dividers
  4. "Profile Settings" and "Subscriptions" entries are no longer present in the dropdown
**Plans**: 1 plan
Plans:
- [ ] 01-01-PLAN.md — Refactor profile dropdown: add role-branched Settings entry, remove Profile Settings and Subscriptions
**UI hint**: yes

### Phase 2: Settings Shell
**Goal**: A sidebar-navigated Settings section exists at `app/settings/` with the same visual pattern as Admin Settings
**Depends on**: Phase 1
**Requirements**: SHELL-01, SHELL-02, SHELL-03, SHELL-04
**Success Criteria** (what must be TRUE):
  1. Navigating to `/settings` renders a page with a sidebar listing General, Subscriptions, Connections, and Inbox in that order
  2. The active sidebar item is visually highlighted to show which page the user is on
  3. The layout uses the same design tokens and component structure as Admin Settings (`AdminShell.tsx`)
**Plans**: TBD
**UI hint**: yes

### Phase 3: Settings Pages
**Goal**: All four settings pages are accessible with their correct content — two with real content migrated in, two as placeholders
**Depends on**: Phase 2
**Requirements**: PAGE-01, PAGE-02, PAGE-03, PAGE-04
**Success Criteria** (what must be TRUE):
  1. Settings > General displays the full profile settings form (name, avatar, bio, etc.) and changes save successfully
  2. Settings > Subscriptions displays subscription information identical to the existing subscriptions page
  3. Settings > Connections displays a "coming soon" placeholder page
  4. Settings > Inbox displays a "coming soon" placeholder page
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Dropdown Refactor | 0/1 | Planning complete | - |
| 2. Settings Shell | 0/? | Not started | - |
| 3. Settings Pages | 0/? | Not started | - |
