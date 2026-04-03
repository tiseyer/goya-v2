# Quick Task: Fix Nav Auth Race Condition

**Date:** 2026-04-03
**Status:** Complete
**Quick ID:** 260403-c7w

## Task Description

Fix progressive nav item pop-in on page load caused by race condition between getUser() and onAuthStateChange in Header component.

## Solution

Consolidated auth initialization into single onAuthStateChange listener, removing getUser() which could resolve to null prematurely and flash logged-out nav before auth state was known.

## Commits

- `bf9024c` — fix: prevent nav items from popping in progressively on page load
