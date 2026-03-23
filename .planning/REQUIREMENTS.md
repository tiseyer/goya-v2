# Requirements: GOYA v2

**Defined:** 2026-03-23
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.0 Requirements — User Settings

### Dropdown Navigation

- [x] **NAV-01**: User can tap/click a "Settings" item in the profile dropdown to navigate to `/settings`
- [x] **NAV-02**: Admin and Moderator users see "Settings" positioned directly above "Admin Settings" in the dropdown
- [x] **NAV-03**: Regular users (student, teacher, wellness_practitioner) see "Settings" positioned between the two dropdown dividers
- [x] **NAV-04**: "Profile Settings" entry is removed from the profile dropdown
- [x] **NAV-05**: "Subscriptions" entry is removed from the profile dropdown

### Settings Shell

- [ ] **SHELL-01**: Settings section is accessible at `app/settings/` with a sidebar navigation layout consistent with Admin Settings
- [ ] **SHELL-02**: Sidebar lists four items in order: General, Subscriptions, Connections, Inbox
- [ ] **SHELL-03**: Active sidebar item is visually highlighted to indicate current page
- [ ] **SHELL-04**: Settings layout follows the same design tokens and component patterns as Admin Settings (`AdminShell.tsx`)

### Settings Pages

- [ ] **PAGE-01**: Settings > General displays the existing profile settings form (name, avatar, bio, etc.) currently at `app/profile/settings/`
- [ ] **PAGE-02**: Settings > Subscriptions displays the existing subscriptions content
- [ ] **PAGE-03**: Settings > Connections displays a placeholder page indicating this section is coming soon
- [ ] **PAGE-04**: Settings > Inbox displays a placeholder page indicating this section is coming soon

## v2 Requirements

### Connections Settings

- **CONN-01**: User can manage connection preferences and privacy settings
- **CONN-02**: User can view and manage their incoming/outgoing connection requests

### Inbox Settings

- **INBX-01**: User can configure inbox notification preferences
- **INBX-02**: User can manage message filtering rules

## Out of Scope

| Feature | Reason |
|---------|--------|
| Connections settings implementation | Task 2 — placeholder only in this milestone |
| Inbox settings implementation | Task 2 — placeholder only in this milestone |
| Notification preferences | Out of scope for settings MVP |
| Account deletion | High-risk operation — deferred |
| Password change in settings | Handled via forgot-password flow |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| NAV-01 | Phase 1 | Complete |
| NAV-02 | Phase 1 | Complete |
| NAV-03 | Phase 1 | Complete |
| NAV-04 | Phase 1 | Complete |
| NAV-05 | Phase 1 | Complete |
| SHELL-01 | Phase 2 | Pending |
| SHELL-02 | Phase 2 | Pending |
| SHELL-03 | Phase 2 | Pending |
| SHELL-04 | Phase 2 | Pending |
| PAGE-01 | Phase 3 | Pending |
| PAGE-02 | Phase 3 | Pending |
| PAGE-03 | Phase 3 | Pending |
| PAGE-04 | Phase 3 | Pending |

**Coverage:**
- v1.0 requirements: 13 total
- Mapped to phases: 13
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-23*
*Last updated: 2026-03-23 — traceability filled after roadmap creation*
