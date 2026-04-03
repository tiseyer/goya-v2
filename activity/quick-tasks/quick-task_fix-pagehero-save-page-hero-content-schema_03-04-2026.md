# Quick Task: Fix PageHero Save — page_hero_content Schema

**Date:** 2026-04-03
**Task ID:** 260403-lkf
**Status:** Complete

## Task Description

Fix the `page_hero_content` database table schema so that PageHero inline editing saves work end-to-end. The migration had column name mismatches with the API route.

## Problem

The migration `20260404_page_hero_content.sql` created the table with wrong column names:
- `page_slug` (API expected `slug`)
- `pill_text` (API expected `pill`)
- `id uuid primary key` + separate `page_slug text unique` (API expected `slug text primary key`)
- `references profiles(id)` (should be `references auth.users(id)`)

This caused any Save attempt in the PageHero inline editor to fail at the DB level.

## Solution

1. Rewrote migration to use `drop table if exists` + correct schema (`slug text primary key`, `pill text`, `references auth.users(id)`)
2. Applied to remote DB via `npx supabase db query --linked -f` since table already existed with wrong schema
3. Regenerated Supabase types — `page_hero_content` now in types with correct columns; `is_superuser` boolean preserved on profiles
4. Verified Events and Academy pages correctly pass `pageSlug` and `isAdmin={profile.role === 'admin'}` to PageHero
5. Confirmed no source files reference `'superuser'` as a role value string

## Commits

- `323d3d1` — fix(260403-lkf): correct page_hero_content migration column names
- `720be3c` — chore(260403-lkf): regenerate Supabase types with page_hero_content table
