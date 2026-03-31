# Requirements: GOYA v2

**Defined:** 2026-03-31
**Core Value:** Members stay professionally connected, credentialed, and engaged through a single trusted platform.

## v1.14 Requirements

Requirements for School Owner System milestone. Each maps to roadmap phases.

### Database Foundation

- [ ] **DB-01**: Schools table extended with bio, video, practice_styles, programs, delivery format, lineage, languages, insurance, onboarding fields
- [ ] **DB-02**: school_designations table with designation type, Stripe subscription/payment tracking, status workflow
- [ ] **DB-03**: school_faculty table with position, principal_trainer flag, invited_email for non-members
- [ ] **DB-04**: school_verification_documents table with document type, designation link, file storage
- [ ] **DB-05**: Profiles table extended with principal_trainer_school_id and faculty_school_ids
- [ ] **DB-06**: RLS policies: owner CRUD own school, public SELECT approved, admin/mod full access
- [ ] **DB-07**: TypeScript types regenerated and tsc --noEmit passes

### Interest & Entry Points

- [ ] **INT-01**: Dashboard right sidebar widget for teachers without a school — CTA to /schools/create
- [ ] **INT-02**: Subscriptions page callout below teacher subscription card — CTA to register school
- [ ] **INT-03**: Add-Ons page featured banner for teachers — CTA to register school
- [ ] **INT-04**: All entry points role-gated to teachers with no principal_trainer_school_id

### Registration Flow

- [ ] **REG-01**: School name + auto-generated slug with uniqueness check at /schools/create step 1
- [ ] **REG-02**: Designation selection step showing 8 products as cards with prices and running total
- [ ] **REG-03**: Stripe Checkout session with annual subscription + signup fee per selected designation
- [ ] **REG-04**: Post-payment: school record created with status='pending', school_designations created
- [ ] **REG-05**: Redirect to onboarding flow after successful payment

### Onboarding Flow

- [ ] **ONB-01**: Welcome step with instructions and time estimate
- [ ] **ONB-02**: Basic info step: school name (pre-filled), short bio, full bio, established year
- [ ] **ONB-03**: Online presence step: website + social links with at-least-one validation
- [ ] **ONB-04**: Video introduction step: YouTube/Vimeo toggle + URL (optional)
- [ ] **ONB-05**: Teaching info step: practice styles, programs, delivery format, lineage, languages
- [ ] **ONB-06**: Location step with Google Places autocomplete (conditional on in-person/hybrid)
- [ ] **ONB-07**: Document upload step per designation: business registration, qualification cert, insurance
- [ ] **ONB-08**: Faculty step: search GOYA members, invite non-members by email, assign positions
- [ ] **ONB-09**: Review & submit: summary, set onboarding_completed=true, status='pending_review', admin notification

### School Settings

- [ ] **SET-01**: School Settings link in user dropdown between Settings and Admin Settings (owner only)
- [ ] **SET-02**: Settings shell at /schools/[slug]/settings with collapsible sidebar matching existing pattern
- [ ] **SET-03**: General section: name, slug, bio, established year (name/slug change triggers re-review)
- [ ] **SET-04**: Online Presence section: website, social links, video intro
- [ ] **SET-05**: Teaching Info section: practice styles, programs, delivery format, lineage, languages
- [ ] **SET-06**: Location section with Google Places autocomplete
- [ ] **SET-07**: Faculty section: manage members, assign positions
- [ ] **SET-08**: Designations section: view active, add new designations
- [ ] **SET-09**: Documents section: view/re-upload verification documents
- [ ] **SET-10**: Subscription section: view billing status
- [ ] **SET-11**: Status banner when pending_review

### Admin Management

- [ ] **ADM-01**: Admin inbox School Registrations tab updated with new school data, designations, approve/reject
- [ ] **ADM-02**: Admin school detail/review page at /admin/schools/[id] with all fields and documents
- [ ] **ADM-03**: Approve action: set status='approved', send approval email via Resend
- [ ] **ADM-04**: Reject action: set status='rejected', save reason, send rejection email
- [ ] **ADM-05**: Member profile "Visit School" button for Principal Trainers/Faculty of approved schools

### Public Profile

- [ ] **PUB-01**: Public school profile at /schools/[slug] with hero, bio, teaching info, faculty
- [ ] **PUB-02**: Hero: logo, name, designation badges, location or "Online School"
- [ ] **PUB-03**: Body: about, practice styles, programs, languages, lineage, video (left), sidebar with details + faculty (right)
- [ ] **PUB-04**: Member directory integration: School filter type, school cards with logo and designation badges

### Faculty Invitations

- [ ] **FAC-01**: Invitation email via Resend when owner adds non-member faculty by email
- [ ] **FAC-02**: Email links to /register?school=[slug]&invite=[token]
- [ ] **FAC-03**: Auto-link profile to school faculty on registration with valid invite token

## Future Requirements

### School Enhancements (deferred)

- **SCH-F01**: School analytics dashboard (visitor stats, inquiry tracking)
- **SCH-F02**: School-level course/event listings on school profile
- **SCH-F03**: Student reviews and ratings for schools
- **SCH-F04**: School search with map view and filters

## Out of Scope

| Feature | Reason |
|---------|--------|
| School-to-school networking | Social features between schools are deferred |
| Multi-owner schools | Single owner (Principal Trainer) per school for v1 |
| School billing portal | Schools manage via Stripe Customer Portal, no custom portal |
| Automated document verification | Admin manual review for v1, AI verification deferred |
| School messaging/chat | Use existing DM system between members |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 28 | Pending |
| DB-02 | Phase 28 | Pending |
| DB-03 | Phase 28 | Pending |
| DB-04 | Phase 28 | Pending |
| DB-05 | Phase 28 | Pending |
| DB-06 | Phase 28 | Pending |
| DB-07 | Phase 28 | Pending |
| INT-01 | Phase 29 | Pending |
| INT-02 | Phase 29 | Pending |
| INT-03 | Phase 29 | Pending |
| INT-04 | Phase 29 | Pending |
| REG-01 | Phase 30 | Pending |
| REG-02 | Phase 30 | Pending |
| REG-03 | Phase 30 | Pending |
| REG-04 | Phase 30 | Pending |
| REG-05 | Phase 30 | Pending |
| ONB-01 | Phase 31 | Pending |
| ONB-02 | Phase 31 | Pending |
| ONB-03 | Phase 31 | Pending |
| ONB-04 | Phase 31 | Pending |
| ONB-05 | Phase 31 | Pending |
| ONB-06 | Phase 31 | Pending |
| ONB-07 | Phase 31 | Pending |
| ONB-08 | Phase 31 | Pending |
| ONB-09 | Phase 31 | Pending |
| SET-01 | Phase 32 | Pending |
| SET-02 | Phase 32 | Pending |
| SET-03 | Phase 32 | Pending |
| SET-04 | Phase 32 | Pending |
| SET-05 | Phase 32 | Pending |
| SET-06 | Phase 32 | Pending |
| SET-07 | Phase 32 | Pending |
| SET-08 | Phase 32 | Pending |
| SET-09 | Phase 32 | Pending |
| SET-10 | Phase 32 | Pending |
| SET-11 | Phase 32 | Pending |
| ADM-01 | Phase 33 | Pending |
| ADM-02 | Phase 33 | Pending |
| ADM-03 | Phase 33 | Pending |
| ADM-04 | Phase 33 | Pending |
| ADM-05 | Phase 33 | Pending |
| PUB-01 | Phase 34 | Pending |
| PUB-02 | Phase 34 | Pending |
| PUB-03 | Phase 34 | Pending |
| PUB-04 | Phase 34 | Pending |
| FAC-01 | Phase 35 | Pending |
| FAC-02 | Phase 35 | Pending |
| FAC-03 | Phase 35 | Pending |

**Coverage:**
- v1.14 requirements: 39 total
- Mapped to phases: 39
- Unmapped: 0 ✓

---
*Requirements defined: 2026-03-31*
*Last updated: 2026-03-31 after roadmap creation*
