# Flow Builder v1.0 Requirements

## Schema & Data

- [x] **SCHEMA-01**: Admin can create flows with name, description, status (draft/active/paused/archived), priority, display type, trigger, frequency, and conditions
- [x] **SCHEMA-02**: Admin can define flow steps with position ordering, title, and elements (jsonb array of typed element objects)
- [x] **SCHEMA-03**: Admin can define branches from single-choice elements that route to specific steps based on answer value
- [x] **SCHEMA-04**: User flow responses are recorded with start/complete timestamps, last step for resumability, and per-element answer storage
- [x] **SCHEMA-05**: Flow analytics events are recorded (shown, started, step_completed, completed, skipped, dismissed) with user and step references
- [x] **SCHEMA-06**: Profiles table has birthday date column for condition evaluation
- [x] **SCHEMA-07**: RLS policies enforce admin/moderator write access and user-own-data read/write on flow_responses

## Admin UI — Flow List

- [ ] **ADMIN-01**: Admin can view flows in a tabbed list (Active, Draft, Paused, Archived, Templates) with status badges and condition summaries
- [ ] **ADMIN-02**: Admin can drag-and-drop flows to reorder priority within each tab
- [ ] **ADMIN-03**: Admin can create, duplicate, pause/activate, and archive flows from the list page
- [ ] **ADMIN-04**: Flow list shows completion stats (completed count, in-progress count) from flow_analytics

## Admin UI — Flow Editor

- [ ] **ADMIN-05**: Admin can edit a flow in a three-panel layout (step list, step canvas, settings sidebar)
- [ ] **ADMIN-06**: Admin can add, remove, and drag-reorder steps in the left sidebar
- [ ] **ADMIN-07**: Admin can add elements to a step from a type picker (info_text, short_text, long_text, single_choice, multi_choice, dropdown, image_upload, image, video)
- [ ] **ADMIN-08**: Admin can drag-reorder elements within a step on the canvas
- [ ] **ADMIN-09**: Admin can configure element properties (label, placeholder, required, help_text, element_key) per element type
- [ ] **ADMIN-10**: Admin can map input elements to profile fields via a dropdown selector
- [ ] **ADMIN-11**: Admin can enable branching on single_choice elements and assign target steps per answer option
- [ ] **ADMIN-12**: Admin can configure step-level actions (save to profile, send email, Kit.com tag, Stripe checkout, redirect, trigger flow, success popup, mark complete)
- [ ] **ADMIN-13**: Admin can configure flow settings (display type, modal options, trigger, frequency, conditions) in a collapsible panel
- [ ] **ADMIN-14**: Admin can build conditions using a chip-based builder with AND logic (role, onboarding status, profile picture, subscription, birthday, flow completion)
- [ ] **ADMIN-15**: Admin can preview a flow as a user would see it (all display types, navigation, no data saved)

## Flow Player

- [ ] **PLAYER-01**: User sees active flows rendered in the correct display type (modal, fullscreen, top banner, bottom banner, notification)
- [ ] **PLAYER-02**: Modal and fullscreen flows show progress bar, back/next navigation, and validate required fields
- [ ] **PLAYER-03**: Modal flows respect dismissible setting (X button, backdrop click behavior)
- [ ] **PLAYER-04**: Banner flows show as fixed bars with text, optional CTA, and close button
- [ ] **PLAYER-05**: Notification flows slide in from top-right with icon, title, body, and action button
- [ ] **PLAYER-06**: Choice elements render as Typeform-style pill/card buttons (not native radio/checkbox)
- [ ] **PLAYER-07**: All element types have styled renderers (text inputs, dropdowns, image upload, info text, images, video embeds)
- [ ] **PLAYER-08**: Flow player persists progress on each step completion and resumes from last step on reload
- [ ] **PLAYER-09**: Flow engine evaluates conditions server-side and returns the highest-priority matching flow per trigger

## Actions Engine

- [ ] **ACTION-01**: Step completion triggers configured actions (save_to_profile, send_email, kit_tag, stripe_checkout, redirect, trigger_flow, success_popup, mark_complete)
- [ ] **ACTION-02**: save_to_profile upserts mapped element values to the profiles table
- [ ] **ACTION-03**: kit_tag POSTs to Kit.com API with graceful fallback when KITCOM_API_KEY is missing
- [ ] **ACTION-04**: stripe_checkout creates a Stripe checkout session using existing Stripe integration
- [ ] **ACTION-05**: trigger_flow queues the next flow for the user after current flow completes

## Analytics

- [ ] **ANALYTICS-01**: Admin can view per-flow analytics (shown, started, completed, skipped, dismissed counts and completion rate)
- [ ] **ANALYTICS-02**: Admin can see step drop-off chart showing user progression through each step
- [ ] **ANALYTICS-03**: Analytics support time filters (today, yesterday, this week, this month, this year, custom range)

## User Management

- [ ] **USERMGMT-01**: Admin can view a user's flow interactions (status, started_at, completed_at) on the user edit page
- [ ] **USERMGMT-02**: Admin can reset a user's flow response to force re-display
- [ ] **USERMGMT-03**: Admin can force-assign a flow to a user or mark it complete without the user going through it

## Onboarding Migration

- [ ] **MIGRATE-01**: Three onboarding templates (Student, Teacher, Wellness Practitioner) are seeded with all existing onboarding questions mapped to flow elements
- [ ] **MIGRATE-02**: Templates have correct profile field mappings, role conditions, login trigger, once frequency, and non-dismissible modal display
- [ ] **MIGRATE-03**: Existing hardcoded onboarding pages/routes and middleware redirects are removed after templates are seeded

## Future Requirements (Deferred)

- A/B testing between flow variants
- Public flow sharing / embedding on external sites
- Flow versioning / revision history
- Webhook-triggered flows
- Multi-language / i18n for flow content

## Out of Scope

- Real-time collaborative editing of flows
- Flow marketplace / sharing between GOYA instances
- Custom CSS per flow
- Mobile app native flow player

## Traceability

| REQ-ID | Phase | Status |
|--------|-------|--------|
| SCHEMA-01 | Phase 1 | Pending |
| SCHEMA-02 | Phase 1 | Pending |
| SCHEMA-03 | Phase 1 | Pending |
| SCHEMA-04 | Phase 1 | Pending |
| SCHEMA-05 | Phase 1 | Pending |
| SCHEMA-06 | Phase 1 | Pending |
| SCHEMA-07 | Phase 1 | Pending |
| ADMIN-01 | Phase 3 | Pending |
| ADMIN-02 | Phase 3 | Pending |
| ADMIN-03 | Phase 3 | Pending |
| ADMIN-04 | Phase 3 | Pending |
| ADMIN-05 | Phase 3 | Pending |
| ADMIN-06 | Phase 3 | Pending |
| ADMIN-07 | Phase 3 | Pending |
| ADMIN-08 | Phase 3 | Pending |
| ADMIN-09 | Phase 3 | Pending |
| ADMIN-10 | Phase 3 | Pending |
| ADMIN-11 | Phase 3 | Pending |
| ADMIN-12 | Phase 3 | Pending |
| ADMIN-13 | Phase 3 | Pending |
| ADMIN-14 | Phase 3 | Pending |
| ADMIN-15 | Phase 3 | Pending |
| PLAYER-01 | Phase 5 | Pending |
| PLAYER-02 | Phase 5 | Pending |
| PLAYER-03 | Phase 5 | Pending |
| PLAYER-04 | Phase 5 | Pending |
| PLAYER-05 | Phase 5 | Pending |
| PLAYER-06 | Phase 5 | Pending |
| PLAYER-07 | Phase 5 | Pending |
| PLAYER-08 | Phase 5 | Pending |
| PLAYER-09 | Phase 4 | Pending |
| ACTION-01 | Phase 4 | Pending |
| ACTION-02 | Phase 4 | Pending |
| ACTION-03 | Phase 4 | Pending |
| ACTION-04 | Phase 4 | Pending |
| ACTION-05 | Phase 4 | Pending |
| ANALYTICS-01 | Phase 6 | Pending |
| ANALYTICS-02 | Phase 6 | Pending |
| ANALYTICS-03 | Phase 6 | Pending |
| USERMGMT-01 | Phase 6 | Pending |
| USERMGMT-02 | Phase 6 | Pending |
| USERMGMT-03 | Phase 6 | Pending |
| MIGRATE-01 | Phase 7 | Pending |
| MIGRATE-02 | Phase 7 | Pending |
| MIGRATE-03 | Phase 7 | Pending |
