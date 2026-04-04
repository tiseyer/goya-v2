# Pitfalls Research

**Domain:** Device authentication (2FA) — fingerprinting + email OTP + trusted device management
**Researched:** 2026-04-04
**Confidence:** HIGH (codebase reviewed, verified against official CVE disclosures and official docs)

---

## Critical Pitfalls

Mistakes that cause rewrites, security breaches, or broken user flows.

---

### Pitfall 1: Middleware-Only Device Lock is Bypassable (CVE-2025-29927 Pattern)

**What goes wrong:**
The `device_pending_verification` cookie lock redirects unverified devices to `/verify-device` via middleware. If this is the ONLY enforcement point, an attacker sends a crafted `x-middleware-subrequest` header to skip middleware entirely and access any protected route without completing OTP.

CVE-2025-29927 (CVSS 9.1, disclosed March 2025) demonstrated exactly this: Next.js middleware authorization bypassed by spoofing an internal header. Fixed in Next.js 15.2.3, but the architectural lesson applies to any cookie-based middleware gate.

**Why it happens:**
Developers treat Next.js middleware as a security enforcement layer. It is a routing layer. The existing `middleware.ts` in this project already uses a cookie-gate pattern for the password reset lock (`password_reset_pending`) — the device verification lock will follow the same pattern and inherit the same risk if not defended in depth.

**How to avoid:**
- The middleware lock handles UX (redirect loop) only. State this explicitly in code comments.
- Every protected API route and Server Action that accesses user data must independently query `trusted_devices` to confirm device trust — not rely on cookie absence.
- Never treat the absence of `device_pending_verification` cookie as proof of a trusted device. The cookie can be deleted manually by any user.
- Ensure Next.js is >= 15.2.3 where `x-middleware-subrequest` spoofing is blocked.

**Warning signs:**
- Any API route that reads a cookie to determine trust without also querying the `trusted_devices` table.
- The word "trusted" only appears in `middleware.ts`, not in data-access code.

**Phase to address:**
Phase 1 (DB + API route design) — establish the defence-in-depth rule before any route is written.

---

### Pitfall 2: OTP Verify Endpoint Has No Attempt Limit — Brute Force

**What goes wrong:**
A 6-digit OTP has 1,000,000 combinations. With a 10-minute expiry and no attempt counter, an attacker can submit ~16,667 guesses per minute and statistically crack the code before it expires. In-memory rate limiting (the pattern this codebase uses for the chatbot and REST API) fails across Vercel function instances and after cold starts — it is explicitly documented in `PROJECT.md` as "sufficient for single-instance deployment."

**Why it happens:**
Developers add a UI cooldown (disable resend button for 30s) and assume that is sufficient. The UI is trivially bypassed with curl. The in-memory limiter from the existing codebase looks appropriate but provides zero protection on Vercel serverless which has multiple instances.

**How to avoid:**
- Add an `attempts` integer column (default 0) to `device_verification_codes`.
- On every failed verify attempt, `UPDATE device_verification_codes SET attempts = attempts + 1 WHERE id = $1`.
- After 3 failed attempts, mark the code `invalidated = true` and return HTTP 429. The user must request a new code.
- Separately rate-limit send-code: before inserting a new row, count `WHERE user_id = $1 AND created_at > now() - interval '1 hour'`. Reject if count >= 5.
- This is DB-backed, survives cold starts, and works across all Vercel instances.

**Warning signs:**
- `device_verification_codes` table schema has no `attempts` column.
- Verify route returns `{ valid: false }` without checking or incrementing a counter.
- Send-code route fires the Resend email without checking row count for the past hour.

**Phase to address:**
Phase 2 (Send + Verify API routes) — build attempt tracking into the table schema from the start.

---

### Pitfall 3: OTP Compared with `===` — Timing Side-Channel Attack

**What goes wrong:**
String equality `===` short-circuits on the first mismatched character. An attacker making high volumes of guesses can measure response latency differences (microseconds) to learn how many leading digits match, narrowing the brute-force search space. This is a documented Node.js security pitfall confirmed by Snyk research.

**Why it happens:**
`code === storedCode` is natural JavaScript. Node.js does not use constant-time comparison for `===`. Developers do not think of OTP comparison as a cryptographic operation.

**How to avoid:**
Use `crypto.timingSafeEqual` from Node.js built-in `crypto`:
```typescript
import { timingSafeEqual } from 'crypto'

function safeCompareOTP(input: string, stored: string): boolean {
  // timingSafeEqual throws on length mismatch — pad to equal length first
  const a = Buffer.from(input.padEnd(10, '0'))
  const b = Buffer.from(stored.padEnd(10, '0'))
  return timingSafeEqual(a, b)
}
```
Important: this must run in a Node.js API route, not an Edge Function. Do not add `export const runtime = 'edge'` to the verify route — `crypto` is not available in the Edge Runtime.

**Warning signs:**
- Verify route contains `if (code === record.code)`.
- Supabase `.eq('code', inputCode)` is used as the sole lookup (this is acceptable if the DB does the comparison, but if the code is fetched first and compared in JS, the timing vulnerability is present).
- The route has `export const runtime = 'edge'`.

**Phase to address:**
Phase 2 (Verify API route) — one-time implementation decision, non-negotiable.

---

### Pitfall 4: Fingerprint Instability — Re-Verification Storm After Chrome Update

**What goes wrong:**
If the fingerprint is computed as `SHA-256(userAgent + screenResolution + timezone)`, the User-Agent string changes on every major browser version bump. Chrome auto-updates silently every ~6 weeks. The morning after Chrome 126 ships to stable, every trusted device hash computed from Chrome 125 stops matching. All users are prompted for OTP simultaneously — a support flood.

**Why it happens:**
The User-Agent string is the most volatile input in a naive fingerprint. It looks like a useful differentiator ("is this the same browser?") but changes constantly without user action. Timezone and screen resolution are stable across updates; UA is not.

**How to avoid:**
Exclude the User-Agent from the hash entirely. Use:
```typescript
const fingerprint = SHA-256(`${screen.width}x${screen.height}:${Intl.DateTimeFormat().resolvedOptions().timeZone}`)
```
Screen resolution + timezone is stable across browser updates, OS updates, and incognito mode. The entropy is lower but sufficient for a 2FA gate on a yoga community platform — you only need "probably the same device," not "cryptographically unique per device."

Store the raw inputs alongside the hash in `trusted_devices` (e.g., `screen_resolution`, `timezone` columns) so the algorithm can be updated without invalidating all records.

If UA is included for additional entropy, store only the major version (e.g., `Chrome/125`) and allow a ±1 version tolerance on match.

**Warning signs:**
- Fingerprint computation includes `navigator.userAgent` as a raw string in the hash input.
- `trusted_devices` table has no `raw_inputs` or equivalent columns to allow algorithm updates.
- No monitoring on daily OTP verification rate — a storm would be invisible until users complain.

**Phase to address:**
Phase 1 (fingerprint algorithm design) — must be decided before the DB schema is locked in. Changing the hash algorithm later requires a migration to re-derive all existing hashes.

---

### Pitfall 5: Multi-Tab Race Condition — Two OTP Emails Sent

**What goes wrong:**
User logs in. Verification page loads on Tab A. User opens a second tab (Tab B) by middle-clicking a bookmark or opening a new tab and navigating. Tab B hits middleware, sees `device_pending_verification` cookie, redirects to `/verify-device`. Both tabs fire `POST /api/send-verification-code` on mount via `useEffect`. Two OTP emails are sent. The user sees the second code in their inbox. Tab A has the first code rendered. The user enters the second code in Tab A — it fails because Tab A was holding code #1 (now invalidated by the second send). Confusion ensues.

**Why it happens:**
The send-on-load pattern (`useEffect → POST /api/send-code`) has no idempotency guard. A second concurrent request creates a second DB row and sends a second email.

**How to avoid:**
Make send-code idempotent: before inserting a new row, check if an unexpired, non-invalidated code already exists for this `user_id` created within the cooldown window (e.g., < 60 seconds ago). If one exists, return the expiry time without creating a new code or sending a new email.

```sql
SELECT id, expires_at FROM device_verification_codes
WHERE user_id = $1
  AND expires_at > now()
  AND invalidated = false
ORDER BY created_at DESC
LIMIT 1
```

The UI should show the cooldown countdown based on the returned `expires_at`, not reset it on every page load.

**Warning signs:**
- Send-code route always `INSERT`s a new row without a prior `SELECT` check.
- No `cooldown_until` or recency guard before the Resend API call.
- Resend dashboard shows 2+ emails to the same user within seconds of each other.

**Phase to address:**
Phase 2 (Send-code API route).

---

### Pitfall 6: Fingerprint Cookie Flags Conflict With Supabase Auth Cookies

**What goes wrong:**
Two failure modes:

1. **`SameSite: Strict` on the fingerprint cookie** — The fingerprint cookie is not sent on the redirect from `/auth/callback` (which is a cross-origin navigation in PKCE flow). The fingerprint is missing on the very first trusted-device check. The user is always re-prompted for OTP even on a trusted device.

2. **`HttpOnly: true` on the fingerprint cookie** — Client-side JavaScript cannot read the stored fingerprint to send it to the verify endpoint. The fingerprint would need to be recomputed on every request, which defeats the purpose of a stable stored identifier.

**Why it happens:**
The existing codebase mixes `httpOnly: false` (e.g., `password_reset_pending`, `goya_active_context`) and `httpOnly: true` cookies. The natural instinct for a "security" cookie is to add `HttpOnly`, but for a fingerprint cookie that must be read by JS, this breaks the feature.

**How to avoid:**
Fingerprint cookie settings:
- `httpOnly: false` — must be readable by client-side JS
- `sameSite: 'lax'` — allows delivery on redirect navigations (not `strict`, not `none`)
- `secure: true` in production (matches existing codebase pattern)
- `maxAge: 365 * 24 * 60 * 60` — 1 year; long-lived trusted device identifier
- `path: '/'`

`device_pending_verification` cookie settings:
- `httpOnly: false` — client-side verify page may need to check status
- `sameSite: 'lax'`
- `secure: true` in production
- `maxAge: 3600` — 1 hour; must expire if the user abandons the flow

Never name a custom cookie with the `sb-` prefix — Supabase's `@supabase/ssr` package will attempt to parse it as a session chunk.

**Warning signs:**
- Fingerprint cookie set with `SameSite: Strict` or `HttpOnly: true`.
- Cookie name starts with `sb-`.
- Fingerprint cookie is `undefined` in the `/auth/callback` route after login.

**Phase to address:**
Phase 1 (cookie strategy) — must be defined before `/auth/callback` integration.

---

### Pitfall 7: Middleware Redirect Loop on `/verify-device`

**What goes wrong:**
Middleware intercepts all requests. With a `device_pending_verification` cookie gate added, the logic redirects any request to `/verify-device`. But `/verify-device` itself triggers the same gate check and redirects back — infinite redirect loop, `ERR_TOO_MANY_REDIRECTS` in the browser.

**Why it happens:**
The existing `middleware.ts` has a careful bypass list (`PUBLIC_PATHS`, `MAINTENANCE_BYPASS_PATHS`) but no concept of device-pending paths yet. Adding a new cookie-gate without also adding the gate's target to the bypass list always produces a loop. The `password_reset_pending` lock in the existing code was correct because `/reset-password` was already in `PUBLIC_PATHS`.

**How to avoid:**
Create a `DEVICE_PENDING_ALLOWED_PATHS` list and check it before the device gate fires:
```typescript
const DEVICE_PENDING_ALLOWED_PATHS = [
  '/verify-device',
  '/sign-out',
  '/auth/callback',
]
```
Place the device gate check after `supabase.auth.getUser()` (requires a valid session) but before the generic protected-path enforcement block. The `/api/` routes are already excluded from the middleware matcher (`'/((?!_next/static|_next/image|favicon\\.ico|images/|api/)')`), so the verify and send-code API routes are safe from middleware interference by default.

**Warning signs:**
- `ERR_TOO_MANY_REDIRECTS` when navigating to `/verify-device`.
- `/verify-device` is not in the explicit bypass list for the device gate check.
- `console.log` in middleware shows it running on `/verify-device` requests repeatedly.

**Phase to address:**
Phase 3 (middleware integration) — implement only after the API routes work in isolation. Test the redirect chain explicitly.

---

### Pitfall 8: Trusted Device Revocation Does Not Immediately Invalidate the Session

**What goes wrong:**
Admin revokes a trusted device via the Devices tab. The `trusted_devices` row is deleted. The user's current Supabase session remains active. The user continues browsing all protected routes. Revocation only takes effect on the user's next login — when the device lookup fails and OTP is required again.

**Why it happens:**
Device trust and Supabase sessions are separate systems. Deleting a `trusted_devices` row does not call any Supabase auth API. The middleware device gate only fires at login (in `/auth/callback`), not on every request.

**How to avoid:**
- Document this clearly in the admin UI confirmation dialog: "This device will be required to verify via email on next login."
- If immediate forced re-verification is ever required (e.g., compromised device), the admin action must also call `supabase.auth.admin.signOut(userId, 'others')` to invalidate all active sessions. Flag this as a future enhancement — do not implement for v1.24.
- Log every revocation to the `audit_log` table via `logAuditEvent` (consistent with the existing impersonation and other admin action patterns).

**Warning signs:**
- Admin UI says "Device revoked" with no explanation of when it takes effect.
- No `logAuditEvent` call after a revoke action.
- Admin revoke calls only `supabase.from('trusted_devices').delete()` with no further logic.

**Phase to address:**
Phase 4 (admin Devices tab) — include accurate copy in the confirmation dialog on day one.

---

## Technical Debt Patterns

Shortcuts that seem reasonable but create long-term problems.

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| In-memory rate limit on send-code/verify routes | No Redis dependency, matches existing codebase pattern | Fails across Vercel instances — OTP spam and brute force viable | Never for this feature; use DB-backed counter |
| Include full User-Agent in fingerprint hash | Higher device uniqueness | Re-verification storm on every Chrome release (~6 weeks) | Never; use screen + timezone only |
| Skip `attempts` tracking, rely on OTP expiry only | Simpler verify route | Brute-force 6-digit OTP viable within 10-minute window | Never |
| `httpOnly: true` on fingerprint cookie | XSS cannot read the value | Client JS cannot compute the fingerprint — feature breaks entirely | Never |
| Middleware-only device lock, no DB check in routes | Simpler code | CVE-2025-29927 pattern: middleware bypassable via header spoofing | Never for security-critical gates |
| `===` for OTP string comparison | Natural code | Timing side-channel attack vector | Never in the verify route |
| Send-code without idempotency check | Simpler route code | Multi-tab users get duplicate emails; last code wins, earlier code fails | Never |

---

## Integration Gotchas

Common mistakes when connecting to external services.

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Supabase RLS on `trusted_devices` | Forget user-scoped SELECT policy — admin Devices tab uses service role but user-facing checks use anon client | `SELECT` for `authenticated` where `user_id = auth.uid()` + service role for admin queries; no RLS on service role calls |
| Supabase RLS on `device_verification_codes` | Allow users to SELECT their own codes — attacker reads stored OTP directly | INSERT-only RLS for `authenticated`; all reads go through service role in API routes; DELETE via cron only |
| Resend email sending | Await the send call but no error check — email silently fails, user told to "check your inbox" | Check `error` on the Resend response; return `{ success: false, error: 'email_failed' }` to client; log to `LOG.md` |
| `crypto.timingSafeEqual` in Edge Runtime | Edge Runtime does not expose Node.js `crypto` module — throws at runtime | Keep verify route as a standard Node.js API route; never add `export const runtime = 'edge'` |
| Supabase cookie naming | Custom cookie named `sb-device-fp` — `@supabase/ssr` tries to parse it as a session chunk | Prefix all custom cookies with `goya_` (e.g., `goya_device_fp`, `goya_device_pending`) |
| `/auth/callback` integration | Device gate added directly to the auth callback route — Supabase session cookies may not be readable yet before the redirect | Set `device_pending_verification` cookie on the redirect response from `/auth/callback`, not on an intermediate response; verify cookie is present in the next middleware run |

---

## Performance Traps

Patterns that work at small scale but fail as usage grows.

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| DB query on every middleware run for device trust | Middleware latency spikes; Supabase connection pool exhaustion | Middleware reads cookie only (UX gate); all DB device checks happen in API routes and Server Actions | At ~100 concurrent logins |
| No composite index on `trusted_devices(user_id, fingerprint_hash)` | Slow full table scan on trusted device lookup at login | Add `CREATE INDEX ON trusted_devices(user_id, fingerprint_hash)` in the migration | At ~10K trusted device rows |
| No cleanup of expired `device_verification_codes` rows | Table grows unboundedly; lookup scans slow | Add to the existing Vercel cron schedule: `DELETE FROM device_verification_codes WHERE expires_at < now()` | At ~1K logins per day |

---

## Security Mistakes

Domain-specific security issues beyond general web security.

| Mistake | Risk | Prevention |
|---------|------|------------|
| No `invalidated` flag — only `expires_at` | After successful verification, old code can be replayed within the expiry window if the user reverifies | Set `invalidated = true` on the verified code immediately after successful verify; check this flag before accepting any code |
| Storing OTP as plain text in `device_verification_codes` | DB breach exposes all active OTP codes | Store as `HMAC-SHA256(code, server_secret)` and compare hashes. For a 6-digit OTP with 10-min TTL, HMAC is sufficient and performant; bcrypt is overkill |
| Sending OTP to unconfirmed email addresses | Attacker registers with victim's email, triggers OTP spam to the real owner | Gate send-code on `user.email_confirmed_at IS NOT NULL` from the Supabase session; reject if null |
| Fingerprint cookie readable by XSS (`httpOnly: false` is required) | Script injection reads fingerprint value, attacker crafts a matching request | Acceptable tradeoff for this feature; mitigate with strict CSP headers and input sanitization; `httpOnly: true` would break the feature entirely |
| Admin revoke action not logged | No audit trail — cannot investigate when/why a device was revoked | Every revoke calls `logAuditEvent({ action: 'device.revoked', ... })` consistent with existing admin patterns |
| Trust check only at login, not on each request | If a device is revoked after the user logs in, they have full access until next login | Documented limitation; immediate revocation requires session invalidation (future enhancement); clearly communicated in admin UI |

---

## UX Pitfalls

Common user experience mistakes in this domain.

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| OTP email delayed 15–30s by Resend queue | User thinks the system is broken, clicks resend repeatedly — multiple emails arrive, user confused about which code is valid | Show "check your spam folder" tip after 10s; on multiple sends, display "A new code was sent — use the most recent one" |
| No indication of which device was trusted | Admin Devices list shows "Chrome on Mac" × 5 with no dates — impossible to manage | Store `created_at`, `last_used_at`, and a friendly `display_name` (e.g., "Chrome on macOS, Dublin") in `trusted_devices` |
| Resend cooldown resets on page refresh | User refreshes `/verify-device`, resend button is immediately available again, triggering duplicate emails | Store cooldown expiry on the DB row (`cooldown_until` timestamp), not in React state — return it in the send-code response and show countdown |
| Middleware redirects user mid-session to `/verify-device` | Users lose in-progress work | Device check must happen at login only (in `/auth/callback`) not lazily on every request; the middleware lock ensures the user cannot navigate elsewhere, not that it triggers mid-session |
| Verification email from wrong sender | User marks as spam | Sender must be the configured GOYA Resend domain and display name, not `noreply@resend.dev` — use the same Resend config as all other platform emails |
| No logout escape from `/verify-device` | User on wrong account cannot sign out | `/sign-out` must be in `DEVICE_PENDING_ALLOWED_PATHS`; show a "Not you? Sign out" link on the verify page |

---

## "Looks Done But Isn't" Checklist

- [ ] **Fingerprint cookie flags:** `httpOnly: false`, `SameSite: Lax`, `Secure: true` in prod — verify in browser DevTools > Application > Cookies after login.
- [ ] **Attempt tracking:** `device_verification_codes.attempts` column exists AND increments on each wrong submission — test: submit wrong code 3 times, confirm 4th attempt returns HTTP 429.
- [ ] **Idempotent send-code:** Open two tabs on `/verify-device` simultaneously — confirm only ONE email is sent (check Resend dashboard).
- [ ] **DB-backed trust check:** Delete the fingerprint cookie manually, reload a protected page — confirm OTP is required again (not just a cookie check).
- [ ] **Code invalidated after use:** Submit correct OTP, then submit the same code again immediately — confirm second submission returns invalid/used.
- [ ] **No redirect loop:** With `goya_device_pending` cookie set, navigate to `/verify-device` — confirm page renders without `ERR_TOO_MANY_REDIRECTS`.
- [ ] **Admin revoke audited:** Revoke a device from admin Devices tab — confirm `audit_log` row created with `action: 'device.revoked'`.
- [ ] **Resend failure handled:** Simulate Resend error (wrong API key in dev) — confirm user sees error message, not silent failure.
- [ ] **Edge Runtime not set on verify route:** Confirm no `export const runtime = 'edge'` in verify route — run `node -e "require('crypto').timingSafeEqual"` to confirm availability.
- [ ] **RLS on `device_verification_codes`:** From browser console, `supabase.from('device_verification_codes').select('*')` should return empty result (RLS blocks SELECT for users).
- [ ] **Sign-out available from verify page:** With `goya_device_pending` cookie set, navigate to `/sign-out` — confirm redirect to sign-in, cookie cleared.

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Fingerprint includes UA — re-verification storm | HIGH | Write migration to recompute all `trusted_devices.fingerprint_hash` values using new algorithm (screen + timezone only); bump cookie name to `goya_device_fp_v2` to force client re-compute; all users verify once more |
| OTP endpoint has no attempt limit, brute force occurred | MEDIUM | Add `attempts` column migration (non-breaking, default 0); audit `device_verification_codes` for anomalous attempt patterns; force re-verification for affected users via targeted row deletion |
| Timing attack discovered (no constant-time comparison) | LOW | Replace `===` with `timingSafeEqual` — one-line change; deploy immediately; no DB migration needed |
| SameSite conflict — fingerprint missing on login | MEDIUM | Update cookie options; bump cookie name to force re-issue; all users verify once more on next login |
| Middleware redirect loop deployed to production | LOW | Hotfix: add `/verify-device` to `DEVICE_PENDING_ALLOWED_PATHS` in `middleware.ts`; deploy; no DB migration needed |
| Revocation not logging to audit_log | LOW | Add `logAuditEvent` call; retroactively note gap in `LOG.md` |

---

## Pitfall-to-Phase Mapping

How roadmap phases should address these pitfalls.

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Middleware-only lock bypassable | Phase 1: DB + API design | Every API route queries `trusted_devices` table, not just cookie |
| OTP brute force | Phase 2: Verify API route | Submit wrong code 3 times — 4th attempt returns HTTP 429 |
| Timing attack via `===` | Phase 2: Verify API route | Code review: `timingSafeEqual` present; no `export const runtime = 'edge'` |
| Fingerprint instability (UA in hash) | Phase 1: Fingerprint algorithm | Smoke test: change UA header, confirm hash still matches |
| Multi-tab race condition | Phase 2: Send-code API route | Open 2 tabs simultaneously — confirm 1 email sent per Resend dashboard |
| Cookie flag conflicts | Phase 1: Cookie strategy | DevTools inspection; test in Safari (strictest SameSite enforcement) |
| Middleware redirect loop | Phase 3: Middleware integration | Navigate to `/verify-device` with pending cookie — confirm no loop |
| Revocation not immediate | Phase 4: Admin Devices tab | Confirmation dialog copy states "takes effect on next login" |

---

## Sources

- [CVE-2025-29927 — Vercel Postmortem](https://vercel.com/blog/postmortem-on-next-js-middleware-bypass) — HIGH confidence (official Vercel post-mortem)
- [CVE-2025-29927 Full Analysis — JFrog](https://jfrog.com/blog/cve-2025-29927-next-js-authorization-bypass/) — HIGH confidence (security research)
- [Timing Attacks in Node.js — DEV Community](https://dev.to/silentwatcher_95/timing-attacks-in-nodejs-4pmb) — MEDIUM confidence
- [Constant-time string comparison in Node — Simon Willison TIL](https://til.simonwillison.net/node/constant-time-compare-strings) — HIGH confidence
- [OTP Rate Limiting Best Practices — Arkesel](https://arkesel.com/otp-expiration-rate-limiting-best-practices/) — MEDIUM confidence
- [Rate-limiting OTP endpoints — Unkey](https://www.unkey.com/blog/ratelimiting-otp) — MEDIUM confidence
- [Browser Fingerprinting accuracy 2025 — seresa.io](https://seresa.io/blog/data-loss/browser-fingerprinting-in-2025-why-ip-device-screen-hashing-is-not-the-cookie-alternative-you-think) — MEDIUM confidence
- [Trusted device cookie-theft vulnerability — Akamai Identity Cloud](https://techdocs.akamai.com/identity-cloud/docs/why-a-user-has-to-go-through-two-factor-authentication-even-though-she-trusted-her-device) — HIGH confidence (vendor documentation)
- [NextAuth race condition with cookies — GitHub Issue #8897](https://github.com/nextauthjs/next-auth/issues/8897) — MEDIUM confidence
- [Supabase SSR cookie issues — supabase/ssr Issue #36](https://github.com/supabase/ssr/issues/36) — HIGH confidence (official repo)
- [Next.js Middleware Practical Guide: Pitfalls — eastondev.com](https://eastondev.com/blog/en/posts/dev/20251225-nextjs-middleware-guide/) — MEDIUM confidence
- [Session Security 2025 — techosquare.com](https://www.techosquare.com/blog/session-security-in-2025-what-works-for-cookies-tokens-and-rotation) — MEDIUM confidence
- Codebase inspection: `middleware.ts`, `app/auth/callback/route.ts`, `PROJECT.md` — HIGH confidence (primary source)

---
*Pitfalls research for: Device authentication (2FA) — fingerprinting + email OTP + trusted device management added to Next.js 16 + Supabase*
*Researched: 2026-04-04*
