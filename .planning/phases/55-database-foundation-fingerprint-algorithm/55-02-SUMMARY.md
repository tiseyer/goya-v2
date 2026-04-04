---
phase: 55-database-foundation-fingerprint-algorithm
plan: "02"
subsystem: device-fingerprinting
tags: [fingerprint, device-trust, cookies, sha256, client-component]
dependency_graph:
  requires: [55-01]
  provides: [lib/device/fingerprint.ts, lib/device/parseDeviceName.ts, lib/device/checkTrustedDevice.ts, app/components/DeviceFingerprintSetter.tsx]
  affects: [56-otp-api-routes, 57-auth-callback-middleware-verify-page, 58-admin-devices-tab]
tech_stack:
  added: []
  patterns: [Web Crypto API SHA-256, service-role Supabase query, 90-day rolling window, client-only cookie setter]
key_files:
  created:
    - lib/device/fingerprint.ts
    - lib/device/parseDeviceName.ts
    - lib/device/checkTrustedDevice.ts
    - app/components/DeviceFingerprintSetter.tsx
  modified:
    - app/layout.tsx
decisions:
  - "UA excluded from fingerprint hash — screen dimensions + timezone + language only (per Pitfall 4 / FP-01)"
  - "goya_device_fp cookie: SameSite=Lax (not Strict) so fingerprint is sent on /auth/callback redirect"
  - "checkTrustedDevice uses `as any` cast because trusted_devices may not be in generated types from Plan 01 yet — safe, column names verified against migration"
  - "DeviceFingerprintSetter writes goya_device_name cookie always (display only) but only writes goya_device_fp if absent"
metrics:
  duration: "2 minutes"
  completed_date: "2026-04-04"
  tasks_completed: 2
  files_changed: 5
---

# Phase 55 Plan 02: Device Fingerprint Module Summary

**One-liner:** SHA-256 fingerprint (screen+timezone+language, no UA) with cookie setter component and service-role 90-day trust checker.

## Tasks Completed

| # | Task | Commit | Files |
|---|------|--------|-------|
| 1 | Create lib/device/ module | 96c4e79 | lib/device/fingerprint.ts, parseDeviceName.ts, checkTrustedDevice.ts |
| 2 | Create DeviceFingerprintSetter + mount in layout | 2788d12 | app/components/DeviceFingerprintSetter.tsx, app/layout.tsx |

## What Was Built

### lib/device/fingerprint.ts
Client-safe async function using Web Crypto API (`crypto.subtle.digest`). Hash inputs: `screen.width`, `screen.height`, `screen.colorDepth`, `Intl.DateTimeFormat().resolvedOptions().timeZone`, `navigator.language` — joined with `|`. Returns lowercase 64-char hex string. UserAgent is intentionally excluded (would change every ~6 weeks with Chrome auto-updates).

### lib/device/parseDeviceName.ts
Client-safe synchronous function. Detects browser (Firefox, Edge, Opera, Chrome, Safari) and OS (iOS, Android, macOS, Windows, Linux, ChromeOS) from userAgent string. Returns `"Browser on OS"` format. Falls back to `"Unknown Device"` if no UA available.

### lib/device/checkTrustedDevice.ts
Server-only function using `getSupabaseService()`. Queries `trusted_devices` table for a row matching `profile_id` + `device_fingerprint` where `last_used_at >= 90 days ago`. Returns boolean. This is the defense-in-depth check — used independently by every API route, not solely by middleware (CVE-2025-29927 pattern).

### app/components/DeviceFingerprintSetter.tsx
`'use client'` component with a `useEffect`. Sets `goya_device_fp` cookie only if absent (avoids unnecessary rewrites). Always sets `goya_device_name` cookie with human-readable device label. Both cookies: `path=/`, `max-age=31536000` (365 days), `SameSite=Lax`, Secure in production. Returns `null` — no visual output.

### app/layout.tsx
Added import and `<DeviceFingerprintSetter />` mount immediately inside `<ClientProviders>`, before `<ImpersonationBanner>`. Ensures fingerprint cookie is available before any login flow on any page.

## Decisions Made

1. **UA excluded from hash** — Chrome auto-updates every ~6 weeks; including UA would cause mass re-verification storms. Screen dimensions + timezone + language are stable for the same device/browser profile.

2. **SameSite=Lax (not Strict)** — The fingerprint cookie must be sent when the user is redirected from `/auth/callback` (an external-origin redirect). Strict would drop the cookie on that redirect.

3. **`as any` cast in checkTrustedDevice** — `trusted_devices` table may not be present in the auto-generated Supabase types until Plan 01 migration runs. The cast is safe because column names are verified directly against the migration SQL.

4. **Only write fingerprint cookie if absent** — Avoids overwriting on every page load. Device name cookie is always refreshed (harmless for display purposes).

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — all functionality is fully wired.

## Self-Check: PASSED

- lib/device/fingerprint.ts: FOUND
- lib/device/parseDeviceName.ts: FOUND
- lib/device/checkTrustedDevice.ts: FOUND
- app/components/DeviceFingerprintSetter.tsx: FOUND
- app/layout.tsx: modified, contains DeviceFingerprintSetter import and JSX mount
- Commit 96c4e79: FOUND
- Commit 2788d12: FOUND
- tsc: 0 errors in changed files (pre-existing errors in app/page.test.tsx only — unrelated test runner types)
