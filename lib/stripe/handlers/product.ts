import 'server-only'
import type Stripe from 'stripe'
import { getSupabaseService } from '@/lib/supabase/service'

export async function handleProduct(
  event:
    | Stripe.ProductCreatedEvent
    | Stripe.ProductUpdatedEvent
    | Stripe.ProductDeletedEvent
): Promise<void> {
  const product = event.data.object

  const { error } = await getSupabaseService()
    .from('stripe_products')
    .upsert(
      {
        stripe_id: product.id,
        name: product.name,
        description: product.description ?? null,
        active: event.type === 'product.deleted' ? false : product.active,
        images: product.images ?? [],
        metadata: (product.metadata as Record<string, string>) ?? {},
      },
      { onConflict: 'stripe_id' }
    )

  if (error) {
    throw new Error(`stripe_products upsert failed: ${error.message}`)
  }
}
