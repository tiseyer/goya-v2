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
- ✅ **v1.15 Course System Redesign** - Phases 36-40 (shipped 2026-04-01)
- ✅ **v1.16 Admin Color Settings** - Phases 41-42 (shipped 2026-04-01)
- ✅ **v1.17 Dashboard Redesign** - Phases 43-46 (shipped 2026-04-02)
- ✅ **v1.18 User Profile Redesign** - Phases 47-50 (shipped 2026-04-02)

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
**Plans:** 3/3 plans complete
Plans:
- [x] 31-01-PLAN.md — Server actions + faculty search API for all onboarding steps
- [x] 31-02-PLAN.md — Onboarding wizard UI: page wrapper + steps 1-5 (Welcome, Basic Info, Online Presence, Video, Teaching)
- [x] 31-03-PLAN.md — Onboarding wizard UI: steps 6-9 (Location, Documents, Faculty, Review & Submit) + visual verification
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
**Plans:** 3/3 plans complete
Plans:
- [x] 32-01-PLAN.md — Settings shell + header dropdown + server actions
- [x] 32-02-PLAN.md — Settings pages: General, Online Presence, Teaching Info, Location
- [x] 32-03-PLAN.md — Settings pages: Faculty, Designations, Documents, Subscription
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
**Plans:** 2/2 plans complete
Plans:
- [x] 33-01-PLAN.md — Server actions (approve/reject with email) + inbox tab update with designations
- [x] 33-02-PLAN.md — Admin school detail/review page + member profile Visit School button
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
**Plans:** 2/2 plans complete
Plans:
- [x] 34-01-PLAN.md — Public school profile page with hero, body, sidebar, faculty links
- [x] 34-02-PLAN.md — Member directory integration: fetchMembers with schools, SchoolCard component
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

<details>
<summary>✅ v1.15 Course System Redesign (Phases 36-40) - SHIPPED 2026-04-01</summary>

**Milestone Goal:** Redesign admin course management with categories table, multi-lesson support, drag-and-drop ordering, platform-aware video fields, and modern SaaS UI.

- [x] **Phase 36: Database Migrations** - Create course_categories and lessons tables, migrate courses schema, RLS policies, TypeScript types (completed 2026-04-01)
- [x] **Phase 37: Admin Courses — Tabs + Categories** - Courses/Categories tab bar, category table, CRUD modal, delete guard (completed 2026-04-01)
- [x] **Phase 38: Course Creation Form — UI Redesign** - Card-section layout, dynamic category select, duration slider, remove vimeo_url, post-save redirect (completed 2026-04-01)
- [x] **Phase 39: Lesson Management — UI + Logic** - Drag-and-drop lesson list, type-specific forms (Video/Audio/Text), sort_order persistence, mobile touch support (completed 2026-04-01)
- [x] **Phase 40: Wire Lessons to Frontend** - Academy page lesson list, lesson player page by type, category color on course cards, member my-courses lesson management (completed 2026-04-01)

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
**Plans:** 3/3 plans complete
Plans:
- [x] 36-01-PLAN.md — Schema: create course_categories + lessons tables, migrate courses (category_id FK, duration_minutes, drop legacy columns)
- [x] 36-02-PLAN.md — RLS policies for course_categories and lessons, regenerate TypeScript types, fix tsc
- [x] 36-03-PLAN.md — Gap closure: fix migration file idempotency (DROP POLICY IF EXISTS before CREATE)

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
**Plans:** 2/2 plans complete
Plans:
- [x] 37-01-PLAN.md — Server actions and helpers for category CRUD with delete guard
- [x] 37-02-PLAN.md — Tab bar UI, categories table, add/edit modal, DB-driven filters
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
**Plans:** 2/2 plans complete
Plans:
- [x] 38-01-PLAN.md — Update Course type, redesign CourseForm with card sections, DB categories, duration slider, remove vimeo_url, auto course_type, post-save redirect
- [x] 38-02-PLAN.md — Mobile responsiveness audit and visual verification checkpoint
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
**Plans:** 2/2 plans complete
Plans:
- [x] 39-01-PLAN.md — Lesson types, server actions (CRUD + reorder), LessonList with dnd-kit sortable, edit page integration
- [x] 39-02-PLAN.md — LessonForm with type selector (Video/Audio/Text), type-specific fields, inline form wiring, visual verification
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
**Plans:** 3/3 plans complete
Plans:
- [x] 40-01-PLAN.md — Fix stale column refs, lesson list on course detail, category colors on academy cards
- [x] 40-02-PLAN.md — Per-lesson player page with type-specific rendering (Video/Audio/Text)
- [x] 40-03-PLAN.md — Member my-courses lesson management, fix my-courses stale refs
**UI hint**: yes

</details>

<details>
<summary>✅ v1.16 Admin Color Settings (Phases 41-42) - SHIPPED 2026-04-01</summary>

**Milestone Goal:** Admin-controlled color configuration system — brand colors, role colors, and maintenance indicator — stored in site_settings and injected globally via CSS variables.

- [x] **Phase 41: ThemeProvider Infrastructure** - ThemeProvider component, site_settings storage for brand_colors/role_colors/maintenance_indicator_color, global CSS variable injection (completed 2026-04-01)
- [x] **Phase 42: Admin Colors UI** - Colors page at /admin/settings, 3-section layout, color pickers with hex input, save/reset controls, sidebar nav entry (completed 2026-04-01)

### Phase 41: ThemeProvider Infrastructure
**Goal**: Color settings are stored in site_settings and injected as CSS variables globally so any page can consume them via CSS custom properties
**Depends on**: Nothing (first phase of milestone)
**Requirements**: INFRA-01, INFRA-02, BRAND-05, ROLE-03, MAINT-02
**Success Criteria** (what must be TRUE):
  1. A ThemeProvider component exists that reads brand_colors and role_colors from site_settings and sets CSS variables on the html element at render time
  2. ThemeProvider is present in layout.tsx so CSS variables are available on every page of the app without any per-page setup
  3. brand_colors saved to site_settings as a JSON value under the key "brand_colors" are reflected as CSS variables after a page reload
  4. role_colors saved to site_settings as a JSON value under the key "role_colors" are reflected as CSS variables after a page reload
  5. maintenance_indicator_color saved to site_settings under the key "maintenance_indicator_color" is reflected as a CSS variable after a page reload
**Plans:** 1/1 plans complete
Plans:
- [x] 41-01-PLAN.md — Color defaults/types module + ThemeColorProvider server component + layout.tsx integration

### Phase 42: Admin Colors UI
**Goal**: Admins can view, edit, preview, save, and reset all brand colors, role colors, and the maintenance indicator color from a dedicated Colors page in Admin Settings
**Depends on**: Phase 41
**Requirements**: UI-01, UI-02, UI-03, BRAND-01, BRAND-02, BRAND-03, BRAND-04, ROLE-01, ROLE-02, MAINT-01, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. A "Colors" link appears in the admin sidebar under the Settings group and navigates to /admin/settings with the Colors tab active
  2. The page shows three labeled sections — Brand Colors, Role Colors, and Maintenance Indicator — each with color pickers showing a hex input field and a preview swatch
  3. Changing any color updates the CSS variables on the page instantly so the admin can see how the color looks before saving
  4. Clicking "Save" persists all current color values to site_settings; clicking the per-color reset icon restores that single color to its default value
  5. Clicking "Reset All" restores every color across all three sections to its default value
**Plans:** 1/1 plans complete
Plans:
- [x] 42-01-PLAN.md — ColorsTab component with color pickers, live preview, save/reset + settings page tab + sidebar entry
**UI hint**: yes

</details>

<details>
<summary>✅ v1.17 Dashboard Redesign (Phases 43-46) - SHIPPED 2026-04-02</summary>

**Milestone Goal:** Rebuild /dashboard from scratch with role-specific layouts (Student, Teacher, School-view, Wellness Practitioner), Apple/Netflix aesthetic, horizontal carousels, profile completion scoring, stat heroes, and value-driven CTAs. Delete all existing feed UI.

- [x] **Phase 43: Feed Cleanup + Data Infrastructure** - Delete old feed UI after import audit, build lib/dashboard/queries.ts + profileCompletion.ts, rewrite page.tsx as async server component with role branch skeleton (completed 2026-04-02)
- [x] **Phase 44: Shared UI Components** - HorizontalCarousel, DashboardGreeting, PrimaryActionCard, ProfileCompletionCard, StatHero, and 5 card types (completed 2026-04-02)
- [x] **Phase 45: Student + Wellness Practitioner Dashboards** - Full Student and Wellness Practitioner role layouts assembled from Phase 44 components (completed 2026-04-02)
- [x] **Phase 46: Teacher + School Dashboards** - Full Teacher and School-view layouts including school detection, "View as School" toggle, faculty list, connections list, and complex CTA branching (completed 2026-04-02)

### Phase 43: Feed Cleanup + Data Infrastructure
**Goal**: The old dashboard feed is safely deleted, lib/dashboard/ contains tested data fetch functions and a profile completion scorer, and page.tsx is a working async server component that routes to the correct role layout stub
**Depends on**: Nothing (first phase of this milestone)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-05
**Success Criteria** (what must be TRUE):
  1. FeedView, PostComposer, FeedPostCard, PostActionsMenu, and CommentDeleteButton are deleted after a codebase-wide grep confirms no non-dashboard pages import them; npx next build passes with no Module not found errors
  2. lib/dashboard/queries.ts exports fetchUpcomingEvents, fetchRecentCourses, fetchAcceptedConnections, fetchSchoolFaculty, and fetchUserInProgressCourses — all using parallel Promise.all and explicit column selects (no select('*'))
  3. lib/dashboard/profileCompletion.ts exports a scorer with isFieldComplete() that treats JSONB empty arrays as incomplete; a fresh test account with no fields filled scores 0%
  4. app/dashboard/page.tsx is an async server component using getEffectiveUserId() + Promise.all, branching to DashboardStudent, DashboardTeacher, DashboardSchool, or DashboardWellness stubs based on role — where school is detected via role='teacher' AND principal_trainer_school_id IS NOT NULL
  5. Visiting /dashboard as each role (and impersonating a teacher with a school) renders the correct stub without errors
**Plans:** 2/2 plans complete
Plans:
- [x] 43-01-PLAN.md — Grep audit + delete feed files, create lib/dashboard/queries.ts and profileCompletion.ts
- [x] 43-02-PLAN.md — Rewrite page.tsx as async server component with role branching + 4 role layout stubs

### Phase 44: Shared UI Components
**Goal**: HorizontalCarousel, DashboardGreeting, PrimaryActionCard, ProfileCompletionCard, StatHero, and all five card types exist as reusable components that any role layout can consume
**Depends on**: Phase 43 (needs page.tsx shell and data interfaces defined)
**Requirements**: INFRA-04, COMP-01, COMP-02, COMP-03, COMP-04, COMP-05, COMP-06, COMP-07, COMP-08, COMP-09, DES-01, DES-02, DES-03
**Success Criteria** (what must be TRUE):
  1. HorizontalCarousel scrolls horizontally with snap-x on mobile touch, mouse drag on desktop (via embla-carousel-react), hidden scrollbar via @utility no-scrollbar, and renders a skeleton state (3 placeholder cards) when the items array is empty
  2. DashboardGreeting shows a time-of-day salutation, the user's first name, and a role badge styled with the role's CSS variable color
  3. ProfileCompletionCard renders a progress bar (0–100%), a checklist of the 6 weighted fields, and deep links to the exact settings section for each incomplete field — the card is hidden when completion is 100%
  4. StatHero displays its metric tile with an explicit "—" when the value is null or undefined; it never shows "0 profile views" for untracked stats
  5. All five card types (TeacherCard, CourseCard, EventCard, ConnectionCard, FacultyCard) render correctly with shrink-0 set so they do not collapse inside the carousel, and each has a "Show all →" link at the carousel header pointing to the relevant directory page
**Plans:** 2/2 plans complete
Plans:
- [x] 44-01-PLAN.md — Install embla-carousel-react, @utility no-scrollbar, HorizontalCarousel, DashboardGreeting, PrimaryActionCard, ProfileCompletionCard, StatHero
- [x] 44-02-PLAN.md — TeacherCard, CourseCard, EventCard, ConnectionCard, FacultyCard
**UI hint**: yes

### Phase 45: Student + Wellness Practitioner Dashboards
**Goal**: The Student and Wellness Practitioner role layouts are fully assembled — users on those roles see a personalized dashboard with carousels, stat heroes, completion cards, and role-appropriate CTAs
**Depends on**: Phase 43, Phase 44
**Requirements**: STU-01, STU-02, STU-03, STU-04, WP-01, WP-02, WP-03, WP-04, WP-05, WP-06
**Success Criteria** (what must be TRUE):
  1. A Student visiting /dashboard sees a greeting with "Ready to practice today?", a teachers carousel filtered by style tags, a courses carousel, and an upcoming events carousel — each with a "Show all →" link
  2. A Wellness Practitioner visiting /dashboard sees a greeting with WP role badge, a profile completion card (when < 100%), a stat hero placeholder, primary CTAs for sharing an event and adding a course, a suggested connections panel linking to the directory, and an upcoming events carousel
  3. Both layouts are mobile-first: sections stack vertically on small screens, CTAs display side-by-side on desktop
  4. Empty carousels show a non-blank empty state with a contextual CTA rather than an invisible blank space
**Plans:** 2/2 plans complete
Plans:
- [x] 45-01-PLAN.md — Restore card components + replace DashboardStudent stub with full layout (teachers, courses, events carousels)
- [x] 45-02-PLAN.md — Restore ConnectionCard + replace DashboardWellness stub with full layout (completion, stats, CTAs, connections, events)
**UI hint**: yes

### Phase 46: Teacher + School Dashboards
**Goal**: The Teacher and School-view layouts are fully assembled — teachers see connections, completion, stat heroes, and role CTAs; school-owner teachers can toggle to a school-focused view with faculty list and school-specific CTAs
**Depends on**: Phase 43, Phase 44
**Requirements**: TCH-01, TCH-02, TCH-03, TCH-04, TCH-05, SCH-01, SCH-02, SCH-03, SCH-04, SCH-05, SCH-06
**Success Criteria** (what must be TRUE):
  1. A Teacher visiting /dashboard sees a greeting with teacher role badge, a profile completion card (when < 100%), a stat hero showing weekly profile views as "—", primary CTAs for sharing an event and adding a course, and a recent connections list (max 3) with a "View all connections →" link
  2. A teacher who owns a school sees a "View as School" toggle; activating it switches the layout to show the school name in the greeting, a school profile completion card, a school discovery stat hero, school-specific CTAs ("Add workshops & courses", "Manage designations"), a faculty list (max 5) with "Manage faculty →", and an enrolled students list (max 5) with "View all →"
  3. The "View as School" toggle state is remembered within the session so refreshing does not reset it
  4. Both layouts are mobile-first: sections stack vertically on small screens, CTAs display side-by-side on desktop
**Plans:** 2/2 plans complete
Plans:
- [x] 46-01-PLAN.md — DashboardTeacher: greeting, completion, stat hero, CTAs, connections list, View as School toggle
- [x] 46-02-PLAN.md — DashboardSchool: school greeting, completion, stat hero, school CTAs, faculty list, students list
**UI hint**: yes

</details>

### ✅ v1.18 User Profile Redesign (Phases 47-50) — SHIPPED 2026-04-02

**Milestone Goal:** Rebuild /members/[id] with cover image hero, role-specific pill sections, intro video embed, school affiliation, faculty grid, events/courses carousels, Mapbox map, sidebar with membership card and social links, and own-profile editing nudge.

- [x] **Phase 47: Foundation** - DB migration, types, privacy helper, data fetch architecture (completed 2026-04-02)
- [x] **Phase 48: Hero + Sidebar** - ProfileHero + ProfileSidebar + two-column layout (completed 2026-04-02)
- [x] **Phase 49: Content Sections** - Bio, pills, school affiliation, faculty grid, community section (completed 2026-04-02)
- [x] **Phase 50: Media** - Video facade, Mapbox map, events + courses carousels (completed 2026-04-02)

## Phase Details

### Phase 47: Foundation
**Goal**: The database, types, privacy layer, and data fetch architecture are all in place — every subsequent phase can read from the correct columns, trust visibility flags, and receive fully resolved props
**Depends on**: Nothing (first phase of milestone)
**Requirements**: DB-01, DB-02, DB-03, INFRA-01, INFRA-02, INFRA-03, INFRA-04, INFRA-05
**Success Criteria** (what must be TRUE):
  1. The profiles table has cover_image_url, location_lat, location_lng, and location_place_id columns; a profile-covers Supabase Storage bucket exists; lib/types.ts includes lineage and the four new columns
  2. A PUBLIC_PROFILE_COLUMNS constant defines the exact SELECT string used for all profile fetches — no select('*') appears anywhere in the profile page data layer
  3. deriveProfileVisibility() returns correct boolean flags (showMap, showAddress) for all combinations of role (student/teacher/wp) and practice_format (online/in-person/hybrid); students and online-only profiles always receive showMap=false
  4. The profile page.tsx calls supabase.auth.getUser() server-side and derives isOwnProfile = currentUserId === profileId before passing props to any component
  5. page.tsx fetches profile data first, then fires fetchMemberEvents() and fetchMemberCourses() (filtered by created_by) in a parallel Promise.all — verified by confirming no sequential awaits in the data fetch block
**Plans:** 2 plans
Plans:
- [ ] 47-01-PLAN.md — Migration (4 profile columns + profile-covers bucket) + Profile type updates
- [ ] 47-02-PLAN.md — Privacy helper, PUBLIC_PROFILE_COLUMNS, own-profile detection, Promise.all fetch

### Phase 48: Hero + Sidebar
**Goal**: Visitors see a visually complete above-the-fold profile — cover image hero with avatar, name, role badge, and action buttons — alongside a sidebar with membership card, designation badges, social links, and quick stats; own-profile users see an edit button and a completion nudge banner
**Depends on**: Phase 47
**Requirements**: HERO-01, HERO-02, HERO-03, HERO-04, HERO-05, HERO-06, SIDE-01, SIDE-02, SIDE-03, SIDE-04, DES-01, DES-02, DES-03
**Success Criteria** (what must be TRUE):
  1. A member with a cover image set sees a full-bleed hero banner with a dark overlay; a member without one sees a solid fallback background — both have the 120px circular avatar overlapping the hero bottom edge with a white ring
  2. The hero displays name, role badge, intro text (up to 250 characters), location with a pin icon (when set), and language pills — all sourced from the profiles row
  3. Connect and Message buttons appear in the hero for authenticated visitors who are not the profile owner; both buttons are hidden when the viewer is the profile owner
  4. The profile owner sees an "Edit Profile" button in the hero and — when profile completion is below 100% — a completion nudge banner listing incomplete fields with links to the relevant settings sections
  5. The sidebar shows a GOYA membership card ("Member since" date), designation badges from user_designations, social link icons (website, Instagram, TikTok, Facebook, YouTube), and quick stats (connections count, events count, profile views as "—") — the layout stacks to a single column on mobile
**Plans:** 2 plans
Plans:
- [ ] 48-01-PLAN.md — ProfileHero component + two-column page layout restructure
- [ ] 48-02-PLAN.md — ProfileSidebar component (membership card, social icons, quick stats)
**UI hint**: yes

### Phase 49: Content Sections
**Goal**: The main content column below the hero shows the member's bio, role-appropriate pill sections with real data, school affiliation for teachers, and faculty/community sections for school profiles
**Depends on**: Phase 47, Phase 48
**Requirements**: CONT-02, CONT-03, CONT-04, CONT-05, CONT-06, CONT-07, REL-01, REL-02, REL-03
**Success Criteria** (what must be TRUE):
  1. The bio section renders the full profile bio text and is completely absent (no empty card) when bio is null or empty
  2. Pill sections render only when the underlying field has values — an empty array produces no section at all, not an empty heading
  3. A teacher's profile shows teaching styles, focus areas, lineage, format, teaching since, and years teaching pills in a section; a student's profile shows practice styles, what they're looking for, practice level, and learning preference; a wellness practitioner's profile shows type, modalities, focus areas, format, years, and complementary badge; a school profile shows scope, focus, programs, lineage, delivery, and established year
  4. A teacher who belongs to a school sees a "School Affiliation" section with a school card and a list of faculty members from that school
  5. A school profile shows a faculty grid (up to 6 members with a "View all" link) and a community section with enrolled student count and up to 5 avatar thumbnails
**Plans:** 2 plans
Plans:
- [ ] 49-01-PLAN.md — ProfileBio + ProfilePillSection + role-specific pill rendering
- [ ] 49-02-PLAN.md — SchoolAffiliation + FacultyGrid + CommunitySection + page wiring
**UI hint**: yes

### Phase 50: Media
**Goal**: Members with an intro video URL see a facade embed (thumbnail + click-to-play, not a live iframe on load), in-person and hybrid members see an inline location map, and all members' published events and courses appear in horizontal carousels
**Depends on**: Phase 47, Phase 48
**Requirements**: CONT-01, MED-01, MED-02, MED-03, MED-04
**Success Criteria** (what must be TRUE):
  1. A member with a YouTube or Vimeo intro URL sees a video thumbnail with a play button overlay at the top of the main column — clicking the overlay replaces it with the iframe; the full iframe is never loaded on initial page render
  2. The video section is completely absent when youtube_intro_url is null or empty
  3. A teacher or wellness practitioner with in-person or hybrid practice_format and non-null location_lat/lng sees an inline Mapbox map pinned to their location; students and members with online-only format see no map element at all (enforced server-side via deriveProfileVisibility())
  4. A member's published events appear in a horizontal carousel reusing HorizontalCarousel + EventCard from dashboard components; the section is hidden when the member has no published events
  5. A member's published courses appear in a horizontal carousel reusing HorizontalCarousel + CourseCard; the section is hidden when the member has no published courses
**Plans:** 1 plan
Plans:
- [ ] 50-01-PLAN.md — Video facade, Mapbox map, events & courses carousels
**UI hint**: yes

## Progress

**Execution Order:** 47 -> 48 -> 49 -> 50

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
| 36. Database Migrations | 3/3 | Complete | 2026-04-01 |
| 37. Admin Courses — Tabs + Categories | 2/2 | Complete | 2026-04-01 |
| 38. Course Creation Form — UI Redesign | 2/2 | Complete | 2026-04-01 |
| 39. Lesson Management — UI + Logic | 2/2 | Complete | 2026-04-01 |
| 40. Wire Lessons to Frontend | 3/3 | Complete | 2026-04-01 |
| 41. ThemeProvider Infrastructure | 1/1 | Complete | 2026-04-01 |
| 42. Admin Colors UI | 1/1 | Complete | 2026-04-01 |
| 43. Feed Cleanup + Data Infrastructure | 2/2 | Complete | 2026-04-02 |
| 44. Shared UI Components | 2/2 | Complete | 2026-04-02 |
| 45. Student + Wellness Practitioner Dashboards | 2/2 | Complete | 2026-04-02 |
| 46. Teacher + School Dashboards | 2/2 | Complete | 2026-04-02 |
| 47. Foundation | 2/2 | Complete | 2026-04-02 |
| 48. Hero + Sidebar | 2/2 | Complete | 2026-04-02 |
| 49. Content Sections | 2/2 | Complete | 2026-04-02 |
| 50. Media | 1/1 | Complete | 2026-04-02 |

---

## v1.19 Global Search (Phases 51-54)

**Milestone Goal:** macOS Spotlight-style global search overlay across all platform entities — members, events, courses, and pages — with role-aware results, keyboard navigation, debounced input, and result caching.

### Phases

- [ ] **Phase 51: Search Overlay UI** - SearchOverlay component: desktop modal + mobile full-screen, category filter pills, keyboard navigation, grouped result rows with contextual actions
- [ ] **Phase 52: Search API + Page Registry** - /api/search route with per-category Supabase queries (members, events, courses) + static page registry with role-based visibility
- [ ] **Phase 53: Header Integration** - Wire SearchOverlay into the nav header (search icon click + Cmd+K / Ctrl+K keyboard shortcut)
- [ ] **Phase 54: Performance + Polish** - Debounced input (200ms), loading skeletons, result caching keyed by query string, empty/no-result states

## Phase Details

### Phase 51: Search Overlay UI
**Goal**: Users can open a search overlay, type a query, filter by category, navigate results with the keyboard, and click through to any result — fully functional as a UI component before the real API is wired up
**Depends on**: Nothing (first phase of milestone)
**Requirements**: SRCH-01, SRCH-02, SRCH-03, SRCH-04, SRCH-05, SRCH-06, SRCH-07, SRCH-08
**Success Criteria** (what must be TRUE):
  1. Clicking the search icon in the nav header opens a centered modal overlay on desktop; on mobile it opens full-screen with the input anchored at the bottom
  2. The overlay closes when the user presses Escape, clicks the X button, or clicks the dark backdrop outside the modal
  3. Category filter pills (All / Members / Events / Courses / Pages) are visible and clicking one filters the displayed results to that category
  4. Pressing the down arrow moves highlight to the next result, up arrow moves to the previous, and pressing Enter on a highlighted result navigates to it
  5. Results are visually grouped by category with the best match shown at the top; member rows show a message icon, and members with a full address show a map/directions icon
  6. When the overlay opens (by any method), the search input is immediately focused and ready to receive keyboard input
**Plans**: 2 plans
Plans:
- [ ] 51-01-PLAN.md — Search types, mock data, SearchContext, and ClientProviders wiring
- [ ] 51-02-PLAN.md — GlobalSearchOverlay component, sub-components, Header integration
**UI hint**: yes

### Phase 52: Search API + Page Registry
**Goal**: A search query to /api/search returns categorized results from members, events, courses, and the static page registry — role-aware so admins/moderators see more results than regular users
**Depends on**: Phase 51 (overlay component exists to consume the API)
**Requirements**: SAPI-01, SAPI-02, SAPI-03, SAPI-04, SAPI-05, SAPI-06, SAPI-07, PREG-01, PREG-02
**Success Criteria** (what must be TRUE):
  1. Searching "yoga" returns up to 20 member results containing full_name, avatar_url, role, city, country, and has_full_address — with ilike matching against full_name
  2. Searching a keyword returns up to 20 event results matching on title, tags, or description; and up to 20 course results matching on title, tags, or description
  3. The page registry is a static data structure mapping all navigable platform pages (e.g., /dashboard, /members, /events, /academy, /settings, /admin/*) with role visibility rules; a query matching a page title returns that page in results
  4. A regular member searching by email or MRN returns no member results for those fields; an admin or moderator searching by email or MRN does return matching member results
  5. Admin and moderator users see admin-only pages (e.g., /admin/users, /admin/inbox) in page search results; regular members do not see those pages
  6. Teacher or school-owner users see their own school's settings page in page search results; other users do not see that page
**Plans**: TBD

### Phase 53: Header Integration
**Goal**: Users can open the search overlay from anywhere on the platform using the keyboard shortcut Cmd+K (Mac) or Ctrl+K (Windows/Linux), in addition to clicking the header search icon
**Depends on**: Phase 51 (SearchOverlay component), Phase 52 (API route)
**Requirements**: INTG-01
**Success Criteria** (what must be TRUE):
  1. Pressing Cmd+K on Mac or Ctrl+K on Windows/Linux from any authenticated page opens the search overlay and focuses the input, regardless of which element currently has focus
  2. The keyboard shortcut does not interfere with browser-native Ctrl+K behavior (address bar) — the event is captured and prevented from propagating
  3. The search icon in the nav header opens the same overlay that the keyboard shortcut opens — both triggers share one SearchOverlay instance mounted at layout level
**Plans**: TBD

### Phase 54: Performance + Polish
**Goal**: The search experience is snappy and honest — input is debounced so the API is not hammered on every keystroke, results are cached so repeated queries are instant, and every non-result state shows a clear, helpful message
**Depends on**: Phase 51, Phase 52, Phase 53
**Requirements**: INTG-02, INTG-03, INTG-04
**Success Criteria** (what must be TRUE):
  1. Typing rapidly into the search input triggers only one API call after the user pauses for 200ms — not one call per keystroke; during the debounce window and during the fetch a loading skeleton is visible in the results area
  2. Typing the same query a second time does not trigger a new API call — the cached results are displayed immediately from component state
  3. An empty input shows a contextual placeholder state ("Search members, events, courses, pages…"); a query with no results shows a "No results for '[query]'" message; a query that is too short (< 2 characters) shows a "Keep typing…" prompt
**Plans**: TBD

## Progress

**Execution Order:** 51 -> 52 -> 53 -> 54

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 51. Search Overlay UI | 0/2 | Not started | - |
| 52. Search API + Page Registry | 0/TBD | Not started | - |
| 53. Header Integration | 0/TBD | Not started | - |
| 54. Performance + Polish | 0/TBD | Not started | - |
