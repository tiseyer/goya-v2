'use server'

import { createSupabaseServerActionClient } from '@/lib/supabaseServer'

// ---------------------------------------------------------------------------
// Helper: get a school the caller owns (settings — always allow completed)
// ---------------------------------------------------------------------------

interface OwnedSchool {
  id: string
  owner_id: string
  name: string
  slug: string
  status: string
}

async function getOwnedSchool(
  slug: string,
): Promise<{ school: OwnedSchool; userId: string } | { error: string }> {
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school, error } = await (supabase as any)
    .from('schools')
    .select('id, owner_id, name, slug, status')
    .eq('slug', slug)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (error) return { error: error.message }
  if (!school) return { error: 'School not found or you do not own it' }

  return { school: school as OwnedSchool, userId: user.id }
}

// ---------------------------------------------------------------------------
// updateGeneral
// ---------------------------------------------------------------------------

export async function updateGeneral(
  schoolSlug: string,
  data: {
    name: string
    slug: string
    short_bio: string
    bio: string
    established_year: number
  },
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result
  const currentYear = new Date().getFullYear()

  if (!data.name || data.name.trim().length < 3) {
    return { error: 'School name must be at least 3 characters' }
  }
  if (!data.short_bio || data.short_bio.trim().length === 0) {
    return { error: 'Short bio is required' }
  }
  if (data.short_bio.length > 250) {
    return { error: 'Short bio must be 250 characters or fewer' }
  }
  if (!data.bio || data.bio.trim().length < 1000) {
    return { error: 'Full bio must be at least 1000 characters' }
  }
  if (data.bio.length > 5000) {
    return { error: 'Full bio must be 5000 characters or fewer' }
  }
  if (!data.established_year || data.established_year < 1900 || data.established_year > currentYear) {
    return { error: `Established year must be between 1900 and ${currentYear}` }
  }

  // Validate new slug format if it has changed
  const newSlug = data.slug.trim().toLowerCase()
  if (newSlug !== school.slug) {
    if (!/^[a-z0-9-]+$/.test(newSlug)) {
      return { error: 'Slug may only contain lowercase letters, numbers, and hyphens' }
    }
    if (newSlug.length < 3) {
      return { error: 'Slug must be at least 3 characters' }
    }
    // Check uniqueness
    const supabase = await createSupabaseServerActionClient()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: existing } = await (supabase as any)
      .from('schools')
      .select('id')
      .eq('slug', newSlug)
      .maybeSingle()
    if (existing) return { error: 'That slug is already taken' }
  }

  // Determine if re-review is needed
  const nameChanged = data.name.trim() !== school.name
  const slugChanged = newSlug !== school.slug
  const triggerReReview = nameChanged || slugChanged

  const supabase = await createSupabaseServerActionClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('schools')
    .update({
      name: data.name.trim(),
      slug: newSlug,
      short_bio: data.short_bio.trim(),
      bio: data.bio.trim(),
      established_year: data.established_year,
      ...(triggerReReview ? { status: 'pending_review' } : {}),
      updated_at: new Date().toISOString(),
    })
    .eq('id', school.id)

  if (error) return { error: error.message }
  return { success: true }
}

// ---------------------------------------------------------------------------
// updateOnlinePresence
// ---------------------------------------------------------------------------

export async function updateOnlinePresence(
  schoolSlug: string,
  data: {
    website?: string
    instagram?: string
    facebook?: string
    tiktok?: string
    youtube?: string
    video_platform?: 'youtube' | 'vimeo' | null
    video_url?: string
  },
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result

  const hasValue = [data.website, data.instagram, data.facebook, data.tiktok, data.youtube]
    .some(v => v && v.trim().length > 0)

  if (!hasValue) {
    return { error: 'At least one online presence field is required' }
  }

  if (data.video_platform && (!data.video_url || data.video_url.trim().length === 0)) {
    return { error: 'Video URL is required when a platform is selected' }
  }

  const supabase = await createSupabaseServerActionClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('schools')
    .update({
      website: data.website?.trim() ?? null,
      instagram: data.instagram?.trim() ?? null,
      facebook: data.facebook?.trim() ?? null,
      tiktok: data.tiktok?.trim() ?? null,
      youtube: data.youtube?.trim() ?? null,
      video_platform: data.video_platform ?? null,
      video_url: data.video_url?.trim() ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', school.id)

  if (error) return { error: error.message }
  return { success: true }
}

// ---------------------------------------------------------------------------
// updateTeachingInfo
// ---------------------------------------------------------------------------

export async function updateTeachingInfo(
  schoolSlug: string,
  data: {
    practice_styles: string[]
    programs_offered: string[]
    course_delivery_format: 'in_person' | 'online' | 'hybrid'
    lineage: string
    languages: string[]
  },
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result

  if (!data.course_delivery_format) {
    return { error: 'Course delivery format is required' }
  }
  if (data.practice_styles.length > 5) {
    return { error: 'You can select at most 5 practice styles' }
  }
  if (data.languages.length > 3) {
    return { error: 'You can select at most 3 languages' }
  }

  const supabase = await createSupabaseServerActionClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('schools')
    .update({
      practice_styles: data.practice_styles,
      programs_offered: data.programs_offered,
      course_delivery_format: data.course_delivery_format,
      lineage: data.lineage?.trim() ?? null,
      languages: data.languages,
      updated_at: new Date().toISOString(),
    })
    .eq('id', school.id)

  if (error) return { error: error.message }
  return { success: true }
}

// ---------------------------------------------------------------------------
// updateLocation
// ---------------------------------------------------------------------------

export async function updateLocation(
  schoolSlug: string,
  data: {
    location_address: string
    location_city: string
    location_country: string
    location_lat: number
    location_lng: number
    location_place_id: string
  },
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result

  if (!data.location_address || !data.location_city || !data.location_country) {
    return { error: 'Address, city, and country are required' }
  }
  if (!data.location_lat || !data.location_lng || !data.location_place_id) {
    return { error: 'Please select a location from the autocomplete suggestions' }
  }

  const supabase = await createSupabaseServerActionClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('schools')
    .update({
      location_address: data.location_address,
      location_city: data.location_city,
      location_country: data.location_country,
      location_lat: data.location_lat,
      location_lng: data.location_lng,
      location_place_id: data.location_place_id,
      updated_at: new Date().toISOString(),
    })
    .eq('id', school.id)

  if (error) return { error: error.message }
  return { success: true }
}
