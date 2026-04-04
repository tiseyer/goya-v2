# Architecture Research

**Domain:** Device authentication (2FA) — fingerprint + OTP integrated into existing Next.js 16 + Supabase SSR auth
**Researched:** 2026-04-04
**Confidence:** HIGH — all integration points verified from live codebase

---

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│  LOGIN FLOW (email/OAuth code → /auth/callback)                         │
│                                                                         │
│  1. exchangeCodeForSession()   ← no change                              │
│  2. getUser()                  ← no change                              │
│  3. [NEW] read goya_device_fp cookie from request                       │
│  4. [NEW] query trusted_devices (service role)                          │
│     ├── found + is_active=true  → redirect to original `next` param    │
│     │                             update last_used_at (fire-and-forget) │
│     └── not found (or no cookie)→ set device_pending_verification='true'│
│                                  redirect to /verify-device?next=...   │
└─────────────────────────────────────────────────────────────────────────┘
          │
          ▼ (unrecognised device)
┌──────────────────────────────────────────────────────────────────────┐
│  MIDDLEWARE (middleware.ts — modified)                               │
│                                                                      │
│  [NEW] device_pending_verification cookie lock                       │
│    mirrors password_reset_pending block exactly:                     │
│    cookie=true + user  → allow /verify-device only                  │
│    cookie=true + !user → clear cookie, redirect /sign-in            │
└──────────────────────────────────────────────────────────────────────┘
          │
          ▼
┌──────────────────────────────────────────────────────────────────────┐
│  /verify-device  (new page — client component)                       │
│                                                                      │
│  useEffect on mount → POST /api/device/send-code                     │
│  User enters 6-digit OTP                                             │
│  Submit → POST /api/device/verify-code { code, fingerprint, name }  │
│    success: clear cookie client-side, router.push(next)             │
│    failure: show error, allow resend after cooldown                  │
└──────────────────────────────────────────────────────────────────────┘
          │
          ▼ (admin view)
┌──────────────────────────────────────────────────────────────────────┐
│  /admin/users/[id]?tab=devices  (new tab, server-rendered)           │
│                                                                      │
│  Server fetch: trusted_devices WHERE profile_id = id                 │
│  List: device name, fingerprint (masked), trusted_at,               │
│        last_used_at, is_active badge                                 │
│  Revoke: RevokeDeviceButton → POST /api/admin/devices/[id]/revoke   │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Component Boundaries

| Component | New or Modified | Responsibility |
|-----------|----------------|----------------|
| `app/auth/callback/route.ts` | Modified | After `getUser()`: read fp cookie, check `trusted_devices`, gate or allow redirect |
| `middleware.ts` | Modified | Add `device_pending_verification` cookie lock block after `password_reset_pending` block |
| `app/layout.tsx` | Modified | Mount `<DeviceFingerprintSetter />` client component so fp cookie exists before login |
| `app/components/DeviceFingerprintSetter.tsx` | New | Client component: on mount, reads cookie; if absent, computes fingerprint and writes cookie |
| `lib/device/fingerprint.ts` | New | Pure client-side util: UA + screen + timezone → SHA-256 hex digest |
| `app/verify-device/page.tsx` | New | OTP entry page; auto-sends code on mount via API route |
| `app/api/device/send-code/route.ts` | New | Auth-gated POST: generate 6-digit code, store hash in DB, send via Resend |
| `app/api/device/verify-code/route.ts` | New | Auth-gated POST: validate code hash, insert `trusted_devices`, return success |
| `app/api/admin/devices/[deviceId]/revoke/route.ts` | New | Admin POST: set `trusted_devices.is_active = false`, log audit event |
| `app/admin/users/[id]/page.tsx` | Modified | Add `devices` tab to tab array; conditional fetch; render `UserDevicesSection` |
| `app/admin/users/[id]/UserDevicesSection.tsx` | New | Server component: list trusted devices with `RevokeDeviceButton` per row |
| `app/admin/users/[id]/RevokeDeviceButton.tsx` | New | Client component: POST revoke, `router.refresh()` on success (mirrors `RemoveConnectionButton`) |
| DB: `trusted_devices` | New | `id, profile_id, fingerprint, device_name, trusted_at, last_used_at, is_active, created_at` |
| DB: `device_verification_codes` | New | `id, profile_id, code_hash, expires_at, used_at, created_at` |

---

## Data Flow: Login → Fingerprint Check → OTP → Trust

```
User submits login form
        ↓
Supabase magic link / OAuth code issued
        ↓
GET /auth/callback?code=…&next=/dashboard
        ↓
[existing] exchangeCodeForSession(code)
  → session cookies written to `response` (NextResponse.redirect)
        ↓
[existing] getUser()  → user.id available
        ↓
[existing] role/invite handling (unchanged)
        ↓
[existing] logAuditEvent (unchanged — fires regardless of device trust)
        ↓
[NEW] if next !== '/reset-password':        ← skip device check for recovery flow
  fp = request.cookies.get('goya_device_fp')?.value
  trusted = fp
    ? await checkTrustedDevice(user.id, fp)   ← service role query
    : false
  if (!trusted):
    response.cookies.set('device_pending_verification', 'true', {
      httpOnly: false, sameSite: 'lax', path: '/', maxAge: 600, secure: prod
    })
    return NextResponse.redirect('/verify-device?next=<encoded>')
  else if (fp && trusted):
    fire-and-forget: UPDATE trusted_devices SET last_used_at = now()
      WHERE profile_id = user.id AND fingerprint = fp
        ↓
[existing] return response  ← only reached if trusted (or recovery flow)
```

```
/verify-device loads
        ↓
useEffect → POST /api/device/send-code
  server: getUser() → confirm session
          generate crypto.randomInt(100000, 999999) → 6-digit code
          hash = SHA-256(code)
          INSERT device_verification_codes { profile_id, code_hash, expires_at: now+10min }
          sendEmailFromTemplate('device_otp', { code, firstName })
          return { ok: true }
        ↓
User types 6-digit code → Submit
        ↓
POST /api/device/verify-code { code, fingerprint, deviceName }
  server: getUser()
          hash = SHA-256(code)
          SELECT device_verification_codes
            WHERE profile_id = user.id
              AND code_hash = hash
              AND expires_at > now()
              AND used_at IS NULL
          not found / expired → 400 { error: 'Invalid or expired code' }
          found:
            UPDATE device_verification_codes SET used_at = now()
            INSERT trusted_devices { profile_id, fingerprint, device_name, trusted_at, is_active: true }
            return { ok: true }
        ↓
Client on success:
  document.cookie = 'device_pending_verification=; maxAge=0; path=/'
  router.push(next ?? '/dashboard')
```

---

## Cookie Architecture

### New cookie: `device_pending_verification`

Mirrors `password_reset_pending` in every attribute (verified from `/auth/callback` lines 43-50).

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| `httpOnly` | `false` | Client must clear it after successful OTP (same as `password_reset_pending`) |
| `sameSite` | `lax` | Consistent with all existing auth cookies |
| `path` | `/` | Global scope so middleware can read it on any route |
| `maxAge` | `600` | 10-minute safety net — matches OTP expiry |
| `secure` | `process.env.NODE_ENV === 'production'` | Matches existing pattern |

### New cookie: `goya_device_fp`

Long-lived client-written fingerprint. **Not a secret** — just a stable identifier.

| Attribute | Value | Rationale |
|-----------|-------|-----------|
| `httpOnly` | `false` | Must be written by JavaScript (client-side fingerprinting) |
| `sameSite` | `lax` | Consistent with platform cookies |
| `path` | `/` | Must be readable by `/auth/callback` route handler via `request.cookies` |
| `maxAge` | `31_536_000` (1 year) | Long-lived trust signal — survives session expiry |
| `secure` | production only | Matches existing pattern |

### Supabase SSR cookie non-interference

`goya_device_fp` is a **custom cookie**, entirely separate from `sb-*` Supabase session cookies. In `/auth/callback`, the `setAll` callback in `createServerClient` only handles Supabase auth cookies. The fp cookie is read via `request.cookies.get('goya_device_fp')` before the Supabase client is constructed — no conflict. The fp cookie is written by `DeviceFingerprintSetter` on the preceding page load, not during the callback.

---

## Modified File: `/auth/callback/route.ts`

Insert device check block **after** `logAuditEvent` and **before** `return response` (line 129 in the current file).

```typescript
// [NEW] Device trust check — skip for recovery flow
if (next !== '/reset-password') {
  const fp = request.cookies.get('goya_device_fp')?.value
  const trusted = fp ? await checkTrustedDevice(user!.id, fp) : false

  if (!trusted) {
    response.cookies.set('device_pending_verification', 'true', {
      httpOnly: false,
      sameSite: 'lax',
      path: '/',
      maxAge: 600,
      secure: process.env.NODE_ENV === 'production',
    })
    const verifyUrl = new URL('/verify-device', origin)
    verifyUrl.searchParams.set('next', next)
    return NextResponse.redirect(verifyUrl)
  }

  if (fp) {
    // Fire-and-forget last_used_at update
    void getSupabaseService()
      .from('trusted_devices' as any)
      .update({ last_used_at: new Date().toISOString() })
      .eq('profile_id', user!.id)
      .eq('fingerprint', fp)
  }
}

return response
```

`checkTrustedDevice` is a small helper in `lib/device/checkTrustedDevice.ts` (new file):

```typescript
// lib/device/checkTrustedDevice.ts
export async function checkTrustedDevice(userId: string, fingerprint: string): Promise<boolean> {
  const service = getSupabaseService()
  const { data } = await (service as any)
    .from('trusted_devices')
    .select('id')
    .eq('profile_id', userId)
    .eq('fingerprint', fingerprint)
    .eq('is_active', true)
    .maybeSingle()
  return Boolean(data)
}
```

---

## Modified File: `middleware.ts`

Insert one block immediately **after** the `passwordResetPending` block (after line 256 in the current file). Also add `/verify-device` to `MAINTENANCE_BYPASS_PATHS`.

```typescript
// ─── Device verification lock ──────────────────────────────────────────────
const devicePendingVerification = request.cookies.get('device_pending_verification')?.value === 'true'
if (devicePendingVerification && user) {
  if (pathname !== '/verify-device' && !pathname.startsWith('/verify-device/')) {
    return NextResponse.redirect(new URL('/verify-device', request.url))
  }
}
if (devicePendingVerification && !user) {
  // Stale cookie — clear and redirect to sign-in
  const clearResponse = NextResponse.redirect(new URL('/sign-in', request.url))
  clearResponse.cookies.set('device_pending_verification', '', { maxAge: 0, path: '/' })
  return clearResponse
}
```

`/verify-device` must **not** be in `PUBLIC_PATHS` (it requires an active session). Add it only to `MAINTENANCE_BYPASS_PATHS` so maintenance mode does not block a user mid-verification. The auth enforcement at the bottom of middleware will redirect unauthenticated users to `/sign-in` naturally.

---

## Admin: Devices Tab Integration

### `app/admin/users/[id]/page.tsx` — three changes

1. Add to tab array:
   ```typescript
   { key: 'devices', label: 'Devices' }
   ```

2. Add conditional fetch (mirrors `connections` pattern at lines 50-63):
   ```typescript
   let devices: TrustedDevice[] = []
   if (tab === 'devices') {
     const { data } = await (getSupabaseService() as any)
       .from('trusted_devices')
       .select('id, device_name, fingerprint, trusted_at, last_used_at, is_active')
       .eq('profile_id', id)
       .order('trusted_at', { ascending: false })
     devices = data || []
   }
   ```

3. Add tab content render:
   ```typescript
   {tab === 'devices' && (
     <UserDevicesSection devices={devices} userId={id} />
   )}
   ```

### `UserDevicesSection.tsx` — server component

Receives `devices: TrustedDevice[]` and `userId: string` as props. Renders a list/table identical in style to the connections tab. Each row has device name, masked fingerprint (first 8 chars + `…`), trusted_at date, last_used_at date, `is_active` badge, and a `RevokeDeviceButton`. Pattern is identical to the `RemoveConnectionButton` pattern already in the file.

### `RevokeDeviceButton.tsx` — client component

```typescript
'use client'
// POST /api/admin/devices/[deviceId]/revoke
// On success: router.refresh()
// Shows disabled state while in-flight
// Mirrors RemoveConnectionButton exactly
```

---

## Recommended Project Structure (new files only)

```
app/
├── components/
│   └── DeviceFingerprintSetter.tsx       # client component: compute + write fp cookie
├── verify-device/
│   └── page.tsx                           # OTP entry page
├── api/
│   └── device/
│       ├── send-code/
│       │   └── route.ts                   # POST: generate OTP, email it
│       └── verify-code/
│           └── route.ts                   # POST: validate, insert trusted_devices
│   └── admin/
│       └── devices/
│           └── [deviceId]/
│               └── revoke/
│                   └── route.ts           # POST: revoke trusted device
└── admin/
    └── users/
        └── [id]/
            ├── UserDevicesSection.tsx     # server component: device list
            └── RevokeDeviceButton.tsx     # client component: revoke action

lib/
└── device/
    ├── fingerprint.ts                     # SHA-256 fingerprint utility (client-safe)
    └── checkTrustedDevice.ts              # server-only DB lookup helper
```

---

## Architectural Patterns

### Pattern 1: Cookie-lock gate (existing pattern — extended)

**What:** A short-lived `httpOnly: false` cookie acts as a "pending action" gate in middleware. Middleware enforces it by redirecting all non-allowed paths back to the pending-action page. The page clears the cookie client-side after the action completes.

**When to use:** Any multi-step auth flow requiring a secondary action before full navigation. Already used for `password_reset_pending` and the impersonation cookie.

**Trade-offs:** Simple — no DB lookup in middleware (just a cookie read). Cannot be forged to escape the gate (cookie is set server-side in the route handler). Edge case: user clears cookies mid-flow → lands at sign-in, which is acceptable.

### Pattern 2: Service role lookup in the callback route handler

**What:** `getSupabaseService()` is used in `/auth/callback` to query `trusted_devices` after session establishment. The session is just-established via `exchangeCodeForSession`, so the anon key client has it, but using service role is consistent with the existing pattern in this file (faculty invite claim, profile fetch at lines 64-109).

**Trade-offs:** Simpler than constructing a second session-bearing client. Service role is already imported in this file. Not for general use — scoped to the route handler.

### Pattern 3: Tab-gated server fetch (existing pattern — extended)

**What:** The admin user detail page conditionally fetches data based on `?tab=` search param. Data is only fetched when the tab is active.

**When to use:** All admin detail tabs. Already the pattern for `connections` (lines 50-63). Add `devices` as a fourth conditional block.

---

## Build Order

Ordered by dependency chain:

| Step | What | Depends on |
|------|------|-----------|
| 1 | DB migrations: `trusted_devices` + `device_verification_codes` + RLS + indexes | Nothing — first |
| 2 | `lib/device/fingerprint.ts` | Nothing — pure util |
| 3 | `lib/device/checkTrustedDevice.ts` | Step 1 (tables exist) |
| 4 | `DeviceFingerprintSetter` client component + root layout mount | Step 2 |
| 5 | `/auth/callback` modification | Steps 1, 3, 4 (cookie must be set before callback runs) |
| 6 | `middleware.ts` modification | Step 5 (establishes cookie name and gate route) |
| 7 | `app/api/device/send-code` route | Step 1; `sendEmailFromTemplate` (already exists) |
| 8 | `app/api/device/verify-code` route | Steps 1, 7 |
| 9 | `/verify-device` page | Steps 6, 7, 8 |
| 10 | `UserDevicesSection` + `RevokeDeviceButton` | Step 1 |
| 11 | `app/api/admin/devices/[deviceId]/revoke` | Step 1 |
| 12 | Admin user detail `devices` tab | Steps 1, 10, 11 |
| 13 | Email template `device_otp` in `email_templates` DB | Can be done any time after step 1 |

Steps 4-6 and 7-9 can proceed in parallel after step 1 is done. Steps 10-12 are fully independent of 4-9.

---

## Anti-Patterns

### Anti-Pattern 1: Computing the fingerprint server-side from headers

**What people do:** Read `User-Agent` from request headers in `/auth/callback` and hash it.

**Why it's wrong:** UA alone is a weak fingerprint — many users share identical UA strings. Screen resolution and timezone (client-only values) dramatically reduce collision probability. More importantly, the `goya_device_fp` cookie must be **stable across sessions** — not regenerated on each login. It needs to be set once by a client component and persist for 1 year.

**Do this instead:** `DeviceFingerprintSetter` computes `SHA-256(UA + screenWidth + screenHeight + colorDepth + timezone)` client-side on every page load. It reads the existing cookie first; only writes if absent.

### Anti-Pattern 2: Storing the raw fingerprint string in the cookie

**What people do:** Store the raw `UA|1920|1080|24|Europe/Berlin` string for debugging.

**Why it's wrong:** Unnecessarily exposes device characteristics. The cookie value should be opaque.

**Do this instead:** Cookie value = SHA-256 hex digest. `trusted_devices.fingerprint` = same hex digest. Comparison is direct equality of two hex strings.

### Anti-Pattern 3: Moving the device trust check into middleware

**What people do:** Add a `trusted_devices` DB lookup to middleware to avoid the callback detour.

**Why it's wrong:** Middleware runs on the Edge runtime. `getSupabaseService()` is a Node.js-only client. The anon-key Edge client could be used, but that requires `trusted_devices` to have permissive RLS for the authenticated user — that RLS has to be written carefully and adds complexity. More critically, at middleware execution time for normal page navigation the user's device fp cookie already exists and is trusted — the middleware check would run on every request for every authenticated user, not just at login. This is unnecessary load.

**Do this instead:** Middleware only enforces the cookie lock (no DB lookup — just `request.cookies.get(...)`). The device check happens once per login in the route handler.

### Anti-Pattern 4: Storing the raw OTP code in the database

**What people do:** INSERT the 6-digit code directly as a `code` column.

**Why it's wrong:** A plain 6-digit code in a database row is trivially exploitable if the DB or logs are compromised.

**Do this instead:** Store `SHA-256(code)` as `code_hash`. On verify, hash the incoming code and compare. The raw code only ever exists in memory and in the email.

### Anti-Pattern 5: Skipping the `used_at` column on verification codes

**What people do:** DELETE the row on successful verification.

**Why it's wrong:** Deletion prevents replay detection. If the same code is submitted twice (race condition or retry), a second verification would find no row and fail silently — acceptable, but you lose audit trail.

**Do this instead:** SET `used_at = now()` and keep the row. The lookup query filters `WHERE used_at IS NULL`.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0–1k users | Current approach: synchronous lookup in callback, no caching needed |
| 1k–100k users | Add composite index: `trusted_devices(profile_id, fingerprint, is_active)`. Add to migration from day one. |
| 100k+ users | Add daily cron to hard-delete `device_verification_codes` rows older than 24 hours. Add to existing cron routes in `app/api/cron/`. |

---

## Integration Points Summary

| Integration Point | Existing File | Change Type | Key Detail |
|-------------------|--------------|-------------|------------|
| Auth callback | `app/auth/callback/route.ts` | Modified | Add device check block after `logAuditEvent`, before `return response` |
| Middleware lock | `middleware.ts` | Modified | New `device_pending_verification` block after `passwordResetPending` block |
| Root layout fp setter | `app/layout.tsx` | Modified | Mount `<DeviceFingerprintSetter />` (client component, no visible UI) |
| Admin user detail tabs | `app/admin/users/[id]/page.tsx` | Modified | Add 4th tab `devices`; conditional fetch; render `UserDevicesSection` |
| Email system | `lib/email/send.ts` | None — use as-is | Call `sendEmailFromTemplate('device_otp', { code, firstName })` |
| Supabase service client | `lib/supabase/service.ts` | None — use as-is | Used for all server-side device table queries |
| Audit logging | `lib/audit.ts` | None — use as-is | Log `admin.device_revoked` events in revoke route |

---

## Sources

- `app/auth/callback/route.ts` (live): verified `exchangeCodeForSession` → `getUser()` → conditional cookie set (`password_reset_pending`) → `return response` flow
- `middleware.ts` (live): verified `password_reset_pending` lock block (lines 244–256) as the direct model for the new lock
- `app/admin/users/[id]/page.tsx` (live): verified tab array pattern, `tab === 'connections'` conditional fetch (lines 50–63), `?tab=` search param URL pattern
- `lib/email/send.ts` (live): verified `sendEmailFromTemplate` signature and graceful template-missing handling
- `lib/supabase/service.ts` (live): verified service role singleton pattern
- `app/api/admin/impersonate/route.ts` (live): verified admin role-check pattern (`isAdminOrAbove`) for admin API routes
- Confidence: HIGH — all patterns derived from existing production code, not assumptions

---
*Architecture research for: Device authentication v1.24*
*Researched: 2026-04-04*
