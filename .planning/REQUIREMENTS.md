# Requirements: GOYA v2

**Defined:** 2026-04-01
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.16 Requirements

Requirements for Admin Color Settings milestone. Each maps to roadmap phases.

### Brand Colors

- [ ] **BRAND-01**: Admin can view and edit Primary Blue color via color picker with hex input and preview swatch
- [ ] **BRAND-02**: Admin can view and edit Accent Red color via color picker with hex input and preview swatch
- [ ] **BRAND-03**: Admin can view and edit Background, Surface, Border, and Text Foreground colors
- [ ] **BRAND-04**: Admin can reset any individual brand color to its default value
- [ ] **BRAND-05**: Brand color changes are persisted to site_settings as JSON key "brand_colors"

### Role Colors

- [ ] **ROLE-01**: Admin can view and edit colors for all 6 roles (Student, Teacher, Wellness Practitioner, School, Moderator, Admin)
- [ ] **ROLE-02**: Admin can reset any individual role color to its default value
- [ ] **ROLE-03**: Role color changes are persisted to site_settings as JSON key "role_colors"

### Maintenance Indicator

- [ ] **MAINT-01**: Admin can view and edit the maintenance indicator color with default amber (#F59E0B)
- [ ] **MAINT-02**: Maintenance indicator color is persisted to site_settings as key "maintenance_indicator_color"

### Color Infrastructure

- [ ] **INFRA-01**: ThemeProvider component reads brand_colors and role_colors from site_settings and injects CSS variables on the html element
- [ ] **INFRA-02**: ThemeProvider wraps the app in layout.tsx so colors apply globally
- [ ] **INFRA-03**: Color changes preview instantly in the admin UI before saving (CSS vars update on change)
- [ ] **INFRA-04**: "Save" button persists all changes to site_settings
- [ ] **INFRA-05**: "Reset All" button resets all colors to defaults

### Admin UI

- [ ] **UI-01**: Colors settings page accessible at /admin/settings with "Colors" tab
- [ ] **UI-02**: Page has 3 sections: Brand Colors, Role Colors, Maintenance Indicator
- [ ] **UI-03**: "Colors" appears in admin sidebar under Settings group

## Future Requirements

### Color Enhancements (deferred)

- **CLR-F01**: Dark mode toggle with separate dark color palette
- **CLR-F02**: Color scheme presets (e.g., "Ocean", "Earth", "Sunset")
- **CLR-F03**: Per-school brand color overrides
- **CLR-F04**: Color accessibility contrast checker (WCAG AA/AAA)

## Out of Scope

| Feature | Reason |
|---------|--------|
| Dark mode | Separate feature — v1.16 focuses on admin-configurable brand/role colors only |
| Per-school colors | School-level theming is a larger feature, deferred |
| Color presets/themes | Keep it simple — manual hex input for now |
| Accessibility checker | Nice-to-have, not blocking for color configuration |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BRAND-01 | Phase 42 | Pending |
| BRAND-02 | Phase 42 | Pending |
| BRAND-03 | Phase 42 | Pending |
| BRAND-04 | Phase 42 | Pending |
| BRAND-05 | Phase 41 | Pending |
| ROLE-01 | Phase 42 | Pending |
| ROLE-02 | Phase 42 | Pending |
| ROLE-03 | Phase 41 | Pending |
| MAINT-01 | Phase 42 | Pending |
| MAINT-02 | Phase 41 | Pending |
| INFRA-01 | Phase 41 | Pending |
| INFRA-02 | Phase 41 | Pending |
| INFRA-03 | Phase 42 | Pending |
| INFRA-04 | Phase 42 | Pending |
| INFRA-05 | Phase 42 | Pending |
| UI-01 | Phase 42 | Pending |
| UI-02 | Phase 42 | Pending |
| UI-03 | Phase 42 | Pending |

**Coverage:**
- v1.16 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0

---
*Requirements defined: 2026-04-01*
*Last updated: 2026-04-01*
