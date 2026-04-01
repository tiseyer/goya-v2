# Quick Task: remove-staticmembers-lookup-fallback

**Date:** 2026-03-30
**Status:** Done

## Task Description

Remove the stale `staticMembers` lookup fallback in the members detail page (`app/members/[id]/page.tsx`). The static members data is no longer needed since all member profiles are served from Supabase.

## Solution

1. Replaced `const staticMember = !profileData ? staticMembers.find(m => m.id === id) : null;` with `const staticMember = null;`
2. Removed the now-unused import `import { members as staticMembers } from '@/lib/members-data';`

## Commit

`4dd0e0e` — fix: remove stale staticMembers lookup fallback in members detail page
