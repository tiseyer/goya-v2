---
title: "GOYA Documentation Index"
last_updated: "2026-03-31"
---

# GOYA Documentation

Comprehensive documentation for the GOYA v2 platform, organized by audience.

## Admin (15 pages)

Documentation for platform administrators with full system access.

| Page | Description |
|------|-------------|
| [Admin Panel Overview](admin/overview.md) | How to access the admin panel, sidebar navigation, key features |
| [Inbox](admin/inbox.md) | All 7 inbox tabs, approval workflows, badge counts, status meanings |
| [Users](admin/users.md) | User management, search/filter, role badges, detail pages |
| [Events](admin/events.md) | Event management, GOYA vs Member types, status workflow, audit log |
| [Courses](admin/courses.md) | Course management, type badges, status filter, soft delete, audit log |
| [Media Library](admin/media-library.md) | Media management (in development) |
| [Shop](admin/shop.md) | Products, Orders, and Coupons management |
| [Analytics](admin/analytics.md) | Shop analytics, revenue metrics, CSV export |
| [System Settings](admin/settings.md) | Site configuration, maintenance mode, health checks |
| [Flows](admin/flows.md) | Automation flow builder, templates, analytics |
| [Chatbot](admin/chatbot.md) | Mattea configuration, FAQ, conversations, API connections |
| [API Keys](admin/api-keys.md) | API key management, third-party keys, endpoint docs |
| [Audit Log](admin/audit-log.md) | System audit trail, filtering, export |
| [Credits](admin/credits.md) | Credit requirements dashboard, member credit tracking |
| [Verification](admin/verification.md) | Teacher verification queue, document review |

## Moderator (6 pages)

Guides for moderators who review content and manage community quality.

| Page | Description |
|------|-------------|
| [Moderator Role Overview](moderator/overview.md) | What moderators can and can't do, how to access the admin panel |
| [Verification Guide](moderator/verification-guide.md) | Step-by-step teacher verification process |
| [Event Review](moderator/event-review.md) | Reviewing and approving/rejecting member-submitted events |
| [Course Review](moderator/course-review.md) | Reviewing and approving/rejecting member-submitted courses |
| [Inbox Guide](moderator/inbox-guide.md) | Using the admin inbox as a moderator |
| [Support Tickets](moderator/support-tickets.md) | Handling escalated support tickets from Mattea |

## Teacher (7 pages)

Guides for teachers, wellness practitioners, and school owners.

| Page | Description |
|------|-------------|
| [Teacher Role Overview](teacher/overview.md) | What teachers can do on the platform |
| [Setting Up Your Profile](teacher/profile-setup.md) | Profile settings, avatar, bio, visibility |
| [Submitting Events](teacher/my-events.md) | Full event submission workflow with all statuses |
| [Submitting Courses](teacher/my-courses.md) | Course submission workflow with all statuses |
| [Credits and Teaching Hours](teacher/credits-hours.md) | CPD credits, CE vs Teaching Hours, submission process |
| [Upgrading to Teacher](teacher/upgrade-guide.md) | Upgrade process: certificate upload, payment, approval |
| [Media Library](teacher/media-library.md) | Member media view (in development) |

## Student (6 pages)

Guides for students new to or using the platform.

| Page | Description |
|------|-------------|
| [Student Role Overview](student/overview.md) | What students can do on the platform |
| [Getting Started](student/getting-started.md) | First steps after signing up |
| [Finding Teachers](student/finding-teachers.md) | Using the member directory, connecting with teachers |
| [Events Guide](student/events-guide.md) | Browsing and registering for events |
| [Academy Guide](student/academy-guide.md) | Browsing courses, enrolling, tracking progress |
| [Upgrading to Teacher](student/upgrade-to-teacher.md) | Overview of the teacher upgrade path |

## Developer (10 pages)

Technical documentation for developers working on the codebase.

| Page | Description |
|------|-------------|
| [Developer Guide Overview](developer/overview.md) | Tech stack, prerequisites, getting started |
| [Architecture](developer/architecture.md) | Folder structure, key patterns, component conventions |
| [Database Schema](developer/database-schema.md) | All tables, columns, types, RLS policies |
| [API Reference](developer/api-reference.md) | API auth, rate limiting, route overview |
| [Authentication](developer/authentication.md) | Auth flow, session management, role system, impersonation |
| [Storage](developer/storage.md) | Supabase Storage buckets, upload patterns |
| [Email System](developer/email-system.md) | Resend integration, DB templates, sending emails |
| [Stripe Integration](developer/stripe-integration.md) | Webhook flow, mirror tables, handlers |
| [Deployment](developer/deployment.md) | Vercel deployment, environment variables, cron jobs |
| [Contributing](developer/contributing.md) | Code conventions, adding pages, testing, PR process |
