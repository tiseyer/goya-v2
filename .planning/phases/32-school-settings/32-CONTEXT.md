# Phase 32: School Settings - Context

**Gathered:** 2026-03-31
**Status:** Ready for planning
**Mode:** Auto-generated (autonomous mode)

<domain>
## Phase Boundary

Full settings area at /schools/[slug]/settings with a collapsible left sidebar (same design pattern as user settings and admin settings). School Settings link in user dropdown between Settings and Admin Settings (owner only). 8 sidebar sections: General, Online Presence, Teaching Info, Location, Faculty, Designations, Documents, Subscription. Status banner when pending_review. Name/slug changes trigger re-review.

</domain>

<decisions>
## Implementation Decisions

### Navigation
- "School Settings" link in Header.tsx user dropdown, between personal Settings and Admin Settings
- Only shown to users who own a school (principal_trainer_school_id is not null)
- Links to /schools/[slug]/settings where slug comes from the user's school

### Settings Shell
- Collapsible left sidebar matching SettingsShell / AdminShell pattern
- 8 sections: General, Online Presence, Teaching Info, Location, Faculty, Designations, Documents, Subscription
- Each section is its own sub-route or tab

### Section Details
- **General**: name, slug, short bio, full bio, established year. Name/slug change triggers re-review (set status back to pending_review)
- **Online Presence**: website, Instagram, Facebook, TikTok, YouTube URLs
- **Teaching Info**: practice styles, programs, delivery format, lineage, languages
- **Location**: Google Places autocomplete (same as onboarding step 6)
- **Faculty**: manage faculty members, assign positions (reuse onboarding step 8 patterns)
- **Designations**: view active designations, add new ones (future: Stripe checkout for additional)
- **Documents**: view/re-upload verification documents per designation
- **Subscription**: view school subscription status, billing info (read-only, links to Stripe portal)

### Status Banner
- When school.status = 'pending_review': show prominent banner at top of settings
- "Your school is currently under review. This can take up to 1 week."

### Re-review Logic
- Changing school name or slug sets status back to 'pending_review'
- Other field changes don't trigger re-review

### Claude's Discretion
- Exact sidebar component implementation (reuse SettingsShell or create SchoolSettingsShell)
- Sub-route structure vs tabs
- Form save patterns (auto-save vs explicit save button)

</decisions>

<code_context>
## Existing Code Insights

### Settings Shell Pattern
- app/settings/ uses SettingsShell component
- app/admin/ uses AdminShell component
- Both have collapsible sidebar with navigation items
- Check app/components/SettingsShell.tsx or similar

### Header Dropdown
- app/components/Header.tsx has UserMenu component
- Conditional rendering based on role
- Settings link at line ~536, Admin Settings at line ~540

### Server Actions
- Onboarding actions at app/schools/[slug]/onboarding/actions.ts can be reused/referenced
- Same field types and validation patterns

### School Data
- schools table has all fields from Phase 28
- school_designations, school_faculty, school_verification_documents tables
- Types regenerated in types/supabase.ts

</code_context>

<specifics>
## Specific Ideas

- Match existing SettingsShell/AdminShell exactly for sidebar pattern
- Reuse server action patterns from onboarding
- Google Places for location section

</specifics>

<deferred>
## Deferred Ideas

- "Add New Designation" checkout flow in Designations section (basic view for now)
- Subscription management beyond Stripe portal link

</deferred>
