import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'
import type Stripe from 'stripe'
import type { HandlerResult } from './subscription'

export async function handlePaymentIntent(
  event: Stripe.Event,
): Promise<HandlerResult> {
  const pi = event.data.object as Stripe.PaymentIntent

  const stripe_customer_id =
    typeof pi.customer === 'string'
      ? pi.customer
      : pi.customer?.id ?? null

  const { error } = await getSupabaseService()
    .from('stripe_orders')
    .upsert(
      {
        stripe_id: pi.id,
        stripe_customer_id,
        amount_total: pi.amount,
        currency: pi.currency,
        status: pi.status,
        type: 'one_time',
        metadata: (pi.metadata as Record<string, string>) ?? {},
        stripe_event_id: event.id,
      },
      { onConflict: 'stripe_id' },
    )

  if (error) {
    throw new Error(`stripe_orders upsert failed: ${error.message}`)
  }

  return { status: 'processed' }
}
