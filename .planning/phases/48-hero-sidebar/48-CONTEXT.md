# Phase 48: Hero + Sidebar - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

ProfileHero with cover image, 120px avatar, name, role badge, intro text, location, languages, action buttons, edit button, completion nudge. ProfileSidebar with membership card, designation badges, connect/message, social icons, quick stats. Two-column responsive layout. Pill + format design tokens.

Requirements: HERO-01 through HERO-06, SIDE-01 through SIDE-04, DES-01 through DES-03

</domain>

<decisions>
## Implementation Decisions

### Hero Design
- Avatar overlap: negative margin-top (-mt-16) from avatar container into hero banner area
- Cover image fallback: solid blue banner (#345c83) when no cover_image_url
- Cover image: absolute positioned, object-cover, with dark overlay (bg-black/30) for text readability
- Language pills: below location, same row as member-since date
- 120px avatar with white ring (ring-4 ring-white) and rounded-full

### Sidebar Design
- Sidebar sticky: sticky top-20 on desktop (follows scroll)
- Social icons: Lucide icons (Globe for website, Instagram, Video for TikTok, Facebook, Youtube)
- Designation badges: small gold/amber pills matching school designation patterns
- Quick stats: simple number + label rows (profile views "—", connections count, events count)

### Layout
- Two-column: main (2/3) + sidebar (1/3) on desktop, stacks on mobile (sidebar below)
- Pill design: rounded-full, bg-[#345c83]/10 text-[#345c83]
- Format pills: green (#10B981) for Online, blue (#3B82F6) for In-Person, purple (#8B5CF6) for Hybrid

### Own Profile Behavior
- Edit profile button in hero (links to /settings)
- Connect + Message hidden on own profile
- Completion nudge banner below hero when score < 100%

### Claude's Discretion
- Exact component prop interfaces
- How to compose the two-column layout (grid or flex)

</decisions>

<code_context>
## From Phase 47
- app/members/[id]/page.tsx — has auth, Promise.all, visibility, passes isOwnProfile + profileCompletion
- lib/members/profileVisibility.ts — deriveProfileVisibility() for map/address gates
- lib/members/constants.ts — PUBLIC_PROFILE_COLUMNS
- lib/dashboard/profileCompletion.ts — computeProfileCompletion()

### Integration Points
- app/members/[id]/components/ — new directory for profile components
- Existing ConnectButton component for connect action
- Existing MessageButton or messaging logic for message action

</code_context>

<specifics>
No specific requirements beyond spec.
</specifics>

<deferred>
None.
</deferred>
