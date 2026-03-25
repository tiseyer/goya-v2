import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'
import type Stripe from 'stripe'
import type { HandlerResult } from './subscription'

export async function handleCheckoutSession(
  event: Stripe.CheckoutSessionCompletedEvent,
): Promise<HandlerResult> {
  const session = event.data.object as Stripe.Checkout.Session

  // Only handle teacher upgrade sessions
  if (session.metadata?.type !== 'teacher_upgrade') {
    return { status: 'processed' }
  }

  const userId = session.metadata.user_id
  const certificateUrls: string[] = JSON.parse(session.metadata.certificate_urls ?? '[]')
  const paymentIntentId = typeof session.payment_intent === 'string'
    ? session.payment_intent
    : session.payment_intent?.id ?? null

  const supabase = getSupabaseService()

  // Insert upgrade_request — status defaults to 'pending' per DB schema
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: insertError } = await (supabase as any)
    .from('upgrade_requests')
    .insert({
      user_id: userId,
      certificate_urls: certificateUrls,
      stripe_payment_intent_id: paymentIntentId,
    })

  if (insertError) {
    throw new Error(`upgrade_requests insert failed: ${insertError.message}`)
  }

  // Notify all admins (UPG-09)
  const { data: admins } = await supabase
    .from('profiles')
    .select('id')
    .eq('role', 'admin')

  if (admins && admins.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).from('notifications').insert(
      admins.map((admin: { id: string }) => ({
        user_id: admin.id,
        type: 'teacher_upgrade_submitted',
        title: 'New Teacher Upgrade Request',
        body: 'A member has submitted a teacher upgrade request for review.',
        link: '/admin/inbox',
        actor_id: userId,
      }))
    )
  }

  return { status: 'processed' }
}
