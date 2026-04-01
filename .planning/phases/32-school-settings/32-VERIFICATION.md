---
phase: 32-school-settings
verified: 2026-03-31T00:00:00Z
status: passed
score: 11/11 must-haves verified
---

# Phase 32: School Settings Verification Report

**Phase Goal:** A school owner can edit every aspect of their school from a dedicated settings area accessible from the header dropdown
**Verified:** 2026-03-31
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | School Settings link in user dropdown, owner-only | ✓ VERIFIED | Header.tsx line 1125-1131: `profile?.role === 'teacher'` gate + `schoolSlug` check. UserMenu component (mobile) also gated at line 553 via `userRole === 'teacher'`. Link uses slug-based href. |
| 2 | Settings shell with collapsible sidebar, 8 sections | ✓ VERIFIED | SchoolSettingsShell.tsx: `buildNavItems()` returns 8 entries (General, Online Presence, Teaching Info, Location, Faculty, Designations, Documents, Subscription). Sidebar collapses to 64px with localStorage persistence. |
| 3 | General section: name/slug/bio editable, re-review trigger on name/slug change | ✓ VERIFIED | GeneralSettingsClient.tsx lines 95-97: `showReReviewWarning = nameChanged \|\| slugChanged`. Amber warning box rendered conditionally. `updateGeneral` action sets `status: 'pending_review'` when triggered. |
| 4 | Online Presence editable | ✓ VERIFIED | OnlinePresenceClient.tsx (260 lines): website, instagram, facebook, tiktok, youtube, video_platform, video_url fields. Calls `updateOnlinePresence` on save. |
| 5 | Teaching Info editable | ✓ VERIFIED | TeachingInfoClient.tsx (436 lines): practice styles chips (max 5), programs chips, delivery format radio, lineage tags, languages chips (max 3). Calls `updateTeachingInfo`. |
| 6 | Location with Google Places autocomplete | ✓ VERIFIED | LocationClient.tsx: dynamic script loading of Google Maps Places API, `Autocomplete` initialization, `place_changed` handler extracts address/city/country/lat/lng/place_id. Calls `updateLocation`. |
| 7 | Faculty management: list, add, remove | ✓ VERIFIED | FacultyClient.tsx (549 lines): lists existing members with position/status, "Add Member" with search tab (calls `/api/schools/faculty-search`) and invite-by-email tab, remove with confirmation. All three settings actions wired. |
| 8 | Designations view with status badges | ✓ VERIFIED | designations/page.tsx (143 lines, server component): queries `school_designations`, renders each with `StatusBadge` (green/amber/red/gray per status). |
| 9 | Documents view/re-upload | ✓ VERIFIED | DocumentsClient.tsx (267 lines): documents grouped by designation, per-document re-upload flow (deleteDocument then uploadDocument with FormData), status badges. |
| 10 | Subscription view with Stripe portal link | ✓ VERIFIED | SubscriptionClient.tsx (147 lines): lists designations with subscription status, "Manage Billing" button calls `createBillingPortalSession` action, redirects via `window.location.href = result.url`. |
| 11 | Status banner when pending_review | ✓ VERIFIED | SchoolSettingsShell.tsx line 187: `{schoolStatus === 'pending_review' && (...)` renders amber banner. `schoolStatus` passed from layout.tsx which fetches `school.status` from DB. |

**Score:** 11/11 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `app/components/Header.tsx` | School Settings link using slug | ✓ VERIFIED | Two dropdown surfaces: UserMenu (mobile) and profile dropdown. Both gated on teacher role + schoolSlug. Slug fetched via `select('slug')` query. |
| `app/schools/[slug]/settings/components/SchoolSettingsShell.tsx` | Collapsible sidebar shell | ✓ VERIFIED | 204 lines, 8 nav items, localStorage persistence, pending_review banner. |
| `app/schools/[slug]/settings/layout.tsx` | Auth + owner guard | ✓ VERIFIED | 39 lines, async params, auth check, owner_id check, admin/moderator bypass. |
| `app/schools/[slug]/settings/actions.ts` | Server actions for all sections | ✓ VERIFIED | 479 lines: updateGeneral, updateOnlinePresence, updateTeachingInfo, updateLocation, saveFacultyMember, removeFacultyMember, inviteFacultyByEmail, uploadDocument, deleteDocument, createBillingPortalSession. |
| `app/schools/[slug]/settings/page.tsx` | General settings | ✓ VERIFIED | Server component → GeneralSettingsClient (293 lines). |
| `app/schools/[slug]/settings/online-presence/page.tsx` | Online Presence | ✓ VERIFIED | Server component → OnlinePresenceClient (260 lines). |
| `app/schools/[slug]/settings/teaching/page.tsx` | Teaching Info | ✓ VERIFIED | Server component → TeachingInfoClient (436 lines). |
| `app/schools/[slug]/settings/location/page.tsx` | Location with Google Places | ✓ VERIFIED | Server component → LocationClient (263 lines). |
| `app/schools/[slug]/settings/faculty/page.tsx` | Faculty management | ✓ VERIFIED | Server component fetches school + faculty + owner profile → FacultyClient (549 lines). |
| `app/schools/[slug]/settings/designations/page.tsx` | Designations view | ✓ VERIFIED | Full server component (143 lines), queries school_designations, renders with StatusBadge. |
| `app/schools/[slug]/settings/documents/page.tsx` | Documents management | ✓ VERIFIED | Server component (72 lines) fetches designations + documents, groups them → DocumentsClient (267 lines). |
| `app/schools/[slug]/settings/subscription/page.tsx` | Subscription status | ✓ VERIFIED | Server component (55 lines) fetches designations + owner stripe_customer_id → SubscriptionClient (147 lines). |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `Header.tsx` | `/schools/[slug]/settings` | `schoolSlug` state from `select('slug')` query | ✓ WIRED | Line 827/843: fetches slug, stored in `schoolSlug` state. Rendered at line 1127 and via UserMenu prop. |
| `layout.tsx` | `SchoolSettingsShell` | import + render with school data | ✓ WIRED | Line 3: `import SchoolSettingsShell`. Line 35: renders with `schoolSlug={slug} schoolStatus={school.status}`. |
| `page.tsx` (General) | `actions.ts updateGeneral` | import + call on form submit | ✓ WIRED | GeneralSettingsClient.tsx line 5: `import { updateGeneral }`, line 107: called in `handleSave`. |
| `online-presence/page.tsx` | `actions.ts updateOnlinePresence` | import + call on form submit | ✓ WIRED | OnlinePresenceClient.tsx line 4: import, line 87: called in save handler. |
| `teaching/page.tsx` | `actions.ts updateTeachingInfo` | import + call on form submit | ✓ WIRED | TeachingInfoClient.tsx line 4: import, line 188: called in save handler. |
| `location/page.tsx` | `actions.ts updateLocation` | import + call on form submit | ✓ WIRED | LocationClient.tsx line 4: import, line 168: called in save handler. |
| `faculty/page.tsx` | `actions.ts saveFacultyMember, removeFacultyMember` | import + call | ✓ WIRED | FacultyClient.tsx lines 5-7: imports all three faculty actions. Called at lines 203, 243, 272. |
| `documents/page.tsx` | `actions.ts uploadDocument, deleteDocument` | import + call with FormData | ✓ WIRED | DocumentsClient.tsx line 4: import. Lines 90, 104: both actions called in re-upload flow. |
| `subscription/page.tsx` | Stripe Customer Portal | `createBillingPortalSession` + `window.location.href` | ✓ WIRED | SubscriptionClient.tsx line 4: import. Line 43: action called. Line 47: redirects to `result.url`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|--------------------|--------|
| `GeneralSettingsClient` | `school` prop | Server component queries `schools` table by slug | Yes — DB query with `.select('id, name, slug, short_bio, bio, established_year, status')` | ✓ FLOWING |
| `OnlinePresenceClient` | `school` prop | Server component queries `schools` table | Yes — fields: website, instagram, facebook, tiktok, youtube, video_platform, video_url | ✓ FLOWING |
| `TeachingInfoClient` | `school` prop | Server component queries `schools` table | Yes — practice_styles, programs_offered, course_delivery_format, lineage, languages | ✓ FLOWING |
| `LocationClient` | `school` prop | Server component queries `schools` table | Yes — location_address, location_city, location_country, location_lat, location_lng, location_place_id | ✓ FLOWING |
| `FacultyClient` | `initialFaculty` prop | Server component queries `school_faculty` with profiles join | Yes — real DB query with `.select('id, profile_id, invited_email, position, status, is_principal_trainer, profiles(...)')` | ✓ FLOWING |
| `DesignationsPage` | `list` | Direct server component queries `school_designations` | Yes — queries real table, renders per designation | ✓ FLOWING |
| `DocumentsClient` | `designationsWithDocs` | Server component queries both `school_designations` and `school_verification_documents` | Yes — two real queries, grouped in server | ✓ FLOWING |
| `SubscriptionClient` | `designations`, `hasStripeCustomer` | Server component queries `school_designations` + owner `stripe_customer_id` | Yes — two real queries | ✓ FLOWING |

### Behavioral Spot-Checks

Step 7b: SKIPPED (requires live Supabase connection and authenticated session; settings pages are auth-gated server components with no runnable standalone entry points)

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|-------------|-------------|--------|----------|
| SET-01 | 32-01 | School Settings link in user dropdown, owner only | ✓ SATISFIED | Header.tsx: two dropdown surfaces, both gated on `role === 'teacher'` + school slug existence. Non-owners/non-teachers never see the link. |
| SET-02 | 32-01 | Settings shell with collapsible sidebar matching existing pattern | ✓ SATISFIED | SchoolSettingsShell.tsx: 8 nav items, 248px/64px widths, localStorage key `school-settings-sidebar-collapsed`, usePathname active state. |
| SET-03 | 32-02 | General section: name, slug, bio, established year; name/slug change triggers re-review | ✓ SATISFIED | GeneralSettingsClient with all 5 fields, re-review warning, `updateGeneral` sets `status: 'pending_review'` when name or slug changes. |
| SET-04 | 32-02 | Online Presence section: website, social links, video intro | ✓ SATISFIED | OnlinePresenceClient: website, instagram, facebook, tiktok, youtube, video_platform + video_url. |
| SET-05 | 32-02 | Teaching Info: practice styles, programs, delivery format, lineage, languages | ✓ SATISFIED | TeachingInfoClient: all 5 fields with chip selectors and max constraints. |
| SET-06 | 32-02 | Location with Google Places autocomplete | ✓ SATISFIED | LocationClient: dynamic script load, Autocomplete initialization, place_changed handler extracts all location fields. |
| SET-07 | 32-03 | Faculty: manage members, assign positions | ✓ SATISFIED | FacultyClient: list with positions/status, search GOYA members, invite by email, remove with confirmation. |
| SET-08 | 32-03 | Designations: view active, add new (deferred per plan decision) | ✓ SATISFIED | designations/page.tsx: reads real designations from DB with status badges. Note: "add new" deferred by design — "contact support" message included per plan spec. |
| SET-09 | 32-03 | Documents: view/re-upload verification documents | ✓ SATISFIED | DocumentsClient: documents grouped by designation, re-upload flow (delete + upload), file input with FormData. |
| SET-10 | 32-03 | Subscription: view billing status | ✓ SATISFIED | SubscriptionClient: lists designations with subscription status, Stripe portal redirect via `createBillingPortalSession`. |
| SET-11 | 32-01 | Status banner when pending_review | ✓ SATISFIED | SchoolSettingsShell.tsx: amber banner rendered when `schoolStatus === 'pending_review'`, value sourced from live DB in layout.tsx. |

### Anti-Patterns Found

No blockers or warnings found.

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `actions.ts` | 292 | `// NOTE: Actual email sending deferred to Phase 35 (FAC-01)` | Info | Email notification for faculty invites not sent yet — expected per plan decision. Record inserted successfully; email delivery deferred. |

### Human Verification Required

#### 1. Re-review Warning Display

**Test:** Log in as a school owner. Navigate to School Settings > General. Change the school name field.
**Expected:** Amber warning box appears immediately below the page heading: "Changing the school name or URL slug will trigger a re-review of your school."
**Why human:** Requires authenticated session and real school data.

#### 2. Pending Review Status Banner

**Test:** Set a school's status to `pending_review` in the DB. Visit the school's settings area.
**Expected:** Amber banner at top of content area: "Your school is currently under review. This can take up to 1 week."
**Why human:** Requires DB state manipulation and authenticated session.

#### 3. Google Places Autocomplete (Location Page)

**Test:** Navigate to School Settings > Location. Type a partial address into the input.
**Expected:** Google Places dropdown appears with address suggestions. Selecting one populates the hidden location fields (city, country, lat, lng, place_id).
**Why human:** Requires live Google Maps API key and browser interaction.

#### 4. Faculty Member Search

**Test:** Navigate to School Settings > Faculty > Add Member. Type a member's name.
**Expected:** Debounced search results appear from `/api/schools/faculty-search`, showing matching GOYA members with an "Add" button.
**Why human:** Requires real profiles in DB and authenticated session.

#### 5. School Settings Link Visibility (Non-Owner)

**Test:** Log in as a student or admin. Open the profile dropdown.
**Expected:** "School Settings" link does NOT appear. Students see only Settings; admins see Admin Settings.
**Why human:** Role-based UI visibility check requiring multiple test accounts.

### Gaps Summary

No gaps. All 11 must-haves are verified across all four levels (exists, substantive, wired, data flowing).

The phase fully achieves its goal: a school owner can access a dedicated settings area from the header dropdown and edit every aspect of their school — name/slug/bio (with re-review triggering), online presence, teaching info, location (Google Places), faculty (with member search and email invite), designations (read-only view), documents (with re-upload), and subscription (Stripe billing portal link). The pending_review banner guards the entire area when relevant.

One minor note: the `userSchoolId` prop name in `UserMenu` is misleading — it actually holds the school slug (not the numeric/UUID ID). The wiring is correct but the naming is a latent maintenance confusion risk. Not a functional gap.

---

_Verified: 2026-03-31_
_Verifier: Claude (gsd-verifier)_
