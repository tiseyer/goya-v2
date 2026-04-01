# Quick Task 260330-nij: Fix member directory 1000-user hardcap and restore designation/style filter UI

## Task 1: Fix Supabase 1000-row default limit in fetchMembers

**Files:** `lib/members-actions.ts`
**Action:** The Supabase PostgREST API has a default limit of 1000 rows. The query fetches all profiles with `onboarding_completed = true` but gets truncated. Implement paginated fetching using `.range()` to loop through all rows in batches of 1000 until all are retrieved.
**Verify:** TypeScript compiles, all ~5800 members returned
**Done:** `fetchMembers()` returns all members, not just first 1000

## Task 2: Ensure Designation and Style filter options populate correctly

**Files:** `app/members/page.tsx`, `lib/members-actions.ts`
**Action:** The ChipGroup components for Designation and Style are correctly wired (lines 431-432) but receive empty arrays if no members in the first 1000 have those fields set. With Bug 1 fixed, more data flows through. Additionally, filter empty strings from the designation/style arrays so blank entries don't appear as filter chips.
**Verify:** Filter chips render for Designation and Style sections
**Done:** Both filter sections show clickable chip options

## Task 3: TypeScript check

**Files:** All
**Action:** Run `npx tsc --noEmit` to verify no type errors
**Verify:** Clean compilation
**Done:** No TypeScript errors
