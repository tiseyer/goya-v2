'use server'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseService } from '@/lib/supabase/service'

export async function approveUpgradeRequest(
  requestId: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (serviceClient as any)
    .from('upgrade_requests')
    .select('id, user_id, stripe_payment_intent_id, status')
    .eq('id', requestId)
    .single()

  if (!request || request.status !== 'pending') {
    return { success: false, error: 'Request not found or already reviewed' }
  }

  // 3. Load profile
  const { data: profile } = await serviceClient
    .from('profiles')
    .select('stripe_customer_id, full_name, email')
    .eq('id', request.user_id)
    .single()

  if (!profile?.stripe_customer_id) {
    return { success: false, error: 'User has no Stripe customer ID' }
  }

  // 4. Capture payment
  try {
    await getStripe().paymentIntents.capture(request.stripe_payment_intent_id)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to capture payment'
    return { success: false, error: message }
  }

  // 5. Create subscription
  let subscription: { id: string }
  try {
    subscription = await getStripe().subscriptions.create({
      customer: profile.stripe_customer_id,
      items: [{ price: 'price_1TE4kfDLfij4i9P9sUpSD2Si' }],
      metadata: { goya_user_id: request.user_id },
    })
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create subscription'
    return { success: false, error: message }
  }

  // 6. Update role to teacher
  await serviceClient
    .from('profiles')
    .update({ role: 'teacher' })
    .eq('id', request.user_id)

  // 7. Update request record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any)
    .from('upgrade_requests')
    .update({
      status: 'approved',
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
      stripe_subscription_id: subscription.id,
    })
    .eq('id', requestId)

  // 8. Notify user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from('notifications').insert({
    user_id: request.user_id,
    type: 'teacher_upgrade_approved',
    title: 'Your upgrade was approved!',
    body: 'Congratulations! Your teacher upgrade has been approved. Your Teacher Membership is now active.',
    link: '/settings/subscriptions',
    actor_id: user.id,
  })

  // 9. Revalidate
  revalidatePath('/admin/inbox')

  return { success: true }
}

export async function rejectUpgradeRequest(
  requestId: string,
  rejectionReason: string,
): Promise<{ success: boolean; error?: string }> {
  // 1. Auth guard — require admin role
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Unauthorized' }

  const serviceClient = getSupabaseService()
  const { data: adminProfile } = await serviceClient
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!adminProfile || adminProfile.role !== 'admin') {
    return { success: false, error: 'Unauthorized' }
  }

  // 2. Load request
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: request } = await (serviceClient as any)
    .from('upgrade_requests')
    .select('id, user_id, stripe_payment_intent_id, status')
    .eq('id', requestId)
    .single()

  if (!request || request.status !== 'pending') {
    return { success: false, error: 'Request not found or already reviewed' }
  }

  // 3. Cancel payment intent (releases authorization — no charge to user)
  try {
    await getStripe().paymentIntents.cancel(request.stripe_payment_intent_id)
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to cancel payment intent'
    return { success: false, error: message }
  }

  // 4. Update request record
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any)
    .from('upgrade_requests')
    .update({
      status: 'rejected',
      rejection_reason: rejectionReason.trim() || null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq('id', requestId)

  // 5. Notify user
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from('notifications').insert({
    user_id: request.user_id,
    type: 'teacher_upgrade_rejected',
    title: 'Your upgrade request was not approved',
    body: rejectionReason.trim()
      ? `Your teacher upgrade request was not approved: ${rejectionReason.trim()}`
      : 'Your teacher upgrade request was not approved. Please contact support for details.',
    link: '/settings/subscriptions',
    actor_id: user.id,
  })

  // 6. Revalidate
  revalidatePath('/admin/inbox')

  return { success: true }
}
