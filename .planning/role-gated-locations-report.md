# Role-Gated Locations Report

**Generated:** 2026-04-01
**Purpose:** Comprehensive audit of all locations where content is conditionally shown based on user role.

## Roles in the System

| Role | Description |
|------|-------------|
| `admin` | Full system access, all admin pages, dangerous operations |
| `moderator` | Most admin features except certain danger zone operations |
| `teacher` | Can create events/courses, access teaching-specific features, register school |
| `wellness_practitioner` | Can create events/courses (same permissions as teacher for content) |
| `student` | Basic member, eligible for teacher upgrade |
| `school` | Organization/school account type (rarely checked) |

Also: `member_type` field (teacher/student/wellness_practitioner) used as fallback in some places.

---

## Middleware & Auth Layer

| File | Lines | Roles | Description | Area |
|------|-------|-------|-------------|------|
| `middleware.ts` | 193-202 | admin, moderator bypass | Maintenance mode enforcement — non-admin/mod redirected to `/maintenance` | Middleware |
| `middleware.ts` | 207-229 | admin only | Impersonation cookie security — validates impersonator is admin | Middleware |
| `middleware.ts` | 259-267 | admin, moderator | Admin path enforcement — non-admin/mod on `/admin/*` redirected to `/dashboard` | Middleware |
| `middleware.ts` | 270-288 | admin, moderator bypass | Page visibility enforcement — admins bypass page redirect rules | Middleware |

---

## Admin Pages (all gated by layout)

| File | Lines | Roles | Description | Area |
|------|-------|-------|-------------|------|
| `app/admin/layout.tsx` | 19 | admin, moderator | Root admin layout — redirects non-admin/mod to `/` | Admin |
| `app/admin/dashboard/` | — | admin, moderator | Admin dashboard (inherits layout gate) | Admin |
| `app/admin/users/` | — | admin, moderator | User management | Admin |
| `app/admin/users/[id]/UserDetailClient.tsx` | 54 | admin | Displays/edits user role, shows different UI for admin vs moderator | Admin |
| `app/admin/events/` | — | admin, moderator | Event management | Admin |
| `app/admin/events/AdminEventsFilters.tsx` | — | admin (vs moderator) | Different filter options for admin vs moderator | Admin |
| `app/admin/events/[id]/edit/page.tsx` | — | admin (vs moderator) | Different edit capabilities | Admin |
| `app/admin/courses/` | — | admin, moderator | Course management | Admin |
| `app/admin/courses/AdminCoursesFilters.tsx` | — | admin (vs moderator) | Different filter options for admin vs moderator | Admin |
| `app/admin/courses/[id]/edit/page.tsx` | — | admin (vs moderator) | Different edit capabilities | Admin |
| `app/admin/inbox/` | — | admin, moderator | Support tickets, registrations | Admin |
| `app/admin/credits/` | — | admin, moderator | Credit tracking (filters by member_type) | Admin |
| `app/admin/shop/` | — | admin, moderator | Shop/product management | Admin |
| `app/admin/media/page.tsx` | — | admin (vs moderator) | Media library — `isAdmin = currentUserRole === 'admin'` for extra permissions | Admin |
| `app/admin/verification/` | — | admin, moderator | Verification queue | Admin |
| `app/admin/flows/` | — | admin, moderator | Automation workflows | Admin |
| `app/admin/settings/` | — | admin, moderator | System settings (all tabs) | Admin |
| `app/admin/chatbot/` | — | admin, moderator | Chatbot configuration | Admin |
| `app/admin/emails/` | — | admin, moderator | Email management | Admin |
| `app/admin/audit-log/` | — | admin, moderator | Audit log viewer | Admin |
| `app/admin/docs/` | — | admin, moderator | Admin documentation | Admin |
| `app/admin/migration/` | — | admin, moderator | Data migration tools | Admin |

---

## API Routes

| File | Lines | Roles | Description | Area |
|------|-------|-------|-------------|------|
| `app/api/admin/health/route.ts` | 9-37 | admin only | Health check endpoint — 403 for non-admin | API |
| `app/api/admin/danger/clear-cache/route.ts` | 14 | admin only | Cache clearing — 403 for non-admin | API |
| `app/api/admin/danger/invalidate-sessions/route.ts` | 14 | admin only | Session invalidation — 403 for non-admin | API |
| `app/api/admin/users/bulk-delete/route.ts` | 21 | admin only | Bulk user deletion — 403 for non-admin | API |
| `app/api/admin/migration/import/route.ts` | 22 | admin only | Data import — 403 for non-admin | API |
| `app/api/admin/email/test/route.ts` | 20 | admin, moderator | Test email sending — 403 for others | API |
| `app/api/admin/analytics/route.ts` | 82 | admin, moderator | Analytics data — 403 for others | API |
| `app/api/admin/deployments/route.ts` | 56 | admin, moderator | Deployment info — 403 for others | API |
| `app/api/flows/active/route.ts` | — | admin, moderator bypass | Flows sandbox check — returns null for non-admins when sandbox active | API |
| `app/api/v1/users/route.ts` | 8, 29-33 | via API key | Users filterable by role param | API |

---

## User-Facing Settings

| File | Lines | Roles | Description | Area |
|------|-------|-------|-------------|------|
| `app/settings/page.tsx` | 324 | student | Student practice profile section | Settings |
| `app/settings/page.tsx` | 324+ | teacher | Teacher teaching profile section | Settings |
| `app/settings/page.tsx` | 358+ | school | School profile section | Settings |
| `app/settings/page.tsx` | 425 | admin, moderator | Theme controls with `isAdmin` prop | Settings |
| `app/settings/my-events/page.tsx` | 24 | teacher, wellness_practitioner, admin | My Events management — redirects unauthorized to `/dashboard` | Settings |
| `app/settings/my-events/actions.ts` | 23 | teacher, wellness_practitioner, admin | Event CRUD server actions — throws "Unauthorized role" | Settings |
| `app/settings/my-courses/page.tsx` | 24 | teacher, wellness_practitioner, admin | My Courses management — redirects unauthorized to `/dashboard` | Settings |
| `app/settings/my-courses/actions.ts` | 23 | teacher, wellness_practitioner, admin | Course CRUD server actions — throws "Unauthorized role" | Settings |
| `app/settings/media/page.tsx` | 34 | teacher, wellness_practitioner, admin | Media library — redirects unauthorized to `/dashboard` | Settings |
| `app/settings/subscriptions/page.tsx` | 44, 48, 72 | student, wellness_practitioner (upgrade CTA); teacher, admin (school CTA) | Different CTAs based on role | Settings |

---

## User-Facing Pages

| File | Lines | Roles | Description | Area |
|------|-------|-------|-------------|------|
| `app/dashboard/page.tsx` | 299 | teacher, admin (without school) | "Register a School" CTA on dashboard | Dashboard |
| `app/dashboard/PostActionsMenu.tsx` | — | admin, moderator | Extra post action options (edit/delete/report) | Dashboard |
| `app/credits/page.tsx` | 68-73 | admin, moderator bypass sandbox; teacher gets extra credit types | Credit hours sandbox redirect + teacher credit types | Credits |
| `app/teaching-hours/page.tsx` | 20-22 | teacher, admin | Teaching hours page — redirects non-teacher to `/credits` | Credits |
| `app/teaching-hours/page.tsx` | 25+ | admin, moderator bypass sandbox | Credit hours sandbox redirect | Credits |
| `app/schools/create/page.tsx` | 30 | teacher, admin | School creation — redirects non-teacher/admin to `/dashboard` | Schools |
| `app/schools/[slug]/settings/layout.tsx` | — | admin, moderator (isAdmin), school owner | School settings — `isAdmin` variable for extra permissions | Schools |

---

## Components with Role Logic

| File | Lines | Roles | Description | Area |
|------|-------|-------|-------------|------|
| `app/components/Header.tsx` | multiple | admin, moderator | Admin link in nav, maintenance indicator, Settings/Admin Settings dropdown items | Component |
| `app/components/Header.tsx` | 600-601 | admin, moderator | Theme toggle `isAdmin` prop — hides when theme locked for non-admins | Component |
| `app/components/ThemeToggle.tsx` | 58, 117 | admin, moderator (via `isAdmin` prop) | Theme cards/inline hidden when theme locked for non-admins | Component |
| `app/components/chat/ChatWidget.tsx` | — | admin, moderator | Chat widget — `isAdmin` changes chat features, maintenance badge | Component |
| `app/components/AnalyticsProvider.tsx` | 39 | all | Uses `member_type || role || 'student'` for analytics tracking | Component |

---

## Server Actions with Role Checks

| File | Lines | Roles | Description | Area |
|------|-------|-------|-------------|------|
| `app/actions/email-templates.ts` | 20 | admin, moderator | Email template CRUD — throws "Forbidden" for others | Action |
| `app/actions/impersonation.ts` | — | admin | Prevents impersonating other admins/mods | Action |
| `app/actions/audit.ts` | 24 | all | Captures `profile.role` as `actor_role` for audit trail | Action |

---

## Summary

| Gate Type | Count | Notes |
|-----------|-------|-------|
| Admin-only pages (layout) | ~20 | Entire `/admin/*` tree |
| Admin-only API routes | 5 | Danger zone, health, migration, bulk delete |
| Admin or moderator API routes | 3 | Analytics, deployments, email test |
| Teacher/WP gated settings | 3 pages + 2 action files | my-events, my-courses, media |
| Role-conditional UI rendering | ~10 locations | Dashboard CTAs, settings sections, theme toggle |
| Middleware role checks | 4 | Maintenance, impersonation, admin paths, page visibility |
| Components with role props | 5 | Header, ThemeToggle, ChatWidget, PostActionsMenu, AnalyticsProvider |
