# GOYA Migration Pipeline

## Overview

This directory contains tools for migrating users from WordPress (GOYA v1) to Supabase (GOYA v2).

## Pipeline Steps

### 1. Export from WordPress

1. Install `wp-goya-exporter/` as a WordPress plugin (zip upload or copy to wp-content/plugins/)
2. Navigate to **Tools > GOYA Export** in WordPress admin
3. Select chunk size, offset, role/status filters
4. Click **Export Chunk** or **Export All** to download JSON files
5. Save exported JSON files to this `migration/` directory

### 2. Import to Supabase

```bash
# Ensure .env.local has SUPABASE_SERVICE_ROLE_KEY set

# Import a single file (skip existing users)
npx tsx migration/import-users.ts --file=migration/goya-export-all.json --mode=skip

# Import with overwrite (updates profile data for existing users)
npx tsx migration/import-users.ts --file=migration/goya-export-all.json --mode=overwrite

# Import multiple chunk files (glob pattern)
npx tsx migration/import-users.ts --file="migration/goya-export-chunk-*.json" --mode=skip
```

### 3. Post-Import

- Imported users have `requires_password_reset: true` on their profile
- On first login, middleware redirects them to `/account/set-password`
- After setting a new password, the flag is cleared and they can use GOYA v2 normally

## Files

| File | Purpose |
|------|---------|
| `wp-goya-exporter/` | WordPress export plugin (PHP) |
| `import-users.ts` | Node.js import script (TypeScript) |
| `dummy-users.json` | 25 test users for development |
| `migration-log-*.json` | Import run logs (auto-generated, git-ignored) |

## Field Mapping (WP Export -> Supabase)

| WP Export Field | Supabase Column | Notes |
|-----------------|-----------------|-------|
| email | profiles.email | Also used for auth.users |
| first_name | profiles.first_name | full_name auto-computed by trigger |
| last_name | profiles.last_name | full_name auto-computed by trigger |
| display_name | (fallback for names) | Used if first/last are empty |
| role | profiles.role | Mapped: subscriber->student, teacher->teacher, wellness->wellness_practitioner, administrator->admin |
| profile.about.introduction | profiles.introduction | |
| profile.about.personal_bio | profiles.biography | Column is "biography" not "bio" |
| profile.practice.practice_level | profiles.practice_level | |
| profile.practice.practice_styles | profiles.practice_styles | jsonb array |
| profile.teaching.years_teaching | profiles.years_teaching | |
| profile.teaching.teaching_styles | profiles.teaching_styles_profile | Note column name difference |
| profile.teaching.teaching_focus | profiles.teaching_focus | jsonb array |
| profile.teaching.teaching_format | profiles.teaching_format | |
| profile.school.lineage | profiles.lineage | jsonb array |
| profile.socials.website | profiles.website | |
| profile.socials.instagram | profiles.instagram | |
| profile.socials.youtube | profiles.youtube | |
| profile.location.city + country | profiles.location | Concatenated: "City, Country" |
| avatar_url | profiles.avatar_url | URL reference only |
| subscriptions[].stripe_customer_id | stripe_orders.stripe_customer_id | |
| subscriptions[].stripe_subscription_id | stripe_orders.stripe_id | |
| subscriptions[].status | stripe_orders.subscription_status | |

## Security Notes

- All `migration/*.json` files are git-ignored (contain real user data in production)
- The import script requires `SUPABASE_SERVICE_ROLE_KEY` (admin-level access)
- Never commit exported user data to version control
