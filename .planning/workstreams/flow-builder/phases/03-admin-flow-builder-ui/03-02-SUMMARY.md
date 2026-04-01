---
phase: 03-admin-flow-builder-ui
plan: "02"
subsystem: flow-builder
tags: [admin-ui, flows, zustand, drag-and-drop, editor]
dependency_graph:
  requires: [03-01]
  provides: [flow-editor-page, zustand-editor-store, step-sidebar, element-canvas, element-type-picker]
  affects: [admin-shell, app/admin/flows, lib/flows]
tech_stack:
  added: [zustand@5.0.12]
  patterns: [zustand-client-store, dnd-kit-sortable-elements, debounced-auto-save, three-panel-css-grid]
key_files:
  created:
    - lib/flows/editor-store.ts
    - app/admin/flows/[id]/edit/page.tsx
    - app/admin/flows/components/editor/FlowEditorShell.tsx
    - app/admin/flows/components/editor/StepListSidebar.tsx
    - app/admin/flows/components/editor/StepCanvas.tsx
    - app/admin/flows/components/editor/ElementTypePicker.tsx
    - app/admin/flows/components/editor/ElementCard.tsx
  modified: []
key_decisions:
  - "Tasks 1 and 2 implemented together in one commit — StepCanvas/ElementTypePicker/ElementCard were required to compile FlowEditorShell, so no separate Task 2 commit was possible"
  - "Zustand store initializeFlow uses explicit property spread instead of spread-all to satisfy TypeScript strict mode with discriminated union FlowElement type"
  - "StepCanvas schedules auto-save via useRef<ReturnType<typeof setTimeout>> to avoid stale-closure issues with the timer across re-renders"
  - "zustand installed as dependency (not devDependency) since it's used at runtime by client components"

patterns-established:
  - "useEditorStore: single Zustand store consumed by all editor panels — no prop drilling across the three-panel layout"
  - "Debounced auto-save: useRef timer cleared on each change, fires 2s after last change, sets isSaving true/false around the PATCH call"
  - "ElementTypePicker: absolute-positioned popover with useEffect document.addEventListener for outside-click close"

requirements-completed: [ADMIN-05, ADMIN-06, ADMIN-07, ADMIN-08]

duration: 18min
completed: 2026-03-27
---

# Phase 03 Plan 02: Flow Editor Shell Summary

**Three-panel flow editor with Zustand state, dnd-kit step reorder, 9-type element picker, and 2-second debounced auto-save to the API.**

## Performance

- **Duration:** 18 min
- **Started:** 2026-03-27T00:00:00Z
- **Completed:** 2026-03-27T00:18:00Z
- **Tasks:** 2 (executed together)
- **Files modified:** 7 created

## Accomplishments

- **`lib/flows/editor-store.ts`** — Zustand store with `flow`, `steps`, `selectedStepId`, `isDirty`, `isSaving` state. Actions: `initializeFlow`, `selectStep`, `addStep`, `removeStep`, `reorderSteps`, `updateStepElements`, `updateStepTitle`, `updateFlow`, `setDirty`, `setSaving`.
- **`/admin/flows/[id]/edit/page.tsx`** — Server component with async params pattern. Calls `getFlowWithSteps(id)`, redirects to `/admin/flows` if not found. Passes `FlowWithSteps` to `FlowEditorShell`.
- **`FlowEditorShell.tsx`** — `'use client'` shell. Mounts with `initializeFlow`. Three-panel CSS grid: 280px step sidebar | 1fr canvas | 320px settings placeholder. Top bar: flow name, save status (`Saved` / `Saving...` / `Unsaved changes`), back button. `beforeunload` guard fires when `isDirty=true`.
- **`StepListSidebar.tsx`** — dnd-kit `SortableContext` + `verticalListSortingStrategy` for step drag-reorder. Each step shows drag grip, title or `Step {position}` fallback, element count, delete button on hover. Add Step button POSTs to API. Delete button sends DELETE with confirm dialog.
- **`StepCanvas.tsx`** — Reads selected step from store. Editable title input (PATCH on blur). dnd-kit sortable element list. 2-second debounced auto-save on element changes. Empty state + "Add Element" button opens `ElementTypePicker`.
- **`ElementTypePicker.tsx`** — 3-column popover grid with all 9 element types and Lucide icons. Outside-click closes via `useEffect` + `document.addEventListener`.
- **`ElementCard.tsx`** — Sortable card with drag grip, colored type badge, `element_key` in monospace, delete button on hover. Shows content/options preview where applicable.

## Decisions Made

1. **Tasks 1 and 2 combined into one commit** — `StepCanvas`, `ElementTypePicker`, and `ElementCard` were imported by `FlowEditorShell` (Task 1), so TypeScript would not compile without them. Both tasks implemented in one pass.
2. **`initializeFlow` uses explicit property spread** — strict TypeScript requires explicit `Flow` shape extraction from `FlowWithSteps` to avoid union type bleed.
3. **Auto-save uses `useRef<ReturnType<typeof setTimeout>>`** — prevents stale closure issue where a plain variable would be re-initialized on re-render and never cleared.
4. **zustand added as runtime dependency** — it's consumed by `'use client'` components at runtime, not a devDependency.

## Deviations from Plan

### Auto-fixed Issues

None.

### Structural Notes

**[Note] Tasks 1 and 2 executed together (single commit)**
- **Reason:** `FlowEditorShell.tsx` imports `StepCanvas`, which imports `ElementTypePicker` and `ElementCard`. Creating the shell without the canvas would fail TypeScript compilation, so all components were built together.
- **Impact:** No behavioral change; all acceptance criteria for both tasks pass. One combined commit instead of two separate commits.
- **Commit:** `8c23cec`

## Known Stubs

- **Right panel (Settings)** — `/admin/flows/components/editor/FlowEditorShell.tsx` line ~80: placeholder div "Settings — coming in Plan 03/04". Intentional per plan spec; Plan 03/03 and 03/04 will implement branch config and flow settings in this panel.

## Self-Check: PASSED
