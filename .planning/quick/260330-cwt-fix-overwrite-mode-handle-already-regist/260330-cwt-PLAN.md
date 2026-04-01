---
phase: quick
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - migration/import-core.ts
autonomous: true
must_haves:
  truths:
    - "In overwrite mode, 'already registered' auth errors do not count as errors"
    - "In overwrite mode, 'Database error creating new user' does not count as an error"
    - "When auth creation fails but existing user is found by email, that user's ID is used for profile upsert"
    - "Only count as error when user cannot be created AND cannot be found"
  artifacts:
    - path: "migration/import-core.ts"
      provides: "Graceful handling of already-registered users in overwrite mode"
      contains: "getUserByEmail"
  key_links:
    - from: "import-core.ts auth error catch"
      to: "auth.admin.listUsers filter by email"
      via: "fallback lookup on auth creation failure"
      pattern: "listUsers|getUserById"
---

<objective>
Fix overwrite mode in migration/import-core.ts to handle already-registered users gracefully.

Purpose: When re-running migration in overwrite mode, Supabase auth.admin.createUser fails for existing auth users with "already registered" or "Database error creating new user". Currently these count as errors and skip the user entirely. Instead, the importer should find the existing auth user by email and continue with their ID for the profile upsert, counting as "updated" not "error".

Output: Updated import-core.ts with resilient auth user creation logic.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@migration/import-core.ts
</context>

<tasks>

<task type="auto">
  <name>Task 1: Handle already-registered auth errors gracefully in overwrite mode</name>
  <files>migration/import-core.ts</files>
  <action>
Modify the "Create new user" section of the importUsersFromData function (around lines 284-327). Replace the current pattern where authError throws immediately with resilient logic:

1. After the `supabase.auth.admin.createUser()` call (line 299), if `authError` is returned:
   a. Check if the error message contains "already registered" OR "Database error" (case-insensitive check).
   b. If it matches either pattern, attempt to find the existing auth user by email:
      - Use `supabase.auth.admin.listUsers()` and filter the result for matching email. The Supabase admin API does not have a `getUserByEmail` method — use `listUsers({ filter: user.email })` or iterate the response. The most reliable approach: `supabase.auth.admin.listUsers()` then filter `data.users.find(u => u.email === user.email.toLowerCase())`.
      - NOTE: For efficiency, use the `page` and `perPage` params if available, but the filter param on listUsers should narrow results.
   c. If existing user found: use their `id` as `userId`, then continue to profile update and subscription upsert. Count as "updated" (not "created" or "error"). Log a console.warn: `"Auth user already exists for {email}, using existing ID {id} (overwrite mode)"`.
   d. If existing user NOT found AND creation failed: THEN throw the original authError (this is a real error).
   e. If the authError does NOT match "already registered" or "Database error": throw immediately as before (unknown error).

2. After successfully resolving userId (either from createUser or from the fallback lookup), proceed with the existing profile update and subscription upsert logic.

3. When the user was found via fallback lookup (not freshly created), skip the 150ms delay (the profile row already exists from the original creation). Also change the result status to "updated" and increment `updated` instead of `created`.

Structure the code cleanly — extract the auth user resolution into a clear block within the existing try/catch, not a separate function (keep it contained).

Commit message: "fix(migration): handle already-registered users gracefully in overwrite mode"
Push to develop branch.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit migration/import-core.ts 2>&1 || echo "Try broader check:" && npx tsc --noEmit --skipLibCheck 2>&1 | head -30</automated>
  </verify>
  <done>
    - TypeScript compiles without errors
    - "already registered" and "Database error" auth failures in overwrite mode fall back to looking up existing user by email
    - Found existing users get their profile updated and count as "updated"
    - Truly unresolvable errors still count as "error"
    - Changes committed and pushed to develop
  </done>
</task>

</tasks>

<verification>
- TypeScript compiles cleanly
- The auth error catch block handles "already registered" and "Database error" patterns
- Fallback uses supabase.auth.admin.listUsers to find existing user by email
- Result status is "updated" when existing user found via fallback
- Only truly unresolvable cases (cannot create AND cannot find) count as errors
</verification>

<success_criteria>
migration/import-core.ts handles already-registered users gracefully in overwrite mode: catches known auth errors, looks up existing user, uses their ID for profile upsert, counts as "updated". Committed and pushed to develop.
</success_criteria>

<output>
After completion, create `.planning/quick/260330-cwt-fix-overwrite-mode-handle-already-regist/260330-cwt-SUMMARY.md`
Also create `activity/quick-tasks/quick-task_fix-overwrite-mode-already-registered_27-03-2026.md`
</output>
