---
phase: 05-flow-player-ui
plan: "02"
subsystem: flow-player
tags: [flow-player, banner, notification, display-types, persistence, global-mount]
dependency_graph:
  requires: ["05-01"]
  provides: ["05-complete", "06-ready", "07-ready"]
  affects: ["app/components/ClientProviders.tsx", "app/components/flow-player/"]
tech_stack:
  added: []
  patterns: ["createPortal", "framer-motion AnimatePresence", "dynamic import SSR bypass", "display override state pattern"]
key_files:
  created:
    - app/components/flow-player/FlowPlayerBanner.tsx
    - app/components/flow-player/FlowPlayerNotification.tsx
  modified:
    - app/components/flow-player/FlowPlayer.tsx
    - app/components/ClientProviders.tsx
decisions:
  - "overrideDisplay state allows banner/notification CTA to upgrade display to modal without remounting FlowPlayer"
  - "handleOverrideDismiss resets overrideDisplay to null and clears activeFlow — clean teardown after CTA-opened modal is dismissed"
  - "bannerText and notificationBody extracted inline via loop over all steps — avoids prop drilling, consistent fallback to flow.name/description"
  - "FlowPlayerLoader placed after {children} inside ConnectionsProvider — portals render above page content without blocking layout"
  - "Persistence (last_step_id resume + response.responses restore) confirmed wired in 05-01 — no additional changes needed"
metrics:
  duration: "2 min"
  completed_date: "2026-03-30"
  tasks_completed: 2
  files_changed: 4
requirements_covered:
  - PLAYER-04
  - PLAYER-05
  - PLAYER-08
---

# Phase 05 Plan 02: Banner, Notification, Global Mount Summary

## One-liner

Banner (top/bottom 48px fixed bar) and notification (top-right slide-in card) display types added with portal rendering, CTA-to-modal upgrade, and FlowPlayerLoader mounted globally in ClientProviders for all-page flow presence.

## What Was Built

### Task 1: FlowPlayerBanner + FlowPlayerNotification

**FlowPlayerBanner** (`PLAYER-04`):
- Fixed 48px bar (`h-12`) at top or bottom viewport via `createPortal`
- `bg-[var(--color-primary)]` background, `text-white` text
- `max-w-screen-xl mx-auto` layout keeps content aligned with page grid
- Motion: top banner slides from `y: -48`, bottom from `y: 48`, `duration: 0.3 easeOut`
- Close button (`X` lucide 16px) and optional CTA button (white pill style)
- No auto-dismiss — stays until user closes or clicks CTA

**FlowPlayerNotification** (`PLAYER-05`):
- Fixed `top-4 right-4` card via `createPortal`
- Spring animation: `{ opacity: 0, x: 80, y: -20 }` -> `{ opacity: 1, x: 0, y: 0 }`, exit slides right
- Primary-color dot icon + title + close X in top row
- Body text + optional full-width action button
- No auto-dismiss — stays until user interacts or closes

### Task 2: FlowPlayer display switch + ClientProviders mount

**FlowPlayer updates**:
- Imported `FlowPlayerBanner` and `FlowPlayerNotification`
- Added `overrideDisplay: 'modal' | null` state — banner/notification CTA sets this to `'modal'`, triggering modal render with `dismissible: true`
- `effectiveDisplay = overrideDisplay ?? display_type` drives the switch
- All 5 display types handled in switch: `modal`, `fullscreen`, `top_banner`, `bottom_banner`, `notification`
- `bannerText` and `notificationBody` extracted from first `info_text` element across steps, falling back to `flow.name` / `flow.description`
- `handleOverrideDismiss` clears both `overrideDisplay` and `activeFlow` for clean teardown after CTA-opened modal is dismissed

**Persistence confirmed** (`PLAYER-08`):
- `last_step_id` resume: on mount, finds step index in `data.steps`, sets `startIndex = lastIndex + 1`
- `response.responses` restore: on mount, merges saved answers into `answers` state via `Object.assign`
- Per-step server persistence: every `handleNext` posts to `/api/flows/${id}/respond` — no localStorage needed

**ClientProviders mount**:
- `FlowPlayerLoader` imported and rendered after `{children}` inside `ConnectionsProvider`
- Dynamic SSR-bypassed import ensures client-only rendering
- Flows appear on every authenticated page — unauthenticated users get 401 from `/api/flows/active`, FlowPlayer renders nothing

## Verification

| Check | Result |
|-------|--------|
| `npx tsc --noEmit` — flow-player + ClientProviders | No errors |
| All 5 display types in switch | Pass (8 matches: case labels + usage) |
| `FlowPlayerLoader` in ClientProviders | Pass (2 occurrences: import + render) |
| `createPortal` in both banner files | Pass |
| `h-12` in FlowPlayerBanner | Pass |
| `top-4 right-4` in FlowPlayerNotification | Pass |
| `AnimatePresence` in both components | Pass |
| `overrideDisplay` in FlowPlayer | Pass |
| `last_step_id` resume logic | Pass |
| `response.responses` restore | Pass |
| `/api/flows/*/respond` per-step call | Pass |

## Commits

| Task | Hash | Message |
|------|------|---------|
| Task 1 | `1f3b5a4` | feat(05-02): add FlowPlayerBanner and FlowPlayerNotification display components |
| Task 2 | `878419a` | feat(05-02): wire all 5 display types + global FlowPlayerLoader mount |

## Deviations from Plan

None — plan executed exactly as written. Persistence logic was already fully wired in 05-01 (confirmed during Task 2 review), consistent with plan's PLAYER-08 "verify already wired" instruction.

## Known Stubs

None. All display types render real flow data. Banner/notification text comes from actual flow elements and metadata. No hardcoded placeholder content.

## Self-Check: PASSED

- `app/components/flow-player/FlowPlayerBanner.tsx` — EXISTS
- `app/components/flow-player/FlowPlayerNotification.tsx` — EXISTS
- Commit `1f3b5a4` — EXISTS
- Commit `878419a` — EXISTS
