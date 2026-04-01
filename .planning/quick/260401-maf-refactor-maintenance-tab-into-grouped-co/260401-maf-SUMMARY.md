# Quick Task 260401-maf: Refactor maintenance tab into grouped content boxes

**Completed:** 2026-04-01
**Status:** Complete

## What Changed

Consolidated 7 separate content boxes in the Maintenance tab into 4 grouped boxes:

1. **Box 1: Maintenance Mode** — Site maintenance toggle + message + schedule + chatbot maintenance (was 2 separate boxes). One shared Save button.
2. **Box 2: Sandboxes** — Email Sandbox + Flows Sandbox + Credit Hours Sandbox (was 3 separate boxes). Combined status badge showing active count. One shared Save button.
3. **Box 3: Theme Lock** — Unchanged content, same card style.
4. **Box 4: Page Visibility** — Unchanged content, same card style.

## Implementation

- Added `saveBox1()` combined save function (maintenance mode + chatbot)
- Added `saveBox2()` combined save function (all 3 sandboxes)
- Added `sandboxActiveCount` computed value for Sandboxes header badge
- Restructured JSX render to group related controls into shared cards with dividers
- All existing state, save logic, audit logging, and toast messages preserved unchanged

## Files Changed

- `app/admin/settings/components/MaintenanceTab.tsx` — Layout refactor only

## Self-Check

- [x] TypeScript clean (`npx tsc --noEmit`)
- [x] 4 content boxes instead of 7
- [x] Box 1 has maintenance mode + chatbot with one save
- [x] Box 2 has all 3 sandboxes with combined status badge and one save
- [x] Box 3 (Theme Lock) unchanged
- [x] Box 4 (Page Visibility) unchanged
- [x] All functionality preserved — no logic changes
