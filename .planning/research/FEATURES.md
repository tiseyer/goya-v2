# Feature Landscape: Dashboard Redesign

**Domain:** Role-specific community platform dashboard — yoga/wellness professional network with Students, Teachers, Wellness Practitioners, and Schools
**Researched:** 2026-04-01
**Confidence:** HIGH (codebase verified, patterns from LinkedIn/Netflix/SaaS platforms well-documented)

---

## Context: What Already Exists (Do Not Rebuild)

These are live in GOYA v2 and feed dashboard data — do not reimport or re-create:

- `profiles` table: `role`, `avatar_url`, `bio`, `location`, `website`, `instagram`, `youtube`, `teaching_styles`, `lineages`, `teaching_focus`, `influences`, `programs`, `years_teaching`, `first_name`, `last_name`
- Connections system: peer, mentorship, faculty connection types with status
- Events: CRUD, status workflow, public listing at `/events`
- Academy/Courses: lessons, categories, progress tracking at `/academy`
- Schools: designations, faculty, public profile at `/schools/[slug]`
- Admin analytics: Recharts-based charts (pattern for stat rendering)
- Settings shell: `SettingsShell` mirrors `AdminShell` — sidebar layout pattern exists
- `PageContainer` component: `max-w-7xl` standard width — must be used on dashboard

---

## Table Stakes

Features that users of any professional community platform expect. Missing any of these makes the dashboard feel incomplete or generic.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Role-specific greeting with name | Every SaaS dashboard personalizes "Good morning, Sarah" — anonymous dashboards feel cold | LOW | Use `first_name` from profiles. Time-based greeting (morning/afternoon/evening) is a small touch that significantly increases warmth perception |
| Profile completion card with progress bar | LinkedIn pioneered this pattern — 40% of users complete profiles only when prompted by a visible progress indicator. Professional platforms have obligation to help members look credible | MEDIUM | 6 weighted fields (see Profile Completion section below). Progress bar 0–100%. Checklist with deep links to the exact settings field. Card dismisses or collapses once 100% |
| Role-aware stat heroes (2–4 KPIs) | Every dashboard has headline numbers. Users need to feel like the platform tracks their activity | MEDIUM | Stat is a number + label + optional trend. Placeholder stats are acceptable for v1.17 (profile views as placeholder). Must not show zero-state stats that make new users feel inactive |
| Horizontal content carousels | Netflix/Spotify pattern: content rows organized by category with horizontal scroll. This is the defining visual of the Apple/Netflix aesthetic called out in the milestone goal | HIGH | Snap-x scroll on mobile, scrollable desktop. Each carousel has a label and "Show all →" link. Cards are reused from existing pages where possible |
| "Show all →" links on each carousel | Users expect to be able to leave the dashboard and get the full listing | LOW | Links to `/events`, `/academy`, `/directory`, etc. with appropriate filters pre-applied where possible |
| Empty state handling per carousel | New members will have no connections, no courses, no events. Empty carousels without guidance feel broken | LOW | Each carousel shows an empty state with a CTA instead of rendering zero cards. Example: "You haven't connected with anyone yet. Find teachers →" |
| Primary CTA per role | Every SaaS onboarding study shows that a single clear next action outperforms a menu of options. The dashboard should tell each role what to do next | LOW | Derived from profile completeness + activity. Teacher with no school → "Register your school". Student with no connections → "Find teachers". See Role Behaviors below |
| Mobile responsiveness | 60%+ of community platform traffic comes from mobile. Horizontal carousels must be swipeable | MEDIUM | CSS `overflow-x: scroll` with `snap-x snap-mandatory` and `scroll-behavior: smooth`. Hide scrollbar on desktop with `-ms-overflow-style: none; scrollbar-width: none` |

---

## Profile Completion Scoring

### How It Works

Profile completion is calculated on the fly from the user's profile record — no stored score. Weighted fields ensure that meaningful professional fields contribute more than cosmetic ones.

### Recommended 6-Field Weighting (totals 100%)

| Field | Weight | Why | DB Column |
|-------|--------|-----|-----------|
| Avatar | 20% | Visual identity is the #1 trust signal in professional networks. A profile without a photo gets 14× fewer engagement responses (LinkedIn data, MEDIUM confidence) | `avatar_url` |
| Bio | 25% | Bio is the primary discovery text. Most important field for SEO and peer trust. LinkedIn weights this as #2 | `bio` |
| Location | 15% | Enables directory map panel, local event recommendations, school discovery. Already used in member directory | `location` |
| Teaching Styles (teacher/WP only) | 20% | Core professional identity. Empty for teacher = useless profile for students searching by style | `teaching_styles` (array, non-empty = complete) |
| Website or Instagram | 10% | Social proof. Either satisfies this — OR condition | `website` OR `instagram` non-null |
| Years Teaching (teacher/WP) / Designation (school) / Course Enrolled (student) | 10% | Role-specific proof of engagement. For students: `years_teaching` is irrelevant → substitute with "enrolled in at least one course" from `user_course_progress` | varies by role |

**For Students:** Replace "Teaching Styles" (20%) and "Years Teaching" (10%) with:
- Enrolled in at least 1 course (20%) — pulls from `user_course_progress`
- Connected with at least 1 teacher (10%) — pulls from `connections`

**For Schools (school role via school owner teacher):** Replace teaching-specific fields with school-specific completion fields.

### Implementation Pattern

```
score = 0
if avatar_url → score += 20
if bio && bio.length > 20 → score += 25
if location → score += 15
if role is teacher/WP:
  if teaching_styles.length > 0 → score += 20
  if years_teaching → score += 10
if role is student:
  if has_enrolled_course → score += 20
  if has_connection → score += 10
if website || instagram → score += 10
return Math.min(score, 100)
```

Calculation is a pure function — no API call, just computed from the profile object already loaded on the dashboard.

### ProfileCompletionCard Behavior

- Shows when score < 100%
- Progress bar with percentage label
- Checklist: each incomplete item is a deep link to the exact settings field
  - "Add your photo" → `/settings?section=avatar`
  - "Write your bio" → `/settings?section=bio`
  - "Add your location" → `/settings?section=location`
- At 100%: card collapses or shows a congratulations state — does not disappear abruptly
- Card is dismissable (localStorage flag `dashboard-completion-dismissed`) once score ≥ 80%

---

## Role Behaviors

### Student Dashboard

**Goal:** Discovery and learning progress. Students are consumers — they want to find teachers, join events, and track their academy progress.

**Stat Heroes (2–3):**
- Courses enrolled (from `user_course_progress`)
- Connections (from `connections` table, accepted status)
- Profile views (placeholder stat — "Coming soon" label acceptable in v1.17)

**Carousels:**
1. "Continue Learning" — courses the student is enrolled in, ordered by `last_accessed_at`. CTA: "Browse Courses" if empty.
2. "Upcoming Events" — next 5 published events sorted by date. CTA: "View Calendar" if empty.
3. "Teachers Near You" — profiles with `role = teacher` filtered by matching `location` (city match, fuzzy). CTA: "Find Teachers" if empty.

**Primary CTA:**
- If profile < 60%: "Complete your profile to be found by teachers"
- If profile ≥ 60% and no courses: "Browse the Academy"
- If enrolled: "Continue [most recent course]"

**Complexity:** MEDIUM — requires 3 DB queries (progress, events, directory) but all data already exists.

---

### Teacher Dashboard

**Goal:** Professional visibility and community building. Teachers are producers — they want to be discovered, show their credentials, and manage their community presence.

**Stat Heroes (3–4):**
- Active connections (accepted connections count)
- Events hosted (published events created by this teacher, from `events` where `created_by = user_id`)
- Courses published (published courses created by this teacher)
- Profile views (placeholder)

**Carousels:**
1. "Your Connections" — accepted connections. CTA: "Explore Directory" if empty.
2. "Your Events" — teacher's own published events. CTA: "Create an Event" if empty.
3. "Academy Courses" — published GOYA courses, not the teacher's own. Discovery carousel for CPD. CTA: "Browse Academy" if empty.

**Primary CTA:**
- If no school: "Register your school on GOYA" (links to school registration) — high-value monetization CTA
- If school exists but onboarding incomplete: "Continue school setup"
- If school live: "Manage your school"
- If profile < 60%: "Complete your profile"

**Special Component:** ConnectionsList — a small panel (not a carousel) showing the 5 most recent accepted connections with avatar + name + role badge + "Message" action. This is distinct from the carousel and sits near the stat heroes.

**Complexity:** MEDIUM-HIGH — teacher-specific events/courses queries need `created_by` filter, school status check adds one more query.

---

### Wellness Practitioner Dashboard

**Goal:** Same as Teacher but without the school system. Wellness practitioners focus on visibility, events, and connections.

**Stat Heroes (2–3):**
- Active connections
- Events hosted
- Profile views (placeholder)

**Carousels:**
1. "Your Connections" — accepted connections. CTA: "Explore Directory" if empty.
2. "Your Events" — WP's own published events. CTA: "Create an Event" if empty.
3. "Recommended Courses" — published GOYA courses. CTA: "Browse Academy" if empty.

**Primary CTA:**
- If profile < 60%: "Complete your profile to be found by clients"
- If no events: "Submit your first event"
- If no connections: "Connect with teachers and practitioners"

**Complexity:** MEDIUM — same pattern as Teacher but without school queries.

---

### School Dashboard (Teacher with active school)

A teacher who owns a school gets an augmented teacher dashboard, not a separate role. The `role` stays `teacher`, but the dashboard detects school ownership and renders school-specific components.

**Detection:** Query `schools` table where `owner_id = user_id AND status = 'active'`.

**Stat Heroes (3–4):**
- Faculty members (from `school_faculty` table, accepted)
- School profile views (placeholder)
- Active designations (from `school_designations`)
- Events hosted (by teacher)

**Carousels:**
1. "Your Faculty" — FacultyList component showing faculty members with avatar + name + role. CTA: "Invite Faculty" if empty.
2. "Your Events" — school-associated events. CTA: "Create an Event" if empty.
3. "Academy Courses" — discovery carousel.

**Special Component:** FacultyList — small panel showing current faculty with invite action button. Similar to ConnectionsList but faculty-specific. Links to school settings for full management.

**Primary CTA:**
- If school pending review: "Your school is pending approval — we'll email you"
- If school approved: "View public school profile" → `/schools/[slug]`
- If school onboarding incomplete: "Complete school setup" → `/schools/[slug]/settings`

**Complexity:** HIGH — requires school status detection, faculty query, designation query on top of teacher queries.

---

## HorizontalCarousel Component

This is a shared infrastructure component used by all role dashboards — the most complex piece of the milestone.

### Behavior Specification

- **Desktop:** Scrollable with mouse/trackpad. No visible scrollbar (`scrollbar-width: none`). Subtle right fade gradient to hint at more content. Navigation arrows on hover.
- **Mobile:** Swipeable with touch gestures. CSS scroll snap (`snap-x snap-mandatory`). First card slightly visible from edge to hint at more.
- **Cards:** Fixed width (e.g., `w-64` or `w-72`). Do not stretch. Consistent height enforced.
- **Overflow:** Parent is `overflow-x-auto` with `-webkit-overflow-scrolling: touch`.
- **Gap:** Consistent `gap-4` between cards.
- **"Show all →" link:** Rendered in the carousel header row, right-aligned. Always links somewhere.
- **Empty state:** Full-width placeholder replacing card row. Icon + message + CTA button.
- **Loading state:** 3–4 skeleton cards matching card dimensions.

### Card Types Needed

| Card | Used By | Data From | Existing Component? |
|------|---------|-----------|---------------------|
| CourseCard | All roles | `courses` + `course_categories` | No — new component |
| EventCard | All roles | `events` | No — new component (public events page uses its own layout) |
| TeacherCard | Student | `profiles` where role=teacher | No — new component |
| ConnectionCard | Teacher/WP | `profiles` via `connections` | No — new component |
| FacultyCard | School | `profiles` via `school_faculty` | No — new component |

All cards follow the same sizing contract so `HorizontalCarousel` can render any card type.

---

## StatHero Component

A KPI card showing a single number + label + optional trend indicator.

### Behavior Specification

- **Number:** Large type (text-3xl or text-4xl), semibold
- **Label:** Small muted text below the number
- **Trend:** Optional up/down arrow with delta ("+3 this week"). Omit if data is unavailable — never show fake trends
- **Placeholder state:** For stats not yet backed by data (profile views), render "—" or "Coming soon" rather than "0". "0 profile views" feels punishing for new users.
- **Grid:** StatHeroes render in a 2–4 column responsive grid (`grid-cols-2 sm:grid-cols-4`). Each card has a subtle border and rounded corners matching `Card.tsx`.
- **Color accent:** Use role color CSS variable (`--color-teacher`, `--color-student`, etc.) from the ThemeColorProvider system (v1.16) for the number or an accent bar.

---

## Anti-Features

Features commonly seen on dashboards but explicitly wrong for this milestone.

| Anti-Feature | Why Requested | Why Wrong Here | Alternative |
|--------------|---------------|----------------|-------------|
| Community feed / posts | The old dashboard had a feed. Users may expect activity from their connections | PROJECT.md explicitly says "Complete rebuild — no community feed." The feed was removed intentionally to create an Apple/Netflix aesthetic, not a Facebook one. A feed conflicts with the carousel layout. | Carousels showing curated content serve the same "what's happening" need without the feed noise |
| Real-time profile view analytics | "Weekly profile views" is a stated milestone goal | Analytics infrastructure (Supabase + Vercel Analytics + GA4) does not currently track profile views per-user. Building this requires an `analytics_events` table, write calls on profile page load, and aggregation queries. This is a separate analytics milestone. | Show placeholder stat "Profile Views — Coming soon" in v1.17. Do NOT instrument analytics in this milestone. |
| Notification feed on dashboard | Many platforms surface notifications on the dashboard | GOYA already has an inbox at `/settings/inbox` for connection requests. Duplicating notifications on the dashboard creates two sources of truth. | The header notification bell (already built) handles notifications. Dashboard CTAs handle next-action guidance. |
| Drag-and-drop dashboard layout customization | Some enterprise dashboards allow widget reorder | Over-engineering for a 5,800-user community platform. Apple/Netflix aesthetic is fixed layout, not configurable grid. | Fixed role-specific layouts. Role determines content. No customization. |
| "Suggested connections" ML algorithm | Common on LinkedIn-style platforms | Requires collaborative filtering or cosine similarity on profile data — a separate data science milestone. Current `connections` table has no similarity signals. | "Teachers Near You" carousel uses location match (simpler, deterministic). |
| Animated number counters on stat heroes | Often seen as a "premium" touch | Adds JavaScript complexity with no UX benefit on dashboards. Users scan KPIs — they don't need to watch them count up. `AnimatedCounter.tsx` exists in landing components but should stay in landing. | Static number rendering. Transition from loading skeleton to number is sufficient motion. |
| Infinite scroll on carousels | Feels modern | Infinite scroll carousels defeat the purpose of a dashboard overview. The carousel's value is showing a finite curated set — "here are your 5 upcoming events." Infinite undermines the curation. | Fixed 5–8 items per carousel. "Show all →" exits to full listing pages. |

---

## Feature Dependencies

```
Supabase profile data (already exists)
  └──feeds──> ProfileCompletionCard (pure computation, no new queries)
  └──feeds──> StatHero: connections count
  └──feeds──> TeacherCard carousel (directory query)

Connections table (v1.1, already exists)
  └──feeds──> StatHero: connections count
  └──feeds──> ConnectionsList panel
  └──feeds──> ConnectionCard carousel

Events table (v1.9, already exists)
  └──feeds──> EventCard carousel (filter: upcoming, published)
  └──feeds──> StatHero: events hosted (filter: created_by)

Courses + course_categories tables (v1.15, already exists)
  └──feeds──> CourseCard carousel
  └──feeds──> StatHero: courses published

Schools + school_faculty tables (v1.14, already exists)
  └──feeds──> FacultyList panel
  └──feeds──> School status detection for Teacher dashboard CTA
  └──feeds──> StatHero: faculty count

ThemeColorProvider CSS variables (v1.16, already exists)
  └──feeds──> StatHero role color accent (--color-teacher, --color-student, etc.)

HorizontalCarousel (NEW — shared component)
  └──used by──> all role carousels
  └──renders──> CourseCard | EventCard | TeacherCard | ConnectionCard | FacultyCard

ProfileCompletionCard (NEW)
  └──requires──> profile data (already in dashboard session query)
  └──links to──> /settings with section anchors

StatHero (NEW)
  └──requires──> aggregation queries per role
  └──uses──> CSS variables from ThemeColorProvider

Role detection (already exists via auth session)
  └──determines──> which dashboard layout renders
  └──determines──> which queries are made
  └──determines──> school ownership check (Teacher only)
```

### Dependency Notes

- **All data already exists** — this milestone is pure UI orchestration on top of existing DB tables. No new tables required for v1.17 unless profile view tracking is added (explicitly deferred above).
- **School detection is additive** — a teacher's dashboard checks for school ownership. If no school, the school-specific components are simply not rendered. No separate "school role" exists — this is a check, not a new auth path.
- **Card components are new** — `CourseCard`, `EventCard`, `TeacherCard`, `ConnectionCard`, `FacultyCard` do not exist yet. They are the main build work of this milestone alongside `HorizontalCarousel`, `ProfileCompletionCard`, and `StatHero`.
- **ThemeColorProvider CSS variables** — already injected globally (v1.16). StatHero role colors can use `var(--color-teacher)` etc. without any new infrastructure.

---

## MVP Scope (v1.17)

### Must Have

- `HorizontalCarousel` shared component with snap-x mobile, desktop scroll, empty state, skeleton loading
- `ProfileCompletionCard` with 6-field weighted score, checklist, deep links
- `StatHero` grid with placeholder support
- Student dashboard layout with greeting, completion card, 3 carousels, 2–3 stat heroes
- Teacher dashboard layout with greeting, completion card, ConnectionsList, 3 carousels, 3–4 stat heroes, school CTA
- Wellness Practitioner dashboard layout (same as Teacher minus school components)
- School-aware Teacher layout (FacultyList, school stat heroes, school CTA variants)
- `CourseCard`, `EventCard`, `TeacherCard`, `ConnectionCard`, `FacultyCard` — new card components
- Full deletion of existing dashboard UI (community feed, old layout)

### Defer to v2

- Real profile view analytics (requires new `analytics_events` table + instrumentation)
- "Suggested connections" recommendation algorithm
- Notification surface on dashboard
- CPD credits stat hero (credits table exists but requires aggregation by type — scope for a dedicated CPD milestone)

---

## Complexity Summary

| Component | Complexity | Reason |
|-----------|------------|--------|
| HorizontalCarousel | MEDIUM | CSS snap + touch handling + skeleton + empty state + responsive arrows |
| ProfileCompletionCard | MEDIUM | Multi-role weighted logic, deep link routing, dismiss state |
| StatHero | LOW | Display-only, no complex logic |
| Student dashboard layout | MEDIUM | 3 new queries, 3 carousels, empty states |
| Teacher dashboard layout | MEDIUM-HIGH | 4+ queries, school detection, ConnectionsList |
| WP dashboard layout | MEDIUM | Same as Teacher minus school check |
| School-aware teacher layout | HIGH | School status query, faculty query, designation query, CTA branching |
| Card components (5×) | LOW-MEDIUM each | New components but follow existing design system |
| Delete existing dashboard | LOW | File deletion + route cleanup |

---

## Sources

- PROJECT.md (codebase) — v1.17 milestone goal, target features, existing system state. HIGH confidence
- Codebase: `app/settings/page.tsx` — Profile fields verified: `avatar_url`, `bio`, `location`, `website`, `instagram`, `teaching_styles`, `years_teaching`. HIGH confidence
- Codebase: `app/components/ui/` — Existing `Card.tsx`, `Button.tsx`, `Badge.tsx`, `PageContainer.tsx`. HIGH confidence
- Codebase: `app/components/ThemeColorProvider.tsx` — CSS variable injection from v1.16. HIGH confidence
- [Designing a smart 'Complete Your Profile' UI](https://blog.logrocket.com/ux-design/complete-profile-ui-interaction/) — Profile completion checklist patterns. MEDIUM confidence
- [Netflix Carousel UX Pattern](https://medium.com/@andrew.tham.cc/recreating-netflixs-slider-component-2d6ad9009ab0) — Horizontal slider with peek items and CSS transform. MEDIUM confidence
- [NN/G Mobile Carousels](https://www.nngroup.com/articles/mobile-carousels/) — Reachable in 3–4 swipes, gestural control on mobile. MEDIUM confidence
- [Dashboard Design UX Patterns — Pencil & Paper](https://www.pencilandpaper.io/articles/ux-pattern-analysis-data-dashboards) — KPI card hierarchy, progressive disclosure. MEDIUM confidence
- [Userpilot — SaaS Onboarding Patterns](https://userpilot.com/blog/app-onboarding-design/) — Checklist + gamification = 124% activation increase (Blip case study). LOW-MEDIUM confidence (single study)
- [KPI Card Best Practices — Tabular Editor](https://tabulareditor.com/blog/kpi-card-best-practices-dashboard-design) — Placeholder/trend guidance for KPI cards. MEDIUM confidence

---

*Feature research for: GOYA v2 — v1.17 Dashboard Redesign*
*Researched: 2026-04-01*
