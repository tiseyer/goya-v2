'use server'

import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { sendEmailFromTemplate } from '@/lib/email/send'

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
// Faculty actions (settings-specific — always allow completed schools)
// ---------------------------------------------------------------------------

export async function saveFacultyMember(
  schoolSlug: string,
  data: { profile_id: string; position: string },
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result
  const supabase = await createSupabaseServerActionClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('school_faculty')
    .insert({
      school_id: school.id,
      profile_id: data.profile_id,
      position: data.position,
      status: 'active',
    })

  if (error) return { error: error.message }
  return { success: true }
}

export async function removeFacultyMember(
  schoolSlug: string,
  facultyId: string,
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result
  const supabase = await createSupabaseServerActionClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('school_faculty')
    .delete()
    .eq('id', facultyId)
    .eq('school_id', school.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function toggleFacultyCanManage(
  schoolSlug: string,
  facultyId: string,
  canManage: boolean,
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result
  const supabase = await createSupabaseServerActionClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('school_faculty')
    .update({ can_manage: canManage })
    .eq('id', facultyId)
    .eq('school_id', school.id)

  if (error) return { error: error.message }
  return { success: true }
}

export async function inviteFacultyByEmail(
  schoolSlug: string,
  data: { email: string; position: string },
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result
  const inviteToken = crypto.randomUUID()

  const supabase = await createSupabaseServerActionClient()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from('school_faculty')
    .insert({
      school_id: school.id,
      invited_email: data.email,
      invite_token: inviteToken,
      position: data.position,
      status: 'pending',
    })

  if (error) return { error: error.message }

  // Send invitation email (fire-and-forget — do not fail the action if email fails)
  try {
    const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? ''
    const registerUrl = `${appUrl}/register?school=${schoolSlug}&invite=${inviteToken}`
    await sendEmailFromTemplate({
      to: data.email,
      templateKey: 'faculty_invite',
      variables: {
        schoolName: school.name,
        position: data.position,
        registerUrl,
      },
    })
  } catch (emailErr) {
    console.error('[inviteFacultyByEmail] email send error:', emailErr)
  }

  return { success: true }
}

// ---------------------------------------------------------------------------
// Document actions (settings-specific — always allow completed schools)
// ---------------------------------------------------------------------------

export async function uploadDocument(
  formData: FormData,
): Promise<{ success: true; document: { id: string; file_name: string; file_url: string } } | { error: string }> {
  const schoolSlug = formData.get('schoolSlug') as string
  const designationId = formData.get('designationId') as string
  const documentType = formData.get('documentType') as string
  const file = formData.get('file') as File | null

  if (!schoolSlug || !designationId || !documentType || !file) {
    return { error: 'Missing required fields' }
  }

  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school, userId } = result

  const ext = file.name.split('.').pop() ?? 'bin'
  const timestamp = Date.now()
  const storagePath = `${userId}/${school.id}/${designationId}/${documentType}_${timestamp}.${ext}`

  const supabase = await createSupabaseServerActionClient()
  const arrayBuffer = await file.arrayBuffer()
  const fileBuffer = new Uint8Array(arrayBuffer)

  const { error: uploadError } = await supabase.storage
    .from('school-documents')
    .upload(storagePath, fileBuffer, {
      contentType: file.type,
      upsert: false,
    })

  if (uploadError) return { error: uploadError.message }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: row, error: insertError } = await (supabase as any)
    .from('school_verification_documents')
    .insert({
      school_id: school.id,
      designation_id: designationId,
      document_type: documentType,
      file_url: storagePath,
      file_name: file.name,
      file_size: file.size,
      status: 'pending',
    })
    .select('id, file_name, file_url')
    .single()

  if (insertError) {
    await supabase.storage.from('school-documents').remove([storagePath])
    return { error: insertError.message }
  }

  return { success: true, document: row as { id: string; file_name: string; file_url: string } }
}

export async function deleteDocument(
  schoolSlug: string,
  documentId: string,
): Promise<{ success: true } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { school } = result
  const supabase = await createSupabaseServerActionClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: doc, error: fetchError } = await (supabase as any)
    .from('school_verification_documents')
    .select('id, file_url')
    .eq('id', documentId)
    .eq('school_id', school.id)
    .maybeSingle()

  if (fetchError) return { error: fetchError.message }
  if (!doc) return { error: 'Document not found' }

  const { error: storageError } = await supabase.storage
    .from('school-documents')
    .remove([doc.file_url])

  if (storageError) {
    console.error('[deleteDocument] storage remove error:', storageError.message)
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: deleteError } = await (supabase as any)
    .from('school_verification_documents')
    .delete()
    .eq('id', documentId)
    .eq('school_id', school.id)

  if (deleteError) return { error: deleteError.message }
  return { success: true }
}

// ---------------------------------------------------------------------------
// Stripe billing portal action
// ---------------------------------------------------------------------------

export async function createBillingPortalSession(
  schoolSlug: string,
): Promise<{ url: string } | { error: string }> {
  const result = await getOwnedSchool(schoolSlug)
  if ('error' in result) return result

  const { userId } = result
  const supabase = await createSupabaseServerActionClient()

  // Fetch the Stripe customer ID from the school owner's profile
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile } = await (supabase as any)
    .from('profiles')
    .select('stripe_customer_id')
    .eq('id', userId)
    .maybeSingle()

  if (!profile?.stripe_customer_id) {
    return { error: 'No billing account found for this school' }
  }

  try {
    const { getStripe } = await import('@/lib/stripe/client')
    const session = await getStripe().billingPortal.sessions.create({
      customer: profile.stripe_customer_id,
      return_url: `${process.env.NEXT_PUBLIC_APP_URL}/schools/${schoolSlug}/settings/subscription`,
    })
    return { url: session.url }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create portal session'
    return { error: message }
  }
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
