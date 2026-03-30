---
phase: 03-admin-flow-builder-ui
plan: "03"
subsystem: flow-builder
tags: [admin-ui, element-editor, branching, profile-mapping, zustand]
dependency_graph:
  requires: [03-02]
  provides: [element-properties-panel, branch-configurator, profile-field-mapper]
  affects: [lib/flows/editor-store.ts, ElementPropertiesPanel, BranchConfigurator, ProfileFieldMapper, ElementCard, FlowEditorShell]
tech_stack:
  added: []
  patterns: [zustand-store-extension, discriminated-union-update, branch-cycle-detection]
key_files:
  created:
    - app/admin/flows/components/editor/ElementPropertiesPanel.tsx
    - app/admin/flows/components/editor/ProfileFieldMapper.tsx
    - app/admin/flows/components/editor/BranchConfigurator.tsx
  modified:
    - lib/flows/editor-store.ts
    - lib/flows/types.ts
    - app/admin/flows/components/editor/ElementCard.tsx
    - app/admin/flows/components/editor/FlowEditorShell.tsx
decisions:
  - "FlowElementChoiceOption exported from types.ts to enable type-safe OptionsEditor in panel"
  - "BranchConfigurator uses local branchMap state, only persists to server via Save Branches button (no auto-save) to avoid partial saves during option editing"
  - "Profile mappings stored in editor store (profileMappings: Record<string, string>) — wired to step-level actions in Plan 04"
  - "updateElement uses spread merge over FlowElement discriminated union — TypeScript satisfied via cast, avoiding per-type if/switch"
metrics:
  duration: "~15min"
  completed: "2026-03-30"
  tasks_completed: 2
  files_created: 3
  files_modified: 4
---

# Phase 03 Plan 03: Element Properties Panel and Branch Configurator Summary

Right panel fully functional: clicking any element opens its property editor; single_choice elements show branching configuration with per-option target step selection and cycle detection.

## What Was Built

### Task 1: Element Properties Panel with Profile Field Mapping

**Editor store extensions** (`lib/flows/editor-store.ts`):
- `selectedElementKey: string | null` — tracks which element is selected
- `selectElement(elementKey)` — sets selection (clears on step change)
- `updateElement(stepId, elementKey, updates)` — merges partial updates into element, sets isDirty
- `updateStepBranches(stepId, branches)` — replaces step's branches array
- `profileMappings: Record<string, string>` — elementKey -> profile column name
- `setProfileMapping(elementKey, field)` — add/remove profile mapping

**ElementCard.tsx** — click body selects element; visual state `ring-2 ring-primary/20` when selected

**ElementPropertiesPanel.tsx** — full right-panel property editor:
- Type badge (read-only)
- Common fields: `element_key` (monospace), `label`, `required` (hidden for display-only types), `help_text`
- Type-specific editors: `info_text` content textarea; choice options editor (label+value per row, move up/down, delete, add); `image` src+alt; `video` url
- Profile field mapper shown for input types

**ProfileFieldMapper.tsx** — select dropdown mapping 11 profile columns; stores mapping in editor store

**FlowEditorShell.tsx** — right panel: renders `ElementPropertiesPanel` with header when element selected, placeholder text when none

### Task 2: Branch Configurator for Single Choice Elements

**BranchConfigurator.tsx**:
- Enable/disable toggle (disabling clears all branch mappings)
- Per-option rows: option label -> ArrowRight -> target step dropdown ("Continue to next step" or any step except current)
- Save Branches button: PUT `/api/admin/flows/{flowId}/steps/{stepId}/branches`
- 422 cycle detection: shows red error `"Cannot save: branch creates a cycle through steps: A -> B -> C"`
- On success: calls `updateStepBranches` to sync store

**ElementPropertiesPanel.tsx** — BranchConfigurator rendered below options editor for `single_choice` only, passing current step's branches and all steps

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Export] Export FlowElementChoiceOption from types.ts**
- **Found during:** Task 1
- **Issue:** `FlowElementChoiceOption` interface was not exported from `lib/flows/types.ts` but needed by `ElementPropertiesPanel.tsx` for OptionsEditor props typing
- **Fix:** Added `export` keyword to the interface declaration
- **Files modified:** `lib/flows/types.ts`
- **Commit:** 20e0832

## Known Stubs

- `profileMappings` in editor store is populated but not yet persisted to the database or wired to step-level actions. This is intentional — Plan 04 (actions engine) will wire profile mappings to `save_to_profile` step actions.

## Self-Check: PASSED
