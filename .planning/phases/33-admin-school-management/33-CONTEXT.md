# Phase 33: Admin School Management - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Admin inbox School Registrations tab updated with new school data (designations, documents). Admin school detail/review page at /admin/schools/[id]. Approve/reject workflow with email notifications via Resend. "Visit School" button on member profiles for Principal Trainers/Faculty.

</domain>

<decisions>
## Implementation Decisions

### Admin Inbox Tab Update (ADM-01)
- School Registrations tab already exists at app/admin/inbox/SchoolRegistrationsTab.tsx
- Update to show: school name, owner name + email, designations selected, submitted date, status, actions
- Actions: Review (opens school detail), Approve, Reject (with reason modal)

### Admin School Detail Page (ADM-02)
- New page at /admin/schools/[id]
- Read-only review showing all school profile fields
- Uploaded documents (viewable/downloadable links)
- Designations requested with status
- Faculty members listed
- Approve/Reject buttons at top

### Approve Action (ADM-03)
- Set school.status = 'approved', school.approved_at = now(), school.approved_by = admin user id
- Send approval email via Resend to school owner
- Email template: "Your school [name] has been approved on GOYA"

### Reject Action (ADM-04)
- Modal with rejection reason text input
- Set school.status = 'rejected', school.rejection_reason = reason text
- Send rejection email via Resend to school owner
- Email template: "Your school [name] registration requires attention"

### Member Profile Button (ADM-05)
- On public member profile page (/members/[id])
- If user is Principal Trainer or Faculty of an approved school: show "Visit School" button
- Links to /schools/[slug]

### Claude's Discretion
- Exact layout of admin school detail page
- Email template design (follow existing Resend patterns)
- Document viewer/download UX

</decisions>

<code_context>
## Existing Code Insights

### Admin Inbox
- app/admin/inbox/page.tsx — tab structure with 7 tabs
- app/admin/inbox/SchoolRegistrationsTab.tsx — existing tab with basic school data
- Other tabs (EventsTab, CoursesTab) have approve/reject patterns to follow

### Email via Resend
- lib/email/ — existing email infrastructure
- Check existing email templates and Resend send patterns
- Email templates stored in DB (email_templates table)

### Member Profiles
- app/members/[id]/page.tsx — public member profile page
- Need to check school ownership/faculty status and show button

### Admin Pages
- app/admin/ uses AdminShell layout
- Existing detail pages at app/admin/users/[id]/ can be referenced

</code_context>

<specifics>
## Specific Ideas

- Follow existing admin inbox tab patterns for approve/reject
- Reuse Resend email patterns from existing templates
- Document download links from Supabase Storage

</specifics>

<deferred>
## Deferred Ideas

None.

</deferred>
