# Quick Task 260403-c7w: Fix nav auth race condition causing progressive pop-in

**Date:** 2026-04-03
**Status:** Complete

## Problem

Nav items appeared progressively on page load: public items (Members, Events, Academy) first, then Add-Ons, then Dashboard. This was caused by a race condition between `getUser()` and `onAuthStateChange` in the Header component's auth initialization.

## Root Cause

`getUser()` could resolve to `null` before `onAuthStateChange` fired with the actual session, setting `authLoading=false` prematurely and revealing the logged-out nav. When `onAuthStateChange` then fired with the session, auth-gated items popped in one by one.

## Fix

Removed the `getUser()` call and consolidated all auth initialization into the `onAuthStateChange` listener, which fires with `INITIAL_SESSION` as the authoritative source of truth. `authLoading` is only set to `false` after the listener has resolved (including profile fetch for logged-in users).

## File Changed

- `app/components/Header.tsx` — replaced dual auth init (getUser + onAuthStateChange) with single onAuthStateChange listener

## Commit

- `bf9024c` — fix: prevent nav items from popping in progressively on page load
