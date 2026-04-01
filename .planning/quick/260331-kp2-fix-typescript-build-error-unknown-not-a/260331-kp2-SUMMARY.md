---
quick_id: 260331-kp2
description: "Fix TypeScript build error: unknown not assignable to ReactNode in events edit page"
status: complete
date: 2026-03-31
---

# Summary

Fixed TypeScript build error `Type 'unknown' is not assignable to type 'ReactNode'` in `app/admin/events/[id]/edit/page.tsx`.

## Changes

- **Line 142:** Added `!!` to `(entry.changes as Record<string, unknown>).old_status` — converts `unknown` to `boolean` so the `&&` short-circuit evaluates to `false` (valid ReactNode) instead of `unknown` (invalid).
- **Line 150:** Same fix for `.rejection_reason` condition.

## Root Cause

JSX `&&` patterns like `{unknownValue && <Element />}` fail TypeScript because when the left operand is falsy, the expression evaluates to the left operand's type. With `unknown`, that produces `unknown | ReactNode`, which is not assignable to `ReactNode`. The `!!` prefix coerces to `boolean`, which is a valid ReactNode type.
