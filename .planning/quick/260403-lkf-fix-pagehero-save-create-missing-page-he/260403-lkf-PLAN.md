---
phase: quick
plan: 260403-lkf
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260404_page_hero_content.sql
  - types/supabase.ts
  - app/events/page.tsx
  - app/academy/page.tsx
autonomous: true
must_haves:
  truths:
    - "Admin users see pencil edit button on all PageHero sections (Dashboard, Events, Academy, Add-Ons)"
    - "Clicking pencil opens inline editor; Save persists to page_hero_content table"
    - "Non-admin users never see the edit pencil"
    - "TypeScript compiles with zero errors"
  artifacts:
    - path: "supabase/migrations/20260404_page_hero_content.sql"
      provides: "page_hero_content table with correct column names matching API"
      contains: "slug text not null unique"
    - path: "types/supabase.ts"
      provides: "Generated Supabase types including page_hero_content and is_superuser"
      contains: "page_hero_content"
  key_links:
    - from: "app/components/PageHero.tsx"
      to: "/api/page-hero/[slug]"
      via: "fetch call using pageSlug prop"
      pattern: "fetch.*api/page-hero"
    - from: "app/api/page-hero/[slug]/route.ts"
      to: "page_hero_content table"
      via: "supabase .from('page_hero_content')"
      pattern: "from.*page_hero_content"
---

<objective>
Fix PageHero save flow end-to-end: correct the migration column names so they match the API route, regenerate Supabase types, and verify pencil button visibility on all pages.

Purpose: The page_hero_content migration has column name mismatches (`page_slug`/`pill_text` vs `slug`/`pill` used by the API), and types are stale. Without fixing this, saves will fail at the DB level.
Output: Working inline hero editing for admin users across all pages.
</objective>

<context>
@app/components/PageHero.tsx
@app/api/page-hero/[slug]/route.ts
@supabase/migrations/20260404_page_hero_content.sql
</context>

<tasks>

<task type="auto">
  <name>Task 1: Fix migration column names and push DB</name>
  <files>supabase/migrations/20260404_page_hero_content.sql</files>
  <action>
The migration `20260404_page_hero_content.sql` has column name mismatches with the API route:
- Migration uses `page_slug` but API uses `slug`
- Migration uses `pill_text` but API uses `pill`
- Migration references `profiles(id)` for `updated_by` but the skipped migration referenced `auth.users(id)` — use `auth.users(id)` since Supabase RLS uses auth.uid()

Rewrite the migration to match the API's expected columns:
```sql
create table if not exists page_hero_content (
  slug text primary key,
  pill text,
  title text,
  subtitle text,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);
```

Keep the RLS policies as-is (they already correctly use just `role in ('admin')`).

Note: Use `slug text primary key` (no separate uuid id column) to match the API's `onConflict: 'slug'` upsert pattern. The API route does `.eq('slug', slug)` and `.upsert({slug, ...}, { onConflict: 'slug' })`.

After editing the migration file, run: `npx supabase db push`

IMPORTANT: If the table already exists with wrong columns from a previous push, you may need to drop it first. Check with the push output — if it errors, create a new migration that drops and recreates:
```sql
drop table if exists page_hero_content;
```
Then re-push.
  </action>
  <verify>
    <automated>npx supabase db push 2>&1 | tail -20</automated>
  </verify>
  <done>page_hero_content table exists in Supabase with columns: slug (text PK), pill (text), title (text), subtitle (text), updated_at (timestamptz), updated_by (uuid). RLS enabled with admin-only write policy.</done>
</task>

<task type="auto">
  <name>Task 2: Regenerate Supabase types and preserve is_superuser</name>
  <files>types/supabase.ts</files>
  <action>
1. Run type generation:
   ```
   npx supabase gen types typescript --project-id snddprncgilpctgvjukr --schema public > types/supabase.ts
   ```

2. After generation, check if `is_superuser` is present in the generated output. It SHOULD be there since the column exists in the DB after the boolean refactor migration. Verify with:
   ```
   grep is_superuser types/supabase.ts
   ```

3. If `is_superuser` is NOT in the generated types (unlikely but possible if the migration hasn't been pushed yet), manually add it to the `profiles` table type in three places:
   - `Row`: `is_superuser: boolean` (after `instagram` field)
   - `Insert`: `is_superuser?: boolean`
   - `Update`: `is_superuser?: boolean`

4. Verify the new `page_hero_content` table appears in the generated types with the correct column names (`slug`, `pill`, `title`, `subtitle`, `updated_at`, `updated_by`).

5. Run `npx tsc --noEmit` to confirm no type errors.
  </action>
  <verify>
    <automated>grep -c "page_hero_content" types/supabase.ts && grep -c "is_superuser" types/supabase.ts && npx tsc --noEmit 2>&1 | tail -5</automated>
  </verify>
  <done>types/supabase.ts contains page_hero_content table types with correct column names AND is_superuser boolean on profiles. tsc --noEmit passes with 0 errors.</done>
</task>

<task type="auto">
  <name>Task 3: Verify pencil button visibility on Events and Academy pages</name>
  <files>app/events/page.tsx, app/academy/page.tsx</files>
  <action>
Check `app/events/page.tsx` — it uses `useState` for `isAdmin` (line 208). Find where `setIsAdmin` is called and confirm it sets to `true` when `role === 'admin'`. The pencil shows when `isAdmin && pageSlug` are truthy (PageHero line 150). Events already passes `pageSlug="events"` and `isAdmin={isAdmin}` (lines 347-348).

Check `app/academy/page.tsx` — also uses `useState` for `isAdmin` (line 44). Find where `setIsAdmin` is called and confirm it sets correctly. Academy passes `pageSlug="academy"` and `isAdmin={isAdmin}` (lines 127-128).

For both pages, verify `setIsAdmin` is called with `role === 'admin'` (not `role === 'superuser'` or any check that would exclude the refactored superuser-as-admin).

Already verified as correct:
- Dashboard components: all 4 variants pass `isAdmin={profile.role === 'admin'}` -- correct
- Add-ons: passes `isAdmin={role === 'admin'}` -- correct
- API route: checks `profile?.role !== 'admin'` -- correct (no superuser role reference)

If Events or Academy have stale superuser checks in their `setIsAdmin` logic, update to just `role === 'admin'`.

Also do a final sweep: `grep -rn "superuser" --include="*.ts" --include="*.tsx" app/ lib/` to ensure no source files reference 'superuser' as a role VALUE (the string literal in role comparisons). References to `is_superuser` (the boolean flag) are fine and expected.
  </action>
  <verify>
    <automated>npx tsc --noEmit 2>&1 | tail -3</automated>
  </verify>
  <done>All PageHero consumers pass pageSlug and isAdmin correctly. No source code references 'superuser' as a role value (only is_superuser boolean references remain). tsc passes.</done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` passes with 0 errors
2. `grep -rn "'superuser'" --include="*.ts" --include="*.tsx" app/ lib/` returns no matches (only `is_superuser` references are acceptable)
3. page_hero_content table exists with correct schema in Supabase
4. types/supabase.ts contains both page_hero_content and is_superuser
</verification>

<success_criteria>
- Admin users see pencil icon on Dashboard, Events, Academy, and Add-Ons PageHero sections
- Clicking Save on the inline editor successfully persists to page_hero_content table (no 500 errors)
- Non-admin users see no pencil icon
- TypeScript compiles cleanly
- No references to 'superuser' as a role value in application source code
</success_criteria>

<output>
After completion, create `.planning/quick/260403-lkf-fix-pagehero-save-create-missing-page-he/260403-lkf-SUMMARY.md`
</output>
