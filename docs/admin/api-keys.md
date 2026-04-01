---
title: API Keys
audience: ["admin"]
section: admin
order: 12
last_updated: "2026-03-31"
---

# API Keys

The API Keys page manages two distinct types of credentials: **Own Keys** (keys issued by GOYA for external consumers of the GOYA API) and **Third Party Keys** (keys from external AI providers used internally by features like the chatbot). A third tab documents the available API endpoints.

Navigate to **Settings > API Keys** or go to `/admin/api-keys`.

## Table of Contents

- [Own Keys Tab](#own-keys-tab)
- [Third Party Keys Tab](#third-party-keys-tab)
- [Endpoints Tab](#endpoints-tab)

---

## Own Keys Tab

The **Own Keys** tab (`/admin/api-keys?tab=keys`) lists API keys that grant external services or integrations access to the GOYA API.

### Key table

Each row shows:

| Column | Description |
|---|---|
| **Name** | A human-readable label for the key |
| **Permissions** | Badge pills: **read** (blue), **write** (amber), **admin** (purple) |
| **Last used** | Relative time since the key was last used (or "Never") |
| **Created** | Absolute creation date |
| **Status** | Active or Revoked |
| **Actions** | Copy or Revoke button |

### Creating a key

1. Click **Create API Key** (or the inline form trigger if shown).
2. Enter a **Name** for the key.
3. Select one or more **permissions**: `read`, `write`, `admin`.
4. Click **Create**.

The raw key is displayed once immediately after creation. Copy it now — it is never shown again. After dismissing the dialog, only a masked version of the key is visible.

### Copying a key

Click **Copy** on any active key row to copy the masked key reference. For the full raw key, you must have captured it at creation time.

### Revoking a key

Click **Revoke** on any key row. The key is permanently invalidated — any service using it will receive authentication errors. Revocation cannot be undone.

---

## Third Party Keys Tab

The **Third Party Keys** tab (`/admin/api-keys?tab=secrets`) stores credentials used by GOYA's own features to call external services.

### AI Provider Keys

This section manages AI model credentials used by the chatbot. Each key entry includes:

| Field | Description |
|---|---|
| **Key name** | A label (e.g. "OpenAI GPT-4o") |
| **Model** | The model identifier (e.g. `gpt-4o`) |
| **Provider** | The API provider (e.g. OpenAI, Anthropic) |

To add a new AI provider key, click **Add AI Provider Key** and fill in the key name, model, provider, and the actual API key string. The key is stored encrypted.

Once saved, AI provider keys appear in the chatbot configuration dropdown — see [Chatbot](./chatbot.md#ai-configuration-section).

### Other Secrets

The lower section of this tab manages other third-party secrets (e.g. Stripe keys, email provider credentials, webhook secrets). These are seeded with placeholder entries on first visit. Edit a placeholder to set the actual value.

---

## Endpoints Tab

The **Endpoints** tab (`/admin/api-keys?tab=endpoints`) is a built-in reference guide to the GOYA API. It lists all available endpoints with their:

- HTTP method (GET, POST, PATCH, DELETE)
- URL path
- Required permissions
- Request and response shape

Use this tab to understand what external systems can do with an Own Key before issuing credentials.

---

**See also:** [Chatbot](./chatbot.md) | [Audit Log](./audit-log.md) | [Settings](./settings.md)
