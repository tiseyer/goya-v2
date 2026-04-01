# Phase 31: School Onboarding Flow - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

9-step onboarding wizard at /schools/[slug]/onboarding for school owners to complete their school profile after payment. Steps: (1) Welcome, (2) Basic Info, (3) Online Presence, (4) Video Introduction, (5) Teaching Info, (6) Location, (7) Document Upload, (8) Faculty, (9) Review & Submit. On submit: set onboarding_completed=true, status='pending_review', notify admin inbox.

This is a CUSTOM onboarding page, not a Flow Builder template. The existing flow builder field types don't fully cover the needs (Google Places, document uploads per designation, faculty member search). Build a dedicated multi-step form at /schools/[slug]/onboarding.

</domain>

<decisions>
## Implementation Decisions

### Step 1 — Welcome
- Display text: "Welcome! Let's set up your school profile. This takes about 10 minutes."
- "Your school will be reviewed by our team before going live."
- Continue button

### Step 2 — Basic Info
- School name (pre-filled from registration, editable)
- Short bio (max 250 chars, required) with character counter
- Full bio (1000–5000 chars, required) with character counter
- School established year (year picker, required)

### Step 3 — Online Presence
- Website URL (optional but at-least-one required)
- Instagram URL, Facebook URL, TikTok URL, YouTube URL
- Validation: at least one field must be filled

### Step 4 — Video Introduction (optional)
- Platform toggle: YouTube / Vimeo
- Video URL text input
- Video preview embed

### Step 5 — Teaching Info
- Practice Styles: multi-select up to 5 from predefined list (same as user onboarding)
- Programs Offered: multi-select from predefined list
- Course Delivery Format: radio — In-Person / Online / Hybrid
- Lineage: multi-select up to 3 (text input tags)
- Languages: multi-select up to 3 from predefined list

### Step 6 — Location (conditional: only if format is In-Person or Hybrid)
- Google Places Autocomplete using NEXT_PUBLIC_GOOGLE_MAPS_API_KEY
- Stores: location_address, location_city, location_country, location_lat, location_lng, location_place_id

### Step 7 — Upload Documents
- For EACH selected designation, show required uploads:
  - Business registration document (PDF/JPG/PNG, required for all)
  - Qualification certificate for this designation type (required per designation)
  - Insurance document (optional but encouraged)
- Upload to Supabase Storage private bucket: school-documents/
- Store records in school_verification_documents table

### Step 8 — Faculty (optional)
- Search existing GOYA members by name to add as faculty
- Invite non-members by email
- Each faculty member gets a position field (e.g. "Senior Teacher")
- Owner automatically listed as Principal Trainer

### Step 9 — Review & Submit
- Summary of all entered information
- "Submit for Review" button
- On submit: set school.onboarding_completed = true, school.status = 'pending_review'
- Sends notification to admin inbox
- Shows confirmation: "Your school has been submitted for review. This can take up to 1 week."

### Data Persistence
- Save progress after each step (server action updating school record)
- Allow resuming onboarding (check onboarding_completed flag)
- Step state tracked via URL params or localStorage

### Claude's Discretion
- Visual design of each step (follow existing onboarding patterns)
- Step indicator/progress bar design
- Exact validation UX (inline vs on-submit)
- Mobile layout for multi-step form

</decisions>

<code_context>
## Existing Code Insights

### Predefined Lists
- Practice styles: found in seed migration (20260369_seed_onboarding_flow_templates.sql)
  - Hatha Yoga, Vinyasa Flow, Yin Yoga, Restorative Yoga, Ashtanga Yoga, Prenatal Yoga, Postnatal Yoga, Children's Yoga, Power Yoga, Kundalini Yoga, Hot Yoga, Gentle Yoga, Modern Contemporary Yoga, Traditional Lineage Based Yoga, Trauma-Informed Yoga, Iyengar Yoga, Somatic Yoga, Chair Yoga, Aerial Yoga
- Languages: English, French, German, Spanish, Arabic, Croatian, Czech, Dutch, Finnish, Greek, Hindi, Italian, Japanese, Mandarin, Polish, Portuguese, Slovakian, Swedish, Thai, Ukrainian, Urdu, Other

### Google Places
- NEXT_PUBLIC_GOOGLE_MAPS_API_KEY already in env
- Check existing location inputs for Google Places integration patterns

### Supabase Storage
- school-documents/ bucket needs to be created (private)
- Upload pattern: check existing avatar/certificate upload flows

### School Record
- Created in Phase 30 with status='pending', owner_id set
- school_designations rows exist from checkout
- Need to update school fields progressively during onboarding

### Faculty
- school_faculty table with profile_id (nullable), invited_email, position, is_principal_trainer
- Need member search API + invite by email flow

</code_context>

<specifics>
## Specific Ideas

- 9 steps as specified by user
- Google Places for location
- Document uploads per designation
- Faculty search by GOYA member name

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>
