---
task_id: 260404-h63
date: 04-04-2026
status: complete (awaiting human-verify)
---

# Quick Task: Seed 4 Test Users with Full Dummy Profiles

## Task Description

Create an idempotent TypeScript seed script that provisions 4 fully-populated test users in Supabase Auth + profiles, with connections, credit entries, a school, and faculty membership.

## Solution

Created `scripts/seed-test-users.ts`. Run with `npx tsx scripts/seed-test-users.ts`.

**Users created:**

| Email | Name | Role |
|-------|------|------|
| student-test@seyer-marketing.de | Maya Collins | student |
| teacher-test@seyer-marketing.de | Daniel Reeves | teacher |
| school-test@seyer-marketing.de | Sandra Kim | teacher (school owner) |
| wp-test@seyer-marketing.de | Marco Silva | wellness_practitioner |

Password for all: **Test1234!**

**Data seeded:**
- 4 auth users with confirmed emails
- 4 profiles with full bios, avatars, locations, social links, `wp_roles: ['faux']`
- 12 connection rows (6 bidirectional pairs, type: peer, status: accepted)
- Lotus Flow Yoga School (Sandra as PT, Daniel as Lead Instructor faculty)
- 8 credit entries for Daniel (teaching/ce/practice)
- 12 credit entries for Sandra (teaching/ce/practice/community)

## Status

Complete. Script runs with 0 errors and is fully idempotent. Awaiting human verification checkpoint.
