---
title: Hero Section Editing
description: How to customize page hero banners with inline editing
audience: admin
last_updated: 2026-04-03
---

# Hero Section Editing

Admins can customize the hero banner (pill, title, and subtitle) on any page that displays a PageHero.

## How to Edit

1. Navigate to any page with a hero banner (Dashboard, Events, Academy, Add-Ons)
2. Look for the small pencil icon in the top-right corner of the hero section
3. Click the pencil icon to enter edit mode
4. Edit the pill text, title, or subtitle directly inline
5. Use variable pills at the bottom to insert dynamic content
6. Click Save to persist your changes, or Cancel to discard

## Available Variables

| Variable | Description | Example Output |
|----------|-------------|---------------|
| `[first_name]` | User's first name | Alice |
| `[full_name]` | User's full name | Alice Johnson |
| `[role]` | User's role | Teacher |
| `[greeting]` | Time-based greeting | Good morning |
| `[member_count]` | Total members | 142 |
| `[event_count]` | Total events | 23 |

Variables resolve differently for each user viewing the page.

## Notes

- Changes are saved per page (Dashboard, Events, Academy, Add-Ons)
- If you clear all fields, the page reverts to its default hero content
- Only admins can see the edit pencil and make changes
- All users see the customized content with their own variable values
