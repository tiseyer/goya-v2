# Quick Task: Fix TypeScript unknown→ReactNode build error

**Date:** 2026-03-31
**Status:** Complete
**File:** `app/admin/events/[id]/edit/page.tsx`

## Description

Fixed TypeScript build error `Type 'unknown' is not assignable to type 'ReactNode'` at lines 142 and 150 in the events edit page audit history section.

## Solution

Added `!!` boolean coercion prefix to two JSX `&&` short-circuit patterns where `Record<string, unknown>` values were used as conditions. Without `!!`, a falsy left operand would evaluate to `unknown` (not valid as ReactNode). With `!!`, it evaluates to `false` (valid ReactNode).

**Lines changed:** 142, 150
