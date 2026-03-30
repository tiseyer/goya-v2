# Quick Task: GA4 & Clarity Full Tracking Implementation

**Date:** 2026-03-30
**Status:** Complete
**Quick ID:** 260330-o30

## Description
Implemented comprehensive GA4 and Microsoft Clarity tracking across the GOYA v2 app: page view tracking on every App Router navigation, user properties (role, membership, subscription, designation) set after login, conversion events (sign_up, purchase, teacher_upgrade), engagement events (post_created, message_sent, credits_submitted, profile_updated, course_started, course_completed, member_search), and Clarity smart events (checkout_initiated, upgrade_clicked, profile_edit_saved).

## Solution
1. Created `lib/analytics/tracking.ts` — safe wrapper functions for gtag/clarity with try/catch
2. Created `app/components/AnalyticsProvider.tsx` — Suspense-wrapped client component for page tracking + user properties
3. Added event tracking calls across 11 files at the moment of success (not before)
4. All analytics calls are non-blocking and failure-safe
