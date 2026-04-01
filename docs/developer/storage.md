---
title: Storage
audience: ["developer"]
section: developer
order: 6
last_updated: "2026-03-31"
---

# Storage

GOYA v2 uses Supabase Storage for all user-uploaded and admin-uploaded files. Each category of file lives in its own bucket with purpose-specific RLS policies.

## Table of Contents

- [Buckets](#buckets)
- [Avatar Uploads](#avatar-uploads)
- [Event Images](#event-images)
- [School Logos](#school-logos)
- [Upgrade Certificates](#upgrade-certificates)
- [Chatbot Avatars](#chatbot-avatars)
- [Post Media (Community Feed)](#post-media-community-feed)
- [Migration Uploads](#migration-uploads)
- [Media Library Buckets](#media-library-buckets)
- [Accessing Storage URLs](#accessing-storage-urls)

---

## Buckets

| Bucket | Public | Purpose |
|---|---|---|
| `avatars` | Yes | Member profile photos |
| `event-images` | Yes | Featured images for events |
| `school-logos` | Yes | Yoga school logo images |
| `upgrade-certificates` | No | Uploaded PDFs/images in the WP upgrade flow |
| `chatbot-avatars` | Yes | Custom avatar images for the AI chatbot |
| `post-images` | Yes | Images attached to community feed posts |
| `post-videos` | Yes | Videos attached to community feed posts |
| `post-audio` | Yes | Audio files attached to community feed posts |
| `migration-uploads` | No | Temporary WP export JSON staging (admin only) |

All buckets are defined via SQL migrations in `supabase/migrations/`. RLS policies on `storage.objects` control who can read, insert, update, and delete.

---

## Avatar Uploads

**Route handler:** `app/api/avatar/route.ts`

The avatar upload flow:

1. The client `POST`s the image file as `multipart/form-data` to `/api/avatar`.
2. The route handler authenticates the user via the server Supabase client.
3. The file is uploaded to the `avatars` bucket at path `{userId}/avatar.{ext}`.
4. The route handler updates `profiles.avatar_url` with the new public URL.
5. The URL is returned to the client.

**Storage path pattern:** `avatars/{user_id}/avatar.{extension}`

The `avatars` bucket is public, so URLs can be used directly in `<img>` or `next/image` without signed tokens.

---

## Event Images

**Bucket:** `event-images` (public)

Uploaded by admins/moderators from the admin event editor. The public URL is stored in `events.featured_image_url`.

**RLS:**
- Public: SELECT
- Admin/moderator: INSERT, UPDATE, DELETE

---

## School Logos

**Bucket:** `school-logos` (public)

Uploaded by admins from the schools admin section. Stored in `schools.logo_url`.

**RLS:**
- Public: SELECT
- Admin only: INSERT, UPDATE, DELETE

---

## Upgrade Certificates

**Bucket:** `upgrade-certificates` (private)

Used during the WP (Wellness Practitioner) upgrade flow. Members upload proof documents (PDF or image) as part of their designation application. Files are read by admins during the review process.

Because this bucket is private, access requires a signed URL or the service role client.

---

## Chatbot Avatars

**Bucket:** `chatbot-avatars` (public)

Admin-uploaded avatar image for the GOYA chatbot. URL stored in `site_settings` under the key `chatbot_avatar_url`.

---

## Post Media (Community Feed)

**Buckets:** `post-images`, `post-videos`, `post-audio` (all public)

Community feed posts can include attached media. Files are uploaded client-side and the public URL is stored with the post record.

---

## Migration Uploads

**Bucket:** `migration-uploads` (private, admin only)

Temporary staging area for the WordPress member import tool. The admin uploads a JSON export file, which the `/api/admin/migration/import` route handler downloads from storage, processes, then deletes.

**File size limit:** 50 MB. **Allowed MIME types:** `application/json` only.

---

## Media Library Buckets

The media library (`/admin/media`) is a centralised file manager that provides a UI for browsing and organising files across multiple buckets. The `media_items` table stores metadata for every catalogued file.

Buckets managed through the media library (defined in `app/admin/media/constants.ts`):

| Bucket | Label in UI |
|---|---|
| `avatars` | Avatars |
| `event-images` | Events |
| `school-logos` | Courses |
| `upgrade-certificates` | Certificates |
| `uploads` | Uploads |

### Backfill Script

Because `media_items` was added after files already existed in storage, a one-time backfill script is provided:

```bash
npm run media:backfill
```

Source: `scripts/backfill-media-items.ts`. The script is **idempotent** — safe to re-run; it skips files already registered in `media_items`. New file uploads after the initial backfill are registered automatically via `lib/media/register.ts`.

See [database-schema.md](./database-schema.md) for the `media_items` and `media_folders` table schemas.

---

## Accessing Storage URLs

**Public buckets** — construct the URL directly:

```ts
const url = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/${bucket}/${path}`
```

Supabase Storage also returns the public URL from the upload response:

```ts
const { data } = await supabase.storage
  .from('avatars')
  .upload(path, file, { upsert: true })

const { data: { publicUrl } } = supabase.storage
  .from('avatars')
  .getPublicUrl(data.path)
```

**Private buckets** — generate a signed URL using the service role client:

```ts
import { getSupabaseService } from '@/lib/supabase/service'

const supabase = getSupabaseService()
const { data } = await supabase.storage
  .from('upgrade-certificates')
  .createSignedUrl(filePath, 3600) // 1 hour expiry
```

When displaying avatars or event images, prefer `next/image` with the public URL for automatic optimisation.

---

## See Also

- [database-schema.md](./database-schema.md) — `media_items` and `media_folders` tables
- [architecture.md](./architecture.md) — Where avatar upload route lives in `app/api/`
- [deployment.md](./deployment.md) — Storage-related environment variables
