'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { getStripe } from '@/lib/stripe/client'

export async function createPortalSession(stripeCustomerId: string): Promise<{ url: string }> {
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const session = await getStripe().billingPortal.sessions.create({
    customer: stripeCustomerId,
    return_url: `${process.env.NEXT_PUBLIC_APP_URL}/settings/subscriptions`,
  })

  return { url: session.url }
}

export async function softDeleteDesignation(designationId: string): Promise<void> {
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await supabase
    .from('user_designations')
    .update({ deleted_at: new Date().toISOString(), deleted_by: user.id })
    .eq('id', designationId)
    .eq('user_id', user.id)   // RLS double-check in query too
    .is('deleted_at', null)    // Only soft-delete active rows

  if (error) throw new Error(`Failed to delete designation: ${error.message}`)

  revalidatePath('/settings/subscriptions')
}
