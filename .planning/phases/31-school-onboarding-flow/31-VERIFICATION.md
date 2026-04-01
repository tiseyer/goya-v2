---
phase: 31-school-onboarding-flow
verified: 2026-03-31T12:00:00Z
status: human_needed
score: 9/9 must-haves verified
re_verification:
  previous_status: gaps_found
  previous_score: 0/9
  gaps_closed:
    - "Welcome step displays instructions and time estimate"
    - "Basic info step has name pre-filled, short bio/full bio counters, established year"
    - "Online presence step validates at least one field"
    - "Video intro step has YouTube/Vimeo toggle + embed preview (optional)"
    - "Teaching info step has practice styles, programs, delivery format, lineage, languages"
    - "Location step with Google Places (in-person/hybrid only)"
    - "Document upload per designation with required/optional slots"
    - "Faculty step with member search and email invite"
    - "Review step submits and sets onboarding_completed=true, status='pending_review'"
  gaps_remaining: []
  regressions: []
human_verification:
  - test: "Complete 9-step onboarding wizard end-to-end"
    expected: "All 9 steps render, save data, location step skips for online schools, documents upload to school-documents bucket, faculty search returns members, submit transitions school to pending_review and shows confirmation card"
    why_human: "Requires browser interaction with Google Places autocomplete, file upload, and visual confirmation of step indicator and form states"
---

# Phase 31: School Onboarding Flow — Verification Report

**Phase Goal:** A school owner can complete all 9 onboarding steps and submit their school for admin review
**Verified:** 2026-03-31
**Status:** HUMAN NEEDED — all automated checks passed after merge
**Re-verification:** Yes — after gap closure (merge of worktree-agent-aacd96da into develop, commit d8520e3)

---

## Root Cause Resolved

The previous gap was that Plans 02 and 03 existed only in `worktree-agent-aacd96da` and had never been merged into `develop`. Merge commit `d8520e3` resolved this. All four required files are now present on `develop`.

---

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Welcome step displays instructions and time estimate | ✓ VERIFIED | `Step1Welcome` at line 311: heading "Welcome! Let's set up your school profile", body "This takes about 10 minutes", checklist of 7 items, "Get Started" button |
| 2 | Basic info step has name pre-filled, short bio with 250-char counter, full bio with 1000-5000 range, established year picker | ✓ VERIFIED | `Step2BasicInfo` lines 401-569: `useState(school.name)` pre-fills name; `{shortBio.length}/250` counter at line ~497; under-minimum warning for bio; year dropdown 1900-CURRENT_YEAR; `saveBasicInfo` called on continue |
| 3 | Online presence step validates at least one field | ✓ VERIFIED | `Step3OnlinePresence` line 591: `if (!hasAny) { setError('Please fill in at least one...') }` — also `canContinue={hasAny}` disables button; `saveOnlinePresence` called on continue |
| 4 | Video intro step has YouTube/Vimeo toggle and URL with embed preview (optional) | ✓ VERIFIED | `Step4VideoIntro` lines 735-898: platform toggle tabs; `parseYouTubeId`/`parseVimeoId` helpers; embed preview rendered when ID parsed; Skip button clears; `saveVideoIntro` called |
| 5 | Teaching info step has practice styles (max 5), programs, delivery format (required), lineage tags, languages (max 3) | ✓ VERIFIED | `Step5TeachingInfo` lines 893-1192: 19 practice styles with max-5 enforcement; 10 programs; 3-way delivery radio (required); lineage Enter/comma tag input with max-3; 22 languages with max-3; `saveTeachingInfo` called |
| 6 | Location step with Google Places appears only for in-person/hybrid | ✓ VERIFIED | `getVisibleSteps` line 1196: `if (deliveryFormat === 'online') return all.filter(s => s !== 6)`; `Step6Location` lines 1219-1380: dynamic Google Maps script injection; `Autocomplete` on inputRef; `saveLocation` called |
| 7 | Document upload per designation with business reg (required), qualification cert (required), insurance (optional) | ✓ VERIFIED | `DOCUMENT_SLOTS` lines 1384-1388; per-designation card iteration; `handleFileChange` builds `FormData` and calls `uploadDocument`; `handleDelete` calls `deleteDocument`; `canContinue()` blocks on missing required slots |
| 8 | Faculty step with member search and email invite | ✓ VERIFIED | `Step8Faculty` lines 1630-1944: owner shown as "Principal Trainer (you)"; debounced 500ms search to `/api/schools/faculty-search?q=...&school_id=...`; `saveFacultyMember` on add; `inviteFacultyByEmail` on invite; `removeFacultyMember` on remove |
| 9 | Review step submits and sets onboarding_completed=true, status='pending_review' | ✓ VERIFIED | `Step9Review` lines 1946-2193: read-only summary with per-section edit links; `handleSubmit` calls `submitForReview(school.slug)`; `actions.ts` lines 466-469: service role sets `onboarding_completed: true`, `status: 'pending_review'`; success shows confirmation card with "Go to Dashboard" |

**Score:** 9/9 truths verified

---

## Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/schools/[slug]/onboarding/page.tsx` | Server page wrapper with auth/owner/onboarding-completed guards | ✓ VERIFIED | 110 lines; Next.js 15 async params; auth gate, owner gate, onboarding_completed guard; fetches school, designations, faculty, documents, ownerName; wraps `<OnboardingWizard>` in `<PageContainer>` |
| `app/schools/[slug]/onboarding/OnboardingWizard.tsx` | Client wizard, all 9 steps | ✓ VERIFIED | 2291 lines; `'use client'`; all 9 step components; step navigation with `getVisibleSteps`/`getNextStep`/`getPrevStep`; URL-driven step state via `?step=N` |
| `app/schools/[slug]/onboarding/actions.ts` | 11 server actions | ✓ VERIFIED | 497 lines; `'use server'`; 11 named exports; `getOwnedSchool` auth helper on every action |
| `app/api/schools/faculty-search/route.ts` | GET faculty search | ✓ VERIFIED | 77 lines; auth + ownership check; `ilike` member search; excludes existing faculty and caller |

---

## Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `OnboardingWizard.tsx` | `actions.ts` | `import { saveBasicInfo, saveOnlinePresence, saveVideoIntro, saveTeachingInfo, saveLocation, uploadDocument, deleteDocument, saveFacultyMember, removeFacultyMember, inviteFacultyByEmail, submitForReview } from './actions'` | ✓ WIRED | Lines 7-18; all 11 actions imported and called in their respective steps |
| `page.tsx` | `OnboardingWizard.tsx` | `import OnboardingWizard from './OnboardingWizard'` + `<OnboardingWizard school={school} designations={...} faculty={...} documents={...} ownerName={...} />` | ✓ WIRED | Lines 5, 100-106 |
| `Step8Faculty` | `/api/schools/faculty-search` | `fetch('/api/schools/faculty-search?q=${...}&school_id=${school.id}')` | ✓ WIRED | Line 1671; response parsed as `{ results: SearchResult[] }` |
| `actions.ts submitForReview` | `schools` table | Service role `.update({ onboarding_completed: true, status: 'pending_review' })` | ✓ WIRED | Lines 464-471 |
| `actions.ts submitForReview` | `notifications` table | Service role `.insert(admins.map(...))` for all admin/moderator profiles | ✓ WIRED | Lines 476-492 |
| `actions.ts uploadDocument` | `school-documents` storage bucket | `supabase.storage.from('school-documents').upload(storagePath, ...)` | ✓ WIRED | Lines 288-293 |
| `actions.ts uploadDocument` | `school_verification_documents` table | `.insert({ school_id, designation_id, document_type, file_url, ... })` | ✓ WIRED | Lines 298-309 |

---

## Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `page.tsx` | `school` | `supabase.from('schools').select('*').eq('slug', slug).single()` | Yes — live DB query | ✓ FLOWING |
| `page.tsx` | `designations` | `supabase.from('school_designations').select(...).eq('school_id', school.id)` | Yes | ✓ FLOWING |
| `page.tsx` | `faculty` | `supabase.from('school_faculty').select(...).eq('school_id', school.id)` | Yes | ✓ FLOWING |
| `page.tsx` | `documents` | `supabase.from('school_verification_documents').select(...).eq('school_id', school.id)` | Yes | ✓ FLOWING |
| `OnboardingWizard.tsx Step 2` | `name`, `shortBio`, `bio`, `establishedYear` | `school` prop (pre-filled from server) | Yes — pre-populated from DB | ✓ FLOWING |
| `OnboardingWizard.tsx Step 8` | `searchResults` | `fetch('/api/schools/faculty-search?q=...')` → `profiles` ilike query | Yes — live DB search | ✓ FLOWING |
| `actions.ts submitForReview` | `status`, `onboarding_completed` | Service role `.update(...)` on `schools` | Yes — writes to DB | ✓ FLOWING |

---

## Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| ONB-01 | 31-02 | Welcome step with instructions and time estimate | ✓ SATISFIED | `Step1Welcome`: heading, 10-minute estimate, 7-item checklist, "Get Started" button |
| ONB-02 | 31-02 | Basic info: name (pre-filled), short bio 250-char, full bio 1000-5000, established year | ✓ SATISFIED | `Step2BasicInfo`: pre-filled state from `school` prop; client + server validation; year picker |
| ONB-03 | 31-02 | Online presence with at-least-one validation | ✓ SATISFIED | `Step3OnlinePresence`: `hasAny` gate on client; `saveOnlinePresence` at-least-one check on server |
| ONB-04 | 31-02 | Video intro: YouTube/Vimeo toggle, optional, embed preview | ✓ SATISFIED | `Step4VideoIntro`: platform tabs, regex ID parsing, embed preview, Skip button |
| ONB-05 | 31-02 | Teaching info: practice styles (max 5), programs, delivery format, lineage, languages (max 3) | ✓ SATISFIED | `Step5TeachingInfo`: all fields present with correct constraints |
| ONB-06 | 31-03 | Location step with Google Places, conditional on in-person/hybrid | ✓ SATISFIED | `getVisibleSteps` skips step 6 for `online`; `Step6Location`: dynamic Maps script + Autocomplete |
| ONB-07 | 31-03 | Document upload per designation: business reg (req), qualification cert (req), insurance (opt) | ✓ SATISFIED | `DOCUMENT_SLOTS` const; per-designation card; `uploadDocument`/`deleteDocument` actions wired |
| ONB-08 | 31-03 | Faculty: member search + email invite | ✓ SATISFIED | `Step8Faculty`: debounced search to `/api/schools/faculty-search`; invite by email; remove faculty |
| ONB-09 | 31-01, 31-03 | Review + submit: sets pending_review, onboarding_completed=true, notifies admins | ✓ SATISFIED | `Step9Review`: read-only summary, submit button; `submitForReview` action: service role update + notifications insert |

---

## Behavioral Spot-Checks

Step 7b: SKIPPED for browser-dependent UI components (requires running Supabase instance and browser). The `actions.ts` and `faculty-search/route.ts` are server-only and require live DB credentials.

---

## Anti-Patterns Found

No blocker or warning anti-patterns found in any merged file.

| File | Pattern | Severity | Assessment |
|------|---------|----------|------------|
| `actions.ts` line 434 | `// NOTE: Actual email sending deferred to Phase 35 (FAC-01)` | Info | Intentional known stub, correctly scoped to a future phase |
| `actions.ts` line 347 | `console.error('[deleteDocument] storage remove error:...')` | Info | Error logging, not a stub — allows DB cleanup to continue on storage failure |
| `OnboardingWizard.tsx` line ~481 | `placeholder="e.g. Sunrise Yoga Academy"` | Info | HTML input placeholder attributes, not stub implementations |

---

## Human Verification Required

### 1. Complete wizard end-to-end

**Test:** Navigate to `/schools/[your-school-slug]/onboarding` with a school in `pending` status and complete all 9 steps. For step 5, select "Online" delivery format to verify step 6 (Location) is skipped.
**Expected:** Each step saves data and advances; step 6 is absent from the step indicator and navigation when `online` is selected; documents upload to Supabase storage; faculty search returns real profiles; submit transitions school to `pending_review` and shows "Your school has been submitted for review" confirmation with "Go to Dashboard" link.
**Why human:** Requires browser interaction with Google Places Autocomplete, file upload UI, and visual inspection of step indicator state changes.

---

## Summary

All 9 ONB requirements are fully implemented, wired, and data-connected on the `develop` branch following the merge of commit `d8520e3`. The single root cause from the previous verification — files absent from develop — is resolved. No new gaps were introduced by the merge.

The remaining item is human end-to-end testing, which cannot be verified programmatically due to Google Places API dependency and file upload UI interaction.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
