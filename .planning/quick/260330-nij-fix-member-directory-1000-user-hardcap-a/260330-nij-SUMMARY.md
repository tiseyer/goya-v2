# Quick Task 260330-nij: Summary

## Task
Fix member directory 1000-user hardcap and restore designation/style filter UI

## Changes

### Bug 1: 1000-user hardcap (lib/members-actions.ts)
- **Root cause:** Supabase PostgREST has a default row limit of 1000. The query had no `.limit()` or `.range()`, so it silently returned only the first 1000 rows.
- **Fix:** Implemented paginated fetching using `.range()` in a loop, fetching 1000 rows per batch until all rows are retrieved. This supports all ~5,800 members.

### Bug 2: Empty Designation and Style filters (lib/members-actions.ts)
- **Root cause:** With only 1000 members loaded, the unique designation/style arrays were either empty or very sparse (most of the first 1000 users by creation date didn't have these fields populated). The `ChipGroup` component correctly renders chips but had nothing to display.
- **Fix:** With all members now loaded, the designation and style arrays populate correctly. Additionally added `.filter(Boolean)` to strip empty strings from designation and teaching style arrays at both the member-level and the aggregate-level, preventing blank filter chips.

## Files Changed
- `lib/members-actions.ts` — Paginated Supabase query + empty string filtering

## Verification
- `npx tsc --noEmit` — No errors in changed files (pre-existing errors in unrelated files)
