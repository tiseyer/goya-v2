---
task_id: 260404-jep
date: 2026-04-04
status: complete
---

# Quick Task: Fix Password Reset PKCE Flow

## Task Description

Fix the password reset PKCE flow so that the code-for-session exchange happens server-side in `/auth/callback` before the user ever reaches `/reset-password`. Users were seeing "Link expired or invalid" immediately on valid reset links.

## Root Cause

Supabase PKCE stores a `code_verifier` in browser storage when `resetPasswordForEmail()` is called. When the email link opened (different tab, fresh session), the client-side `exchangeCodeForSession(code)` on `/reset-password` had no matching `code_verifier`, causing immediate failure.

## Solution

1. **`app/forgot-password/page.tsx`** — Changed `redirectTo` to point through `/auth/callback?next=/reset-password` instead of directly to `/reset-password`. The server-side callback handles PKCE exchange without needing a client-side `code_verifier`.

2. **`app/reset-password/page.tsx`** — Replaced client-side `exchangeCodeForSession` with `getSession()` check. Added safety-net redirect for old `?code=` links. Removed 3-second timeout hack.

3. **Deleted** `app/reset-password/page 2.tsx` — accidental duplicate file.

## Status

Complete — awaiting end-to-end verification (request reset → click link → set password → sign in).

## Commit

`ecb6a4b`
