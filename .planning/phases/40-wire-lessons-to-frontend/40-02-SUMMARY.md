---
phase: 40-wire-lessons-to-frontend
plan: "02"
subsystem: academy/lessons
tags: [lessons, academy, video-embed, audio-player, navigation]
dependency_graph:
  requires:
    - 39-lesson-management-ui-logic (LessonForm, LessonList, lessons table)
    - 36-database-migrations (lessons table schema with type/video_platform/audio_url)
  provides:
    - Per-lesson player page at /academy/[id]/lesson/[lessonId]
    - Legacy lesson redirect at /academy/[id]/lesson
  affects:
    - app/academy/[id]/lesson/** (replaced and extended)
tech_stack:
  added: []
  patterns:
    - Client component with useEffect for auth-gated lesson loading
    - Server component redirect for legacy URL backward compatibility
    - Type-specific conditional rendering (video/audio/text)
key_files:
  created:
    - app/academy/[id]/lesson/[lessonId]/page.tsx
    - app/academy/[id]/lesson/[lessonId]/actions.ts
  modified:
    - app/academy/[id]/lesson/page.tsx
    - docs/student/academy-guide.md
    - public/docs/search-index.json
decisions:
  - Per-lesson page is 'use client' to match existing auth-check pattern (useEffect + supabase.auth.getUser)
  - markLessonComplete action copied to [lessonId]/actions.ts for colocation — original in lesson/actions.ts remains intact
  - Legacy /academy/[id]/lesson is now a server component redirect (force-dynamic) — no client JS needed
metrics:
  duration: "~5 minutes"
  completed: "2026-04-01"
  tasks_completed: 2
  files_changed: 4
---

# Phase 40 Plan 02: Per-Lesson Player Page Summary

Per-lesson player page at `/academy/[id]/lesson/[lessonId]` rendering Vimeo/YouTube video embeds, HTML5 audio player, and formatted text content with prev/next navigation by sort_order.

## What Was Built

### Task 1: Per-lesson player page (`45755f1`)

Created `app/academy/[id]/lesson/[lessonId]/page.tsx` — a `'use client'` component that:

- Fetches the lesson by `lessonId` from the `lessons` table
- Fetches all sibling lessons (`course_id` match, ordered by `sort_order`) for prev/next navigation
- Guards auth: redirects to course overview if not logged in or not enrolled
- Renders type-specifically:
  - **video**: Vimeo iframe (`player.vimeo.com/video/{id}`) or YouTube iframe (`youtube.com/embed/{id}`), with a gradient fallback if URL is missing/invalid
  - **audio**: HTML5 `<audio controls>` with optional featured image header
  - **text**: Prose-formatted description paragraphs with optional featured image

Also created `app/academy/[id]/lesson/[lessonId]/actions.ts` with `markLessonComplete` server action (copied from parent directory for colocation).

### Task 2: Legacy lesson redirect (`61f6d1b`)

Replaced `app/academy/[id]/lesson/page.tsx` (old client component with hardcoded Vimeo player) with a server component that:

- Queries the first lesson ordered by `sort_order` for the given `course_id`
- Redirects to `/academy/{id}/lesson/{firstLesson.id}` if lessons exist
- Falls back to `/academy/{id}` if no lessons are found
- Preserves backward compatibility for all existing bookmarks

## Deviations from Plan

None — plan executed exactly as written.

## Self-Check: PASSED

- `app/academy/[id]/lesson/[lessonId]/page.tsx` — FOUND
- `app/academy/[id]/lesson/[lessonId]/actions.ts` — FOUND
- `app/academy/[id]/lesson/page.tsx` — FOUND (modified to redirect)
- Commit `45755f1` — FOUND
- Commit `61f6d1b` — FOUND
- TypeScript: only pre-existing `linkify-it`/`mdurl` type definition errors (unrelated to this plan)
