'use server'

import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { sendEmailFromTemplate } from '@/lib/email/send'

export async function approveSchool(
  schoolId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const service = getSupabaseService()

    // Update school status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (service as any)
      .from('schools')
      .update({
        status: 'approved',
        approved_at: new Date().toISOString(),
        approved_by: adminUser.id,
        rejection_reason: null,
      })
      .eq('id', schoolId)

    if (updateError) {
      console.error('[approveSchool] update error:', updateError)
      return { success: false, error: updateError.message }
    }

    // Fetch school + owner profile for email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: school } = await (service as any)
      .from('schools')
      .select('name, slug, owner_id')
      .eq('id', schoolId)
      .single()

    if (school?.owner_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: owner } = await (service as any)
        .from('profiles')
        .select('first_name, email')
        .eq('id', school.owner_id)
        .single()

      if (owner?.email) {
        const firstName = owner.first_name ?? 'there'
        const schoolUrl = `${process.env.NEXT_PUBLIC_BASE_URL ?? ''}/schools/${school.slug ?? schoolId}`

        await sendEmailFromTemplate({
          to: owner.email,
          templateKey: 'school_approved',
          variables: {
            firstName,
            schoolName: school.name ?? 'Your school',
            schoolUrl,
          },
        })
      }
    }

    revalidatePath('/admin/inbox')
    return { success: true }
  } catch (err) {
    console.error('[approveSchool] unexpected error:', err)
    return { success: false, error: String(err) }
  }
}

export async function rejectSchool(
  schoolId: string,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user: adminUser },
    } = await supabase.auth.getUser()

    if (!adminUser) {
      return { success: false, error: 'Not authenticated' }
    }

    const service = getSupabaseService()

    // Update school status
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error: updateError } = await (service as any)
      .from('schools')
      .update({
        status: 'rejected',
        rejection_reason: reason || null,
      })
      .eq('id', schoolId)

    if (updateError) {
      console.error('[rejectSchool] update error:', updateError)
      return { success: false, error: updateError.message }
    }

    // Fetch school + owner profile for email
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: school } = await (service as any)
      .from('schools')
      .select('name, owner_id')
      .eq('id', schoolId)
      .single()

    if (school?.owner_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: owner } = await (service as any)
        .from('profiles')
        .select('first_name, email')
        .eq('id', school.owner_id)
        .single()

      if (owner?.email) {
        const firstName = owner.first_name ?? 'there'

        await sendEmailFromTemplate({
          to: owner.email,
          templateKey: 'school_rejected',
          variables: {
            firstName,
            schoolName: school.name ?? 'Your school',
            reason: reason || 'No reason provided',
          },
        })
      }
    }

    revalidatePath('/admin/inbox')
    return { success: true }
  } catch (err) {
    console.error('[rejectSchool] unexpected error:', err)
    return { success: false, error: String(err) }
  }
}
