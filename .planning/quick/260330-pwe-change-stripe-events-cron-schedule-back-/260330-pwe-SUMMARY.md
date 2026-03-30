---
quick_id: 260330-pwe
description: Change stripe-events cron schedule back to every 5 minutes
date: 2026-03-30
status: complete
---

# Summary

Changed `/api/cron/stripe-events` schedule in `vercel.json` from `0 0 * * *` (daily at midnight) back to `*/5 * * * *` (every 5 minutes).

## Files Changed

- `vercel.json` — updated cron schedule
