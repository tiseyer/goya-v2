import 'server-only'
import { getSupabaseService } from '@/lib/supabase/service'
import type Stripe from 'stripe'
import type { HandlerResult } from './subscription'

export async function handleInvoice(
  event: Stripe.Event,
): Promise<HandlerResult> {
  const invoice = event.data.object as Stripe.Invoice

  const stripe_customer_id =
    typeof invoice.customer === 'string'
      ? invoice.customer
      : (invoice.customer as Stripe.Customer | null)?.id ?? null

  const status_value = event.type === 'invoice.paid' ? 'paid' : 'payment_failed'

  const subscriptionField = invoice.subscription
  const subscription_id =
    typeof subscriptionField === 'string'
      ? subscriptionField
      : subscriptionField
        ? (subscriptionField as Stripe.Subscription).id
        : null

  const { error } = await getSupabaseService()
    .from('stripe_orders')
    .upsert(
      {
        stripe_id: invoice.id,
        stripe_customer_id,
        amount_total: invoice.amount_paid ?? invoice.total,
        currency: invoice.currency,
        status: status_value,
        type: invoice.subscription ? 'recurring' : 'one_time',
        subscription_status: null,
        metadata: { subscription_id },
        stripe_event_id: event.id,
      },
      { onConflict: 'stripe_id' },
    )

  if (error) {
    throw new Error(`stripe_orders upsert failed: ${error.message}`)
  }

  if (event.type === 'invoice.paid') {
    return { status: 'pending_cron' }
  }

  return { status: 'processed' }
}
