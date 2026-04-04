---
phase: 57-auth-callback-middleware-verify-page
plan: "02"
subsystem: auth
tags: [device-auth, 2fa, otp, verify-page, server-component, client-component]
dependency_graph:
  requires: [device_pending_verification cookie flow (57-01), /api/device-verification/send, /api/device-verification/verify]
  provides: [/verify-device page, VerifyDeviceClient OTP flow, InputOTP wrapper component]
  affects: [app/verify-device/page.tsx, app/verify-device/VerifyDeviceClient.tsx, app/components/ui/input-otp.tsx]
tech_stack:
  added: [input-otp (npm package)]
  patterns: [server-component-with-client-shell, cookie-read-in-server-component, controlled-otp-input, cooldown-timer-pattern]
key_files:
  created:
    - app/verify-device/page.tsx
    - app/verify-device/VerifyDeviceClient.tsx
    - app/components/ui/input-otp.tsx
decisions:
  - "input-otp package was not in package.json — installed it as a required blocking dependency (Rule 3)"
  - "No components/ui/ at root; created shadcn-style InputOTP wrapper at app/components/ui/input-otp.tsx to match project's existing ui component path"
  - "sendOTP wrapped in useCallback so useEffect dependency array is satisfied without lint warnings"
  - "Title and subtitle rendered in page.tsx (server shell) rather than VerifyDeviceClient to keep server markup static"
metrics:
  duration: "~15 minutes"
  completed: "2026-04-04"
  tasks_completed: 2
  files_modified: 3
---

# Phase 57 Plan 02: Verify Device Page Summary

**One-liner:** `/verify-device` server component reads masked profile email from Supabase and passes it to a client OTP component with auto-send on mount, 60-second resend cooldown, auto-submit on 6-digit entry, and sign-out escape hatch.

## Tasks Completed

| Task | Description | Commit |
|------|-------------|--------|
| 1 | Create app/verify-device/page.tsx (server component) | 7cb2fe3 |
| 2 | Create app/verify-device/VerifyDeviceClient.tsx + InputOTP wrapper | 608128d |

## What Was Built

### Task 1 — `/verify-device` Server Page (`app/verify-device/page.tsx`)

- Reads `device_pending_verification` cookie via `cookies()` from `next/headers`; redirects to `/sign-in` if absent
- Builds a Supabase server client using `createServerClient` from `@supabase/ssr` with async cookies adapter
- Calls `supabase.auth.getUser()`; redirects to `/sign-in` if no session
- Fetches `profiles.email` for the user; falls back to `user.email`
- Applies `maskEmail()` helper: `t***@domain.com` format
- Renders dark full-screen layout matching `/reset-password` style (`bg-[#1e2e56]`, centered `max-w-md` card)
- Passes `maskedEmail` as prop to `<VerifyDeviceClient>`

### Task 2 — OTP Client Component (`app/verify-device/VerifyDeviceClient.tsx`)

- `'use client'` directive; accepts `maskedEmail: string` prop
- State: `otp`, `status` (idle/sending/sent/verifying/error/success), `errorMsg`, `cooldown`
- **Auto-send on mount:** `useEffect` calls `sendOTP()` once on mount
- **Resend cooldown:** `setTimeout`-based countdown; resend button disabled + shows `Resend in Xs` during cooldown
- **InputOTP:** 6-slot controlled input; `onChange` fires `verifyOTP()` when value reaches length 6
- **verifyOTP:** POST to `/api/device-verification/verify`; on success → `router.push('/dashboard')`; handles `code_expired` (auto-resend), `too_many_attempts` (lock message), `invalid_code` (show remaining attempts)
- **Sign-out:** `supabase.auth.signOut()` then `router.push('/sign-in')`
- Visual: `bg-[#243560]` card, teal primary button, dark OTP slots

### InputOTP Wrapper (`app/components/ui/input-otp.tsx`)

Shadcn-style wrapper over the `input-otp` npm package. Exports `InputOTP`, `InputOTPGroup`, `InputOTPSlot`, `InputOTPSeparator`. Uses `OTPInput` and `OTPInputContext` from the package to implement slot-level active/caret state.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] `input-otp` package not installed**
- **Found during:** Task 2 — TypeScript check failed with `Cannot find module 'input-otp'`
- **Issue:** The CONTEXT.md stated the package was installed, but it was absent from `package.json`
- **Fix:** Ran `npm install input-otp`; package installed successfully with types
- **Files modified:** `package.json`, `package-lock.json`
- **Commit:** 608128d

**2. [Rule 3 - Blocking] `input-otp` exports `OTPInput`/`OTPInputContext`, not `InputOTP`/`InputOTPGroup`/`InputOTPSlot`**
- **Found during:** Task 2 — TypeScript check: `Module '"input-otp"' has no exported member 'InputOTP'`
- **Issue:** The plan expected shadcn-style named exports, but the raw package uses a different API. No `components/ui/` existed at project root; project uses `app/components/ui/`
- **Fix:** Created `app/components/ui/input-otp.tsx` — a thin shadcn-style wrapper that re-exports `InputOTP`, `InputOTPGroup`, `InputOTPSlot` using `OTPInput` and `OTPInputContext` from the package. Updated import in `VerifyDeviceClient.tsx` to `@/app/components/ui/input-otp`
- **Files modified:** `app/components/ui/input-otp.tsx` (created), `app/verify-device/VerifyDeviceClient.tsx`
- **Commit:** 608128d

## Known Stubs

None — all data is wired: masked email is fetched from Supabase profile server-side; OTP send/verify calls real API routes from Plan 56.

## Self-Check: PASSED

Files created:
- FOUND: app/verify-device/page.tsx
- FOUND: app/verify-device/VerifyDeviceClient.tsx
- FOUND: app/components/ui/input-otp.tsx

Commits:
- FOUND: 7cb2fe3 (feat(57-02): create /verify-device server page component)
- FOUND: 608128d (feat(57-02): create VerifyDeviceClient OTP interaction component)
