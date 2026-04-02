# Feature Landscape: Profile Page Field Audit

**Domain:** Member profile page rebuild (v1.18)
**Researched:** 2026-04-01
**Sources:** `lib/types.ts`, `supabase/migrations/001_profiles.sql` through `20260376_school_owner_schema.sql`

---

## Summary

The `profiles` table already has the majority of fields the new design needs. The three notable gaps are: **cover image** (exists on `schools`, never added to `profiles`), **intro video URL** (exists in DB but not typed — see discrepancy note below), and **lineage** (exists in DB as `jsonb` but not in `lib/types.ts`). No migration is needed for teaching styles, practice styles, social links, location, languages — all present and typed.

---

## Field Audit: Existing vs. Needed

### Hero Section

| Design Need | DB Column | Type | In `lib/types.ts` | Status |
|---|---|---|---|---|
| Avatar image | `avatar_url` | `text` | YES | READY |
| Full name | `full_name` | `text` (computed via trigger) | YES | READY |
| First / last name | `first_name`, `last_name` | `text` | YES | READY |
| Role badge | `role` | `text` enum | YES | READY |
| Member type | `member_type` | `text` enum | YES | READY |
| Short intro / tagline | `introduction` | `text` (max 120 chars enforced in UI) | YES | READY |
| City + country | `city`, `country` | `text` | YES | READY |
| Location (plain text) | `location` | `text` | YES | READY |
| Languages | `languages` | `text[]` | YES | READY |
| Verification badge | `verification_status` | `text` enum | YES | READY |
| **Cover / banner image** | **MISSING on profiles** | — | NO | **NEEDS MIGRATION** |

`cover_image_url` exists only on the `schools` table. A new `cover_image_url text` column must be added to `profiles`.

---

### Role-Specific Pill Sections

| Design Need | DB Column | Type | In `lib/types.ts` | Status |
|---|---|---|---|---|
| Teaching styles (teacher) | `teaching_styles` | `text[]` | YES | READY |
| Teaching focus (teacher) | `teaching_focus_arr` | `text[]` | YES | READY |
| Influences (teacher) | `influences_arr` | `text[]` | YES | READY |
| Years teaching (teacher) | `years_teaching` | `text` | YES | READY |
| Teacher status | `teacher_status` | `text` | YES | READY |
| Practice styles (student) | `practice_styles` | `text[]` | YES | READY |
| Practice level (student) | `practice_level` | `text` | YES | READY |
| Practice format (shared) | `practice_format` | `text` enum (`online`/`in_person`/`hybrid`) | YES | READY |
| Wellness designations | `wellness_designations` | `text[]` | YES | READY |
| Wellness focus | `wellness_focus` | `text[]` | YES | READY |
| **Lineage (teacher)** | **`lineage` (jsonb)** | `jsonb DEFAULT '[]'` | NO | **NEEDS TYPE ONLY** |

`lineage` was added in `002_profile_fields.sql` as `jsonb`. The column exists in the DB but was never added to `lib/types.ts`. No migration needed — only a type addition.

---

### Intro Video

| Design Need | DB Column | Type | In `lib/types.ts` | Status |
|---|---|---|---|---|
| Intro video embed (YouTube/Vimeo) | `youtube_intro_url` | `text` | YES | READY |

**Note on discrepancy:** `002_profile_fields.sql` added a column called `video_intro_url` (not `youtube_intro_url`). `20260326_extend_onboarding.sql` later added `youtube_intro_url`. Both columns exist in the DB. `lib/types.ts` only types `youtube_intro_url`. The new profile page should use `youtube_intro_url` (the typed, current column) and support both YouTube and Vimeo URLs from that single field — same pattern as schools.

---

### Location / Map

| Design Need | DB Column | Type | In `lib/types.ts` | Status |
|---|---|---|---|---|
| Location text | `location`, `city`, `country` | `text` | YES | READY |
| Map coordinates | **MISSING on profiles** | — | NO | **NEEDS MIGRATION** |
| Place ID (for map) | **MISSING on profiles** | — | NO | **NEEDS MIGRATION** |

The `schools` table has `location_lat`, `location_lng`, `location_place_id`, `location_address`. The `profiles` table has none of these — only freeform text fields. For the Mapbox inline map, coordinates must be stored. This requires a migration.

---

### Social Links / Sidebar

| Design Need | DB Column | Type | In `lib/types.ts` | Status |
|---|---|---|---|---|
| Website | `website` | `text` | YES | READY |
| Instagram | `instagram` | `text` | YES | READY |
| Facebook | `facebook` | `text` | YES | READY |
| TikTok | `tiktok` | `text` | YES | READY |
| YouTube | `youtube` | `text` | YES | READY |
| MRN (membership card) | `mrn` | `text` | YES | READY |
| Subscription status | `subscription_status` | `text` enum | YES | READY |
| Username | `username` | `text` | YES | READY |
| Phone | `phone` | `text` | YES | READY (private — do not display publicly) |

---

### School Affiliation (teacher view)

| Design Need | DB Column | Type | In `lib/types.ts` | Status |
|---|---|---|---|---|
| Principal trainer's school | `principal_trainer_school_id` | `uuid FK → schools` | YES | READY |
| Faculty school memberships | `faculty_school_ids` | `uuid[]` | YES | READY |

Joined school data (name, slug, logo, designations) must be fetched from `schools` + `school_designations` — no additional profile columns needed.

---

### Designations (sidebar badges)

No column on `profiles` — designations live in `user_designations` table (added in `20260345_upgrade_and_designations.sql`). The profile page query must join this table.

---

## Fields Requiring Migration

| Column | Table | Type | Purpose |
|---|---|---|---|
| `cover_image_url` | `profiles` | `text` | Hero banner image |
| `location_lat` | `profiles` | `double precision` | Mapbox pin |
| `location_lng` | `profiles` | `double precision` | Mapbox pin |
| `location_place_id` | `profiles` | `text` | Mapbox geocode reference |

All four can go in a single migration. The `school-covers` storage bucket already exists for schools — a parallel `profile-covers` bucket should be created for profile cover images.

---

## Fields Needing Type-Only Updates (no migration)

| Column | Table | Current DB Type | Action Needed |
|---|---|---|---|
| `lineage` | `profiles` | `jsonb DEFAULT '[]'` | Add to `lib/types.ts` as `string[] \| null` |

---

## Fields NOT Needed (do not add)

| Column | Reason |
|---|---|
| `phone` | Already exists — keep private, never display on public profile |
| `video_intro_url` | Orphaned early column in DB, superseded by `youtube_intro_url` — ignore |
| `biography` | Orphaned early column in DB, superseded by `bio` — ignore |
| `teaching_styles_profile` | Orphaned early jsonb column, superseded by `teaching_styles text[]` — ignore |
| `influences` (jsonb) | Orphaned early jsonb column, superseded by `influences_arr text[]` — ignore |

---

## Privacy Rules (already constrainable from existing fields)

| Rule | Column | Logic |
|---|---|---|
| No map for online-only users | `practice_format` | Show map only when `practice_format IN ('in_person', 'hybrid')` |
| No map for students | `role` / `member_type` | Do not show map when `member_type = 'student'` |
| No full address public display | `location` vs `location_place_id` | Only display city/country text; never expose lat/lng in rendered HTML |

---

## What the Profile Page Query Must JOIN

To avoid N+1 fetches and render the complete profile in one pass:

```
profiles
  + user_designations (sidebar badges)
  + schools WHERE id = principal_trainer_school_id (school affiliation)
  + school_faculty WHERE profile_id = profiles.id AND status = 'active' (faculty roles)
  + school_designations WHERE school_id = affiliated school (designation badges)
```

Events and courses are separate carousels — fetch independently with `created_by = profile.id` and `status = 'published'`.
