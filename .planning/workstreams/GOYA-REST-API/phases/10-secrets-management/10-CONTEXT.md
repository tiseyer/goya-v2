# Phase 10: Secrets Management - Context

**Gathered:** 2026-03-27
**Status:** Ready for planning
**Mode:** Smart discuss (autonomous)

<domain>
## Phase Boundary

Build an encrypted secrets manager for third-party API keys. Backend: Supabase table with AES-256 encryption, server-side crypto service, CRUD API routes. Frontend: Admin UI in the "Third Party Keys" tab with table, modal create/edit, delete confirmation, category filter, and search. Raw decrypted values never exposed in bulk — only on explicit single-key fetch.

</domain>

<decisions>
## Implementation Decisions

### Encryption Architecture
- AES-256 encryption using Node.js `crypto` module (AES-256-GCM for authenticated encryption)
- Single SECRETS_MASTER_KEY environment variable for encryption/decryption
- Encrypted value stored as base64-encoded string in Supabase
- IV (initialization vector) stored alongside encrypted value (prepended or separate column)
- Server-side only — encryption/decryption never happens in browser

### Database Schema
- Table name: `admin_secrets`
- Columns: id (uuid), key_name (text, unique), encrypted_value (text), iv (text), description (text), category (text), created_at (timestamptz), updated_at (timestamptz), created_by (uuid references auth.users)
- RLS: admin-only access (same pattern as api_keys table)
- Categories enum: 'Auth', 'Analytics', 'Payments', 'AI', 'Other'

### API Routes
- POST `/api/admin/secrets` — create new secret
- GET `/api/admin/secrets` — list secrets (name, category, description, updated_at — never values)
- GET `/api/admin/secrets/[id]` — get single secret with decrypted value (for editing)
- PATCH `/api/admin/secrets/[id]` — update secret
- DELETE `/api/admin/secrets/[id]` — delete secret
- All routes use Supabase service role client and check admin permission

### UI Design
- Table with columns: Name, Category, Description, Last Updated, Actions (edit/delete)
- Category filter as dropdown or tabs above table
- Search input for filtering by name
- "Add Secret" button opens modal with: name, value (password input), category (dropdown), description
- Edit modal pre-fills name/category/description, shows masked value with "Update value" option
- Delete button triggers AlertDialog confirmation
- Values are NEVER shown in the table — always masked

### Pre-populated Categories
- Auth: GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, APPLE_SERVICE_ID, APPLE_PRIVATE_KEY (placeholders for social login)
- Analytics: GA4_MEASUREMENT_ID, CLARITY_PROJECT_ID, META_PIXEL_ID
- Payments: Note in UI that Stripe keys remain in .env
- AI: ANTHROPIC_API_KEY
- Other: Remaining keys from .env.local.example

### Claude's Discretion
- Exact modal component structure (Dialog vs Sheet)
- Toast notifications for success/error feedback
- Loading states and optimistic updates
- Server action vs API route pattern (follow existing codebase conventions)

</decisions>

<code_context>
## Existing Code Insights

### Reusable Assets
- `app/admin/api-keys/page.tsx` — Tab shell (Phase 9 output, renders SecretsPlaceholder)
- `app/admin/api-keys/SecretsPlaceholder.tsx` — Replace with real secrets UI
- `lib/api/` — Service layer pattern from REST API
- `app/components/ui/` — Badge, Button, Card components
- Existing Supabase migration pattern in `supabase/migrations/`

### Established Patterns
- Admin pages use server components with client component islands
- Server actions in `actions.ts` files for mutations
- `getSupabaseService()` for admin operations bypassing RLS
- AlertDialog pattern used elsewhere for delete confirmations

### Integration Points
- `app/admin/api-keys/page.tsx` — swap SecretsPlaceholder import for real component
- `supabase/migrations/` — new migration file
- `.env.local.example` — add SECRETS_MASTER_KEY

</code_context>

<specifics>
## Specific Ideas

- SECRETS_MASTER_KEY generation instruction: `openssl rand -base64 32`
- Follow the same admin table styling as ApiKeysTable
- Category badges with color coding matching existing Badge component

</specifics>

<deferred>
## Deferred Ideas

- Secret rotation reminders and expiry tracking
- Audit log for secret access
- Secret versioning and rollback

</deferred>
