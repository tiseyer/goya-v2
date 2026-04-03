---
task: 260403-ly5
date: 2026-04-03
status: complete
---

# Quick Task: Fix PageHero Edit Mode Layout — Variables and Buttons to Fixed Panels

## Task Description

Variable pills and Save/Cancel buttons in PageHero edit mode were positioned inside the hero section (absolute bottom), causing overlap and readability issues. The task was to move them outside the hero flow into fixed-position panels.

## Status

Complete.

## Solution

- Removed the `editToolbar` const (absolute-positioned bottom toolbar inside the hero)
- Added a fixed left-edge variables panel (`fixed left-0 top-1/2 -translate-y-1/2 z-50`) rendered in both dark and light variants when `editing === true`
- Added fixed top-right Save/Cancel panel (`fixed top-4 right-4 z-50`) rendered in both variants when editing
- Changed `adminControl` to show an X icon (instead of null) when `editing === true` — clicking X cancels edit, same styling as pencil button

File modified: `app/components/PageHero.tsx`
Commit: 5434734
