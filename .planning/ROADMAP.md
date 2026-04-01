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
- ✅ **v1.14 School Owner System** - Phases 28-35 (shipped 2026-03-31)
- 🚧 **v1.15 Course System Redesign** - Phases 36-40 (in progress)

## Phases

<details>
<summary>✅ v1.14 School Owner System (Phases 28-35) - SHIPPED 2026-03-31</summary>

**Milestone Goal:** Teachers can register their yoga school on GOYA — select designations, pay via Stripe, complete onboarding, get admin-verified, and go live with a public school profile.

- [x] **Phase 28: Database Foundation** - Extend schools/profiles tables, add school_designations/faculty/documents tables, RLS policies, TypeScript types (completed 2026-03-31)
- [x] **Phase 29: Interest & Entry Points** - Dashboard widget, subscriptions callout, add-ons banner for teachers without a school (completed 2026-03-31)
- [x] **Phase 30: School Registration Flow** - Name/slug step, designation selection, Stripe Checkout, post-payment school record creation (completed 2026-03-31)
- [x] **Phase 31: School Onboarding Flow** - 9-step onboarding wizard from welcome through review & submit (completed 2026-03-31)
- [x] **Phase 32: School Settings** - Full settings area at /schools/[slug]/settings with sidebar navigation and all section pages (completed 2026-03-31)
- [x] **Phase 33: Admin School Management** - Inbox tab updates, school detail/review page, approve/reject workflow, member profile integration (completed 2026-03-31)
- [x] **Phase 34: Public School Profile** - /schools/[slug] with hero, bio, teaching info, faculty, and member directory integration (completed 2026-03-31)
- [x] **Phase 35: Faculty Invitations** - Email invites for non-members, invite link at registration, auto-link on account creation (completed 2026-03-31)

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
**Plans:** 2 plans
Plans:
- [ ] 33-01-PLAN.md — Server actions (approve/reject with email) + inbox tab update with designations
- [ ] 33-02-PLAN.md — Admin school detail/review page + member profile Visit School button
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
**Plans:** 2 plans
Plans:
- [ ] 34-01-PLAN.md — Public school profile page with hero, body, sidebar, faculty links
- [ ] 34-02-PLAN.md — Member directory integration: fetchMembers with schools, SchoolCard component
**UI hint**: yes

### Phase 35: Faculty Invitations
**Goal**: School owners can invite non-GOYA members to join as faculty, and new registrants with valid invite links are automatically linked to the school
**Depends on**: Phase 28, Phase 31 (needs school_faculty table with invited_email)
**Requirements**: FAC-01, FAC-02, FAC-03
**Success Criteria** (what must be TRUE):
  1. When an owner adds a faculty member by email who is not a GOYA member, an invitation email is sent via Resend
  2. The invitation email contains a link to /register?school=[slug]&invite=[token]
  3. A new member who registers using a valid invite link is automatically linked to the school's faculty
**Plans:** 1/1 plans complete
Plans:
- [x] 35-01-PLAN.md — Faculty invitation email + registration auto-link

</details>

### v1.15 Course System Redesign (In Progress)

**Milestone Goal:** Redesign admin course management with categories table, multi-lesson support, drag-and-drop ordering, platform-aware video fields, and modern SaaS UI.

- [ ] **Phase 36: Database Migrations** - Create course_categories and lessons tables, migrate courses schema, RLS policies, TypeScript types
- [ ] **Phase 37: Admin Courses — Tabs + Categories** - Courses/Categories tab bar, category table, CRUD modal, delete guard
- [ ] **Phase 38: Course Creation Form — UI Redesign** - Card-section layout, dynamic category select, duration slider, remove vimeo_url, post-save redirect
- [ ] **Phase 39: Lesson Management — UI + Logic** - Drag-and-drop lesson list, type-specific forms (Video/Audio/Text), sort_order persistence, mobile touch support
- [ ] **Phase 40: Wire Lessons to Frontend** - Academy page lesson list, lesson player page by type, category color on course cards, member my-courses lesson management

### Phase 36: Database Migrations
**Goal**: The database fully supports the course system redesign — course_categories and lessons tables exist, courses schema updated, RLS policies enforced, and TypeScript types pass
**Depends on**: Nothing (first phase of milestone)
**Requirements**: DB-01, DB-02, DB-03, DB-04, DB-05, DB-06, DB-07
**Success Criteria** (what must be TRUE):
  1. The course_categories table exists with 5 seeded canonical categories (Workshop, Yoga Sequence, Dharma Talk, Music Playlist, Research), each with id, name, slug, description, color, parent_id, and sort_order
  2. The lessons table exists with course_id FK (CASCADE), type enum (video/audio/text), sort_order as numeric for float-position drag reorder, and all platform-specific URL and media fields
  3. The courses table has category_id FK pointing to course_categories, duration_minutes integer column, and the old category text column and vimeo_url column are dropped
  4. RLS on course_categories allows admin/mod full CRUD and public SELECT; RLS on lessons allows admin/mod full CRUD, members SELECT published lessons of published courses, and course creators SELECT their own
  5. npx tsc --noEmit passes with no type errors after types are regenerated
**Plans:** 2 plans
Plans:
- [ ] 36-01-PLAN.md — Schema: create course_categories + lessons tables, migrate courses (category_id FK, duration_minutes, drop legacy columns)
- [ ] 36-02-PLAN.md — RLS policies for course_categories and lessons, regenerate TypeScript types, fix tsc

### Phase 37: Admin Courses — Tabs + Categories
**Goal**: Admins can manage course categories from a dedicated tab on the courses page, with full CRUD and a safe delete guard
**Depends on**: Phase 36
**Requirements**: ACAT-01, ACAT-02, ACAT-03, ACAT-04, ACAT-05
**Success Criteria** (what must be TRUE):
  1. The admin courses page has a Courses/Categories tab bar; switching tabs does not lose the current course list state
  2. The Categories tab shows a table with color swatch, name, slug, parent category, description, and edit/delete action buttons
  3. An admin can open an "Add Category" modal, enter a name (slug auto-generates), optionally set description, parent, and color, and save to the database
  4. An admin can open an existing category in the same modal, edit any field, and save the update
  5. Clicking delete on a category that has courses referencing it shows the course count and blocks deletion; a category with no references is deleted immediately
**Plans**: TBD
**UI hint**: yes

### Phase 38: Course Creation Form — UI Redesign
**Goal**: The admin course creation and edit form has a premium card-section layout, database-driven category select, and duration slider, with no legacy vimeo_url field
**Depends on**: Phase 36, Phase 37
**Requirements**: ACF-01, ACF-02, ACF-03, ACF-04, ACF-05, ACF-06, ACF-07
**Success Criteria** (what must be TRUE):
  1. The course form is structured as visually distinct card sections (e.g., Basic Info, Media, Settings) rather than a flat single-scroll form
  2. The category dropdown is populated from the course_categories table; selecting a category saves category_id to the database
  3. The duration field is a slider from 5 to 600 minutes in steps of 5, displaying the selected value as "Xh Ym" next to the slider
  4. The vimeo_url field is absent from the form; no reference to it appears in the UI
  5. After saving a new course, the admin is redirected to the course edit page where they can immediately add lessons
  6. The form renders correctly on mobile screens with no overflow or truncated controls
**Plans**: TBD
**UI hint**: yes

### Phase 39: Lesson Management — UI + Logic
**Goal**: Admins can add, edit, reorder, and delete lessons on the course edit page, with type-specific forms for Video, Audio, and Text lessons and full drag-and-drop support on desktop and mobile
**Depends on**: Phase 36, Phase 38
**Requirements**: LM-01, LM-02, LM-03, LM-04, LM-05, LM-06, LM-07, LM-08, LM-09
**Success Criteria** (what must be TRUE):
  1. The course edit page has a Lessons section; when no lessons exist the section shows "No lessons yet" with a prompt to add the first lesson
  2. Each lesson in the list shows a drag handle, sequential number, title, type badge (Video/Audio/Text), duration, and edit/delete actions
  3. Clicking "Add lesson" or the edit button opens a form with a visual type selector (card-style toggle for Video, Audio, Text)
  4. The Video lesson form shows a platform toggle (Vimeo/YouTube), URL field, short and long description fields, and a duration slider (1-180 min); the Audio form shows audio URL, featured image upload, descriptions, and duration slider; the Text form shows featured image, descriptions, and duration slider
  5. Dragging a lesson to a new position updates sort_order in the database with a single-row write (float position midpoint); the list reflects the new order immediately without a full page reload
  6. Drag-and-drop works on touch screens (mobile and tablet)
**Plans**: TBD
**UI hint**: yes

### Phase 40: Wire Lessons to Frontend
**Goal**: The public academy shows lesson lists on course detail pages, renders each lesson type correctly, displays category colors on course cards, and member course management includes the same lesson editor
**Depends on**: Phase 36, Phase 39
**Requirements**: FA-01, FA-02, FA-03, FA-04, FA-05
**Success Criteria** (what must be TRUE):
  1. The /academy/[id] page shows an ordered lesson list fetched from the lessons table, with a type icon, title, and duration for each lesson
  2. Each lesson has a player page at /academy/[id]/lesson that renders correctly by type — Vimeo or YouTube embed for Video, an HTML5 audio player for Audio, and formatted text for Text
  3. Lessons appear in the order defined by sort_order, not insertion order
  4. Course cards on the academy listing page display a colored badge or border that reflects the category color stored in course_categories
  5. The My Courses settings page for members includes the same lesson management section available to admins (without the category tab)
**Plans**: TBD
**UI hint**: yes

## Progress

**Execution Order:** 36 -> 37 -> 38 -> 39 -> 40

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 28. Database Foundation | 2/2 | Complete | 2026-03-31 |
| 29. Interest & Entry Points | 1/1 | Complete | 2026-03-31 |
| 30. School Registration Flow | 2/2 | Complete | 2026-03-31 |
| 31. School Onboarding Flow | 3/3 | Complete | 2026-03-31 |
| 32. School Settings | 3/3 | Complete | 2026-03-31 |
| 33. Admin School Management | 2/2 | Complete | 2026-03-31 |
| 34. Public School Profile | 2/2 | Complete | 2026-03-31 |
| 35. Faculty Invitations | 1/1 | Complete | 2026-03-31 |
| 36. Database Migrations | 0/2 | Not started | - |
| 37. Admin Courses — Tabs + Categories | 0/? | Not started | - |
| 38. Course Creation Form — UI Redesign | 0/? | Not started | - |
| 39. Lesson Management — UI + Logic | 0/? | Not started | - |
| 40. Wire Lessons to Frontend | 0/? | Not started | - |
