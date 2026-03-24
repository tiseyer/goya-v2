'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseService } from '@/lib/supabase/service'

/**
 * Toggle a single product's published/draft status.
 * Write-partitioning: GOYA owns is_active (products table); Stripe owns active state.
 */
export async function toggleProductStatus(
  productId: string,
  stripeProductId: string,
  newIsActive: boolean,
): Promise<void> {
  const { error } = await getSupabaseService()
    .from('products')
    .update({ is_active: newIsActive })
    .eq('id', productId)

  if (error) throw new Error(`toggleProductStatus supabase error: ${error.message}`)

  await getStripe().products.update(stripeProductId, { active: newIsActive })

  revalidatePath('/admin/shop/products')
}

/**
 * Bulk action on multiple products.
 * - 'publish': set is_active=true + stripe active=true
 * - 'draft': set is_active=false (Stripe product stays active — just hidden in GOYA)
 * - 'delete': soft-delete each product
 */
export async function bulkProductAction(
  items: Array<{ productId: string; stripeProductId: string }>,
  action: 'publish' | 'draft' | 'delete',
): Promise<void> {
  await Promise.all(
    items.map(async ({ productId, stripeProductId }) => {
      if (action === 'delete') {
        await softDeleteProduct(productId, stripeProductId)
      } else {
        const newIsActive = action === 'publish'
        const { error } = await getSupabaseService()
          .from('products')
          .update({ is_active: newIsActive })
          .eq('id', productId)

        if (error) throw new Error(`bulkProductAction supabase error: ${error.message}`)

        await getStripe().products.update(stripeProductId, { active: newIsActive })
      }
    }),
  )

  revalidatePath('/admin/shop/products')
}

/**
 * Reorder products by updating products.priority based on the supplied ordered array.
 * Write-partitioning: priority is a GOYA-owned column on the products table.
 */
export async function reorderProducts(orderedStripeProductIds: string[]): Promise<void> {
  await Promise.all(
    orderedStripeProductIds.map((id, index) =>
      getSupabaseService()
        .from('products')
        .update({ priority: index + 1 })
        .eq('stripe_product_id', id),
    ),
  )

  revalidatePath('/admin/shop/products')
}

/**
 * Soft-delete a product: mark is_active=false in GOYA + deactivate in Stripe.
 * The row remains visible in the admin table with "Deleted" status.
 */
export async function softDeleteProduct(
  productId: string,
  stripeProductId: string,
): Promise<void> {
  const { error } = await getSupabaseService()
    .from('products')
    .update({ is_active: false })
    .eq('id', productId)

  if (error) throw new Error(`softDeleteProduct supabase error: ${error.message}`)

  await getStripe().products.update(stripeProductId, { active: false })

  revalidatePath('/admin/shop/products')
}
