# Quick Task: Fix Admin Event Edit Save Button

**Date:** 2026-04-03
**Status:** Complete
**Quick ID:** 260403-cuh

## Task Description

Fix the Save button on admin event edit form getting stuck in "Saving..." state after successful save.

## Solution

Added `finally` block to reset saving state, show inline success message on edit (auto-dismiss 3s), keep navigation on create.

## Commits

- `473908b` — fix: admin event edit save button stuck in Saving state
