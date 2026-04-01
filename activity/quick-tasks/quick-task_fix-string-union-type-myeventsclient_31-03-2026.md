# Quick Task: Fix string→union type errors in MyEventsClient

**Status:** Complete
**Date:** 2026-03-31

## Task

Fix TypeScript build error where `e.target.value` (string) was passed to `setCategory` and `setFormat` which expect `EventCategory` and `EventFormat` union types.

## Solution

- Added explicit `useState<EventCategory>` and `useState<EventFormat>` generics
- Cast `e.target.value` to the correct union types at the `<select>` onChange handlers
- Scanned entire file for similar patterns — only these two instances found
- `npx tsc --noEmit` passes
