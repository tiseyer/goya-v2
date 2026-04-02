import type { Profile } from '@/lib/types'

export interface ProfileVisibility {
  showMap: boolean
  showAddress: boolean       // city + country text
  showFullAddress: boolean   // precise location (future use)
}

/**
 * Derives what location/map data is safe to show on a public profile.
 * Rules (from v1.18 spec):
 * - Students: never show map or full address; city+country text is OK
 * - Online-only: never show map or full address
 * - In-person/hybrid non-students with coordinates: show map + full address
 *
 * CRITICAL: This function runs SERVER-SIDE only. Never derive visibility on the client.
 */
export function deriveProfileVisibility(
  profile: Pick<Profile, 'role' | 'practice_format' | 'location_lat' | 'location_lng'>,
): ProfileVisibility {
  const isStudent = profile.role === 'student'
  const isOnlineOnly = profile.practice_format === 'online'
  const hasCoordinates = profile.location_lat != null && profile.location_lng != null

  // Students and online-only profiles: no map pin, no precise address
  const showMap = !isStudent && !isOnlineOnly && hasCoordinates
  // City + country text is safe to show for all roles (it's what they entered themselves)
  const showAddress = true
  // Full address (precise coordinates) only when map is shown
  const showFullAddress = showMap

  return { showMap, showAddress, showFullAddress }
}
