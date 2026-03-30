---
phase: quick
plan: 260330-ngh
type: execute
wave: 1
depends_on: []
files_modified:
  - app/members/[id]/page.tsx
  - app/components/Header.tsx
  - app/messages/page.tsx
  - app/members/page.tsx
autonomous: true
must_haves:
  truths:
    - "Clicking 'My Profile' in the dropdown nav navigates to /members/{userId} and shows the profile page (not 404)"
    - "Clicking 'View Profile' link in messages page navigates to the other participant's profile (not 404)"
    - "Clicking 'View Full Profile' or member card in member directory navigates to that member's profile (not 404)"
  artifacts:
    - path: "app/members/[id]/page.tsx"
      provides: "Member profile detail page that loads for any valid user UUID"
  key_links:
    - from: "app/components/Header.tsx"
      to: "app/members/[id]/page.tsx"
      via: "/members/${userId} link"
    - from: "app/messages/page.tsx"
      to: "app/members/[id]/page.tsx"
      via: "/members/${other_participant.id} link"
    - from: "app/members/page.tsx"
      to: "app/members/[id]/page.tsx"
      via: "/members/${member.id} link"
---

<objective>
Fix broken profile links that 404 across the app — dropdown nav "My Profile", messages "View Profile", and member directory "View Full Profile" links all result in 404 pages.

Purpose: Members cannot view any profile page, breaking a core navigation flow.
Output: All profile links navigate to working profile pages.
</objective>

<execution_context>
@CLAUDE.md
</execution_context>

<context>
@app/members/[id]/page.tsx
@app/components/Header.tsx
@app/messages/page.tsx
@app/members/page.tsx
@lib/supabaseServer.ts
@middleware.ts

Investigation notes from planning:
- Route `app/members/[id]/page.tsx` EXISTS on disk and is a valid Next.js dynamic route
- All links correctly use `/members/${uuid}` pattern
- Middleware protects `/members` (requires auth) — unauthenticated users redirect to `/sign-in`, not 404
- RLS policy on profiles: "Profiles are viewable by authenticated users" (SELECT for `authenticated` role)
- The profile page uses `createSupabaseServerClient()` (user-session client, respects RLS)
- If `profileData` is null, page calls `notFound()` — this is the likely 404 trigger
- The `setAll` in `createSupabaseServerClient` is a no-op (server components cannot set cookies)
- If the Supabase session token is expired and cannot be refreshed (because setAll is no-op), the client may act as `anon` role, causing RLS to block the SELECT, returning null, triggering notFound()
- Build has a TypeScript error in `lib/health-checks.ts` (stripe.VERSION) — unrelated but blocks prod builds
</context>

<tasks>

<task type="auto">
  <name>Task 1: Diagnose and fix the 404 root cause on /members/[id]</name>
  <files>app/members/[id]/page.tsx, lib/supabaseServer.ts</files>
  <action>
    Step 1 — Reproduce and diagnose: Start the dev server (`npm run dev`) and navigate to any `/members/{uuid}` URL while logged in. Check the terminal for Supabase errors. Add temporary `console.log` to `app/members/[id]/page.tsx` right after the profile query (line ~47-51) to log `{ id, profileData, error }` — the Supabase `.single()` call destructure should include `error` alongside `data`.

    Step 2 — Fix based on diagnosis. The most likely root causes in order of probability:

    **A) Auth session not forwarded to server component (most likely):**
    The `createSupabaseServerClient()` has a no-op `setAll`, which means if the JWT is expired, the Supabase client cannot refresh the token. The query then runs as `anon` (not `authenticated`), and the RLS policy blocks the SELECT, returning null.

    Fix: Change the profile query to use `getSupabaseService()` (service role) instead of the user-session client for the PUBLIC profile read. The member profile page is a public-facing profile (any authenticated user can view any profile), so there is no security concern using service role here. The middleware already enforces authentication.

    Replace:
    ```typescript
    const supabase = await createSupabaseServerClient();
    ```
    With using service role for the profile data fetch while keeping the user-session client for `auth.getUser()`:
    ```typescript
    import { getSupabaseService } from '@/lib/supabase/service';
    // ... keep createSupabaseServerClient for auth
    const supabase = await createSupabaseServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    const currentUserId = user?.id ?? null;
    // Use service role for profile reads (bypasses RLS, middleware enforces auth)
    const serviceClient = getSupabaseService();
    ```
    Then update the viewer profile query (line ~35-41) and the main profile query (line ~47-51) to use `serviceClient` instead of `supabase`. Also update the schools query (line ~68-72) to use `serviceClient`.

    **B) Column name mismatch:** If diagnosis reveals a specific column error, fix the SELECT column list to match the actual database schema.

    **C) Other error:** If the Supabase error reveals a different cause, fix accordingly and document.

    Step 3 — Remove any temporary console.log statements added for diagnosis.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit app/members/\[id\]/page.tsx 2>&1 | head -20</automated>
    Manual: Start dev server, log in, click "My Profile" in dropdown nav — profile page loads (not 404).
  </verify>
  <done>Navigating to /members/{any-valid-uuid} while authenticated shows the member profile page instead of a 404.</done>
</task>

<task type="auto">
  <name>Task 2: Verify all profile link sources produce valid URLs</name>
  <files>app/components/Header.tsx, app/messages/page.tsx, app/members/page.tsx</files>
  <action>
    After Task 1 fixes the profile page itself, verify that the link sources produce valid URLs (not `/members/undefined` or `/members/null`):

    1. **Header.tsx (dropdown nav):** Check line ~446 and ~1093. The `userId` prop and `profile?.id` are used. Verify these are actual UUIDs by checking that the `profile` state in the main Header component (line ~821-823) includes `id` in its select. Currently it uses `select('*')` which includes `id` — this is fine. No change needed unless `profile?.id` is somehow undefined (check for edge cases).

    2. **messages/page.tsx line ~514:** Uses `activeConv.other_participant.id`. Verify the conversation data includes the participant's UUID. If the conversation object does not include the participant ID, fix the query.

    3. **members/page.tsx line ~240 and ~320:** Uses `member.id`. The `fetchMembers()` action (lib/members-actions.ts) maps `p.id` from the profiles query — this is correct.

    4. If any link source can produce `undefined` or `null` as the ID, add a guard: only render the Link when the ID is truthy (similar to the guard on messages/page.tsx line ~512: `activeConv?.other_participant?.id &&`).

    No changes should be needed here unless Task 1 diagnosis reveals a link-source issue.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && grep -n 'members/\${.*}' app/components/Header.tsx app/messages/page.tsx app/members/page.tsx | head -20</automated>
    Manual: Test all three flows — dropdown "My Profile", messages "View Profile", directory "View Full Profile" — all navigate to working profile pages.
  </verify>
  <done>All profile links across the app (dropdown nav, messages, member directory) navigate to the correct member profile page without 404 errors. No link produces /members/undefined or /members/null.</done>
</task>

</tasks>

<verification>
1. Log in to the app
2. Click "My Profile" in the header dropdown — profile page loads
3. Go to /messages, open a conversation, click "View Profile" — profile page loads
4. Go to /members, click any member card or "View Full Profile" — profile page loads
5. No 404 errors in any profile navigation flow
</verification>

<success_criteria>
- All three profile link paths (dropdown, messages, directory) navigate to a working profile page
- The /members/[id] route renders the member profile for any valid user UUID
- No regression in other member-related functionality
</success_criteria>

<output>
After completion, create `.planning/quick/260330-ngh-fix-broken-profile-links-across-app-drop/260330-ngh-SUMMARY.md`
Also create `activity/quick-tasks/quick-task_fix-broken-profile-links_30-03-2026.md`
</output>
