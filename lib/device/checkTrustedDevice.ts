import { getSupabaseService } from '@/lib/supabase/service'

/**
 * Checks if a device fingerprint is trusted for a given profile.
 * Uses service-role client (bypasses RLS).
 * Returns true only if a matching row exists AND last_used_at is within 90 days.
 *
 * IMPORTANT: This is the defense-in-depth check. The middleware cookie lock
 * is UX-only — every API route that touches user data must call this function
 * independently (CVE-2025-29927 pattern).
 */
export async function checkTrustedDevice(
  profileId: string,
  fingerprint: string
): Promise<boolean> {
  const supabase = getSupabaseService()
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString()

  const { data } = await supabase
    .from('trusted_devices')
    .select('id')
    .eq('profile_id', profileId)
    .eq('device_fingerprint', fingerprint)
    .gte('last_used_at', ninetyDaysAgo)
    .maybeSingle()

  return Boolean(data)
}
