# Roadmap: GOYA v2

## Milestones

- ✅ **v1.0 User Settings** — Phases 1-3 (shipped 2026-03-23)
- 🔄 **v1.1 Connections & Inbox** — Phases 4-7 (in progress)

## Phases

<details>
<summary>✅ v1.0 User Settings (Phases 1-3) — SHIPPED 2026-03-23</summary>

- [x] Phase 1: Dropdown Refactor (1/1 plans) — completed 2026-03-23
- [x] Phase 2: Settings Shell (1/1 plans) — completed 2026-03-23
- [x] Phase 3: Settings Pages (2/2 plans) — completed 2026-03-23

Full archive: `.planning/milestones/v1.0-ROADMAP.md`

</details>

### v1.1 Connections & Inbox

- [x] **Phase 4: Database Foundation** — connections table, RLS policies, migration, wire real Supabase
- [ ] **Phase 5: Profile Page Buttons** — role-aware connect buttons on profile pages
- [ ] **Phase 6: Settings Connections & Inbox** — full Settings > Connections and Settings > Inbox pages
- [ ] **Phase 7: Admin Connections Tab** — admin user detail Connections tab

## Phase Details

### Phase 4: Database Foundation
**Goal**: The connections system is backed by a real Supabase table with correct access control and the existing UI components read from and write to it
**Depends on**: Phase 3 (Settings shell and placeholder pages exist)
**Requirements**: DB-01, DB-02, DB-03, DB-04
**Success Criteria** (what must be TRUE):
  1. A `connections` table exists in Supabase with requester_id, recipient_id, type, status, and timestamps
  2. RLS policies prevent users from reading or writing another user's connections
  3. The migration file is committed to `supabase/migrations/` and the schema is live
  4. ConnectButton and ConnectionsContext no longer touch localStorage; all reads and writes go through Supabase
**Plans**: 2 plans
Plans:
- [x] 04-01-PLAN.md &mdash; Create connections table migration with RLS policies
- [x] 04-02-PLAN.md &mdash; Rewrite ConnectionsContext to use Supabase

### Phase 5: Profile Page Buttons
**Goal**: The button shown on a profile page reflects the correct relationship type based on the viewer's role and the profile owner's role
**Depends on**: Phase 4
**Requirements**: PROF-01, PROF-02, PROF-03, PROF-04
**Success Criteria** (what must be TRUE):
  1. A student visiting a teacher's profile sees "Request Mentorship" instead of "Connect"
  2. A teacher or wellness practitioner visiting a school profile sees "Apply as Faculty"
  3. A teacher visiting a school they own sees "Manage School" (not "Apply as Faculty")
  4. A teacher visiting another teacher's profile sees the standard "Connect" button
**Plans**: TBD (planned during phase execution)
**UI hint**: yes

### Phase 6: Settings Connections & Inbox
**Goal**: Users can manage their full connections and incoming requests from Settings
**Depends on**: Phase 4
**Requirements**: CONN-01, CONN-02, CONN-03, INBOX-01, INBOX-02, INBOX-03, INBOX-04
**Success Criteria** (what must be TRUE):
  1. Settings > Connections shows tabs for My Connections, My Mentors, My Mentees, My Faculty, and My Schools (school owners also see Principal Teacher tab)
  2. Each connection entry shows its current status (pending sent / accepted) and a remove action for accepted connections
  3. Settings > Inbox lists all incoming connection requests with accept and decline actions
  4. Inbox requests can be filtered by type (all / peer / mentorship / faculty)
  5. The notification dropdown "View all" link points to `/settings/inbox`
**Plans**: TBD (planned during phase execution)
**UI hint**: yes

### Phase 7: Admin Connections Tab
**Goal**: Admins can view and manage any user's connections directly from the admin user detail view
**Depends on**: Phase 4
**Requirements**: ADM-01, ADM-02
**Success Criteria** (what must be TRUE):
  1. The admin user detail page has a Connections tab that lists all of that user's connections with type, status, and the other party's name
  2. Admin can remove any connection from the Connections tab without leaving the user detail page
**Plans**: TBD (planned during phase execution)
**UI hint**: yes

## Progress

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Dropdown Refactor | v1.0 | 1/1 | Complete | 2026-03-23 |
| 2. Settings Shell | v1.0 | 1/1 | Complete | 2026-03-23 |
| 3. Settings Pages | v1.0 | 2/2 | Complete | 2026-03-23 |
| 4. Database Foundation | v1.1 | 2/2 | Complete | 2026-03-23 |
| 5. Profile Page Buttons | v1.1 | 0/? | Not started | - |
| 6. Settings Connections & Inbox | v1.1 | 0/? | Not started | - |
| 7. Admin Connections Tab | v1.1 | 0/? | Not started | - |
