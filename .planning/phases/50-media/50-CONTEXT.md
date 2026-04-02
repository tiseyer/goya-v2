# Phase 50: Media - Context

**Gathered:** 2026-04-02
**Status:** Ready for planning

<domain>
## Phase Boundary

Intro video facade embed, Mapbox GL JS inline map (privacy-gated server-side), events carousel, courses carousel on profile pages.

Requirements: CONT-01, MED-01, MED-02, MED-03, MED-04

</domain>

<decisions>
## Implementation Decisions

### Video Embed (CONT-01)
- Facade pattern: show thumbnail + play overlay, load iframe only on click
- YouTube: thumbnail from img.youtube.com/vi/{id}/maxresdefault.jpg
- Vimeo: fetch thumbnail from oEmbed API or use a placeholder
- Field: youtube_intro_url on profiles table
- Label: "Introduction" or "Meet [name]"
- Hidden entirely when youtube_intro_url is null
- 16:9 aspect ratio container

### Mapbox Map (MED-01, MED-02)
- Interactive Mapbox GL JS (user chose this over static image)
- Use existing mapbox-gl@3.20.0 (already installed)
- dynamic({ ssr: false }) — mapbox-gl is SSR-hostile
- Single marker at location_lat/location_lng
- Height: 240px, rounded corners (rounded-xl)
- interactive: false (no zoom/pan — just display)
- PRIVACY: Map hidden for students AND online-only profiles (practice_format='online')
- Privacy enforced server-side via deriveProfileVisibility() from Phase 47
- Mapbox token: use NEXT_PUBLIC_MAPBOX_TOKEN env var

### Events Carousel (MED-03)
- Reuse HorizontalCarousel + EventCard from app/dashboard/components/
- Data: fetchMemberEvents(profileId) from lib/members/queries.ts (Phase 47)
- Section: "Upcoming events" + "View all events →"
- Hidden when no events
- Show for Teacher, School, Wellness Practitioner profiles

### Courses Carousel (MED-04)
- Reuse HorizontalCarousel + CourseCard from app/dashboard/components/
- Data: fetchMemberCourses(profileId) from lib/members/queries.ts (Phase 47)
- Section: "Courses & classes" + "View all →"
- Hidden when no courses
- Show for Teacher, School, Wellness Practitioner profiles

### Claude's Discretion
- Vimeo thumbnail extraction approach (oEmbed vs placeholder)
- Whether to create a shared VideoFacade component or inline in ProfileVideo
- Exact marker style for Mapbox (default blue pin is fine)

</decisions>

<code_context>
## Existing Assets
- mapbox-gl@3.20.0 installed, working pattern in app/members/MapPanel.tsx
- app/dashboard/components/HorizontalCarousel.tsx
- app/dashboard/components/EventCard.tsx
- app/dashboard/components/CourseCard.tsx (may need to check if this exists on develop)
- lib/members/queries.ts — fetchMemberEvents(), fetchMemberCourses()
- lib/members/profileVisibility.ts — deriveProfileVisibility() returns showMap flag
- Existing VideoRenderer.tsx and lesson player patterns for iframe embed reference

### Integration Points
- app/members/[id]/page.tsx — wire media sections into left column below content
- app/members/[id]/components/ — new ProfileVideo.tsx, ProfileMap.tsx

</code_context>

<specifics>
No additional specifics.
</specifics>

<deferred>
None — final phase.
</deferred>
