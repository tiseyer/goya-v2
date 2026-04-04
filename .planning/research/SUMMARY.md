# Project Research Summary

**Project:** GOYA v2 — v1.24 Mattea Intelligence System (ai-super-helper workstream)
**Domain:** Device Authentication (2FA) — trusted device fingerprinting + email OTP
**Researched:** 2026-04-04
**Confidence:** HIGH

## Executive Summary

This milestone adds new-device verification to an existing Next.js 16 + Supabase + Resend stack. The goal is to intercept logins from unrecognized devices and require a 6-digit email OTP before granting full access. Once verified, devices are remembered for a 90-day rolling window, eliminating friction for returning users on familiar devices. Admins can view and revoke trusted devices per user.

The recommended approach requires zero new packages. Every capability — OTP generation, client-side fingerprinting, cookie management, email delivery, and DB persistence — maps to APIs already installed in the codebase. The implementation is additive: four existing files are modified (auth callback, middleware, root layout, admin user detail page) and eleven new files are created. The core pattern mirrors the existing `password_reset_pending` cookie-gate already in production, making the mental model familiar to the team.

The biggest risks are architectural, not technical. Defense-in-depth is non-negotiable: the middleware cookie lock is a UX redirect, not a security gate — every API route that touches user data must independently verify device trust via a DB query. Two additional non-negotiable rules: OTP codes must be stored hashed (never plaintext), and the OTP comparison must use `crypto.timingSafeEqual` to prevent timing side-channel attacks. Fingerprint stability requires excluding the User-Agent from the hash — UA changes on every Chrome release, which would force re-verification for all users every six weeks.

## Key Findings

### Recommended Stack

No new dependencies are required. The existing stack fully covers all needs: Node.js built-in `crypto` for OTP generation and hashing, the Web Crypto API (`crypto.subtle.digest`) for client-side SHA-256 fingerprinting, `@supabase/supabase-js` and `@supabase/ssr` for DB persistence and cookie management, `resend` via the existing `sendEmailFromTemplate` wrapper for OTP emails, and `next` middleware for the route lock. The shadcn `input-otp` component (already in the project) handles the OTP input UX including auto-advance, paste-to-fill, and auto-submit.

**Core technologies:**
- `crypto` (Node.js built-in): OTP generation via `crypto.randomInt(100000, 999999)` and constant-time comparison via `crypto.timingSafeEqual` — no dependency needed
- Web Crypto API (browser built-in): SHA-256 fingerprint from screen resolution + timezone — zero bundle cost
- `@supabase/ssr` 0.8.0: cookie management in middleware and auth callback — already wired for session cookies
- `resend` 6.9.4 + `sendEmailFromTemplate`: OTP delivery — sandbox, logging, and Resend client already configured
- `next` middleware 16.1.6: device pending cookie gate — mirrors existing `password_reset_pending` pattern exactly

### Expected Features

**Must have (table stakes):**
- 6-digit numeric OTP, auto-sent on page load — industry expectation; any manual trigger step is jarring
- OTP auto-advance, paste-to-fill, auto-submit on complete — `input-otp` component handles all three
- "Trust this device" checkbox (default checked) — the core value proposition of device trust
- Resend option with 60s cooldown and countdown display — prevents abuse while communicating wait time
- 10-minute OTP expiry and max 5 attempt enforcement — standard security baseline
- Middleware lock (`device_pending_verification` cookie) — prevents bypassing the verify page by direct navigation
- Admin "Devices" tab on user detail page (`?tab=devices`) — existing URL-param tab pattern; required for support and security audit
- Admin revoke individual device — hard delete or soft delete with `revoked_at`; must log to `audit_log`

**Should have (differentiators):**
- UA-derived device label ("Chrome on macOS") — makes admin device list human-readable
- "Verified on [date]" and "Last seen" columns in admin list — context for revocation decisions
- Progressive resend cooldown (60s then 2min) — light abuse prevention
- New trusted device email notification to user — audit trail; assess whether users find it noisy post-launch

**Defer (v2+):**
- User-facing "My Devices" self-service page — add only if support tickets request it; admin revocation covers v1 use case
- TOTP authenticator app support — separate milestone; requires QR codes, backup codes, full setup flow
- WebAuthn / passkeys — platform-wide security upgrade; 3-4x implementation complexity

### Architecture Approach

The system integrates at three points in the existing auth flow: the `/auth/callback` route handler (device check after session establishment), `middleware.ts` (UX lock enforcing redirect to `/verify-device`), and the root layout (mounting `DeviceFingerprintSetter` client component to ensure the fingerprint cookie exists before login). Two new Supabase tables — `trusted_devices` and `device_verification_codes` — hold device state. All API routes use the service-role client to prevent RLS bypass by client-supplied user IDs.

**Major components:**
1. `DeviceFingerprintSetter` (client component in root layout) — computes `SHA-256(screenWidth x screenHeight : timezone)` on mount, writes to `goya_device_fp` cookie for 1 year; only writes if cookie is absent
2. `/auth/callback` modification — after `getUser()`, checks `trusted_devices` for the fp cookie value; sets `device_pending_verification` cookie and redirects to `/verify-device` if unrecognized
3. `middleware.ts` modification — reads `device_pending_verification` cookie; redirects all routes except `/verify-device` and `/sign-out` to prevent navigation escape
4. `app/api/device/send-code` — generates OTP, stores SHA-256 hash with 10-min expiry, sends via `sendEmailFromTemplate`; idempotent (returns existing code if one is unexpired and active)
5. `app/api/device/verify-code` — validates hashed code with `timingSafeEqual`, enforces attempt limit, inserts `trusted_devices` row on success
6. `/verify-device` page — OTP entry with auto-send on mount, `input-otp` component, "Trust this device" checkbox, resend cooldown display, "Not you? Sign out" escape link
7. `UserDevicesSection` + `RevokeDeviceButton` (admin) — server component list of devices with client revoke action; mirrors `RemoveConnectionButton` pattern exactly

### Critical Pitfalls

1. **Middleware-only device lock is bypassable (CVE-2025-29927 pattern)** — Never treat absence of the pending cookie as proof of device trust. Every API route handling user data must independently query `trusted_devices`. The middleware cookie gate is a UX redirect only. Ensure Next.js is >= 15.2.3 where header spoofing is patched.

2. **OTP brute force via stateless rate limiting** — In-memory rate limiters fail across Vercel serverless instances (explicitly documented as single-instance only in this project). Add an `attempts` column to `device_verification_codes`; invalidate the code after 5 failed attempts; rate-limit `send-code` by counting DB rows created in the past hour. Both checks must be DB-backed.

3. **Fingerprint instability from User-Agent in hash** — Chrome auto-updates every ~6 weeks, changing the UA string and invalidating all stored fingerprint matches simultaneously. Use screen resolution + timezone only for the hash. Store raw inputs in separate columns to allow algorithm updates without recomputing all records.

4. **Timing side-channel in OTP comparison** — `===` short-circuits on mismatched characters. Use `crypto.timingSafeEqual` in the verify route. The verify route must never export `runtime = 'edge'` — Node.js `crypto` is unavailable in the Edge runtime.

5. **Multi-tab race condition sending duplicate OTP emails** — `useEffect` on `/verify-device` fires in every open tab. Make `send-code` idempotent: check for an unexpired, non-invalidated code for the user before inserting a new row; return the existing expiry rather than sending a second email.

## Implications for Roadmap

Based on the dependency chain in ARCHITECTURE.md and the pitfall-to-phase mapping in PITFALLS.md, the build proceeds in four phases. Phases 1-3 have strict ordering; within Phase 4 the verify page and admin tab sub-deliverables are independent and can be built in parallel.

### Phase 1: Database Foundation and Fingerprint Algorithm

**Rationale:** Everything else depends on the tables. The fingerprint algorithm and cookie strategy must also be locked in here — changing the hash algorithm after devices are stored requires a migration to recompute all existing hashes. This phase encodes all the "expensive to change later" decisions.

**Delivers:** Two Supabase migrations (`trusted_devices` and `device_verification_codes` with RLS, composite indexes, `attempts` and `invalidated` columns from day one); `lib/device/fingerprint.ts` (screen + timezone SHA-256 with UA excluded); `lib/device/checkTrustedDevice.ts`; `DeviceFingerprintSetter` client component mounted in root layout; cookie strategy documented (names, flags, maxAge values).

**Addresses:** Table stakes — fingerprint cookie persistence, `trusted_devices` DB layer, `device_verification_codes` with attempt tracking.

**Avoids:** Fingerprint instability (Pitfall 4 — UA excluded from hash), cookie flag conflicts with Supabase `sb-*` cookies (Pitfall 6), middleware-only trust checks (Pitfall 1 — DB lookup helper established upfront), re-verification storms after Chrome releases.

### Phase 2: OTP Send and Verify API Routes

**Rationale:** The verify page is useless without working API routes. Security properties (hashing, timing-safe comparison, attempt limits, idempotency) are non-negotiable and easier to verify in isolation before UI state is involved. Build and test both routes before writing any UI.

**Delivers:** `app/api/device/send-code/route.ts` (idempotent, DB-backed cooldown, Resend integration, `device_otp` email template record); `app/api/device/verify-code/route.ts` (timingSafeEqual comparison, attempt counter increment, invalidation on limit, `trusted_devices` insert, cookie clear); Resend error handling that surfaces failures to the client.

**Implements:** OTP generation pattern (`crypto.randomInt` + SHA-256 storage), `sendEmailFromTemplate` wrapper, service-role Supabase queries for all code table access.

**Avoids:** OTP brute force (Pitfall 2 — attempts column enforced), timing attack (Pitfall 3 — timingSafeEqual, no Edge runtime), multi-tab race condition (Pitfall 5 — idempotency check), Resend silent failure (error check required).

### Phase 3: Auth Callback Integration and Middleware Lock

**Rationale:** The auth callback connects the fingerprint cookie to the login flow. The middleware lock must follow — it enforces the cookie set by the callback. Test the full redirect chain (login to `/verify-device` and back) before adding the verify page UI on top.

**Delivers:** Modified `/auth/callback/route.ts` with device trust check block inserted after `logAuditEvent`, before `return response`; `device_pending_verification` cookie set on unrecognized device redirect. Modified `middleware.ts` with device pending lock block added after `passwordResetPending` block; `DEVICE_PENDING_ALLOWED_PATHS` list (`/verify-device`, `/sign-out`, `/auth/callback`); `/verify-device` added to `MAINTENANCE_BYPASS_PATHS`.

**Avoids:** Middleware redirect loop (Pitfall 7 — explicit bypass list), `SameSite: Strict` on fingerprint cookie which breaks delivery on the `/auth/callback` redirect, cookie named with `sb-` prefix which Supabase SSR tries to parse.

### Phase 4: Verify Device Page and Admin Devices Tab

**Rationale:** UI layer built last, on top of verified API routes and a working redirect chain. The `/verify-device` page and the admin Devices tab are independent of each other and can be parallelized. Both use established component patterns from the existing codebase.

**Delivers:** `/verify-device/page.tsx` with `input-otp` (auto-advance, paste-to-fill, auto-submit on `onComplete`), auto-send OTP on mount, "Trust this device" checkbox (default checked), context copy with browser/OS hint from UA, resend cooldown countdown, "Not you? Sign out" escape link. `UserDevicesSection.tsx` + `RevokeDeviceButton.tsx` + admin user detail "Devices" tab (`?tab=devices`) with device label, verified date, last seen date, revoke action, audit log entry per revoke, and confirmation dialog copy stating "takes effect on next login."

**Addresses:** All table stakes UX features — auto-advance, paste-to-fill, auto-submit, resend cooldown, context messaging. Admin device management view and revoke.

**Avoids:** No sign-out escape from verify page (Pitfall 7 UX), admin revoke not audited (Pitfall 8 — `logAuditEvent` on every revoke), admin UI that implies immediate session invalidation when revocation only takes effect at next login.

### Phase Ordering Rationale

- Phase 1 must come first because tables must exist before any query runs, and the fingerprint algorithm is locked in by the schema (changing it later requires a recompute migration).
- Phase 2 must precede Phase 3 because the callback redirect is meaningless if the send-code and verify-code routes are not functional. Isolating API route testing avoids debugging through the full login flow.
- Phase 3 must precede Phase 4 because the verify page needs the middleware lock in place to test the redirect chain correctly.
- Phase 4 is internally parallelizable — verify page and admin tab share no dependencies on each other.
- No phase requires new packages — zero dependency management overhead throughout.

### Research Flags

No phase requires `/gsd:research-phase` during planning. All integration points are verified from live production code.

**Phases with standard patterns (skip research-phase):**
- **Phase 1:** DB migrations, RLS, and cookie patterns are fully specified in STACK.md and ARCHITECTURE.md with exact SQL and TypeScript code.
- **Phase 2:** OTP send/verify patterns are fully specified across all four research files with exact implementation code provided.
- **Phase 3:** Middleware modification mirrors the existing `passwordResetPending` block exactly; insertion point is pinpointed to a specific line in ARCHITECTURE.md.
- **Phase 4:** Admin tab follows the `?tab=connections` pattern verified from live source. `input-otp` is already installed. No novel patterns.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All recommendations verified against installed package versions and live codebase patterns; zero new packages means no integration unknowns |
| Features | HIGH | Corroborated by Bitwarden, Twilio, shadcn/ui docs, multiple 2FA implementation guides; industry consensus on 6-digit OTP, 10-min expiry, 90-day trust window |
| Architecture | HIGH | Every integration point verified from live production files (`middleware.ts`, `auth/callback/route.ts`, admin user detail page); all patterns derived from existing code, not assumptions |
| Pitfalls | HIGH | CVE-2025-29927 from official Vercel post-mortem; timing attacks from Simon Willison and Snyk; fingerprint instability from seresa.io; cookie flag conflicts from Supabase/ssr official issue tracker |

**Overall confidence:** HIGH

### Gaps to Address

- **`profile_id` vs `user_id` column name:** STACK.md uses `user_id` in schema examples while ARCHITECTURE.md uses `profile_id`. The codebase consistently uses `profile_id` as the FK to the `profiles` table. Resolve to `profile_id` in Phase 1 migration — architecture file is correct. Low risk.

- **Email template content:** The `device_otp` email template (subject, body copy, OTP placement, device info format) is not specified in research. Needs copy decision before Phase 2. Existing templates in the `email_templates` DB table are the reference format. Low risk; can be drafted at Phase 2 start.

- **90-day rolling window enforcement:** Research recommends checking `last_used_at` at login time rather than a cron job. Confirm the exact query condition (`WHERE last_used_at > now() - interval '90 days' AND is_active = true`) is in `checkTrustedDevice.ts` from Phase 1. Low risk; one-line addition to the helper.

- **Immediate session invalidation on device revoke:** Research documents that revocation takes effect at next login only. If a compromised device scenario ever requires immediate invalidation, `supabase.auth.admin.signOut(userId, 'others')` would be needed. Flagged as a future enhancement — not in scope for v1.24, but document in the admin UI confirmation dialog.

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `middleware.ts`, `app/auth/callback/route.ts`, `app/admin/users/[id]/page.tsx`, `lib/email/send.ts`, `lib/supabase/service.ts` — all integration points verified from live production files
- [CVE-2025-29927 Vercel post-mortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass) — middleware-only lock bypass pattern and defense-in-depth requirement
- [CVE-2025-29927 JFrog analysis](https://jfrog.com/blog/cve-2025-29927-next-js-authorization-bypass/) — CVSS 9.1, attack vector details
- [Supabase Row Level Security docs](https://supabase.com/docs/guides/database/postgres/row-level-security) — RLS patterns for device tables
- [MDN Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) — `crypto.subtle.digest` browser support (100% in 2026)
- [Simon Willison TIL — constant-time string compare](https://til.simonwillison.net/node/constant-time-compare-strings) — `timingSafeEqual` pattern
- [Supabase/ssr Issue #36](https://github.com/supabase/ssr/issues/36) — cookie naming conflicts with `sb-` prefix

### Secondary (MEDIUM confidence)
- [Bitwarden New Device Login Protection](https://bitwarden.com/help/new-device-verification/) — 90-day trust window, device recognition patterns, real-world implementation reference
- [Twilio Verify Developer Best Practices](https://www.twilio.com/docs/verify/developer-best-practices) — 30s resend limit, 6-digit default, rate limiting guidance
- [FingerprintJS v5 MIT license + accuracy](https://fingerprint.com/blog/fingerprintjs-version-5-0-mit-license/) — 40-60% open-source accuracy; justification for not adding the library
- [seresa.io — Browser fingerprinting 2025](https://seresa.io/blog/data-loss/browser-fingerprinting-in-2025-why-ip-device-screen-hashing-is-not-the-cookie-alternative-you-think) — UA instability documented; signal selection guidance
- [Arkesel — OTP rate limiting best practices](https://arkesel.com/otp-expiration-rate-limiting-best-practices/) — 30-60s resend cooldown, 10-minute expiry industry standard
- [shadcn input-otp docs](https://ui.shadcn.com/docs/components/radix/input-otp) — paste, auto-advance, `onComplete` capability confirmation
- [NerdBot — Secure OTP verification flow 2026](https://nerdbot.com/2026/02/28/designing-a-secure-otp-verification-flow-for-modern-web-apps/) — 5-attempt max, uniform error messages, state machine design
- [NextAuth race condition — GitHub #8897](https://github.com/nextauthjs/next-auth/issues/8897) — multi-tab send-code race condition pattern
- [LogRocket — 2FA UX best practices](https://blog.logrocket.com/ux-design/2fa-user-flow-best-practices/) — resend max, trusted device skip patterns

---
*Research completed: 2026-04-04*
*Ready for roadmap: yes*
