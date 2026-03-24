import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'
import type Stripe from 'stripe'

export type HandlerResult = { status: 'processed' | 'pending_cron' }

export async function handleSubscription(
  event: Stripe.Event,
): Promise<HandlerResult> {
  const sub = event.data.object as Stripe.Subscription

  const stripe_customer_id =
    typeof sub.customer === 'string' ? sub.customer : (sub.customer as Stripe.Customer).id

  const firstItem = sub.items?.data?.[0]
  const stripe_price_id = firstItem?.price?.id ?? null

  const productField = firstItem?.price?.product
  const stripe_product_id =
    typeof productField === 'string'
      ? productField
      : productField && typeof productField === 'object'
        ? (productField as Stripe.Product).id
        : null

  const { error } = await getSupabaseService()
    .from('stripe_orders')
    .upsert(
      {
        stripe_id: sub.id,
        stripe_customer_id,
        stripe_price_id,
        stripe_product_id,
        amount_total: firstItem?.price?.unit_amount ?? null,
        currency: sub.currency,
        status: sub.status,
        type: 'recurring',
        subscription_status: sub.status,
        cancel_at_period_end: sub.cancel_at_period_end ?? false,
        current_period_start: firstItem?.current_period_start
          ? new Date(firstItem.current_period_start * 1000).toISOString()
          : null,
        current_period_end: firstItem?.current_period_end
          ? new Date(firstItem.current_period_end * 1000).toISOString()
          : null,
        canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
        metadata: (sub.metadata as Record<string, string>) ?? {},
        stripe_event_id: event.id,
      },
      { onConflict: 'stripe_id' },
    )

  if (error) {
    throw new Error(`stripe_orders upsert failed: ${error.message}`)
  }

  if (event.type === 'customer.subscription.created') {
    return { status: 'processed' }
  }

  return { status: 'pending_cron' }
}
