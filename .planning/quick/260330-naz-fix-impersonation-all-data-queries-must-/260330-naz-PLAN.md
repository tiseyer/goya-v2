---
phase: quick
plan: 260330-naz
type: execute
wave: 1
depends_on: []
files_modified:
  - app/dashboard/page.tsx
  - app/teaching-hours/page.tsx
  - app/profile/settings/page.tsx
  - app/settings/page.tsx
  - app/messages/page.tsx
  - app/credits/page.tsx
  - app/community/page.tsx
  - app/upgrade/page.tsx
  - app/schools/create/page.tsx
  - app/members/[id]/page.tsx
  - app/api/avatar/route.ts
  - app/api/flows/active/route.ts
autonomous: true
must_haves:
  truths:
    - "When admin impersonates a user, all user-facing pages show the impersonated user's data"
    - "When not impersonating, all pages continue to show the logged-in user's own data"
    - "Admin dashboard page still shows admin's own greeting and stats (not impersonated)"
  artifacts:
    - path: "app/dashboard/page.tsx"
      provides: "User dashboard using getEffectiveUserId/getEffectiveClient"
    - path: "app/api/avatar/route.ts"
      provides: "Avatar route using getEffectiveUserId"
    - path: "app/api/flows/active/route.ts"
      provides: "Flow route using getEffectiveUserId"
  key_links:
    - from: "all user-facing pages"
      to: "lib/supabase/getEffectiveUserId.ts"
      via: "import { getEffectiveUserId, getEffectiveClient }"
      pattern: "getEffectiveUserId|getEffectiveClient"
---

<objective>
Fix impersonation across all user-facing pages and API routes. Currently, Server Components and API routes call `supabase.auth.getUser()` and use `user.id` directly, so impersonation always shows the admin's own data instead of the impersonated user's data. Replace with `getEffectiveUserId()` and `getEffectiveClient()` from `lib/supabase/getEffectiveUserId.ts`.

Purpose: Make admin impersonation actually work end-to-end so admins can see exactly what a member sees.
Output: All 10 user-facing pages + 2 API routes respect impersonation cookie.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@lib/supabase/getEffectiveUserId.ts
@lib/supabaseServer.ts
@app/actions/impersonation.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix all user-facing Server Components to use getEffectiveUserId/getEffectiveClient</name>
  <files>
    app/dashboard/page.tsx
    app/teaching-hours/page.tsx
    app/profile/settings/page.tsx
    app/settings/page.tsx
    app/messages/page.tsx
    app/credits/page.tsx
    app/community/page.tsx
    app/upgrade/page.tsx
    app/schools/create/page.tsx
    app/members/[id]/page.tsx
  </files>
  <action>
For each of the 10 user-facing Server Component pages listed above, apply this transformation:

1. Add import: `import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId'`
2. Replace the pattern where `createSupabaseServerClient()` is used to get a client AND `supabase.auth.getUser()` is called to get `user.id`:
   - Replace the user ID source: use `const userId = await getEffectiveUserId()` instead of extracting `user.id` from `supabase.auth.getUser()`
   - Replace the Supabase client: use `const client = await getEffectiveClient()` instead of `createSupabaseServerClient()` for data queries
   - Update all subsequent references from `user.id` or `user!.id` to `userId`, and from `supabase` to `client` for data fetches
3. If the page still needs the real auth user for auth checks (redirect if not logged in), keep the `supabase.auth.getUser()` call for the auth guard, but use `userId` and `client` for all data queries.
4. Remove unused imports of `createSupabaseServerClient` if fully replaced.

IMPORTANT EXCEPTIONS:
- Do NOT touch `app/admin/dashboard/page.tsx` — admin dashboard must always show admin's own data/stats
- For `app/schools/create/page.tsx` — if it only checks auth (not fetching user-specific data), only replace the user ID used in any data operations, keep auth check as-is
- For `app/members/[id]/page.tsx` — the page shows another member's profile, but may use `user.id` to check if the viewer is connected to that member. Replace that viewer ID with `getEffectiveUserId()` so the impersonated user's connections are checked.

Each file follows the same mechanical pattern. Read each file first, identify where `user.id` is used in data queries, and apply the substitution.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && grep -rn "user\.id\|user!\.id" app/dashboard/page.tsx app/teaching-hours/page.tsx app/profile/settings/page.tsx app/settings/page.tsx app/messages/page.tsx app/credits/page.tsx app/community/page.tsx app/upgrade/page.tsx app/schools/create/page.tsx app/members/\[id\]/page.tsx 2>/dev/null | grep -v "// auth" | grep -v "getUser" || echo "PASS: No direct user.id references in data queries"</automated>
  </verify>
  <done>All 10 user-facing pages use getEffectiveUserId() for data queries. No direct user.id references remain in data-fetching code. Auth guards may still use getUser() but data queries use the effective user ID.</done>
</task>

<task type="auto">
  <name>Task 2: Fix API routes to use getEffectiveUserId/getEffectiveClient</name>
  <files>
    app/api/avatar/route.ts
    app/api/flows/active/route.ts
  </files>
  <action>
Apply the same impersonation fix to both API routes:

**app/api/avatar/route.ts:**
1. Add import: `import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId'`
2. Replace `user.id` used in storage paths with `await getEffectiveUserId()`
3. Replace the Supabase client used for storage operations with `await getEffectiveClient()`
4. Keep auth guard (must be logged in) but use effective user ID for the actual avatar storage path

**app/api/flows/active/route.ts:**
1. Add import: `import { getEffectiveUserId } from '@/lib/supabase/getEffectiveUserId'`
2. Replace `user.id` passed to the flow engine with `await getEffectiveUserId()`
3. Use effective client if needed for data queries

After fixing both files, run the TypeScript compiler to check for type errors across all modified files.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit --pretty 2>&1 | head -50</automated>
  </verify>
  <done>Both API routes use getEffectiveUserId() instead of user.id. TypeScript compiles without errors. Avatar uploads and flow engine respect impersonation.</done>
</task>

</tasks>

<verification>
1. `grep -rn "getEffectiveUserId\|getEffectiveClient" app/dashboard/ app/teaching-hours/ app/profile/ app/settings/ app/messages/ app/credits/ app/community/ app/upgrade/ app/schools/ app/members/ app/api/avatar/ app/api/flows/active/` — all 12 files should show imports
2. `npx tsc --noEmit` — no type errors
3. Manual: Log in as admin, impersonate a user, visit /dashboard — should show impersonated user's name and data
</verification>

<success_criteria>
- All 10 user-facing Server Component pages import and use getEffectiveUserId/getEffectiveClient for data queries
- Both API routes (avatar, flows/active) use getEffectiveUserId for user identification
- Admin dashboard (app/admin/dashboard/page.tsx) is NOT modified — still shows admin's own data
- TypeScript compiles cleanly
- No regressions in non-impersonation mode (pages still work normally when not impersonating)
</success_criteria>

<output>
After completion, create `.planning/quick/260330-naz-fix-impersonation-all-data-queries-must-/260330-naz-SUMMARY.md`
Also create `activity/quick-tasks/quick-task_fix-impersonation-all-data-queries_30-03-2026.md`
</output>
