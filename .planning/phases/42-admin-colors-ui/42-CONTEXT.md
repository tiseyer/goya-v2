# Phase 42: Admin Colors UI - Context

**Gathered:** 2026-04-01
**Status:** Ready for planning

<domain>
## Phase Boundary

Admins can view, edit, preview, save, and reset all brand colors, role colors, and the maintenance indicator color from a dedicated Colors tab in Admin Settings.

Requirements: UI-01, UI-02, UI-03, BRAND-01, BRAND-02, BRAND-03, BRAND-04, ROLE-01, ROLE-02, MAINT-01, INFRA-03, INFRA-04, INFRA-05

</domain>

<decisions>
## Implementation Decisions

### Page Structure
- Colors is a new tab in /admin/settings (matches System, Maintenance pattern)
- Stacked vertical sections with section headers (matches Maintenance tab layout)
- Color picker uses native HTML `<input type="color">` + hex text input side by side

### Interaction Design
- Instant preview: client component updates `document.documentElement.style.setProperty()` on every change
- Single "Save All" button at top-right of page (saves all 3 sections at once)
- Per-color "↺" icon button for individual reset + global "Reset All" button at page bottom

### Sidebar & Navigation
- "Colors" appears in admin sidebar under Settings group, between System and Flows
- Default role colors: Student=#3B82F6 (blue), Teacher=#10B981 (emerald), Wellness=#8B5CF6 (violet), School=#F97316 (orange), Moderator=#6366F1 (indigo), Admin=#EF4444 (red)

### Claude's Discretion
- Internal component structure (how many sub-components)
- Server action naming and error handling patterns
- How to read existing colors from site_settings on page load

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `lib/theme/defaults.ts` — DEFAULT_BRAND_COLORS, DEFAULT_ROLE_COLORS, DEFAULT_MAINTENANCE_COLOR, CSS variable name maps
- `lib/theme/types.ts` — BrandColors, RoleColors interfaces
- `app/components/ThemeColorProvider.tsx` — server component reading from site_settings (Phase 41)
- `app/admin/settings/components/MaintenanceTab.tsx` — reference for tab pattern and settings layout
- `app/admin/settings/page.tsx` — tab bar with pill-style buttons

### Established Patterns
- Settings page uses pill-style tab bar (bg-slate-100 rounded-lg)
- site_settings upserted via server actions with getSupabaseService()
- Admin sidebar in AdminShell.tsx with Settings group children

### Integration Points
- app/admin/settings/page.tsx — add "Colors" tab
- app/admin/components/AdminShell.tsx — add "Colors" child to Settings group
- site_settings table — new JSON keys: brand_colors, role_colors, maintenance_indicator_color

</code_context>

<specifics>
## Specific Ideas

- Each color row: label on left, color picker + hex input + swatch preview on right, reset icon button
- Section headers match existing settings style (text-lg font-semibold)
- Brand colors section: Primary Blue, Accent Red, Background, Surface, Border, Text Foreground
- Role colors section: Student, Teacher, Wellness Practitioner, School, Moderator, Admin
- Maintenance section: single color picker for maintenance indicator
- "Save All" button uses primary button style
- "Reset All" button uses destructive/outline style at page bottom

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
