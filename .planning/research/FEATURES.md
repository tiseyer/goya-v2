# Feature Research

**Domain:** Device verification / new-device 2FA for web app (GOYA v2 v1.24)
**Researched:** 2026-04-04
**Confidence:** HIGH (patterns corroborated by Bitwarden, Twilio, shadcn/ui docs, Smashing Magazine, LogRocket, multiple 2FA implementation guides)

---

## Context

This is a subsequent milestone on an existing platform. The goal is to intercept logins from unrecognized devices and require email OTP before granting full access. Trusted devices skip OTP on future logins. Admins can view and revoke trusted devices per user. All research is scoped to UX patterns for this specific capability — not general 2FA setup flows.

Existing platform dependencies that shape every decision:
- Auth: Supabase cookie sessions, `/auth/callback` redirect
- Email: Resend integration already wired
- Admin: User detail page with URL-param tabs (`?tab=connections`)
- Middleware: Cookie-based route restriction already in use (maintenance mode pattern)
- UI: shadcn/ui components, Tailwind CSS 4, no new UI libraries

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = the device verification flow feels broken or untrustworthy.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| 6-digit numeric OTP | Industry-standard format; users recognize it immediately from banking/Google/Apple flows | LOW | 6 digits = 1,000,000 combinations; sufficient against brute force within expiry window |
| Auto-send OTP on page load | Users land on /verify-device expecting the code is already in their inbox — having to press a button first is jarring | LOW | Fire the send API call server-side during redirect or immediately on client mount |
| OTP auto-advance (per-slot inputs) | Standard expectation from every SMS/email code flow users have encountered | LOW | shadcn `input-otp` (backed by `guilhermerodz/input-otp`) handles this with zero custom logic |
| Paste-to-fill support | Users copy the 6-digit code from email; blocking paste forces manual digit-by-digit entry and causes errors | LOW | `input-otp` supports paste natively; also handles formatted codes like "XXX-XXX" via `pasteTransformer` |
| Auto-submit on complete | Once all 6 slots are filled, submit without requiring a button click — reduces friction and matches user mental model | LOW | Wire `onComplete` callback from `input-otp` to trigger verification API call |
| Resend code option | Email delivery can fail or take time; users need an escape hatch | LOW | Display "Resend code" link/button; disable it during cooldown |
| Resend cooldown (30–60 seconds) | Prevents abuse; aligns with Twilio's recommendation of 1 request per 30 seconds per identity | LOW | Show countdown ("Resend in 42s") — makes the wait feel finite, not broken |
| OTP expiry (10 minutes) | Codes must expire to prevent replay attacks; 10 minutes is the industry consensus for login OTPs | LOW | Set `expires_at = now() + interval '10 minutes'` on code insertion; check on verify |
| Max 5 verification attempts | Prevents brute force within a session; industry standard before requiring fresh code | LOW | Increment attempt counter per code row; invalidate after 5 failures |
| "Trust this device" checkbox | Users expect the ability to skip this on their personal laptop — the whole value of device trust | LOW | Checkbox on /verify-device page; default checked for usability |
| Clear context on the verify page | Users need to know WHY they're being asked for a code — "We noticed a login from a new device" with device hint | LOW | Show browser/OS string derived from User-Agent in the explanatory copy |
| Middleware lock during pending verification | Without this, users bypass the OTP page by directly navigating to /dashboard — security hole | MEDIUM | Set `device_pending_verification` cookie on redirect; middleware checks for it and restricts to /verify-device |
| Admin: view trusted devices per user | Admins need to see what devices a user has trusted — required for support and security audit | LOW | New "Devices" tab on the existing admin user detail page, following the `?tab=devices` URL param pattern |
| Admin: revoke individual trusted device | If a user loses a device or suspects compromise, admin must be able to remove trust for that specific device | LOW | Revoke button per row in the devices table; soft-delete or hard-delete the trusted_devices row |

### Differentiators (Competitive Advantage)

Features that go beyond the minimum and improve the experience or security posture.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Device label from User-Agent | Show "Chrome on macOS" or "Safari on iPhone" rather than a raw fingerprint hash — makes device management human-readable | LOW | Parse UA string server-side (no new library needed — basic string matching on `navigator.userAgent` suffices for browser + OS extraction) |
| "Verified on [date] from [city/browser]" in device list | Contextual info helps users recognize which device is which in the admin panel | LOW | Store `created_at` and `user_agent` on trusted_devices insert; display formatted in the Devices tab |
| Current-device indicator in admin device list | Marks which device the admin is viewing from, making revocation less risky (admin won't accidentally lock themselves out) | LOW | Match fingerprint of current admin session against listed devices |
| Uniform error messages | "Invalid code" for wrong code AND expired code — prevents timing attacks that reveal whether a code is valid vs. expired | LOW | Security best practice; negligible implementation cost |
| Progressive resend cooldown | First resend: 60s cooldown. Second resend: 2 minutes. Prevents spamming Resend inbox | LOW | Track resend_count per verification session; escalate cooldown accordingly |
| Email notification on new trusted device | After successful verification, send "New device trusted on your GOYA account" email — security audit trail for the user | LOW | Resend already integrated; fire async email after marking device trusted |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem useful but introduce complexity, user friction, or security issues.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| User-facing "manage my trusted devices" settings page | Users want to see and revoke their own trusted devices | Adds a new settings section, RLS complexity for user-scoped reads, and a page that 95% of users will never visit; admin revocation covers the support case | Let admins revoke on the user's behalf; add only if support requests show demand post-launch |
| SMS OTP as alternative channel | Some users prefer SMS over email | Requires Twilio/Vonage integration, phone number verification, international complexity, and toll-fraud risk — massive scope increase for a platform already using Resend | Email OTP is sufficient; GOYA users already trust email for password reset |
| TOTP authenticator app support | Power users want Google Authenticator / Authy | Full TOTP setup flow (QR codes, backup codes, app scanning UX) is a separate milestone, not this one; adds 5–10 new screens | Defer to a dedicated "Advanced Security" milestone if demand emerges |
| Biometric / WebAuthn | Modern, phishing-resistant 2FA | Platform-specific browser APIs, passkey management UI, fallback flows, and iOS/Android behavior divergence — 3–4x implementation complexity | Defer; email OTP covers the device-trust use case cleanly |
| "Always trust this browser" (permanent, never-expiring) | Users want zero friction forever | Permanent trust means a stolen session cookie = permanent account access; provides no security improvement after the first verification | Use 90-day rolling window (LastAccess-based); this achieves near-permanent UX for active users while revoking dormant devices |
| Device naming by user ("My MacBook Pro") | Users want to label devices with friendly names | Requires an editable UI, name validation, and storage — adds UX surface area for a field most users won't fill in | Auto-generate a label from UA string; readable enough for support use |
| Real-time "active sessions" view | Show currently active login sessions alongside devices | Session management is a separate concern from device trust; conflating them creates confusing UX and significant infrastructure work (session enumeration, forced logout) | Out of scope; trusted_devices table tracks trust, not sessions |

---

## Feature Dependencies

```
[Device fingerprint (client-side hash)]
    └──required by──> [/auth/callback device check]
                          └──required by──> [Redirect to /verify-device]
                                                └──required by──> [OTP send API]
                                                └──required by──> [OTP verify API]
                                                └──required by──> [middleware lock]

[OTP verify API]
    └──required by──> [Trust this device → insert trusted_devices row]

[trusted_devices table]
    └──required by──> [Admin Devices tab]
    └──required by──> [Admin revoke action]

[Resend email integration (existing)]
    └──enhances──> [OTP send API] (already wired — no new setup)

[Admin user detail page + URL-param tabs (existing)]
    └──enhances──> [Admin Devices tab] (drop-in pattern; no new shell needed)
```

### Dependency Notes

- **Fingerprint required before /auth/callback check:** The hash must be generated client-side on the login page and stored in a cookie before the auth callback runs. Without the cookie, the callback cannot compare device identity.
- **middleware lock required before /verify-device page:** Without the lock, authenticated users navigate away from /verify-device. The `device_pending_verification` cookie must be set atomically with the redirect.
- **trusted_devices table required before admin tab:** The Devices tab is a read + revoke view over this table. Build the table and API first.
- **Resend integration already exists:** The OTP email is a new template, but the Resend client and send utility are already in place. This is not a new dependency.
- **Admin tab pattern already exists:** The user detail page uses `?tab=` URL params (connections, etc.). The Devices tab follows the same pattern — no new routing work.

---

## MVP Definition

### Launch With (v1 — this milestone)

The minimum set to make device verification functional, secure, and admin-manageable.

- [ ] `trusted_devices` and `device_verification_codes` tables with RLS
- [ ] Client-side fingerprint: UA + screen resolution + timezone → SHA-256 → long-lived cookie
- [ ] `/auth/callback` gate: check trusted device → set `device_pending_verification` cookie + redirect if unrecognized
- [ ] Middleware lock: `device_pending_verification` cookie restricts navigation to `/verify-device` only
- [ ] `/verify-device` page: 6-digit OTP input (shadcn `input-otp`), auto-send on load, "Trust this device" checkbox (default checked), context copy with browser/OS hint
- [ ] POST `/api/device/send-code`: generate 6-digit OTP, hash + store in DB, send via Resend, 10-minute expiry
- [ ] POST `/api/device/verify-code`: validate code, check expiry, check attempt limit (max 5), mark trusted if checkbox checked, clear pending cookie
- [ ] Resend cooldown: 60s first resend, 2-minute second resend, countdown display
- [ ] Admin "Devices" tab on user detail page: table of trusted devices (label, verified date, last seen), revoke button per row

### Add After Validation (v1.x)

Add these once the core flow ships and real usage data is available.

- [ ] "New trusted device" email notification to user — trigger: assess whether users want this or find it noisy
- [ ] Progressive attempt lockout (delay between attempts) — trigger: if brute-force attempts appear in logs
- [ ] Current-device indicator in admin Devices tab — trigger: admin feedback on usability

### Future Consideration (v2+)

Defer until there is clear user demand.

- [ ] User-facing "My Devices" settings page — trigger: support tickets requesting self-service revocation
- [ ] TOTP authenticator app support — trigger: user requests for app-based 2FA
- [ ] WebAuthn / passkeys — trigger: platform-wide security upgrade initiative

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Fingerprint cookie + /auth/callback gate | HIGH | LOW | P1 |
| /verify-device page with OTP input | HIGH | LOW | P1 |
| OTP send API (Resend) | HIGH | LOW | P1 |
| OTP verify API + trust insert | HIGH | LOW | P1 |
| Middleware lock (pending cookie) | HIGH | LOW | P1 |
| Auto-send on page load | HIGH | LOW | P1 |
| Paste + auto-advance + auto-submit | HIGH | LOW | P1 |
| "Trust this device" checkbox | HIGH | LOW | P1 |
| Resend cooldown with countdown | MEDIUM | LOW | P1 |
| Max 5 attempts enforcement | MEDIUM | LOW | P1 |
| UA-derived device label | MEDIUM | LOW | P1 |
| Admin Devices tab + revoke | MEDIUM | LOW | P1 |
| "New trusted device" email | LOW | LOW | P2 |
| Current-device indicator in admin | LOW | LOW | P2 |
| Progressive resend cooldown | LOW | LOW | P2 |
| User-facing device management page | LOW | MEDIUM | P3 |
| SMS OTP | LOW | HIGH | P3 |
| TOTP / WebAuthn | LOW | HIGH | P3 |

---

## OTP Input Implementation Notes

These are specific implementation decisions that flow from the research — relevant for the build phase.

**Component choice:** Use `input-otp` from `guilhermerodz/input-otp` (the same library shadcn wraps). It provides:
- Auto-advance per slot
- Paste-to-fill (full code from clipboard in one action)
- `onComplete` callback for auto-submit
- `inputmode="numeric"` for mobile keyboards
- `autocomplete="one-time-code"` for OS-level autofill (iOS/Android fill from email)
- Accessible ARIA labels

**Auto-submit:** Wire the `onComplete` callback to immediately call the verify API — no submit button required. If verification fails, clear the input and show an error. If it succeeds, redirect.

**Error messaging:** Use uniform messages ("That code is incorrect or has expired") regardless of whether the failure is wrong digits, expired code, or exceeded attempts. This prevents timing-based enumeration of valid codes.

**Mobile keyboard:** `inputmode="numeric"` triggers the numeric keypad. On iOS 16+, `autocomplete="one-time-code"` enables the "From Messages" / "From Mail" autofill banner.

---

## Trusted Device Duration

**Recommended: 90-day rolling window (LastAccess-based)**

- Store `last_accessed_at` on `trusted_devices`; update it on each recognized login
- A device remains trusted as long as it's used at least once within any 90-day window
- Inactive devices (unused for 90 days) expire naturally — no cron required if checked at login time
- This matches Bitwarden's pattern (3-month window) and aligns with "permanent for active users, automatic cleanup for dormant devices" behavior
- Never use permanent/never-expiring trust: it means a stolen session gives indefinite access

---

## Admin Devices Tab Columns

Following the existing admin user detail tab pattern (`?tab=devices`):

| Column | Source | Display |
|--------|--------|---------|
| Device | `user_agent` (parsed) | "Chrome on macOS", "Safari on iPhone" |
| Verified | `created_at` | Relative date ("3 days ago") with absolute on hover |
| Last seen | `last_accessed_at` | Relative date |
| Actions | — | "Revoke" button — hard delete or soft delete with `revoked_at` |

No bulk revoke needed for MVP. Single-row revoke is sufficient. If the admin revokes all devices, the user will re-verify on next login from any device.

---

## Sources

- [Bitwarden New Device Login Protection](https://bitwarden.com/help/new-device-verification/) — real-world implementation reference, device trust patterns, cookie-based recognition
- [Twilio Verify Developer Best Practices](https://www.twilio.com/docs/verify/developer-best-practices) — 30s resend limit, 6-digit default, rate limiting guidance
- [Designing a Secure OTP Verification Flow — NerdBot (2026)](https://nerdbot.com/2026/02/28/designing-a-secure-otp-verification-flow-for-modern-web-apps/) — state machine, 5-attempt max, progressive delays, uniform error messages
- [2FA UX Patterns — LogRocket](https://blog.logrocket.com/ux-design/2fa-user-flow-best-practices/) — resend max, trusted device skip patterns
- [shadcn input-otp docs](https://ui.shadcn.com/docs/components/radix/input-otp) — component capability confirmation (paste, auto-advance, `onComplete`)
- [input-otp GitHub (guilhermerodz)](https://github.com/guilhermerodz/input-otp) — paste transformer, `autocomplete="one-time-code"` support
- [OTP Expiration & Rate Limiting Best Practices — Arkesel](https://arkesel.com/otp-expiration-rate-limiting-best-practices/) — 30–60s resend cooldown confirmation
- [2FA Device-Aware Implementation — Medium/@jha.aaryan](https://medium.com/@jha.aaryan/2fa-that-knows-your-device-522b423cdc17) — 3-month trust window, UA+IP fingerprint, new-device email alerts
- [Authentication UX Design — Smashing Magazine](https://www.smashingmagazine.com/2022/08/authentication-ux-design-guidelines/) — general auth UX principles
- [Auth0 Device Intelligence Blog](https://auth0.com/blog/leveraging-device-intelligence-to-protect-digital-identities/) — device fingerprint composition patterns

---

*Feature research for: Device verification / new-device 2FA — GOYA v2 v1.24*
*Researched: 2026-04-04*
