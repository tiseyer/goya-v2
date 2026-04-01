---
phase: quick-260327-ldq
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260353_mrn_used_table.sql
autonomous: true
requirements: [MRN-USED-TABLE, MRN-UNIQUENESS, MRN-BACKFILL, MRN-RETIREMENT]

must_haves:
  truths:
    - "used_mrns table tracks every MRN ever issued"
    - "generate_mrn() checks used_mrns for uniqueness, not just profiles"
    - "New user creation inserts MRN into both profiles and used_mrns"
    - "All existing profile MRNs are backfilled into used_mrns"
    - "Profiles missing MRNs get one generated and recorded in used_mrns"
    - "Deleted/anonymized users have MRN marked retired in used_mrns"
  artifacts:
    - path: "supabase/migrations/20260353_mrn_used_table.sql"
      provides: "used_mrns table, updated generate_mrn(), backfill logic, retirement trigger"
      min_lines: 60
  key_links:
    - from: "generate_mrn()"
      to: "used_mrns"
      via: "uniqueness check query"
      pattern: "SELECT 1 FROM public.used_mrns"
    - from: "handle_new_user()"
      to: "used_mrns"
      via: "INSERT after profile creation"
      pattern: "INSERT INTO public.used_mrns"
---

<objective>
Implement the MRN lifecycle tracking system via a single Supabase migration.

Purpose: Ensure MRNs are never reused, even after user deletion/anonymization. Currently generate_mrn() only checks the profiles table, meaning a deleted user's MRN could be reassigned.

Output: One migration file that creates the used_mrns table, updates generate_mrn(), adds insert/retirement triggers, and backfills existing data.
</objective>

<execution_context>
@$HOME/.claude/get-shit-done/workflows/execute-plan.md
@$HOME/.claude/get-shit-done/templates/summary.md
</execution_context>

<context>
@supabase/migrations/20260320_fix_auth_trigger.sql (current generate_mrn and handle_new_user)
@supabase/migrations/001_profiles.sql (original profile schema with mrn column)

<interfaces>
<!-- Current generate_mrn() in 20260320_fix_auth_trigger.sql -->
<!-- Checks only profiles table: NOT EXISTS (SELECT 1 FROM public.profiles WHERE mrn = new_mrn) -->
<!-- handle_new_user() calls generate_mrn() and inserts into profiles -->
<!-- profiles.mrn is TEXT UNIQUE -->
</interfaces>
</context>

<tasks>

<task type="auto">
  <name>Task 1: Create migration with used_mrns table, updated functions, and backfill</name>
  <files>supabase/migrations/20260353_mrn_used_table.sql</files>
  <action>
Create a single migration file `supabase/migrations/20260353_mrn_used_table.sql` with these sections in order:

**1. Create used_mrns table:**
```sql
CREATE TABLE IF NOT EXISTS public.used_mrns (
  mrn TEXT PRIMARY KEY,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'retired'))
);
```
Add RLS: enable RLS, grant SELECT to authenticated users, full access to service_role.
Add index on status column for efficient queries: `CREATE INDEX idx_used_mrns_status ON public.used_mrns(status);`

**2. Update generate_mrn() to check used_mrns instead of profiles:**
```sql
CREATE OR REPLACE FUNCTION public.generate_mrn()
RETURNS text
LANGUAGE plpgsql
AS $$
DECLARE
  new_mrn text;
  done boolean;
BEGIN
  done := false;
  WHILE NOT done LOOP
    new_mrn := lpad(floor(random() * 100000000)::bigint::text, 8, '0');
    done := NOT EXISTS (SELECT 1 FROM public.used_mrns WHERE mrn = new_mrn);
  END LOOP;
  RETURN new_mrn;
END;
$$;
```

**3. Create a trigger function to record MRNs in used_mrns on profile insert/update:**
```sql
CREATE OR REPLACE FUNCTION public.record_mrn_usage()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.mrn IS NOT NULL THEN
    INSERT INTO public.used_mrns (mrn, status)
    VALUES (NEW.mrn, 'active')
    ON CONFLICT (mrn) DO UPDATE SET status = 'active';
  END IF;
  RETURN NEW;
END;
$$;
```
Attach trigger: `CREATE TRIGGER on_profile_mrn_set AFTER INSERT OR UPDATE OF mrn ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.record_mrn_usage();`

**4. Create a trigger function to retire MRNs on profile deletion:**
```sql
CREATE OR REPLACE FUNCTION public.retire_mrn()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF OLD.mrn IS NOT NULL THEN
    UPDATE public.used_mrns SET status = 'retired' WHERE mrn = OLD.mrn;
  END IF;
  RETURN OLD;
END;
$$;
```
Attach trigger: `CREATE TRIGGER on_profile_deleted BEFORE DELETE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.retire_mrn();`

**5. Backfill: Insert all existing profile MRNs into used_mrns:**
```sql
INSERT INTO public.used_mrns (mrn, status)
SELECT mrn, 'active'
FROM public.profiles
WHERE mrn IS NOT NULL
ON CONFLICT (mrn) DO NOTHING;
```

**6. Backfill: Generate MRNs for profiles missing them:**
Note: At this point generate_mrn() checks used_mrns which was just backfilled, so it is safe.
```sql
DO $$
DECLARE
  profile_record RECORD;
  new_mrn TEXT;
BEGIN
  FOR profile_record IN SELECT id FROM public.profiles WHERE mrn IS NULL LOOP
    new_mrn := public.generate_mrn();
    UPDATE public.profiles SET mrn = new_mrn WHERE id = profile_record.id;
    -- The on_profile_mrn_set trigger will auto-insert into used_mrns
  END LOOP;
END;
$$;
```

**7. Add comment for documentation:**
```sql
COMMENT ON TABLE public.used_mrns IS 'Tracks all MRNs ever issued. Prevents reuse after user deletion.';
```

Important: Do NOT modify handle_new_user() in this migration. The existing flow (handle_new_user calls generate_mrn, inserts into profiles) will automatically trigger on_profile_mrn_set which records in used_mrns. This is cleaner and avoids duplicating the insert logic.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && test -f supabase/migrations/20260353_mrn_used_table.sql && grep -q "CREATE TABLE.*used_mrns" supabase/migrations/20260353_mrn_used_table.sql && grep -q "record_mrn_usage" supabase/migrations/20260353_mrn_used_table.sql && grep -q "retire_mrn" supabase/migrations/20260353_mrn_used_table.sql && grep -q "FROM public.used_mrns" supabase/migrations/20260353_mrn_used_table.sql && echo "PASS" || echo "FAIL"</automated>
  </verify>
  <done>Migration file exists with: used_mrns table, updated generate_mrn checking used_mrns, insert trigger recording new MRNs, delete trigger retiring MRNs, backfill of existing MRNs, backfill of NULL MRNs</done>
</task>

<task type="auto">
  <name>Task 2: Push migration to Supabase and verify</name>
  <files></files>
  <action>
Run `npx supabase db push` from the project root to apply the migration.

After push succeeds, verify with spot checks by running SQL queries via `npx supabase db query` or equivalent:
1. `SELECT count(*) FROM public.used_mrns;` -- should match count of profiles with MRNs
2. `SELECT count(*) FROM public.profiles WHERE mrn IS NULL;` -- should be 0
3. `SELECT status, count(*) FROM public.used_mrns GROUP BY status;` -- all should be 'active'

If db push is not available or fails due to environment, document the command needed and mark for manual execution.

IMPORTANT per project memory: Always run `npx supabase db push` after creating a migration file.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx supabase db push --dry-run 2>&1 | head -20</automated>
  </verify>
  <done>Migration applied (or dry-run confirmed valid). used_mrns table populated, no profiles with NULL mrn, generate_mrn() checks used_mrns for uniqueness.</done>
</task>

</tasks>

<verification>
- used_mrns table exists with mrn (PK), created_at, status columns
- generate_mrn() uniqueness check queries used_mrns, not profiles
- Profile insert/update triggers record MRN in used_mrns
- Profile delete triggers set MRN status to 'retired' in used_mrns
- All existing MRNs backfilled into used_mrns
- No profiles have NULL mrn after migration
- Frontend displays unchanged (they read from profile.mrn which is unaffected)
</verification>

<success_criteria>
- Single migration file covers all MRN lifecycle concerns
- MRN reuse is prevented even after user deletion
- Existing data is fully backfilled
- No breaking changes to existing auth trigger or frontend
</success_criteria>

<output>
After completion, create `.planning/quick/260327-ldq-implement-mrn-system-generation-storage-/260327-ldq-SUMMARY.md`
Also create `activity/quick-tasks/quick-task_implement-mrn-system_27-03-2026.md` per CLAUDE.md
</output>
