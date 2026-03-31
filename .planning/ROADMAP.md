# Roadmap: GOYA v2

## Milestones

- ✅ **v1.0 User Settings** - Phases 1-3 (shipped 2026-03-23)
- ✅ **v1.1 Connections & Inbox** - Phases 4-7 (shipped 2026-03-24)
- ✅ **v1.2 Stripe Admin & Shop** - Phases 8-13 (shipped 2026-03-24)
- ✅ **v1.3 Subscriptions & Teacher Upgrade** - Phases 14-15 (shipped 2026-03-26)
- ✅ **v1.6 Open Gates REST API** - Phases 1-8 (shipped 2026-03-27)
- ✅ **v1.7 API Settings Page** - Phases 9-11 (shipped 2026-03-27)
- ✅ **v1.8 AI Support System** - Phases 12-15 (shipped 2026-03-30)
- ✅ **v1.9 Member Events** - Phases 16-21 (shipped 2026-03-31)
- ✅ **v1.10 Member Courses** - Phases 22-27 (shipped 2026-03-31)
- 🚧 **v1.14 School Owner System** - Phases 28-35 (in progress)

## Phases

**Milestone Goal:** Teachers can register their yoga school on GOYA — select designations, pay via Stripe, complete onboarding, get admin-verified, and go live with a public school profile.

- [x] **Phase 28: Database Foundation** - Extend schools/profiles tables, add school_designations/faculty/documents tables, RLS policies, TypeScript types (completed 2026-03-31)
- [x] **Phase 29: Interest & Entry Points** - Dashboard widget, subscriptions callout, add-ons banner for teachers without a school (completed 2026-03-31)
- [x] **Phase 30: School Registration Flow** - Name/slug step, designation selection, Stripe Checkout, post-payment school record creation (completed 2026-03-31)
- [x] **Phase 31: School Onboarding Flow** - 9-step onboarding wizard from welcome through review & submit (completed 2026-03-31)
- [x] **Phase 32: School Settings** - Full settings area at /schools/[slug]/settings with sidebar navigation and all section pages (completed 2026-03-31)
- [ ] **Phase 33: Admin School Management** - Inbox tab updates, school detail/review page, approve/reject workflow, member profile integration
- [ ] **Phase 34: Public School Profile** - /schools/[slug] with hero, bio, teaching info, faculty, and member directory integration
- [ ] **Phase 35: Faculty Invitations** - Email invites for non-members, invite link at registration, auto-link on account creation

### Phase 28: Database Foundation
**Goal**: The database fully supports the school owner system — extended schema, all new tables, role-scoped access, and TypeScript types passing
**Depends on**: Nothing (first phase of milestone)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07
**Success Criteria** (what must be TRUE):
  1. The schools table has all new columns for bio, video, presence, teaching info, location, and onboarding state
  2. school_designations table exists with designation type, Stripe subscription/payment columns, and a status workflow
  3. school_faculty table exists with position, principal_trainer flag, and invited_email for non-members
  4. school_verification_documents table exists linked to school and designation with file storage references
  5. Profiles table has principal_trainer_school_id and faculty_school_ids columns; RLS restricts school data by owner/public/admin role; tsc --noEmit passes with no type errors
**Plans:** 2/2 plans complete
Plans:
- [x] 28-01-PLAN.md — Schema migration: extend schools, create 3 new tables, extend profiles
- [x] 28-02-PLAN.md — RLS policies for new tables, TypeScript type regeneration, tsc verification

### Phase 29: Interest & Entry Points
**Goal**: Teachers who do not yet own a school are prompted to register from three distinct surfaces in the platform
**Depends on**: Phase 28 (needs principal_trainer_school_id on profiles)
**Requirements**: INT-01, INT-02, INT-03, INT-04
**Success Criteria** (what must be TRUE):
  1. A teacher without a school sees a registration widget in the dashboard right sidebar linking to /schools/create
  2. The subscriptions page shows a callout below the teacher subscription card linking to school registration
  3. The add-ons page shows a featured banner for teachers linking to school registration
  4. All three entry points are invisible to non-teachers and to teachers who already own a school
**Plans:** 1/1 plans complete
Plans:
- [x] 29-01-PLAN.md — SchoolRegistrationCTA component + integration into dashboard, subscriptions, add-ons
**UI hint**: yes

### Phase 30: School Registration Flow
**Goal**: A teacher can name their school, select designations, pay via Stripe, and arrive at onboarding with a school record created
**Depends on**: Phase 28 (needs school_designations table and Stripe products)
**Requirements**: REG-01, REG-02, REG-03, REG-04, REG-05
**Success Criteria** (what must be TRUE):
  1. Step 1 lets the teacher enter a school name; a URL-safe slug is auto-generated and checked for uniqueness
  2. Step 2 shows all 8 designation products as cards with prices; a running total updates as selections change
  3. Continuing creates a Stripe Checkout session with annual subscription and signup fee per selected designation
  4. After successful payment a school record with status='pending' and linked school_designations rows exist in the database
  5. The teacher is redirected to the onboarding flow at /schools/[slug]/onboarding
**Plans:** 2/2 plans complete
Plans:
- [x] 30-01-PLAN.md — Server-side foundation: slug utility, check-slug API, Stripe Checkout action, webhook handler, success page
- [x] 30-02-PLAN.md — Multi-step registration wizard UI: name/slug step, designation selection with pricing, Stripe redirect
**UI hint**: yes

### Phase 31: School Onboarding Flow
**Goal**: A school owner can complete all 9 onboarding steps and submit their school for admin review
**Depends on**: Phase 28, Phase 30 (needs school record from registration)
**Requirements**: ONB-01, ONB-02, ONB-03, ONB-04, ONB-05, ONB-06, ONB-07, ONB-08, ONB-09
**Success Criteria** (what must be TRUE):
  1. The welcome step displays instructions and time estimate before any data entry
  2. The owner can fill in basic info (name pre-filled, bio, established year), online presence (with at-least-one validation), and an optional video introduction
  3. Teaching info step accepts practice styles, programs, delivery format, lineage, and languages
  4. The location step with Google Places autocomplete appears only for in-person or hybrid delivery formats
  5. The owner can upload required documents per designation and search/invite faculty members (GOYA members or non-members by email)
  6. The review step summarises all entered data; submitting sets onboarding_completed=true, status='pending_review', and triggers an admin notification
**Plans:** 2/3 plans executed
Plans:
- [x] 31-01-PLAN.md — Server actions + faculty search API for all onboarding steps
- [x] 31-02-PLAN.md — Onboarding wizard UI: page wrapper + steps 1-5 (Welcome, Basic Info, Online Presence, Video, Teaching)
- [ ] 31-03-PLAN.md — Onboarding wizard UI: steps 6-9 (Location, Documents, Faculty, Review & Submit) + visual verification
**UI hint**: yes

### Phase 32: School Settings
**Goal**: A school owner can edit every aspect of their school from a dedicated settings area accessible from the header dropdown
**Depends on**: Phase 28, Phase 31 (needs onboarding data to pre-populate settings)
**Requirements**: SET-01, SET-02, SET-03, SET-04, SET-05, SET-06, SET-07, SET-08, SET-09, SET-10, SET-11
**Success Criteria** (what must be TRUE):
  1. A "School Settings" link appears in the user dropdown between Settings and Admin Settings, visible only to school owners
  2. The settings shell at /schools/[slug]/settings has a collapsible sidebar with sections for General, Online Presence, Teaching Info, Location, Faculty, Designations, Documents, Subscription
  3. General section allows editing name, slug, and bio; changing name or slug triggers a re-review status banner
  4. All other sections (online presence, teaching info, location, faculty, designations, documents, subscription) are fully editable with appropriate controls
  5. When the school is pending_review a visible status banner is shown in the settings area
**Plans:** 2/3 plans complete
Plans:
- [x] 32-01-PLAN.md — Settings shell + header dropdown + server actions
- [x] 32-02-PLAN.md — Settings pages: General, Online Presence, Teaching Info, Location
- [ ] 32-03-PLAN.md — Settings pages: Faculty, Designations, Documents, Subscription
**UI hint**: yes

### Phase 33: Admin School Management
**Goal**: Admins and moderators can review school registrations, inspect all submitted data, and approve or reject schools
**Depends on**: Phase 28 (needs school tables for review)
**Requirements**: ADM-01, ADM-02, ADM-03, ADM-04, ADM-05
**Success Criteria** (what must be TRUE):
  1. The admin inbox School Registrations tab shows schools with new designation data, statuses, and approve/reject actions
  2. A school detail page at /admin/schools/[id] shows all fields, uploaded documents, and designation details
  3. Approving a school sets status to 'approved' and sends an approval email to the owner via Resend
  4. Rejecting a school requires a reason; reason is saved, status set to 'rejected', and a rejection email sent via Resend
  5. A "Visit School" button appears on member profile pages for Principal Trainers and Faculty of approved schools
**Plans**: TBD
**UI hint**: yes

### Phase 34: Public School Profile
**Goal**: Visitors and members can find and browse approved schools through a public profile page and the member directory
**Depends on**: Phase 28, Phase 33 (needs approved schools)
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04
**Success Criteria** (what must be TRUE):
  1. A public school profile exists at /schools/[slug] and is only accessible for schools with status='approved'
  2. The hero section shows logo, school name, designation badges, and location or "Online School"
  3. The body shows about text, practice styles, programs, languages, lineage, video on the left, and a sidebar with school details and faculty on the right
  4. The member directory has a School filter type; school cards show logo and designation badges
**Plans**: TBD
**UI hint**: yes

### Phase 35: Faculty Invitations
**Goal**: School owners can invite non-GOYA members to join as faculty, and new registrants with valid invite links are automatically linked to the school
**Depends on**: Phase 28, Phase 31 (needs school_faculty table with invited_email)
**Requirements**: FAC-01, FAC-02, FAC-03
**Success Criteria** (what must be TRUE):
  1. When an owner adds a faculty member by email who is not a GOYA member, an invitation email is sent via Resend
  2. The invitation email contains a link to /register?school=[slug]&invite=[token]
  3. A new member who registers using a valid invite link is automatically linked to the school's faculty
**Plans**: TBD

## Progress

**Execution Order:** 28 → 29 + 30 (parallel) → 31 → 32 + 33 (parallel) → 34 → 35

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 28. Database Foundation | 2/2 | Complete    | 2026-03-31 |
| 29. Interest & Entry Points | 1/1 | Complete    | 2026-03-31 |
| 30. School Registration Flow | 2/2 | Complete   | 2026-03-31 |
| 31. School Onboarding Flow | 3/3 | Complete    | 2026-03-31 |
| 32. School Settings | 3/3 | Complete    | 2026-03-31 |
| 33. Admin School Management | 0/TBD | Not started | - |
| 34. Public School Profile | 0/TBD | Not started | - |
| 35. Faculty Invitations | 0/TBD | Not started | - |
