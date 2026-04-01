# Quick Task 260331-l3g: Fix unknown→ReactNode Type Error

## Result: DONE

### What Changed
- **File:** `app/admin/events/[id]/edit/page.tsx` (lines 140-162)
- **Problem:** `(entry.changes as Record<string, unknown>).old_status` used directly in JSX conditional — `unknown` is not assignable to `ReactNode`
- **Fix:** Extracted typed variables via `String()` coercion before JSX:
  - `oldStatus`, `newStatus`, `rejectionReason` — all `string | null`
  - Used IIFE pattern `(() => { ... })()` to scope the variables within the JSX block
  - No `unknown` values ever reach JSX rendering

### Verification
- `npx tsc --noEmit` passes (zero errors on this file)
- Only pre-existing `linkify-it 2` / `mdurl 2` type definition warnings remain (unrelated)
