# GOYA REST API v1.0.0

> Complete reference for the GOYA v2 REST API. All endpoints live under `/api/v1/`.

---

## Table of Contents

- [Overview](#overview)
- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Error Codes](#error-codes)
- [Pagination](#pagination)
- [Endpoints](#endpoints)
  - [Health](#health)
  - [Users](#users)
  - [Events](#events)
  - [Courses](#courses)
  - [Credits](#credits)
  - [Verifications](#verifications)
  - [Analytics](#analytics)
  - [Add-ons](#add-ons)
  - [Admin Settings](#admin-settings)
  - [Webhooks](#webhooks)

---

## Overview

**Base URL:** `https://your-domain.com/api/v1`

**API Version:** `1.0.0`

**Content Type:** All requests and responses use `application/json`.

---

## Authentication

Every endpoint (except `GET /api/v1/health`) requires an API key.

### Methods (in priority order)

**1. x-api-key header (primary)**

```
x-api-key: goya_live_abcdef1234567890
```

**2. Authorization: Bearer (fallback)**

```
Authorization: Bearer goya_live_abcdef1234567890
```

### Permission Levels

| Permission | Description |
|------------|-------------|
| `read` | Read-only access: list and fetch resources |
| `write` | Read + write: create, update, delete resources |
| `admin` | Full access: supersedes `read` and `write`; required for admin settings |

API keys carry one or more permissions. An `admin` key satisfies any permission check.

### Example

```bash
curl -X GET https://your-domain.com/api/v1/users \
  -H "x-api-key: goya_live_abcdef1234567890"
```

---

## Rate Limiting

- **Limit:** 100 requests per 60-second window per API key
- **Enforcement:** In-memory sliding window
- **Response on limit exceeded:** `429 Too Many Requests` with `Retry-After` header (seconds until window resets)

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Max 100 requests per minute.",
    "details": { "retry_after": 42 }
  },
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

## Response Format

All responses follow a standard envelope:

```json
{
  "success": true,
  "data": { ... },
  "error": null,
  "meta": {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": { ... }
  }
}
```

| Field | Type | Description |
|-------|------|-------------|
| `success` | `boolean` | `true` on success, `false` on error |
| `data` | `T \| null` | Response payload; `null` on error |
| `error` | `object \| null` | Error detail; `null` on success |
| `meta` | `object` | Always present — includes timestamp, version, and optional pagination |

### Error Object

```json
{
  "code": "NOT_FOUND",
  "message": "User not found",
  "details": {}
}
```

### Pagination Meta

Present on list endpoints when using pagination:

```json
{
  "page": 1,
  "limit": 20,
  "total": 150,
  "total_pages": 8,
  "has_next": true,
  "has_prev": false
}
```

---

## Error Codes

| HTTP Status | Code | Description |
|-------------|------|-------------|
| 400 | `INVALID_BODY` | Request body is not valid JSON |
| 400 | `MISSING_FIELD` | A required field is absent |
| 400 | `INVALID_FIELD` | A field contains an unexpected value or unknown key |
| 400 | `INVALID_VALUE` | A field value is outside allowed enum values |
| 400 | `INVALID_ID` | A path parameter UUID has an invalid format |
| 400 | `MISSING_FIELDS` | At least one field is required but none were provided |
| 401 | `UNAUTHORIZED` | API key is missing or invalid |
| 403 | `FORBIDDEN` | API key lacks the required permission |
| 404 | `NOT_FOUND` | Resource does not exist |
| 409 | `CONFLICT` | Resource already exists (duplicate) |
| 429 | `RATE_LIMITED` | Rate limit exceeded |
| 500 | `INTERNAL_ERROR` | Unexpected server error |
| 500 | `QUERY_ERROR` | Database query failed |

---

## Pagination

List endpoints accept the following query parameters:

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | integer | `1` | Page number (1-based) |
| `limit` | integer | `20` | Items per page (max varies by endpoint) |
| `sort` | string | endpoint-specific | Field to sort by |
| `order` | `asc` \| `desc` | `desc` | Sort direction |

---

## Endpoints

---

### Health

#### GET /api/v1/health

Check API availability. **No authentication required.**

```bash
curl https://your-domain.com/api/v1/health
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "status": "ok",
    "version": "1.0.0",
    "timestamp": "2026-03-27T10:00:00.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

### Users

#### GET /api/v1/users

List users. **Permission: `read`**

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `role` | string | Filter by role: `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin` |
| `status` | string | Filter by subscription status: `member`, `guest` |
| `search` | string | Full-text search across `full_name`, `email`, `username` |
| `date_from` | ISO date string | Filter users created on or after this date |
| `date_to` | ISO date string | Filter users created on or before this date |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |
| `sort` | string | `created_at`, `updated_at`, `full_name`, `email`, `role` (default: `created_at`) |
| `order` | string | `asc` or `desc` (default: `desc`) |

```bash
curl "https://your-domain.com/api/v1/users?role=teacher&status=member&page=1&limit=10" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "full_name": "Jane Doe",
      "email": "jane@example.com",
      "username": "janedoe",
      "role": "teacher",
      "subscription_status": "member",
      "member_type": "teacher",
      "avatar_url": "https://example.com/avatars/jane.jpg",
      "created_at": "2025-06-01T09:00:00.000Z",
      "updated_at": "2026-03-15T14:30:00.000Z"
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 42,
      "total_pages": 5,
      "has_next": true,
      "has_prev": false
    }
  }
}
```

---

#### GET /api/v1/users/:id

Fetch a single user by UUID. **Permission: `read`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

```bash
curl https://your-domain.com/api/v1/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "full_name": "Jane Doe",
    "email": "jane@example.com",
    "username": "janedoe",
    "role": "teacher",
    "subscription_status": "member",
    "member_type": "teacher",
    "avatar_url": "https://example.com/avatars/jane.jpg",
    "bio": "Yoga teacher based in London.",
    "created_at": "2025-06-01T09:00:00.000Z",
    "updated_at": "2026-03-15T14:30:00.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_ID` | ID is not a valid UUID |
| 404 | `NOT_FOUND` | User not found |

---

#### PATCH /api/v1/users/:id

Update a user's role, subscription status, or member type. **Permission: `write`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Request Body**

At least one field required. Only the following fields are accepted:

| Field | Type | Allowed Values |
|-------|------|----------------|
| `role` | string | `student`, `teacher`, `wellness_practitioner`, `moderator`, `admin` |
| `subscription_status` | string | `member`, `guest` |
| `member_type` | string \| null | `student`, `teacher`, `wellness_practitioner`, or `null` |

```bash
curl -X PATCH https://your-domain.com/api/v1/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"role": "teacher", "subscription_status": "member"}'
```

**Response `200`** — Returns updated user object (same shape as GET).

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_ID` | ID is not a valid UUID |
| 400 | `INVALID_FIELD` | Body contains a field not in the allowed list |
| 400 | `INVALID_VALUE` | Field value is not in the allowed enum |
| 400 | `MISSING_FIELDS` | No fields provided |
| 404 | `NOT_FOUND` | User not found |

---

#### GET /api/v1/users/:id/credits

List credit entries for a user. **Permission: `read`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

**Query Parameters:** Standard pagination params (`page`, `limit`, `sort`, `order`).

```bash
curl "https://your-domain.com/api/v1/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/credits?page=1&limit=10" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Paginated list of credit records (same shape as `GET /api/v1/credits` items).

---

#### GET /api/v1/users/:id/certifications

List certifications for a user. **Permission: `read`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

```bash
curl https://your-domain.com/api/v1/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/certifications \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "cert-uuid",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "200-Hour Yoga Teacher Training",
      "issuer": "Yoga Alliance",
      "issued_at": "2024-05-10T00:00:00.000Z"
    }
  ],
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

#### GET /api/v1/users/:id/verifications

Get the verification record for a user. **Permission: `read`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | User ID |

```bash
curl https://your-domain.com/api/v1/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/verifications \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "verification_status": "verified",
    "is_verified": true,
    "certificate_url": "https://example.com/certs/jane.pdf",
    "certificate_is_official": true,
    "verified_at": "2025-08-01T12:00:00.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_ID` | ID is not a valid UUID |
| 404 | `NOT_FOUND` | User not found |

---

### Events

#### GET /api/v1/events

List events. **Permission: `read`**

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | `Workshop`, `Teacher Training`, `Dharma Talk`, `Conference`, `Yoga Sequence`, `Music Playlist`, `Research` |
| `status` | string | `published`, `draft`, `cancelled`, `deleted` |
| `format` | string | `Online`, `In Person`, `Hybrid` |
| `date_from` | ISO date string | Filter events on or after this date |
| `date_to` | ISO date string | Filter events on or before this date |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |
| `sort` | string | Sortable field (default: `created_at`) |
| `order` | string | `asc` or `desc` (default: `desc`) |

Note: Soft-deleted events (`deleted_at IS NOT NULL`) are excluded from results automatically.

```bash
curl "https://your-domain.com/api/v1/events?category=Workshop&status=published&format=Online" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "e1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Morning Vinyasa Workshop",
      "category": "Workshop",
      "format": "Online",
      "status": "published",
      "date": "2026-04-15",
      "time_start": "08:00",
      "time_end": "10:00",
      "description": "A dynamic morning flow.",
      "location": null,
      "instructor": "Jane Doe",
      "price": 0,
      "is_free": true,
      "spots_total": 30,
      "spots_remaining": 12,
      "featured_image_url": "https://example.com/images/vinyasa.jpg",
      "created_at": "2026-03-01T10:00:00.000Z",
      "updated_at": "2026-03-10T14:00:00.000Z"
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1, "has_next": false, "has_prev": false }
  }
}
```

---

#### GET /api/v1/events/:id

Fetch a single event by UUID. **Permission: `read`**

```bash
curl https://your-domain.com/api/v1/events/e1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns full event object (same shape as list items).

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### POST /api/v1/events

Create an event. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `title` | Yes | string | Event title |
| `category` | Yes | string | `Workshop`, `Teacher Training`, `Dharma Talk`, `Conference`, `Yoga Sequence`, `Music Playlist`, `Research` |
| `format` | Yes | string | `Online`, `In Person`, `Hybrid` |
| `date` | Yes | string | Date in `YYYY-MM-DD` format |
| `time_start` | Yes | string | Start time, e.g. `"08:00"` |
| `time_end` | Yes | string | End time, e.g. `"10:00"` |
| `description` | No | string \| null | Event description |
| `location` | No | string \| null | Physical location (for In Person/Hybrid) |
| `instructor` | No | string \| null | Instructor name |
| `price` | No | number | Price in currency units (default `0`) |
| `is_free` | No | boolean | Whether the event is free |
| `spots_total` | No | number \| null | Total capacity |
| `spots_remaining` | No | number \| null | Remaining spots |
| `featured_image_url` | No | string \| null | Image URL |
| `status` | No | string | `published`, `draft`, `cancelled`, `deleted` (default: `draft`) |

```bash
curl -X POST https://your-domain.com/api/v1/events \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Yin Yoga Deep Dive",
    "category": "Workshop",
    "format": "Online",
    "date": "2026-05-10",
    "time_start": "18:00",
    "time_end": "20:00",
    "is_free": true,
    "status": "published"
  }'
```

**Response `201`** — Returns created event object.

---

#### PATCH /api/v1/events/:id

Update an event. **Permission: `write`**

**Path Parameters:** `id` (UUID)

**Request Body** — At least one field required. Allowed fields: `title`, `category`, `format`, `date`, `time_start`, `time_end`, `description`, `location`, `instructor`, `price`, `is_free`, `spots_total`, `spots_remaining`, `featured_image_url`, `status`.

```bash
curl -X PATCH https://your-domain.com/api/v1/events/e1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"status": "cancelled"}'
```

**Response `200`** — Returns updated event object.

**Error Responses:** `400 INVALID_ID`, `400 INVALID_FIELD`, `400 INVALID_VALUE`, `400 MISSING_FIELDS`, `404 NOT_FOUND`

---

#### DELETE /api/v1/events/:id

Soft-delete an event (sets `deleted_at` and `status = "deleted"`). **Permission: `write`**

**Path Parameters:** `id` (UUID)

```bash
curl -X DELETE https://your-domain.com/api/v1/events/e1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns the soft-deleted event object.

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### POST /api/v1/events/:id/registrations

Register a user for an event. **Permission: `write`**

**Path Parameters:** `id` (UUID) — event ID

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `user_id` | Yes | UUID | User to register |

```bash
curl -X POST https://your-domain.com/api/v1/events/e1b2c3d4-e5f6-7890-abcd-ef1234567890/registrations \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

**Response `201`**

```json
{
  "success": true,
  "data": {
    "id": "reg-uuid",
    "event_id": "e1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "registered_at": "2026-03-27T10:00:00.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

**Error Responses**

| Status | Code | Description |
|--------|------|-------------|
| 400 | `INVALID_ID` | Event or user ID not a valid UUID |
| 400 | `MISSING_FIELD` | `user_id` not provided |
| 404 | `NOT_FOUND` | Event not found |
| 409 | `CONFLICT` | User already registered |
| 409 | `NO_SPOTS` | No spots remaining |

---

#### DELETE /api/v1/events/:id/registrations/:userId

Remove a user's event registration. **Permission: `write`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Event ID |
| `userId` | UUID | User ID |

```bash
curl -X DELETE "https://your-domain.com/api/v1/events/e1b2c3d4-e5f6-7890-abcd-ef1234567890/registrations/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns the removed registration record.

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

### Courses

#### GET /api/v1/courses

List courses. **Permission: `read`**

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | `Workshop`, `Yoga Sequence`, `Dharma Talk`, `Music Playlist`, `Research` |
| `level` | string | `Beginner`, `Intermediate`, `Advanced`, `All Levels` |
| `access` | string | `members_only`, `free` |
| `status` | string | `published`, `draft`, `deleted` |
| `search` | string | Search by title/description |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |
| `sort` | string | Sortable field (default: `created_at`) |
| `order` | string | `asc` or `desc` (default: `desc`) |

Note: Soft-deleted courses are excluded automatically.

```bash
curl "https://your-domain.com/api/v1/courses?level=Beginner&access=free&status=published" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Paginated list of course objects.

```json
{
  "success": true,
  "data": [
    {
      "id": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "title": "Foundations of Hatha Yoga",
      "category": "Yoga Sequence",
      "level": "Beginner",
      "access": "free",
      "status": "published",
      "short_description": "Learn the fundamentals.",
      "instructor": "Jane Doe",
      "duration": "4 hours",
      "vimeo_url": null,
      "thumbnail_url": "https://example.com/thumbs/hatha.jpg",
      "gradient_from": "#6366f1",
      "gradient_to": "#8b5cf6",
      "created_at": "2025-09-01T10:00:00.000Z",
      "updated_at": "2026-02-15T09:00:00.000Z"
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": { "page": 1, "limit": 20, "total": 12, "total_pages": 1, "has_next": false, "has_prev": false }
  }
}
```

---

#### GET /api/v1/courses/:id

Fetch a single course by UUID. **Permission: `read`**

```bash
curl https://your-domain.com/api/v1/courses/c1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns full course object. **Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### POST /api/v1/courses

Create a course. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `title` | Yes | string | Course title |
| `category` | Yes | string | `Workshop`, `Yoga Sequence`, `Dharma Talk`, `Music Playlist`, `Research` |
| `short_description` | No | string \| null | Brief summary |
| `description` | No | string \| null | Full description |
| `instructor` | No | string \| null | Instructor name |
| `duration` | No | string \| null | Human-readable duration, e.g. `"4 hours"` |
| `level` | No | string \| null | `Beginner`, `Intermediate`, `Advanced`, `All Levels` |
| `access` | No | string | `members_only`, `free` (default: `members_only`) |
| `vimeo_url` | No | string \| null | Vimeo embed URL |
| `thumbnail_url` | No | string \| null | Thumbnail image URL |
| `gradient_from` | No | string | CSS color for gradient start |
| `gradient_to` | No | string | CSS color for gradient end |
| `status` | No | string | `published`, `draft`, `deleted` (default: `draft`) |

```bash
curl -X POST https://your-domain.com/api/v1/courses \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Advanced Pranayama",
    "category": "Yoga Sequence",
    "level": "Advanced",
    "access": "members_only",
    "status": "published"
  }'
```

**Response `201`** — Returns created course object.

---

#### PATCH /api/v1/courses/:id

Update a course. **Permission: `write`**

**Path Parameters:** `id` (UUID)

**Request Body** — At least one field required. Allowed fields: `title`, `category`, `short_description`, `description`, `instructor`, `duration`, `level`, `access`, `vimeo_url`, `thumbnail_url`, `gradient_from`, `gradient_to`, `status`.

```bash
curl -X PATCH https://your-domain.com/api/v1/courses/c1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"status": "published", "level": "Intermediate"}'
```

**Response `200`** — Returns updated course object.

---

#### DELETE /api/v1/courses/:id

Soft-delete a course (sets `deleted_at` and `status = "deleted"`). **Permission: `write`**

```bash
curl -X DELETE https://your-domain.com/api/v1/courses/c1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns the soft-deleted course object.

---

#### GET /api/v1/courses/:id/enrollments

List enrollments for a course. **Permission: `read`**

**Path Parameters:** `id` (UUID) — course ID

**Query Parameters:** Standard pagination params.

```bash
curl "https://your-domain.com/api/v1/courses/c1b2c3d4-e5f6-7890-abcd-ef1234567890/enrollments" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Paginated list of enrollment objects.

```json
{
  "success": true,
  "data": [
    {
      "id": "enroll-uuid",
      "course_id": "c1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "status": "in_progress",
      "completed_at": null,
      "enrolled_at": "2026-01-10T08:00:00.000Z"
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": { "page": 1, "limit": 20, "total": 3, "total_pages": 1, "has_next": false, "has_prev": false }
  }
}
```

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### POST /api/v1/courses/:id/enrollments

Enroll a user in a course. **Permission: `write`**

**Path Parameters:** `id` (UUID) — course ID

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `user_id` | Yes | UUID | User to enroll |

```bash
curl -X POST https://your-domain.com/api/v1/courses/c1b2c3d4-e5f6-7890-abcd-ef1234567890/enrollments \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"}'
```

**Response `201`** — Returns created enrollment object.

**Error Responses:** `404 NOT_FOUND` (course), `409 CONFLICT` (already enrolled)

---

#### PATCH /api/v1/courses/:id/enrollments/:userId

Update a user's enrollment progress. **Permission: `write`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | UUID | Course ID |
| `userId` | UUID | User ID |

**Request Body** — At least one field required.

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `in_progress`, `completed` |
| `completed_at` | ISO string \| null | Completion timestamp; auto-cleared when status reverts to `in_progress` |

```bash
curl -X PATCH "https://your-domain.com/api/v1/courses/c1b2c3d4-e5f6-7890-abcd-ef1234567890/enrollments/a1b2c3d4-e5f6-7890-abcd-ef1234567890" \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"status": "completed", "completed_at": "2026-03-27T10:00:00.000Z"}'
```

**Response `200`** — Returns updated enrollment object.

**Error Responses:** `400 INVALID_ID`, `400 INVALID_VALUE`, `400 UNKNOWN_FIELDS`, `404 NOT_FOUND`

---

### Credits

#### GET /api/v1/credits

List credit entries. **Permission: `read`**

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `user_id` | UUID string | Filter by user |
| `credit_type` | string | `ce`, `karma`, `practice`, `teaching`, `community` |
| `status` | string | `pending`, `approved`, `rejected` |
| `date_from` | ISO date string | Filter entries on or after this date |
| `date_to` | ISO date string | Filter entries on or before this date |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |
| `sort` | string | Sortable field |
| `order` | string | `asc` or `desc` |

```bash
curl "https://your-domain.com/api/v1/credits?user_id=a1b2c3d4-e5f6-7890-abcd-ef1234567890&status=approved" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Paginated list of credit objects.

```json
{
  "success": true,
  "data": [
    {
      "id": "cred-uuid",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "credit_type": "ce",
      "amount": 2.5,
      "activity_date": "2026-03-01",
      "description": "Attended Advanced Pranayama course",
      "status": "approved",
      "source": "manual",
      "created_at": "2026-03-02T09:00:00.000Z"
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": { "page": 1, "limit": 20, "total": 8, "total_pages": 1, "has_next": false, "has_prev": false }
  }
}
```

---

#### GET /api/v1/credits/:id

Fetch a single credit entry by UUID. **Permission: `read`**

```bash
curl https://your-domain.com/api/v1/credits/cred-uuid \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns credit object. **Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### POST /api/v1/credits

Create a credit entry. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `user_id` | Yes | UUID | User receiving the credit |
| `credit_type` | Yes | string | `ce`, `karma`, `practice`, `teaching`, `community` |
| `amount` | Yes | number | Must be greater than 0 |
| `activity_date` | Yes | string | Date in `YYYY-MM-DD` format |
| `description` | No | string \| null | Description of the activity |
| `source` | No | string | `manual`, `automatic` (default: `manual`) |
| `status` | No | string | `pending`, `approved`, `rejected` (default: `pending`) |

```bash
curl -X POST https://your-domain.com/api/v1/credits \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "credit_type": "ce",
    "amount": 3,
    "activity_date": "2026-03-27",
    "description": "CPD workshop attendance",
    "status": "approved"
  }'
```

**Response `201`** — Returns created credit object.

---

#### PATCH /api/v1/credits/:id

Update a credit entry's status or rejection reason. **Permission: `write`**

**Path Parameters:** `id` (UUID)

**Request Body** — Only `status` and `rejection_reason` may be updated.

| Field | Type | Description |
|-------|------|-------------|
| `status` | string | `pending`, `approved`, `rejected` |
| `rejection_reason` | string \| null | Reason for rejection |

```bash
curl -X PATCH https://your-domain.com/api/v1/credits/cred-uuid \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"status": "rejected", "rejection_reason": "Duplicate submission"}'
```

**Response `200`** — Returns updated credit object.

**Error Responses:** `400 INVALID_ID`, `400 INVALID_FIELD`, `400 INVALID_VALUE`, `404 NOT_FOUND`

---

#### GET /api/v1/credits/summary/:userId

Get a credit summary (totals by type) for a user. **Permission: `read`**

**Path Parameters:** `userId` (UUID)

```bash
curl https://your-domain.com/api/v1/credits/summary/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "totals": {
      "ce": 12.5,
      "karma": 5,
      "practice": 0,
      "teaching": 8,
      "community": 2
    },
    "total_approved": 27.5
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

**Error Responses:** `400 INVALID_ID`

---

### Verifications

#### GET /api/v1/verifications

List verification records. **Permission: `read`**

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `verification_status` | string | `unverified`, `pending`, `verified`, `rejected` |
| `member_type` | string | Filter by member type |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |
| `sort` | string | Sortable field |
| `order` | string | `asc` or `desc` |

```bash
curl "https://your-domain.com/api/v1/verifications?verification_status=pending" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Paginated list of verification records (profile-level verification data).

---

#### GET /api/v1/verifications/:id

Fetch a single verification record by profile UUID. **Permission: `read`**

```bash
curl https://your-domain.com/api/v1/verifications/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns verification data.

```json
{
  "success": true,
  "data": {
    "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "verification_status": "pending",
    "is_verified": false,
    "certificate_url": "https://example.com/certs/jane.pdf",
    "certificate_is_official": false
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### POST /api/v1/verifications

Initiate a verification for a user. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `user_id` | Yes | UUID | User to initiate verification for |
| `certificate_url` | No | string \| null | Certificate document URL |
| `certificate_is_official` | No | boolean | Whether the certificate is officially issued |

Note: This sets the user's profile `verification_status` to `pending`.

```bash
curl -X POST https://your-domain.com/api/v1/verifications \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    "certificate_url": "https://example.com/certs/jane.pdf",
    "certificate_is_official": true
  }'
```

**Response `201`** — Returns the updated profile record with verification fields.

**Error Responses:** `400 MISSING_FIELD`, `400 INVALID_VALUE`, `404 NOT_FOUND`

---

#### PATCH /api/v1/verifications/:id

Update a verification record. **Permission: `write`**

**Path Parameters:** `id` (UUID) — profile UUID

**Request Body** — Allowed fields from `ALLOWED_VERIFICATION_UPDATE_FIELDS` (e.g., `verification_status`, `certificate_url`, `certificate_is_official`). At least one field required.

| Field | Type | Description |
|-------|------|-------------|
| `verification_status` | string | `unverified`, `pending`, `verified`, `rejected` |
| `certificate_url` | string \| null | Certificate URL |
| `certificate_is_official` | boolean | Whether certificate is official |

Note: Setting `verification_status = "verified"` automatically syncs `is_verified = true`.

```bash
curl -X PATCH https://your-domain.com/api/v1/verifications/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"verification_status": "verified"}'
```

**Response `200`** — Returns updated profile record.

---

#### DELETE /api/v1/verifications/:id

Reset a verification record (clears verification fields). **Permission: `write`**

**Path Parameters:** `id` (UUID) — profile UUID

```bash
curl -X DELETE https://your-domain.com/api/v1/verifications/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns the profile with verification fields reset.

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

### Analytics

All analytics endpoints require **`read`** permission. All analytics are computed from local Supabase mirror tables (no live Stripe API calls).

---

#### GET /api/v1/analytics/overview

Get high-level platform metrics. **Permission: `read`**

```bash
curl https://your-domain.com/api/v1/analytics/overview \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "total_users": 1250,
    "active_members": 890,
    "total_events": 48,
    "total_courses": 32,
    "total_credits_issued": 4820.5,
    "new_users_last_30_days": 42
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

#### GET /api/v1/analytics/memberships

Get membership growth and breakdown statistics. **Permission: `read`**

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `date_from` | ISO date string | Filter data from this date |
| `date_to` | ISO date string | Filter data up to this date |

```bash
curl "https://your-domain.com/api/v1/analytics/memberships?date_from=2026-01-01&date_to=2026-03-31" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "total_members": 890,
    "by_role": {
      "student": 450,
      "teacher": 280,
      "wellness_practitioner": 160
    },
    "by_status": {
      "member": 890,
      "guest": 360
    },
    "time_series": [
      { "date": "2026-01-01", "new_members": 12 },
      { "date": "2026-01-08", "new_members": 9 }
    ],
    "granularity": "weekly"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

Note: Granularity auto-selects daily (date range ≤60 days) or weekly (>60 days).

---

#### GET /api/v1/analytics/revenue

Get revenue metrics. **Permission: `read`**

**Query Parameters:** `date_from`, `date_to` (optional ISO date strings)

```bash
curl "https://your-domain.com/api/v1/analytics/revenue?date_from=2026-01-01" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "total_revenue_cents": 128500,
    "mrr_cents": 42000,
    "arr_cents": 504000,
    "by_product": [
      { "product": "Annual Membership", "revenue_cents": 84000, "count": 42 }
    ],
    "time_series": [
      { "date": "2026-01-01", "revenue_cents": 15000 }
    ]
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

#### GET /api/v1/analytics/engagement

Get engagement metrics (events, courses, enrollments). **Permission: `read`**

**Query Parameters:** `date_from`, `date_to` (optional ISO date strings)

```bash
curl https://your-domain.com/api/v1/analytics/engagement \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "event_registrations_total": 520,
    "course_enrollments_total": 318,
    "course_completions_total": 145,
    "completion_rate": 0.456,
    "active_learners": 210,
    "time_series": [
      { "date": "2026-01-01", "registrations": 14, "enrollments": 8 }
    ]
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

#### GET /api/v1/analytics/credits

Get CPD credit statistics. **Permission: `read`**

**Query Parameters:** `date_from`, `date_to` (optional ISO date strings)

```bash
curl https://your-domain.com/api/v1/analytics/credits \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "total_credits_issued": 4820.5,
    "pending_credits": 142,
    "approved_credits": 4678.5,
    "by_type": {
      "ce": 1200,
      "karma": 800,
      "practice": 1400,
      "teaching": 900,
      "community": 520.5
    },
    "time_series": [
      { "date": "2026-01-01", "approved": 120.5 }
    ]
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

### Add-ons

#### GET /api/v1/addons

List add-on products. **Permission: `read`**

**Query Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `category` | string | Filter by add-on category (see valid values in response) |
| `search` | string | Search by name or description |
| `page` | integer | Default: `1` |
| `limit` | integer | Default: `20` |
| `sort` | string | Sortable field |
| `order` | string | `asc` or `desc` |

Note: Invalid `category` values return a `400 INVALID_VALUE` error.

```bash
curl https://your-domain.com/api/v1/addons \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Paginated list of add-on product objects.

```json
{
  "success": true,
  "data": [
    {
      "id": "addon-uuid",
      "slug": "teacher-designation",
      "name": "Teacher",
      "full_name": "Registered Yoga Teacher",
      "category": "designation",
      "price_display": "£99/yr",
      "price_cents": 9900,
      "description": "Official RYT designation.",
      "is_active": true,
      "priority": 1,
      "features": ["Badge on profile", "Teacher directory listing"]
    }
  ],
  "error": null,
  "meta": {
    "timestamp": "2026-03-27T10:00:00.000Z",
    "version": "1.0.0",
    "pagination": { "page": 1, "limit": 20, "total": 5, "total_pages": 1, "has_next": false, "has_prev": false }
  }
}
```

---

#### GET /api/v1/addons/:id

Fetch a single add-on by UUID. **Permission: `read`**

Note: Returns even inactive add-ons (for admin visibility).

```bash
curl https://your-domain.com/api/v1/addons/addon-uuid \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns add-on object. **Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### POST /api/v1/addons

Create an add-on product. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `slug` | Yes | string | URL-friendly unique identifier |
| `name` | Yes | string | Short display name |
| `full_name` | Yes | string | Full product name |
| `category` | Yes | string | Valid add-on category |
| `price_display` | Yes | string | Human-readable price, e.g. `"£99/yr"` |
| `price_cents` | No | number | Price in smallest currency unit |
| `image_path` | No | string \| null | Image path |
| `description` | No | string \| null | Description |
| `features` | No | array | Feature list |
| `requires_any_of` | No | string[] | Prerequisite add-on slugs |
| `hidden_if_has_any` | No | string[] | Hide this add-on if user has any of these |
| `has_variants` | No | boolean | Whether add-on has variants |
| `variants` | No | any | Variant definitions |
| `priority` | No | number | Display priority (lower = higher) |
| `is_active` | No | boolean | Whether add-on is active (default: `true`) |

```bash
curl -X POST https://your-domain.com/api/v1/addons \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "school-owner",
    "name": "School",
    "full_name": "School Owner Designation",
    "category": "designation",
    "price_display": "£149/yr"
  }'
```

**Response `201`** — Returns created add-on object.

---

#### PATCH /api/v1/addons/:id

Update an add-on product. **Permission: `write`**

**Path Parameters:** `id` (UUID)

**Request Body** — At least one field required. Unknown fields return a `400 INVALID_FIELD` error. Updatable fields include: `name`, `full_name`, `category`, `price_display`, `price_cents`, `image_path`, `description`, `features`, `requires_any_of`, `hidden_if_has_any`, `has_variants`, `variants`, `priority`, `is_active`.

```bash
curl -X PATCH https://your-domain.com/api/v1/addons/addon-uuid \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"is_active": false, "priority": 10}'
```

**Response `200`** — Returns updated add-on object.

---

#### DELETE /api/v1/addons/:id

Soft-delete an add-on (sets `is_active = false`). **Permission: `write`**

```bash
curl -X DELETE https://your-domain.com/api/v1/addons/addon-uuid \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns the deactivated add-on object.

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

#### GET /api/v1/addons/users/:userId

Get all add-ons assigned to a user. **Permission: `read`**

**Path Parameters:** `userId` (UUID)

```bash
curl https://your-domain.com/api/v1/addons/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": [
    {
      "id": "assign-uuid",
      "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      "stripe_product_id": "prod_XXXXXXXXXXXX",
      "stripe_price_id": "price_XXXXXXXXXXXX",
      "assigned_at": "2026-02-10T12:00:00.000Z"
    }
  ],
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

#### POST /api/v1/addons/users/:userId

Assign an add-on to a user. **Permission: `write`**

**Path Parameters:** `userId` (UUID)

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `stripe_product_id` | Yes | string | Stripe product ID (e.g., `prod_XXXX`) |
| `stripe_price_id` | Yes | string | Stripe price ID (e.g., `price_XXXX`) |

```bash
curl -X POST https://your-domain.com/api/v1/addons/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890 \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "stripe_product_id": "prod_XXXXXXXXXXXX",
    "stripe_price_id": "price_XXXXXXXXXXXX"
  }'
```

**Response `201`** — Returns the created assignment record.

**Error Responses:** `400 MISSING_FIELD`, `400 INVALID_ID`, `409 ALREADY_ASSIGNED`

---

#### DELETE /api/v1/addons/users/:userId/:addonId

Remove an add-on assignment from a user. **Permission: `write`**

**Path Parameters**

| Parameter | Type | Description |
|-----------|------|-------------|
| `userId` | UUID | User ID |
| `addonId` | UUID | Assignment row ID (`user_designations.id`, not the product ID) |

```bash
curl -X DELETE "https://your-domain.com/api/v1/addons/users/a1b2c3d4-e5f6-7890-abcd-ef1234567890/assign-uuid" \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`** — Returns the removed assignment record.

**Error Responses:** `400 INVALID_ID`, `404 NOT_FOUND`

---

### Admin Settings

All admin settings endpoints require **`admin`** permission.

---

#### GET /api/v1/admin/settings

Retrieve all site settings as a key-value map. **Permission: `admin`**

```bash
curl https://your-domain.com/api/v1/admin/settings \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "site_name": "GOYA",
    "maintenance_mode": "false",
    "contact_email": "hello@goya.com",
    "analytics_enabled": "true"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

---

#### PATCH /api/v1/admin/settings

Bulk update multiple settings. **Permission: `admin`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `settings` | Yes | object | Non-empty object of `{ key: value }` string pairs |

All values must be strings. Setting keys must match `[a-z0-9_]+` format.

```bash
curl -X PATCH https://your-domain.com/api/v1/admin/settings \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "settings": {
      "maintenance_mode": "true",
      "site_name": "GOYA Community"
    }
  }'
```

**Response `200`** — Returns the full updated settings map.

**Error Responses:** `400 INVALID_BODY` (invalid settings object), `400 INVALID_VALUE` (non-string value)

---

#### GET /api/v1/admin/settings/:key

Get a single setting by key. **Permission: `admin`**

**Path Parameters:** `key` (string matching `[a-z0-9_]+`)

```bash
curl https://your-domain.com/api/v1/admin/settings/maintenance_mode \
  -H "x-api-key: goya_live_abcdef1234567890"
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "id": "setting-uuid",
    "key": "maintenance_mode",
    "value": "false",
    "updated_at": "2026-03-20T09:00:00.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:00.000Z", "version": "1.0.0" }
}
```

**Error Responses:** `400 INVALID_KEY`, `404 NOT_FOUND`

---

#### PATCH /api/v1/admin/settings/:key

Update a single setting value. **Permission: `admin`**

**Path Parameters:** `key` (string matching `[a-z0-9_]+`)

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `value` | Yes | string | New setting value (can be empty string) |

```bash
curl -X PATCH https://your-domain.com/api/v1/admin/settings/maintenance_mode \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{"value": "true"}'
```

**Response `200`** — Returns the updated setting row.

**Error Responses:** `400 INVALID_KEY`, `400 INVALID_VALUE`, `404 NOT_FOUND`

---

### Webhooks

All webhook endpoints require **`write`** permission. They are intended for external services to push events into GOYA.

---

#### POST /api/v1/webhooks/trigger

Receive a generic event trigger from an external service. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `type` | Yes | string | Event type identifier, e.g. `"user.updated"`, `"course.completed"` |
| `payload` | Yes | object | Arbitrary JSON payload for the event |
| `timestamp` | No | ISO string | Timestamp of the triggering event |

```bash
curl -X POST https://your-domain.com/api/v1/webhooks/trigger \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "course.completed",
    "payload": { "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890", "course_id": "c1b2..." },
    "timestamp": "2026-03-27T10:00:00.000Z"
  }'
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "success": true,
    "event_type": "course.completed",
    "received_at": "2026-03-27T10:00:05.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:05.000Z", "version": "1.0.0" }
}
```

**Error Responses:** `400 INVALID_BODY`, `400 INVALID_PAYLOAD` (missing/invalid `type` or `payload`)

---

#### POST /api/v1/webhooks/payment

Report a payment event from an external payment processor. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `transaction_id` | Yes | string | External payment reference |
| `amount_cents` | Yes | number | Payment amount in smallest currency unit |
| `currency` | Yes | string | 3-character ISO currency code, e.g. `"GBP"` |
| `status` | Yes | string | `"completed"`, `"refunded"`, `"failed"` |
| `user_id` | No | UUID | GOYA user ID, if known |
| `metadata` | No | object | Additional context |

```bash
curl -X POST https://your-domain.com/api/v1/webhooks/payment \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "transaction_id": "ext_txn_abc123",
    "amount_cents": 9900,
    "currency": "GBP",
    "status": "completed",
    "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890"
  }'
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "success": true,
    "transaction_id": "ext_txn_abc123",
    "status": "completed",
    "received_at": "2026-03-27T10:00:05.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:05.000Z", "version": "1.0.0" }
}
```

**Error Responses:** `400 INVALID_PAYLOAD` (invalid `transaction_id`, `amount_cents`, `currency`, or `status`)

---

#### POST /api/v1/webhooks/notify

Send an in-app or email notification to one or more users. **Permission: `write`**

**Request Body**

| Field | Required | Type | Description |
|-------|----------|------|-------------|
| `user_ids` | Yes | string[] | Non-empty array of user UUIDs |
| `message` | Yes | string | Notification message content |
| `channel` | No | string | `"email"` or `"in_app"` (default: `"in_app"`) |
| `metadata` | No | object | Additional context |

```bash
curl -X POST https://your-domain.com/api/v1/webhooks/notify \
  -H "x-api-key: goya_live_abcdef1234567890" \
  -H "Content-Type: application/json" \
  -d '{
    "user_ids": ["a1b2c3d4-e5f6-7890-abcd-ef1234567890"],
    "message": "Your verification has been approved!",
    "channel": "email"
  }'
```

**Response `200`**

```json
{
  "success": true,
  "data": {
    "success": true,
    "notified_count": 1,
    "channel": "email",
    "received_at": "2026-03-27T10:00:05.000Z"
  },
  "error": null,
  "meta": { "timestamp": "2026-03-27T10:00:05.000Z", "version": "1.0.0" }
}
```

**Error Responses:** `400 INVALID_PAYLOAD` (invalid `user_ids`, `message`, or `channel`)

---

## Quick Reference

| Method | Path | Permission | Description |
|--------|------|-----------|-------------|
| GET | `/api/v1/health` | None | Health check |
| GET | `/api/v1/users` | read | List users |
| GET | `/api/v1/users/:id` | read | Get user |
| PATCH | `/api/v1/users/:id` | write | Update user |
| GET | `/api/v1/users/:id/credits` | read | User's credit history |
| GET | `/api/v1/users/:id/certifications` | read | User's certifications |
| GET | `/api/v1/users/:id/verifications` | read | User's verification record |
| GET | `/api/v1/events` | read | List events |
| GET | `/api/v1/events/:id` | read | Get event |
| POST | `/api/v1/events` | write | Create event |
| PATCH | `/api/v1/events/:id` | write | Update event |
| DELETE | `/api/v1/events/:id` | write | Soft-delete event |
| POST | `/api/v1/events/:id/registrations` | write | Register user for event |
| DELETE | `/api/v1/events/:id/registrations/:userId` | write | Remove event registration |
| GET | `/api/v1/courses` | read | List courses |
| GET | `/api/v1/courses/:id` | read | Get course |
| POST | `/api/v1/courses` | write | Create course |
| PATCH | `/api/v1/courses/:id` | write | Update course |
| DELETE | `/api/v1/courses/:id` | write | Soft-delete course |
| GET | `/api/v1/courses/:id/enrollments` | read | List enrollments |
| POST | `/api/v1/courses/:id/enrollments` | write | Enroll user |
| PATCH | `/api/v1/courses/:id/enrollments/:userId` | write | Update enrollment progress |
| GET | `/api/v1/credits` | read | List credits |
| GET | `/api/v1/credits/:id` | read | Get credit entry |
| POST | `/api/v1/credits` | write | Create credit entry |
| PATCH | `/api/v1/credits/:id` | write | Update credit status |
| GET | `/api/v1/credits/summary/:userId` | read | User credit summary |
| GET | `/api/v1/verifications` | read | List verifications |
| GET | `/api/v1/verifications/:id` | read | Get verification |
| POST | `/api/v1/verifications` | write | Initiate verification |
| PATCH | `/api/v1/verifications/:id` | write | Update verification |
| DELETE | `/api/v1/verifications/:id` | write | Reset verification |
| GET | `/api/v1/analytics/overview` | read | Platform overview metrics |
| GET | `/api/v1/analytics/memberships` | read | Membership statistics |
| GET | `/api/v1/analytics/revenue` | read | Revenue metrics |
| GET | `/api/v1/analytics/engagement` | read | Engagement metrics |
| GET | `/api/v1/analytics/credits` | read | Credit statistics |
| GET | `/api/v1/addons` | read | List add-ons |
| GET | `/api/v1/addons/:id` | read | Get add-on |
| POST | `/api/v1/addons` | write | Create add-on |
| PATCH | `/api/v1/addons/:id` | write | Update add-on |
| DELETE | `/api/v1/addons/:id` | write | Soft-delete add-on |
| GET | `/api/v1/addons/users/:userId` | read | User's add-ons |
| POST | `/api/v1/addons/users/:userId` | write | Assign add-on to user |
| DELETE | `/api/v1/addons/users/:userId/:addonId` | write | Remove add-on assignment |
| GET | `/api/v1/admin/settings` | admin | Get all settings |
| PATCH | `/api/v1/admin/settings` | admin | Bulk update settings |
| GET | `/api/v1/admin/settings/:key` | admin | Get setting by key |
| PATCH | `/api/v1/admin/settings/:key` | admin | Update setting by key |
| POST | `/api/v1/webhooks/trigger` | write | Receive generic event trigger |
| POST | `/api/v1/webhooks/payment` | write | Receive payment event |
| POST | `/api/v1/webhooks/notify` | write | Send notifications to users |
