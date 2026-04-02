import { getSupabaseService } from '@/lib/supabase/service'

export type ActiveContext =
  | { type: 'personal'; profileId: string }
  | { type: 'school'; schoolId: string; profileId: string }

export interface ContextSchool {
  id: string
  name: string
  slug: string
  logo_url: string | null
  status: string
}

/**
 * Parse the x-active-context header value into a typed ActiveContext.
 * Returns personal context if header is missing, empty, or malformed.
 */
export function parseActiveContext(headerValue: string | null | undefined, profileId: string): ActiveContext {
  if (!headerValue || headerValue === 'personal') {
    return { type: 'personal', profileId }
  }

  if (headerValue.startsWith('school:')) {
    const schoolId = headerValue.slice(7)
    if (schoolId && schoolId.length > 0) {
      return { type: 'school', schoolId, profileId }
    }
  }

  return { type: 'personal', profileId }
}

/**
 * Get all schools where the user is owner or has can_manage=true faculty access.
 * Used to populate the context switcher UI.
 */
export async function getUserSchools(profileId: string): Promise<ContextSchool[]> {
  const service = getSupabaseService() as any

  // Schools where user is owner
  const { data: ownedSchools } = await service
    .from('schools')
    .select('id, name, slug, logo_url, status')
    .eq('owner_id', profileId)
    .in('status', ['approved', 'pending_review'])

  // Schools where user is faculty with can_manage=true
  const { data: managedFaculty } = await service
    .from('school_faculty')
    .select('school_id')
    .eq('profile_id', profileId)
    .eq('can_manage', true)
    .eq('status', 'active')

  const managedSchoolIds = (managedFaculty ?? [])
    .map((f: { school_id: string }) => f.school_id)
    .filter((id: string) => !ownedSchools?.some((s: ContextSchool) => s.id === id))

  let managedSchools: ContextSchool[] = []
  if (managedSchoolIds.length > 0) {
    const { data } = await service
      .from('schools')
      .select('id, name, slug, logo_url, status')
      .in('id', managedSchoolIds)
      .in('status', ['approved', 'pending_review'])
    managedSchools = data ?? []
  }

  return [...(ownedSchools ?? []), ...managedSchools]
}

/**
 * Validate that a user has access to switch to a specific school context.
 */
export async function validateSchoolAccess(profileId: string, schoolId: string): Promise<boolean> {
  const service = getSupabaseService() as any

  // Check if owner
  const { data: school } = await service
    .from('schools')
    .select('id')
    .eq('id', schoolId)
    .eq('owner_id', profileId)
    .maybeSingle()

  if (school) return true

  // Check if can_manage faculty
  const { data: faculty } = await service
    .from('school_faculty')
    .select('id')
    .eq('school_id', schoolId)
    .eq('profile_id', profileId)
    .eq('can_manage', true)
    .eq('status', 'active')
    .maybeSingle()

  return !!faculty
}
