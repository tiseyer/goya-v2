# Quick Task 260401-dm7: Remove footer from all pages except landing and legal

**Status:** Complete
**Date:** 2026-04-01

## What was done

Simplified footer logic in `app/layout.tsx`. Footer now only renders on an explicit allowlist of paths: `/`, `/privacy`, `/terms`, `/code-of-conduct`, `/code-of-ethics`, `/standards`.

All other pages (dashboard, members, events, academy, add-ons, settings, admin, schools, etc.) no longer show any footer.

Removed `SlimFooter` import and rendering since it's no longer used.

## Files changed

- `app/layout.tsx` — Replaced hideFooter/showFullFooter/showSlimFooter logic with single `showFooter` check against allowlist
