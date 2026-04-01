# Quick Task: stripe-events-cron-5min

**Date:** 2026-03-30
**Status:** Done

## Task Description

Change the stripe-events cron schedule in vercel.json from daily (`0 0 * * *`) back to every 5 minutes (`*/5 * * * *`).

## Solution

Updated `vercel.json` cron entry for `/api/cron/stripe-events` schedule.

## Commit

`74cf79c` — fix: change stripe-events cron back to every 5 minutes
