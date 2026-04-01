---
title: API Reference
audience: ["developer"]
section: developer
order: 4
last_updated: "2026-03-31"
---

# API Reference

GOYA v2 exposes a versioned REST API at `/api/v1/` for external integrations. All endpoints require an API key.

## Table of Contents

- [Authentication](#authentication)
- [Rate Limiting](#rate-limiting)
- [Response Format](#response-format)
- [Permissions](#permissions)
- [Route Categories](#route-categories)
- [Full Endpoint Reference](#full-endpoint-reference)

---

## Authentication

API requests must include an API key in one of two ways:

**Header (preferred):**
```
x-api-key: goya_your_key_here
```

**Authorization header fallback:**
```
Authorization: Bearer goya_your_key_here
```

Keys are stored in the `api_keys` table as SHA-256 hashes. The raw key is only shown once at creation time. Keys are managed from the admin panel at `/admin/api-keys`.

---

## Rate Limiting

**100 requests per 60-second window** per API key, enforced in-memory per server instance.

When the limit is exceeded, the API returns:

```json
HTTP 429 Too Many Requests
Retry-After: 42

{
  "success": false,
  "error": {
    "code": "RATE_LIMITED",
    "message": "Rate limit exceeded. Max 100 requests per minute."
  },
  "meta": {
    "retry_after": 42
  }
}
```

---

## Response Format

All responses follow a consistent envelope:

**Success:**
```json
{
  "success": true,
  "data": { ... }
}
```

**Error:**
```json
{
  "success": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Human-readable description"
  }
}
```

**Common error codes:**

| Code | HTTP Status | Meaning |
|---|---|---|
| `UNAUTHORIZED` | 401 | Missing or invalid API key |
| `FORBIDDEN` | 403 | Key lacks required permission |
| `NOT_FOUND` | 404 | Resource does not exist |
| `VALIDATION_ERROR` | 400 | Invalid request body or params |
| `RATE_LIMITED` | 429 | Rate limit exceeded |
| `INTERNAL_ERROR` | 500 | Unexpected server error |

---

## Permissions

Each API key has a `permissions` array. Valid values:

| Permission | Access |
|---|---|
| `read` | GET endpoints |
| `write` | POST / PATCH / DELETE endpoints |
| `admin` | Supersedes all other permissions |

Endpoint handlers call `requirePermission(apiKey, 'read' | 'write')` explicitly. The `admin` permission bypasses all permission checks.

---

## Route Categories

| Category | Base Path | Description |
|---|---|---|
| Users | `/api/v1/users` | Member profiles and certification data |
| Events | `/api/v1/events` | Event listings and registrations |
| Courses | `/api/v1/courses` | Academy courses and enrollments |
| Credits | `/api/v1/credits` | CE credit entries and summaries |
| Add-ons | `/api/v1/addons` | Member add-on product assignments |
| Analytics | `/api/v1/analytics` | Revenue, memberships, engagement |
| Webhooks | `/api/v1/webhooks` | Inbound payment and notification webhooks |
| Admin Settings | `/api/v1/admin/settings` | Site settings read/write |

---

## Full Endpoint Reference

For complete request/response schemas, parameter descriptions, and code examples, see:

**[API_DOCS.md](/API_DOCS.md)**

---

## See Also

- [authentication.md](./authentication.md) — Session-based auth (for browser clients)
- [database-schema.md](./database-schema.md) — Underlying tables the API reads from
- [stripe-integration.md](./stripe-integration.md) — The Stripe webhook receiver at `/api/webhooks/stripe`
