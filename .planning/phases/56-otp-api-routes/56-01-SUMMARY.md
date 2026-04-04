---
phase: 56-otp-api-routes
plan: "01"
subsystem: device-authentication
tags: [otp, 2fa, device-verification, api-routes, node-crypto]
dependency_graph:
  requires: []
  provides: [device-verification-send-api, device-verification-verify-api]
  affects: [trusted_devices, device_verification_codes]
tech_stack:
  added: []
  patterns: [node-crypto-timingsafeequal, sha256-hashing, idempotent-send, trusted-device-registration]
key_files:
  created:
    - app/api/device-verification/send/route.ts
    - app/api/device-verification/verify/route.ts
  modified: []
decisions:
  - "Email send failures are non-fatal in /send — code is still usable and 200 is returned"
  - "Idempotency window is 2 minutes — calls within that window return existing expiresAt without new DB row or email"
  - "Codes older than 2 minutes but still valid are invalidated before a new one is generated"
  - "timingSafeEqual wrapped in try/catch — any buffer mismatch error is treated as invalid code, not an exception"
  - "ip_address taken from x-forwarded-for first segment only (proxy-safe)"
metrics:
  duration: "15 minutes"
  completed_date: "2026-04-04"
  tasks_completed: 3
  files_created: 2
  files_modified: 0
---

# Phase 56 Plan 01: OTP API Routes Summary

Two Node.js API route handlers implementing device OTP flow: `send` generates and stores a SHA-256-hashed 6-digit OTP with idempotency; `verify` performs timing-safe comparison and registers a trusted device on success.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | POST /api/device-verification/send | 9b054db | app/api/device-verification/send/route.ts |
| 2 | POST /api/device-verification/verify | 3096d5a | app/api/device-verification/verify/route.ts |
| 3 | Full TypeScript build check | — (no new files) | — |

## What Was Built

### send/route.ts
POST handler that:
1. Parses `device_pending_verification` cookie (`profileId|deviceFingerprint`)
2. Checks for existing unexpired non-invalidated code — if within 2-minute window returns existing `expiresAt` (idempotent); if older than 2 minutes, invalidates it
3. Generates `crypto.randomInt(100000, 999999)`, SHA-256 hashes it, sets 10-minute expiry
4. Inserts new row into `device_verification_codes`
5. Fetches profile email from `profiles`
6. Sends email via `sendEmailFromTemplate` with `templateKey: 'device_verification_otp'` (non-fatal if email fails)
7. Returns `{ expiresAt }` on success; `400 missing_pending_cookie`, `500 internal_error`, `500 profile_not_found` on error

### verify/route.ts
POST handler that:
1. Parses `device_pending_verification` cookie
2. Validates `body.code` is a 6-digit string (`/^\d{6}$/`)
3. Fetches latest non-invalidated code for `(profileId, deviceFingerprint)`
4. Guards: `no_pending_verification`, `code_expired`, `too_many_attempts` (attempt_count >= 5)
5. Timing-safe comparison via `crypto.timingSafeEqual(Buffer.from(submittedHash, 'hex'), Buffer.from(storedHash, 'hex'))`
6. On mismatch: increments `attempt_count`; at 5 sets `invalidated=true`; returns `{ remainingAttempts }`
7. On match: inserts `trusted_devices` row, invalidates code, clears `device_pending_verification` cookie (`maxAge: 0`), returns `{ success: true }`

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check

### Files exist
- [x] `app/api/device-verification/send/route.ts` — FOUND
- [x] `app/api/device-verification/verify/route.ts` — FOUND

### Commits exist
- [x] `9b054db` — FOUND
- [x] `3096d5a` — FOUND

### TypeScript
- [x] `npx tsc --noEmit` exits 0 — PASSED

### Neither route exports `runtime = 'edge'`
- [x] Confirmed — both files have comment explicitly noting Node.js runtime requirement

## Self-Check: PASSED
