import 'server-only'
import type Stripe from 'stripe'
import { getSupabaseService } from '@/lib/supabase/service'

export async function handlePrice(
  event:
    | Stripe.PriceCreatedEvent
    | Stripe.PriceUpdatedEvent
    | Stripe.PriceDeletedEvent
): Promise<void> {
  const price = event.data.object

  const type = price.type === 'recurring' ? 'recurring' : 'one_time'
  const interval = price.recurring?.interval ?? null
  const interval_count = price.recurring?.interval_count ?? null

  const { error } = await getSupabaseService()
    .from('stripe_prices')
    .upsert(
      {
        stripe_id: price.id,
        stripe_product_id:
          typeof price.product === 'string' ? price.product : price.product.id,
        currency: price.currency,
        unit_amount: price.unit_amount,
        type,
        interval,
        interval_count,
        active: event.type === 'price.deleted' ? false : price.active,
        metadata: (price.metadata as Record<string, string>) ?? {},
      },
      { onConflict: 'stripe_id' }
    )

  if (error) {
    throw new Error(`stripe_prices upsert failed: ${error.message}`)
  }
}
