# Phase 4: Google Places Integration Summary

**One-liner:** Format-conditional location fields with Google Places autocomplete, online platform inputs, and lazy-loaded Maps API.

## Completed Tasks

| # | Task | Commit | Key Files |
|---|------|--------|-----------|
| 1 | Create GooglePlacesAutocomplete component | `c11a922` | `app/components/GooglePlacesAutocomplete.tsx`, `lib/types.ts` |
| 2 | Update admin EventForm with format-conditional location | `4b4feb0` | `app/admin/events/components/EventForm.tsx` |
| 3 | Update member form with same logic | `f91730c` | `app/settings/my-events/MyEventsClient.tsx` |
| 4 | TypeScript verification | -- | No errors in changed files |

## Requirements Fulfilled

- **LOC-02**: Online format hides Location, shows Online Platform name + URL fields
- **LOC-03**: In Person / Hybrid shows Google Places Autocomplete for location
- **LOC-04**: Google Maps JS API loaded dynamically only when autocomplete field renders (dynamic import + lazy script tag)
- **LOC-05**: Selected place stores display name, lat, lng in separate payload fields (location, location_lat, location_lng)

## Implementation Details

### GooglePlacesAutocomplete Component
- Singleton lazy loader: script tag injected on first render, promise cached for subsequent mounts
- Falls back to plain text input if API key missing or script load fails
- Uses ref-based callbacks to avoid re-attaching Autocomplete listeners on re-renders
- Exported `PlaceResult` interface for consumers

### Format-Conditional Logic (both forms)
- **Online**: Location field hidden, Online Platform (text) + Platform URL (url) shown via AnimatedField
- **In Person**: Google Places autocomplete shown, online fields hidden
- **Hybrid**: Both location autocomplete AND online platform fields shown
- Coordinates displayed below location field when a place is selected
- Payload nullifies irrelevant fields based on format (e.g., lat/lng nulled for Online)

### Admin EventForm Changes
- Added `useCallback` import, `dynamic` import for GooglePlacesAutocomplete
- New state: `locationLat`, `locationLng`, `onlinePlatformName`, `onlinePlatformUrl`
- `handlePlaceSelect` callback updates location + coordinates
- Payload includes `location_lat`, `location_lng`, `online_platform_name`, `online_platform_url`

### Member Form Changes
- Same pattern as admin form
- Added `AnimatedField` helper component (member form didn't have one)
- Updated `FormValues` interface with new fields
- Updated `buildFormValues()` and parent `handleFormSubmit` payload

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing functionality] Added online_platform fields to Event type**
- **Found during:** Task 1
- **Issue:** `lib/types.ts` Event interface had `location_lat`/`location_lng` but lacked `online_platform_name`/`online_platform_url` even though DB schema (supabase.ts) has them
- **Fix:** Added `online_platform_name?: string | null` and `online_platform_url?: string | null` to Event interface
- **Files modified:** `lib/types.ts`
- **Commit:** `c11a922`

**2. [Rule 2 - Missing functionality] Graceful fallback on script load failure**
- **Found during:** Task 1
- **Issue:** Plan didn't specify error handling for missing API key or script load failure
- **Fix:** Added `loadError` state that renders a plain text input fallback; also reset `loadPromise` on error to allow retry
- **Files modified:** `app/components/GooglePlacesAutocomplete.tsx`
- **Commit:** `c11a922`

## Known Stubs

None. All fields are wired to state and included in submit payloads. Google Places requires `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` env var to function -- without it, the component gracefully falls back to a plain text input.

## Environment Requirement

The `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` environment variable must be set with a Google Maps API key that has the Places API enabled. Without it, the autocomplete degrades to a standard text input.

## Duration

~4 minutes
