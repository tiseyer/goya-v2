---
phase: quick-task
plan: 260403-mah
type: execute
wave: 1
depends_on: []
files_modified:
  - supabase/migrations/20260404_seed_page_hero_defaults.sql
  - app/components/PageHero.tsx
autonomous: true
---

<objective>
Fix PageHero edit UI: seed default hero content into DB, fix pill input disappearing in edit mode, and move all edit UI (variables panel, save/cancel buttons) inside the hero container instead of fixed page-level positioning.

Purpose: The pill was accidentally deleted (no DB seed data), the pill input vanishes when cleared (bad UX for admins), and the fixed-position edit panels overlap other page content and break on scroll.
Output: Migration file with default hero content for all 4 pages, and a revised PageHero.tsx with all edit UI contained within the hero section.
</objective>

<execution_context>
@.planning/STATE.md
</execution_context>

<context>
@app/components/PageHero.tsx (main file being fixed)
@app/api/page-hero/[slug]/route.ts (API route — DB-first architecture, verify only)
@lib/hero-variables.ts (variable tokens: [first_name], [full_name], [role], [greeting], etc.)
@supabase/migrations/20260404_page_hero_content.sql (existing table schema)

Current defaults from page props (to be seeded into DB):
- dashboard: pill="[role]", title="[greeting], [first_name].", subtitle="Ready to practice today?"
- events: pill="Events", title="Events", subtitle="Workshops, teacher trainings, dharma talks, and conferences from the global GOYA community."
- academy: pill="GOYA Academy", title="Course Library", subtitle="Workshops, sequences, dharma talks, and research — curated for the serious yoga practitioner."
- add-ons: pill="Brightcoms", title="All Add-Ons & Upgrades", subtitle="Enhance your GOYA profile with verified designation badges, continuing education credits, and more."

Note on dashboard: Multiple role-specific dashboard components pass different pill/title/subtitle props, but they all use pageSlug="dashboard". The DB row for dashboard should use variable tokens so it works for all roles. The prop defaults remain as fallbacks.
</context>

<tasks>

<task type="auto">
  <name>Task 1: Seed default hero content into DB</name>
  <files>supabase/migrations/20260404_seed_page_hero_defaults.sql</files>
  <action>
Create a new migration file `supabase/migrations/20260404_seed_page_hero_defaults.sql` that upserts default content for all 4 page slugs into the `page_hero_content` table. Use `INSERT ... ON CONFLICT (slug) DO NOTHING` so existing customized values are preserved.

The 4 rows to seed:

1. slug='dashboard', pill='[role]', title='[greeting], [first_name].', subtitle='Ready to practice today?'
2. slug='events', pill='Events', title='Events', subtitle='Workshops, teacher trainings, dharma talks, and conferences from the global GOYA community.'
3. slug='academy', pill='GOYA Academy', title='Course Library', subtitle='Workshops, sequences, dharma talks, and research — curated for the serious yoga practitioner.'
4. slug='add-ons', pill='Brightcoms', title='All Add-Ons & Upgrades', subtitle='Enhance your GOYA profile with verified designation badges, continuing education credits, and more.'

Set `updated_at` to `now()` and `updated_by` to NULL (system seed, not a user).

After creating the file, run `npx supabase db push` to apply.
  </action>
  <verify>
    <automated>npx supabase db push 2>&1 | tail -5</automated>
  </verify>
  <done>All 4 page_hero_content rows exist in DB with correct default values. Existing customizations are not overwritten.</done>
</task>

<task type="auto">
  <name>Task 2: Fix pill input visibility and move edit UI inside hero</name>
  <files>app/components/PageHero.tsx</files>
  <action>
Modify `app/components/PageHero.tsx` with the following changes. Apply ALL changes to BOTH dark and light variant render paths.

**A. Pill input always visible in edit mode (both variants):**

The bug: `darkPillContent` / `lightPillContent` is computed as `null` when `templatePill` is falsy (empty string after user clears it). This hides the entire pill div including the input.

Fix: Change the pill content conditional so that in edit mode, the pill container ALWAYS renders regardless of whether `templatePill` is truthy. Only hide the pill in non-edit mode when `templatePill` is empty/null.

For the dark variant, change:
```tsx
const darkPillContent = customPill ?? (templatePill ? ( ... ) : null);
```
to:
```tsx
const darkPillContent = customPill ?? ((editing || templatePill) ? ( ... ) : null);
```

Same pattern for light variant `lightPillContent`.

**B. Move variables panel inside the hero section (both variants):**

Remove the two `fixed left-0 top-1/2 -translate-y-1/2 z-50` variable panels (one in dark, one in light).

Replace with a panel INSIDE the `<section>` tag, positioned absolutely within the hero:
```tsx
{editing && (
  <div className="absolute bottom-2 left-2 z-10 flex flex-wrap gap-1 p-2 bg-black/20 backdrop-blur-sm rounded-xl max-w-[280px]">
    <span className="text-white/50 text-[10px] font-medium w-full mb-0.5">Variables</span>
    {HERO_VARIABLES.map(v => (
      <button
        key={v.key}
        type="button"
        onClick={() => insertVariable(v.key)}
        title={v.description}
        className="text-[10px] bg-white/20 hover:bg-white/40 text-white px-1.5 py-0.5 rounded font-mono whitespace-nowrap transition-colors"
      >
        {v.key}
      </button>
    ))}
  </div>
)}
```
For the light variant, use the same markup but adjust colors: `bg-slate-800/20 backdrop-blur-sm` with `text-slate-600/50` for the label and `bg-slate-600/20 hover:bg-slate-600/40 text-slate-700` for buttons.

**C. Move save/cancel buttons inside the hero section (both variants):**

Remove the two `fixed top-4 right-4 z-50` button panels.

Modify the `adminControl` block: when `editing` is true, render TWO buttons side by side in the `absolute top-4 right-4 z-10` position (where adminControl already sits):

1. Save button (checkmark icon): round `w-8 h-8` button with a checkmark SVG icon. Styled same as the existing pencil/X buttons but with a green-ish tint or white bg. Place it to the LEFT of the X button. Disable while `saving` is true.
2. X (cancel) button: keep the existing X button as-is (rightmost).

The layout in edit mode should be:
```tsx
<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
  {/* Save button */}
  <button onClick={handleSave} disabled={saving} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/20 hover:bg-green-500/30 text-white/80 hover:text-white transition-all disabled:opacity-50" title="Save changes">
    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
    </svg>
  </button>
  {/* Cancel button */}
  <button onClick={handleCancel} className="...existing X button styles...">
    ...existing X SVG...
  </button>
</div>
```

For the light variant admin buttons in edit mode, use appropriate light-mode colors:
- Save: `bg-slate-200/80 hover:bg-green-100 text-slate-500 hover:text-green-600`
- Cancel: keep existing light variant X styles

When NOT editing, keep the existing pencil button behavior unchanged.
When `saved` is true, keep the existing green "Saved" indicator unchanged.

**D. Verify DB-first architecture (no code change expected):**

Confirm the existing flow is correct:
- `useEffect` fetches from `/api/page-hero/${pageSlug}` on mount
- API returns DB values (null if no row)
- Component falls back: `rawPill ?? pill ?? ''` (DB value -> prop default -> empty)
- Save POSTs to API which upserts to Supabase
- No hardcoded file writes anywhere

This is already correct based on code review. No changes needed for this item.
  </action>
  <verify>
    <automated>cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2" && npx tsc --noEmit 2>&1 | tail -20</automated>
  </verify>
  <done>
- Pill input always renders in edit mode (even when empty) for both dark and light variants
- Variables panel is absolutely positioned inside the hero section (bottom-left), not fixed to page
- Save (checkmark) and Cancel (X) buttons are absolutely positioned inside the hero (top-right), not fixed to page
- Hero height (220px) does not change when entering edit mode
- TypeScript compiles with zero errors
- DB-first architecture confirmed: mount->fetch->DB values->fallback->save writes to Supabase only
  </done>
</task>

</tasks>

<verification>
1. `npx tsc --noEmit` — zero errors
2. Visual check: enter edit mode on any page hero as admin — pill input is visible even when cleared
3. Visual check: variables panel anchored inside hero bottom-left, save/X inside hero top-right
4. Visual check: hero height remains 220px in both view and edit mode
5. DB check: all 4 page slugs have rows in page_hero_content after migration
</verification>

<success_criteria>
- Migration seeds 4 default rows into page_hero_content (dashboard, events, academy, add-ons)
- Pill input always visible in edit mode for both variants
- All edit UI (variables, save, cancel) positioned inside hero bounds
- No fixed-position edit panels remain
- `tsc --noEmit` passes with zero errors
- Hero height unchanged between view and edit modes
</success_criteria>

<output>
After completion, create `.planning/quick/260403-mah-fix-pagehero-edit-ui-overhaul-pill-resto/260403-mah-SUMMARY.md`
</output>
