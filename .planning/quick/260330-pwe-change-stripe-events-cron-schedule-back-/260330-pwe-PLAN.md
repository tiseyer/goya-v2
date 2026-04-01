---
quick_id: 260330-pwe
description: Change stripe-events cron schedule back to every 5 minutes
date: 2026-03-30
---

# Quick Task: Change stripe-events cron schedule

## Task 1: Update vercel.json cron schedule

- **files:** vercel.json
- **action:** Change stripe-events schedule from `0 0 * * *` (daily) to `*/5 * * * *` (every 5 minutes)
- **verify:** grep vercel.json for the updated schedule
- **done:** Schedule reads `*/5 * * * *`
