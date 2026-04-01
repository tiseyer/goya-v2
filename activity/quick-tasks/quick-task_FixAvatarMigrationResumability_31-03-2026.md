# Quick Task: Fix Avatar Migration Script Resumability

**Date:** 2026-03-31
**Status:** Complete

## Task
Fix the pagination bug in `scripts/migrate-wp-avatars.ts` that caused the script to skip unmigrated profiles on re-run instead of processing them.

## Solution
Removed offset-based pagination (`offset += batchSize`). Always query from position 0 since successfully migrated profiles are automatically excluded by the WHERE clause filter.
