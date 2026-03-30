---
phase: 03-admin-flow-builder-ui
plan: "04"
subsystem: flow-builder
tags: [admin-ui, flow-editor, step-actions, conditions, preview]
dependency_graph:
  requires: [03-03]
  provides: [complete-admin-flow-builder-ui]
  affects: [FlowEditorShell, editor-store]
tech_stack:
  added: []
  patterns: [zustand-store-extension, chip-based-conditions, collapsible-panel, preview-overlay]
key_files:
  created:
    - app/admin/flows/components/editor/StepActionsEditor.tsx
    - app/admin/flows/components/editor/FlowSettingsPanel.tsx
    - app/admin/flows/components/editor/ConditionsBuilder.tsx
    - app/admin/flows/components/editor/FlowPreviewModal.tsx
  modified:
    - lib/flows/editor-store.ts
    - app/admin/flows/components/editor/FlowEditorShell.tsx
decisions:
  - "AlignTop/AlignBottom not in lucide-react — used PanelTop/PanelBottom icons instead"
  - "Step actions stored in editor store as stepActions[stepId] map — UI scaffold only, no DB persistence until flow_steps gets actions column"
metrics:
  duration: 6min
  completed_date: "2026-03-30"
  tasks_completed: 2
  tasks_total: 3
  files_created: 4
  files_modified: 2
requirements: [ADMIN-12, ADMIN-13, ADMIN-14, ADMIN-15]
---

# Phase 03 Plan 04: Step Actions, Settings Panel, Conditions Builder, Preview Mode Summary

**One-liner:** Chip-based conditions builder, collapsible flow settings panel, 8-type step actions editor, and in-editor preview overlay with all 5 display types and PREVIEW MODE watermark.

## Tasks Completed

| Task | Name | Commit | Status |
|------|------|--------|--------|
| 1 | Step actions editor, flow settings panel, conditions builder | 91179b7 | Complete |
| 2 | Flow preview modal with display types + step navigation | e2e48c0 | Complete |
| 3 | Human verification of complete flow builder UI | — | AWAITING CHECKPOINT |

## What Was Built

### StepActionsEditor.tsx
- 8 action types: `save_to_profile`, `send_email`, `kit_tag`, `stripe_checkout`, `redirect`, `trigger_flow`, `success_popup`, `mark_complete`
- Each action has a type-specific config form with appropriate fields
- `save_to_profile` shows read-only profile mappings summary (sourced from element ProfileFieldMapper)
- Actions stored in `editor-store.stepActions[stepId]` — UI scaffold, not yet persisted to DB
- "Add Action" dropdown button, colored type badges, X to delete

### FlowSettingsPanel.tsx
- Collapsible panel above the three-panel grid (collapsed by default)
- Collapsed state shows summary: Display Type · Trigger · Frequency · Status badge
- Expanded: display type radio buttons (with lucide icons), status select, modal-specific options (dismissible + backdrop), trigger select, frequency select, delay seconds (page_load only)
- Conditions section renders ConditionsBuilder
- "Save Settings" button PATCH `/api/admin/flows/[id]`
- State toggled via `settingsPanelOpen` / `toggleSettingsPanel` in editor store

### ConditionsBuilder.tsx
- Chip-based AND logic: each condition rendered as `bg-blue-50 text-blue-700` rounded-full chip with X
- "AND" text between chips (text-xs text-slate-400 uppercase)
- Add Condition form: 2-step flow (pick type → configure operator + value)
- All 6 condition types supported: `role` (multi-select), `onboarding_status`, `has_profile_picture`, `subscription_status`, `birthday` (no value), `flow_completed` (flow_id input)

### FlowPreviewModal.tsx
- 5 display types handled: modal, fullscreen, top_banner, bottom_banner, notification
- "PREVIEW MODE" watermark on all types (semi-transparent rotated text)
- Modal: respects `modal_dismissible` and `modal_backdrop` (blur/dark/none)
- Fullscreen: full viewport, max-w-2xl content container
- Banner: fixed bar (top or bottom) with text + CTA + X
- Notification: fixed top-right card
- Multi-step navigation: progress bar, Back/Next/Complete buttons, bounded by steps.length
- Escape key closes preview
- Exit Preview button fixed in content area

### Editor Store Extensions
- `stepActions: Record<string, StepAction[]>` + CRUD actions
- `settingsPanelOpen: boolean` + `toggleSettingsPanel`
- `isPreviewOpen`, `previewStepIndex`, `openPreview`, `closePreview`, `previewNext`, `previewBack`
- `StepActionType` and `StepAction` types exported from store

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] lucide-react AlignTop/AlignBottom icons don't exist**
- **Found during:** Task 1 TypeScript compilation
- **Issue:** `AlignTop` and `AlignBottom` are not exported from lucide-react
- **Fix:** Replaced with `PanelTop` and `PanelBottom` which convey the same meaning
- **Files modified:** app/admin/flows/components/editor/FlowSettingsPanel.tsx
- **Commit:** 91179b7

## Checkpoint: Human Verification Required

**Task 3** is a `checkpoint:human-verify` gate. The orchestrator will present verification steps to the user.

**What to verify:**
1. Navigate to `/admin/flows`, create a new flow, open the editor
2. Verify "Flow Settings" collapsible panel appears above the editor
3. Expand it — verify display type buttons, trigger, frequency, modal options, conditions
4. Add a condition chip (e.g., Role is Student) — verify chip appears with X to remove
5. Click "Preview" — verify PREVIEW MODE watermark and correct display type rendering
6. Navigate through preview steps with back/next
7. In the right panel, scroll below element properties — verify Step Actions section with "Add Action" button
8. Add a step action and configure it

## Known Stubs

- **stepActions** in editor store are not persisted to database — `flow_steps` table has no `actions` column. This is an intentional UI scaffold per plan spec ("these will be persisted when the step actions column is added"). Future plan (schema migration) will add the column and wire persistence.

## Self-Check: PASSED
