# Requirements: GOYA v2 — v1.24 Device Authentication (2FA)

**Defined:** 2026-04-04
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1 Requirements

Requirements for v1.24 milestone. Each maps to roadmap phases.

### Database & Schema

- [ ] **DB-01**: Trusted devices table stores user_id, device fingerprint, device name, IP, timestamps with unique(user_id, device_fingerprint) constraint
- [ ] **DB-02**: Device verification codes table stores user_id, hashed code, device fingerprint, expiry, attempt count, used flag
- [ ] **DB-03**: RLS policies enforce admin full access and user read-only on own trusted devices

### Device Fingerprinting

- [ ] **FP-01**: Client-side fingerprint generated from screen dimensions, color depth, timezone, and language (no userAgent in hash) via SHA-256
- [ ] **FP-02**: Human-readable device name parsed from userAgent (browser + OS format: "Chrome on macOS")
- [ ] **FP-03**: Fingerprint stored in long-lived cookie (365 days, SameSite=Lax, httpOnly=false)
- [ ] **FP-04**: DeviceFingerprintSetter component mounted in root layout sets cookie on every page load

### Login Flow

- [ ] **AUTH-01**: Auth callback checks trusted_devices after session exchange — trusted devices proceed normally
- [ ] **AUTH-02**: Unrecognized devices get device_pending_verification cookie and redirect to /verify-device
- [ ] **AUTH-03**: Middleware locks user to /verify-device and /api/device-verification/* while pending cookie exists

### OTP Verification

- [ ] **OTP-01**: /verify-device page shows "New Device Detected" with masked email and 6-digit OTP input
- [ ] **OTP-02**: POST /api/device-verification/send generates code, hashes before storage, sends via Resend with device info in email
- [ ] **OTP-03**: POST /api/device-verification/verify validates code with timingSafeEqual, enforces max 5 attempts, marks trusted on success
- [ ] **OTP-04**: Send endpoint is idempotent — reuses unexpired code if called within recency window (multi-tab safe)
- [ ] **OTP-05**: Resend link disabled for 60s cooldown, then clickable again
- [ ] **OTP-06**: OTP codes expire after 10 minutes

### Admin Device Management

- [ ] **ADM-01**: Admin user detail page has "Devices" tab showing trusted devices list
- [ ] **ADM-02**: Each device row shows device name, IP, first seen, last seen, and Revoke button
- [ ] **ADM-03**: Revoke deletes the trusted device record (hard delete)
- [ ] **ADM-04**: GET /api/admin/users/[id]/devices and DELETE /api/admin/users/[id]/devices/[deviceId] admin-only routes

## Future Requirements

Deferred beyond v1.24. Tracked but not in current roadmap.

### Enhanced Security

- **SEC-01**: SMS OTP as alternative delivery channel
- **SEC-02**: TOTP authenticator app support (Google Authenticator, Authy)
- **SEC-03**: WebAuthn/passkey support for passwordless device trust
- **SEC-04**: Real-time active session viewer for users

### User Self-Service

- **SELF-01**: User can view and revoke their own trusted devices from Settings
- **SELF-02**: User can set "trust this device" duration (30/60/90 days)
- **SELF-03**: Email notification when a new device is trusted

## Out of Scope

| Feature | Reason |
|---------|--------|
| SMS OTP delivery | Cost, complexity, phone number collection — email sufficient for v1 |
| TOTP/authenticator apps | Significant UX complexity, requires QR setup flow |
| WebAuthn/passkeys | Browser support inconsistent, complex implementation |
| User self-service device management | Admin-only for v1; user settings page deferred |
| Fingerprint using canvas/WebGL | Overkill — cookie is primary trust token, fingerprint is secondary hint |
| FingerprintJS library | 40KB bundle for 40-60% accuracy; cookie-based approach is simpler and more reliable |
| Soft-delete on device revoke | Hard delete is simpler; audit log captures the action if needed later |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 55 | Pending |
| DB-02 | Phase 55 | Pending |
| DB-03 | Phase 55 | Pending |
| FP-01 | Phase 55 | Pending |
| FP-02 | Phase 55 | Pending |
| FP-03 | Phase 55 | Pending |
| FP-04 | Phase 55 | Pending |
| OTP-02 | Phase 56 | Pending |
| OTP-03 | Phase 56 | Pending |
| OTP-04 | Phase 56 | Pending |
| OTP-06 | Phase 56 | Pending |
| AUTH-01 | Phase 57 | Pending |
| AUTH-02 | Phase 57 | Pending |
| AUTH-03 | Phase 57 | Pending |
| OTP-01 | Phase 57 | Pending |
| OTP-05 | Phase 57 | Pending |
| ADM-01 | Phase 58 | Pending |
| ADM-02 | Phase 58 | Pending |
| ADM-03 | Phase 58 | Pending |
| ADM-04 | Phase 58 | Pending |

**Coverage:**
- v1 requirements: 20 total
- Mapped to phases: 20
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-04*
*Last updated: 2026-04-04 after roadmap creation — all 20 requirements mapped*
