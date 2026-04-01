---
task_id: 260401-l88
date: 01-04-2026
status: DONE
---

# Quick Task: Fix Admin Nav, Email Position, Tab Styling

## Description

Fixed 4 admin UI issues:
1. Moved Emails nav item from standalone link into the Settings group (as first child)
2. Removed the divider between Shop and Settings groups
3. Changed group click behavior: now always expands and navigates to first child (never collapses on click)
4. Removed active background highlight from parent group buttons (only child links highlight)
5. Restyled Email page tabs from underline style to pill style matching Settings page

## Solution

- `AdminShell.tsx`: Restructured NAV_ITEMS, updated `toggleGroup` to accept `NavGroup` and call `router.push(firstChild.href)`, removed `isAnyChildActive` highlight from group button className
- `emails/page.tsx`: Replaced `border-b` tab container with `bg-slate-100 rounded-lg p-1 w-fit` pill container, updated active tab to `bg-white shadow-sm`, removed underline span

## Commits

- `1bdcac4` — feat(260401-l88): fix sidebar — emails in settings group, expand+navigate, no parent highlight
- `c964378` — feat(260401-l88): restyle email page tabs to pill style matching settings
