---
title: Database Schema
audience: ["developer"]
section: developer
order: 3
last_updated: "2026-04-01"
---

# Database Schema

All tables live in the `public` schema of Supabase (PostgreSQL). Row-Level Security (RLS) is enabled on every table. Schema changes are applied via `supabase/migrations/` — never edit the DB directly.

## Table of Contents

- [Auth and Profiles](#auth-and-profiles)
- [Events](#events)
- [Courses](#courses)
- [Credits](#credits)
- [Connections and Messaging](#connections-and-messaging)
- [Shop and Stripe](#shop-and-stripe)
- [Chatbot](#chatbot)
- [Flow Builder](#flow-builder)
- [Admin and System](#admin-and-system)
- [Media Library](#media-library)
- [School Owner System](#school-owner-system)
- [RLS Policy Summary](#rls-policy-summary)

---

## Auth and Profiles

### `profiles`

Auto-created by trigger on `auth.users` insert. One row per registered user.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | FK → `auth.users`, primary key |
| `email` | `text` | Synced from auth at registration |
| `full_name` | `text` | — |
| `mrn` | `text` | Unique 8-digit Member Record Number, auto-generated |
| `role` | `text` | `student` \| `teacher` \| `wellness_practitioner` \| `moderator` \| `admin` |
| `avatar_url` | `text` | Supabase Storage public URL |
| `bio` | `text` | — |
| `location` | `text` | — |
| `is_verified` | `boolean` | Admin-set verification status |
| `requires_password_reset` | `boolean` | Set for migrated WordPress users |
| `member_type` | `text` | Extended member classification |
| `theme_preference` | `text` | `light` \| `dark` \| `system` |
| `created_at` | `timestamptz` | — |
| `principal_trainer_school_id` | `uuid` | FK → `schools`, school where this profile is principal trainer |
| `faculty_school_ids` | `uuid[]` | Array of school IDs where this profile is faculty |

**RLS:** Authenticated users can read all profiles. Users update only their own row. Insert handled by service-role trigger only.

---

### `impersonation_log`

Admin impersonation audit trail.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `admin_id` | `uuid` | FK → `auth.users` |
| `target_user_id` | `uuid` | FK → `auth.users` |
| `actions_taken` | `jsonb[]` | Append-only action log |
| `started_at` | `timestamptz` | — |
| `ended_at` | `timestamptz` | — |

---

## Events

### `events`

Public events listings.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `title` | `text` | — |
| `category` | `text` | `Workshop` \| `Teacher Training` \| `Dharma Talk` \| `Conference` \| `Yoga Sequence` \| `Music Playlist` \| `Research` |
| `format` | `text` | `Online` \| `In Person` \| `Hybrid` |
| `description` | `text` | — |
| `date` | `date` | — |
| `time_start` / `time_end` | `time` | — |
| `location` | `text` | — |
| `instructor` | `text` | — |
| `price` | `numeric(10,2)` | — |
| `is_free` | `boolean` | — |
| `spots_total` / `spots_remaining` | `integer` | Nullable = unlimited |
| `featured_image_url` | `text` | Supabase Storage URL |
| `status` | `text` | `published` \| `draft` \| `cancelled` |

**RLS:** Public can read `status = 'published'`. Admins/moderators read all, insert, update, delete.

Storage bucket: `event-images` (public bucket).

### `event_registrations`

Member RSVPs for events.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `event_id` | `uuid` | FK → `events` |
| `user_id` | `uuid` | FK → `auth.users` |
| `status` | `text` | `registered` \| `cancelled` |
| `created_at` | `timestamptz` | — |

---

## Courses

### `courses`

Academy course catalogue.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `title` | `text` | — |
| `short_description` | `text` | — |
| `description` | `text` | — |
| `category` | `text` | `Workshop` \| `Yoga Sequence` \| `Dharma Talk` \| `Music Playlist` \| `Research` |
| `instructor` | `text` | — |
| `duration` | `text` | Display string e.g. `"4h 30m"` |
| `level` | `text` | `Beginner` \| `Intermediate` \| `Advanced` \| `All Levels` |
| `access` | `text` | `members_only` \| `free` |
| `vimeo_url` | `text` | — |
| `thumbnail_url` | `text` | — |
| `status` | `text` | `published` \| `draft` |
| `deleted_at` | `timestamptz` | Soft delete; `NULL` = active |

**RLS:** Public can read `status = 'published'` where `deleted_at IS NULL`. Admins/moderators manage all.

### `user_course_progress`

Per-user course enrollment and completion status.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users` |
| `course_id` | `uuid` | FK → `courses` |
| `status` | `text` | `in_progress` \| `completed` |
| `enrolled_at` | `timestamptz` | — |
| `completed_at` | `timestamptz` | — |

Unique constraint: `(user_id, course_id)`.

### `member_courses`

Member-submitted external course records (for CE credit purposes), with admin approval workflow.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users` |
| `title` | `text` | — |
| `provider` | `text` | — |
| `hours` | `numeric` | — |
| `status` | `text` | `pending` \| `approved` \| `rejected` |
| `reviewed_by` | `uuid` | Admin who acted |
| `reviewed_at` | `timestamptz` | — |

---

## Credits

### `credit_entries`

Every credit submission (CE, karma, practice, teaching, community hours).

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `user_id` | `uuid` | FK → `auth.users` |
| `credit_type` | `text` | `ce` \| `karma` \| `practice` \| `teaching` \| `community` |
| `amount` | `numeric(10,2)` | Must be > 0 |
| `activity_date` | `date` | — |
| `description` | `text` | — |
| `source` | `text` | `manual` \| `automatic` |
| `status` | `text` | `pending` \| `approved` \| `rejected` |
| `rejection_reason` | `text` | — |
| `expires_at` | `date` | **Generated column**: `activity_date + 365 days` |

**RLS:** Users read and insert their own credits. Admins/moderators manage all.

### `credit_requirements`

Admin-configurable required amounts per credit type.

| Column | Type | Notes |
|---|---|---|
| `credit_type` | `text` | PK (unique per type) |
| `required_amount` | `numeric(10,2)` | — |
| `period_months` | `integer` | Rolling window |

**RLS:** Public read. Admins manage.

Default seeded values: CE 20h / 24mo, Karma 10h / 24mo, Practice 50h / 24mo, Teaching 100h / 24mo.

---

## Connections and Messaging

### `connections`

Member-to-member connection requests.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `requester_id` | `uuid` | FK → `profiles` |
| `recipient_id` | `uuid` | FK → `profiles` |
| `type` | `text` | `peer` \| `mentorship` \| `faculty` |
| `status` | `text` | `pending` \| `accepted` \| `declined` |

Unique: `(requester_id, recipient_id)`. **RLS:** Participants read and update their own connections.

### `conversations` and `messages`

Direct messaging between two members. Both tables are added to the Supabase Realtime publication.

| `conversations` columns | Notes |
|---|---|
| `participant_1`, `participant_2` | FK → `profiles`, unique pair |
| `last_message_at` | Updated on each new message |

| `messages` columns | Notes |
|---|---|
| `conversation_id` | FK → `conversations` |
| `sender_id` | FK → `profiles` |
| `content` | `text` |
| `read_at` | `timestamptz`, NULL = unread |

### `notifications`

In-app notifications. Also Realtime-enabled.

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | FK → `profiles` |
| `type` | `text` | Notification category string |
| `title` | `text` | — |
| `body` | `text` | — |
| `link` | `text` | Optional nav target |
| `read_at` | `timestamptz` | NULL = unread |
| `actor_id` | `uuid` | FK → `profiles` (who triggered it) |

---

## Shop and Stripe

### `stripe_products`

Mirror of Stripe product catalogue, kept in sync via webhook events.

| Column | Type | Notes |
|---|---|---|
| `stripe_id` | `text` | Unique, maps to Stripe `prod_...` |
| `name` | `text` | — |
| `description` | `text` | — |
| `active` | `boolean` | — |
| `images` | `text[]` | — |
| `metadata` | `jsonb` | — |

### `stripe_prices`

Mirror of Stripe prices. Prices are immutable on Stripe — no delete cascade FKs.

| Column | Type | Notes |
|---|---|---|
| `stripe_id` | `text` | Unique, maps to Stripe `price_...` |
| `stripe_product_id` | `text` | Text ref (no FK) |
| `currency` | `text` | Default `usd` |
| `unit_amount` | `integer` | Cents |
| `type` | `text` | `one_time` \| `recurring` |
| `interval` | `text` | `day` \| `week` \| `month` \| `year` |

### `stripe_orders`

One row per payment intent or subscription cycle.

| Column | Type | Notes |
|---|---|---|
| `stripe_id` | `text` | Unique |
| `user_id` | `uuid` | FK → `auth.users` ON DELETE SET NULL |
| `amount_total` | `integer` | Cents |
| `status` | `text` | Stripe status string |
| `type` | `text` | `one_time` \| `recurring` |
| `subscription_status` | `text` | From Stripe subscription object |
| `cancel_at_period_end` | `boolean` | — |

### `stripe_coupons`

Mirror of Stripe coupons and promotion codes.

| Column | Type | Notes |
|---|---|---|
| `stripe_coupon_id` | `text` | Unique |
| `stripe_promotion_code_id` | `text` | Unique, nullable |
| `discount_type` | `text` | `percent` \| `amount` \| `free_product` |
| `code` | `text` | Human-readable promo code |
| `valid` | `boolean` | — |

### `stripe_coupon_redemptions`

Append-only log of coupon uses. No `updated_at`.

### `webhook_events`

Idempotency log for incoming Stripe webhook events.

| Column | Type | Notes |
|---|---|---|
| `stripe_event_id` | `text` | Unique (deduplication key) |
| `event_type` | `text` | e.g. `customer.subscription.updated` |
| `status` | `text` | `processing` \| `processed` \| `failed` \| `pending_cron` |
| `payload` | `jsonb` | Full Stripe event payload |
| `error_message` | `text` | Populated on failure |
| `processed_at` | `timestamptz` | — |

---

## Chatbot

### `chat_sessions`

One session per conversation (supports anonymous and authenticated users).

| Column | Type | Notes |
|---|---|---|
| `user_id` | `uuid` | FK → `profiles`, nullable (anonymous) |
| `anonymous_id` | `text` | For unauthenticated sessions |
| `is_escalated` | `boolean` | Flagged for human review |
| `expires_at` | `timestamptz` | Session TTL |

### `chat_messages`

Individual messages within a session.

| Column | Type | Notes |
|---|---|---|
| `session_id` | `uuid` | FK → `chat_sessions` CASCADE |
| `role` | `text` | `user` \| `assistant` |
| `content` | `text` | — |

---

## Flow Builder

### `flows`, `flow_steps`, `flow_step_branches`

Admin-built onboarding and engagement flows assigned to members.

| Table | Purpose |
|---|---|
| `flows` | Flow definitions with title, description, type |
| `flow_steps` | Ordered steps within a flow (question, message, action types) |
| `flow_step_branches` | Conditional branching logic between steps |
| `flow_responses` | Member responses to assigned flows |
| `flow_action_executions` | Log of automated actions triggered by flow completions |

---

## Admin and System

### `site_settings`

Key-value store for admin-configurable settings (maintenance mode, email sandbox, credit thresholds, etc.).

| Column | Type |
|---|---|
| `key` | `text` (unique) |
| `value` | `text` |

### `email_templates`

DB-driven email templates editable from the admin panel.

| Column | Type | Notes |
|---|---|---|
| `template_key` | `text` | Unique identifier e.g. `welcome_member` |
| `subject` | `text` | Supports `{{variable}}` syntax |
| `html_content` | `text` | HTML body, supports `{{variable}}` syntax |
| `is_active` | `boolean` | Inactive templates silently skip send |

### `email_log`

Send/failure log for every outgoing email.

| Column | Type |
|---|---|
| `recipient` | `text` |
| `subject` | `text` |
| `template_name` | `text` |
| `status` | `text` (`sent` \| `failed`) |
| `error_message` | `text` |

### `audit_log`

Immutable record of admin and system actions.

| Column | Type | Notes |
|---|---|---|
| `actor_id` | `uuid` | Who performed the action |
| `category` | `text` | e.g. `member`, `admin`, `system` |
| `action` | `text` | e.g. `profile.updated` |
| `target_type` | `text` | — |
| `target_id` | `text` | — |
| `description` | `text` | Human-readable summary |
| `metadata` | `jsonb` | Arbitrary context |
| `ip_address` | `text` | — |

### `api_keys`

External API credentials. RLS enabled but access is via service role client only.

| Column | Type | Notes |
|---|---|---|
| `key_hash` | `text` | SHA-256 of the raw key |
| `key_prefix` | `text` | First 8 chars for display |
| `name` | `text` | Human label |
| `permissions` | `text[]` | e.g. `['read', 'write']` or `['admin']` |
| `active` | `boolean` | Soft disable |
| `request_count` | `bigint` | Usage counter |

---

## Media Library

### `media_items`

Metadata record for every file in Supabase Storage.

| Column | Type | Notes |
|---|---|---|
| `bucket` | `text` | Storage bucket name |
| `folder` | `uuid` | FK → `media_folders`, nullable |
| `file_name` | `text` | — |
| `file_path` | `text` | Storage path |
| `file_url` | `text` | Public URL |
| `file_type` | `text` | MIME type |
| `file_size` | `bigint` | Bytes |
| `width` / `height` | `integer` | Images only |
| `alt_text` | `text` | — |
| `uploaded_by` | `uuid` | FK → `auth.users` |
| `uploaded_by_role` | `text` | Role snapshot at upload time |

### `media_folders`

Hierarchical folder structure for media organisation.

| Column | Type | Notes |
|---|---|---|
| `name` | `text` | — |
| `parent_id` | `uuid` | Self-referential FK (nullable = root) |
| `bucket` | `text` | Default `'media'`. Which storage bucket this folder belongs to. |
| `sort_order` | `integer` | — |
| `is_system` | `boolean` | Default `false`. System folders (created by migrations) vs user-created folders. |

---

## School Owner System

### `schools`

Yoga school registrations. Extended with v1.14 to support the full school owner system.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `owner_id` | `uuid` | FK → `auth.users` |
| `name` | `text` | — |
| `slug` | `text` | Unique, URL-safe identifier |
| `logo_url` | `text` | Supabase Storage URL |
| `description` | `text` | — |
| `short_bio` | `text` | Brief tagline (added v1.14) |
| `bio` | `text` | Full school bio (added v1.14) |
| `video_platform` | `text` | `youtube` \| `vimeo` |
| `video_url` | `text` | — |
| `practice_styles` | `text[]` | e.g. Hatha, Vinyasa |
| `programs_offered` | `text[]` | — |
| `course_delivery_format` | `text` | `in_person` \| `online` \| `hybrid` |
| `location_address` / `location_city` / `location_country` | `text` | Structured location fields |
| `location_lat` / `location_lng` | `double precision` | Coordinates |
| `location_place_id` | `text` | Google Maps place ID |
| `lineage` | `text` | Yoga lineage or tradition |
| `established_year` | `integer` | — |
| `languages` | `text[]` | Languages taught |
| `is_insured` | `boolean` | — |
| `onboarding_completed` | `boolean` | Whether owner completed onboarding |
| `onboarding_completed_at` | `timestamptz` | — |
| `approved_at` | `timestamptz` | When admin approved |
| `approved_by` | `uuid` | FK → `auth.users` |
| `cover_image_url` | `text` | Hero/cover image |
| `status` | `text` | `pending` \| `pending_review` \| `approved` \| `rejected` \| `suspended` |
| `rejection_reason` | `text` | Admin-set on rejection |
| `is_featured` | `boolean` | — |

Storage buckets: `school-logos` (public), `school-documents` (private), `school-covers` (public).

### `school_designations`

Each row represents a yoga designation a school has applied for or holds.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `school_id` | `uuid` | FK → `schools` ON DELETE CASCADE |
| `designation_type` | `text` | `CYS200` \| `CYS300` \| `CYS500` \| `CCYS` \| `CPYS` \| `CMS` \| `CYYS` \| `CRYS` |
| `status` | `text` | `pending` \| `active` \| `suspended` \| `cancelled` |
| `stripe_subscription_id` / `stripe_price_id` | `text` | Stripe references |
| `signup_fee_paid` | `boolean` | — |
| `signup_fee_amount` / `annual_fee_amount` | `integer` | Cents |
| `activated_at` / `cancelled_at` | `timestamptz` | — |

Unique constraint: `(school_id, designation_type)` — one row per designation per school. **RLS:** Enabled (policies TBD in next phase).

### `school_faculty`

Faculty members of a school. Supports both existing GOYA members and pending email invites.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `school_id` | `uuid` | FK → `schools` ON DELETE CASCADE |
| `profile_id` | `uuid` | FK → `profiles`, nullable (set when invite accepted) |
| `invited_email` | `text` | Email for non-member invites |
| `invite_token` | `text` | Unique token for invite link |
| `position` | `text` | Teacher role/title |
| `is_principal_trainer` | `boolean` | Whether this faculty member is the principal trainer |
| `status` | `text` | `pending` \| `active` \| `removed` |

Constraint: `faculty_has_profile_or_email` — at least one of `profile_id` or `invited_email` must be set. **RLS:** Enabled.

### `school_verification_documents`

Documents uploaded for school or designation verification.

| Column | Type | Notes |
|---|---|---|
| `id` | `uuid` | PK |
| `school_id` | `uuid` | FK → `schools` ON DELETE CASCADE |
| `designation_id` | `uuid` | FK → `school_designations`, nullable |
| `document_type` | `text` | `business_registration` \| `qualification_certificate` \| `insurance` \| `other` |
| `file_url` | `text` | Supabase Storage URL |
| `file_name` / `file_size` | `text` / `integer` | — |
| `uploaded_at` | `timestamptz` | — |
| `reviewed_at` | `timestamptz` | When admin reviewed |
| `reviewed_by` | `uuid` | FK → `auth.users` |
| `status` | `text` | `pending` \| `approved` \| `rejected` |
| `rejection_reason` | `text` | — |

**RLS:** Enabled. Storage: `school-documents` private bucket, owner-namespaced paths.

---

## RLS Policy Summary

| Table | Anonymous | Authenticated Member | Admin / Moderator |
|---|---|---|---|
| `profiles` | No access | Read all, update own | Read/write all (service role) |
| `events` | Read published | Read published | Full CRUD |
| `courses` | Read published | Read published + own progress | Full CRUD |
| `credit_entries` | No access | Read/insert own | Full CRUD |
| `connections` | No access | Read/write own connections | — |
| `messages` | No access | Read/write own conversations | — |
| `stripe_*` | No access | No direct access | Full CRUD |
| `webhook_events` | No access | No access | Service role only |
| `api_keys` | No access | No access | Service role only |
| `audit_log` | No access | No access | Read only |
| `email_templates` | No access | No access | Full CRUD |
| `site_settings` | No access | Read (some keys) | Full CRUD |
| `schools` | Read approved | Owner read/update own | Full CRUD |
| `school_designations` | Read (approved schools only) | Owner CRUD own | Full CRUD (admin) |
| `school_faculty` | Read (approved schools only) | Owner CRUD own | Full CRUD (admin) |
| `school_verification_documents` | No access | Owner read/upload own | Full CRUD (admin) |

---

## See Also

- [architecture.md](./architecture.md) — Where migrations fit in the project structure
- [stripe-integration.md](./stripe-integration.md) — Stripe mirror tables and webhook flow
- [email-system.md](./email-system.md) — `email_templates` and `email_log` usage
