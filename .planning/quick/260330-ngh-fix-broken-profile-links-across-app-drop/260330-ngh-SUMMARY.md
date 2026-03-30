---
phase: quick
plan: 260330-ngh
type: summary
completed: "2026-03-30"
duration: 8min
tasks_completed: 2
tasks_total: 2
files_modified: 1
commits:
  - hash: ceddbd1
    message: "fix(260330-ngh): use service role client on /members/[id] to prevent RLS false 404"
---

# Quick Task 260330-ngh: Fix Broken Profile Links Summary

**One-liner:** Replaced anon-key Supabase client with service role client on the member profile page to prevent JWT-expiry-induced RLS false 404s.

## What Was Done

All profile links across the app (`/members/{id}`) were returning 404 errors. The root cause was the `createSupabaseServerClient()` using the anon key with a no-op `setAll` — meaning expired JWTs could not be refreshed, causing the client to operate as the `anon` role. The RLS policy on `profiles` only allows SELECT for `authenticated` role, so the query returned null and triggered `notFound()`.

### Fix Applied

`app/members/[id]/page.tsx` now uses `getSupabaseService()` (service role) for the profile data query instead of the anon-key session client. The middleware already enforces authentication for `/members/*` routes, so using the service role here is appropriate — there is no security concern.

## Tasks

| # | Task | Status | Commit |
|---|------|--------|--------|
| 1 | Diagnose and fix 404 root cause on /members/[id] | Done | ceddbd1 |
| 2 | Verify all profile link sources produce valid URLs | Done | — (no changes needed) |

## Deviations

**[Rule 1 - Bug] Fixed TypeScript TS18048 on nullable array length check**
- Found during: Task 1 (TypeScript verification)
- Issue: `profile.teaching_styles?.length > 0` — TypeScript flags `undefined > 0` as potentially unsafe when LHS is `null | undefined`
- Fix: Changed to `(profile.teaching_styles?.length ?? 0) > 0` pattern
- Files modified: `app/members/[id]/page.tsx` (same file, same commit)

## Task 2 Findings

All profile link sources verified as correctly guarded:
- `Header.tsx:334` — `userId ? \`/members/${userId}\` : '#'`
- `Header.tsx:784` — guarded with ternary on profile?.id
- `members/page.tsx:187` — `member.id` always a UUID from profiles query

No changes needed for link sources.

## Self-Check

- [x] `app/members/[id]/page.tsx` exists and modified
- [x] Commit ceddbd1 exists
- [x] No TypeScript errors in modified file
