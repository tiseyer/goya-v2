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

  try {
    await getStripe().products.update(stripeProductId, { active: newIsActive })
  } catch (err) {
    throw new Error(`Stripe sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

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

        try {
          await getStripe().products.update(stripeProductId, { active: newIsActive })
        } catch (err) {
          throw new Error(`Stripe sync failed for ${productId}: ${err instanceof Error ? err.message : 'Unknown error'}`)
        }
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

  try {
    await getStripe().products.update(stripeProductId, { active: false })
  } catch (err) {
    throw new Error(`Stripe sync failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  revalidatePath('/admin/shop/products')
}

/**
 * Insert a new product row into the GOYA products table.
 * Returns the real UUID assigned by Postgres (gen_random_uuid()).
 * This must be called BEFORE createProduct so that createProduct's
 * products.update({ stripe_product_id }) finds a real row to link.
 */
export async function createLocalProduct(data: {
  name: string
  description: string
  priceCents: number
  priceType: 'one_time' | 'recurring'
  imagePath?: string
}): Promise<{ productId: string }> {
  const slug =
    data.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '') +
    '-' +
    Date.now()

  const priceDisplay =
    data.priceType === 'recurring'
      ? `$${(data.priceCents / 100).toFixed(2)}/month`
      : `$${(data.priceCents / 100).toFixed(2)}`

  const { data: row, error } = await getSupabaseService()
    .from('products')
    .insert({
      slug,
      name: data.name,
      full_name: data.name,
      category: 'special' as const,
      price_display: priceDisplay,
      price_cents: data.priceCents,
      image_path: data.imagePath ?? null,
      description: data.description,
      is_active: false,
    })
    .select('id')
    .single()

  if (error) throw new Error(`createLocalProduct supabase error: ${error.message}`)

  revalidatePath('/admin/shop/products')
  return { productId: row.id }
}

/**
 * Create a new product in Stripe, create its initial price, sync to Supabase stripe_products
 * and stripe_prices, then link the Stripe product ID to the local products row.
 * Write-partitioning: Stripe owns product/price data; GOYA owns stripe_product_id link.
 */
export async function createProduct(data: {
  productId: string
  name: string
  description: string
  priceCents: number
  priceType: 'one_time' | 'recurring'
  interval?: 'month' | 'year'
  imagePath?: string
  metadata?: Record<string, string>
  statementDescriptor?: string
  unitLabel?: string
  marketingFeatures?: string[]
}): Promise<void> {
  let stripeProduct;
  let stripePrice;

  try {
    const stripe = getStripe()

    stripeProduct = await stripe.products.create({
      name: data.name,
      description: data.description,
      images: data.imagePath ? [data.imagePath] : [],
      metadata: data.metadata ?? {},
      ...(data.statementDescriptor ? { statement_descriptor: data.statementDescriptor } : {}),
      ...(data.unitLabel ? { unit_label: data.unitLabel } : {}),
      ...(data.marketingFeatures
        ? { marketing_features: data.marketingFeatures.map((f) => ({ name: f })) }
        : {}),
    })

    stripePrice = await stripe.prices.create({
      product: stripeProduct.id,
      unit_amount: data.priceCents,
      currency: 'usd',
      ...(data.priceType === 'recurring' ? { recurring: { interval: data.interval! } } : {}),
    })
  } catch (err) {
    throw new Error(`Stripe product creation failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  const sb = getSupabaseService()

  await sb.from('stripe_products').upsert(
    {
      stripe_id: stripeProduct.id,
      name: stripeProduct.name,
      description: stripeProduct.description ?? null,
      active: stripeProduct.active,
      images: stripeProduct.images,
      metadata: stripeProduct.metadata as Record<string, string>,
    },
    { onConflict: 'stripe_id' },
  )

  await sb.from('stripe_prices').upsert(
    {
      stripe_id: stripePrice.id,
      stripe_product_id: stripeProduct.id,
      currency: 'usd',
      unit_amount: data.priceCents,
      type: data.priceType,
      interval: data.interval ?? null,
      active: true,
    },
    { onConflict: 'stripe_id' },
  )

  await sb.from('products').update({ stripe_product_id: stripeProduct.id }).eq('id', data.productId)

  revalidatePath('/admin/shop/products')
}

/**
 * Edit a product's Stripe-owned fields (name, description, images, metadata, etc.).
 * The webhook will sync the stripe_products row after Stripe confirms the update.
 * Write-partitioning: Stripe owns all fields updated here.
 */
export async function editProduct(
  stripeProductId: string,
  data: {
    name?: string
    description?: string
    images?: string[]
    metadata?: Record<string, string>
    statementDescriptor?: string
    unitLabel?: string
    marketingFeatures?: string[]
  },
): Promise<void> {
  type StripeProductUpdateParams = {
    name?: string
    description?: string
    images?: string[]
    metadata?: Record<string, string>
    statement_descriptor?: string
    unit_label?: string
    marketing_features?: Array<{ name: string }>
  }

  const updateObj: StripeProductUpdateParams = {}
  if (data.name !== undefined) updateObj.name = data.name
  if (data.description !== undefined) updateObj.description = data.description
  if (data.images !== undefined) updateObj.images = data.images
  if (data.metadata !== undefined) updateObj.metadata = data.metadata
  if (data.statementDescriptor !== undefined)
    updateObj.statement_descriptor = data.statementDescriptor
  if (data.unitLabel !== undefined) updateObj.unit_label = data.unitLabel
  if (data.marketingFeatures !== undefined)
    updateObj.marketing_features = data.marketingFeatures.map((f) => ({ name: f }))

  try {
    await getStripe().products.update(stripeProductId, updateObj)
  } catch (err) {
    throw new Error(`Stripe product update failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  revalidatePath('/admin/shop/products')
}

/**
 * Change a product's price by creating a new Stripe Price and archiving the old one.
 * IMMUTABILITY RULE: Never call stripe.prices.update() with a new unit_amount.
 * Flow: create new price → archive old price → sync both to stripe_prices table.
 */
export async function updateProductPrice(
  stripeProductId: string,
  oldPriceId: string,
  newAmountCents: number,
  currency: string,
  type: 'one_time' | 'recurring',
  interval?: 'month' | 'year',
): Promise<void> {
  let newPrice;

  try {
    const stripe = getStripe()

    // 1. Create new Stripe Price
    newPrice = await stripe.prices.create({
      product: stripeProductId,
      unit_amount: newAmountCents,
      currency,
      ...(type === 'recurring' ? { recurring: { interval: interval! } } : {}),
    })

    // 2. Archive old Stripe Price (immutability — NEVER update unit_amount)
    await stripe.prices.update(oldPriceId, { active: false })
  } catch (err) {
    throw new Error(`Stripe price update failed: ${err instanceof Error ? err.message : 'Unknown error'}`)
  }

  const sb = getSupabaseService()

  // 3. Upsert new price row in stripe_prices
  await sb.from('stripe_prices').upsert(
    {
      stripe_id: newPrice.id,
      stripe_product_id: stripeProductId,
      currency,
      unit_amount: newAmountCents,
      type,
      interval: interval ?? null,
      active: true,
    },
    { onConflict: 'stripe_id' },
  )

  // 4. Mark old price inactive in stripe_prices
  await sb
    .from('stripe_prices')
    .update({ active: false })
    .eq('stripe_id', oldPriceId)

  revalidatePath('/admin/shop/products')
}

/**
 * Update product visibility rules (GOYA-owned columns only — no Stripe writes).
 * requires_any_of: user must own at least one of these products to see this product
 * hidden_if_has_any: user who owns any of these will NOT see this product (veto overrides)
 */
export async function updateProductVisibility(
  productId: string,
  requiresAnyOf: string[],
  hiddenIfHasAny: string[],
): Promise<void> {
  await getSupabaseService()
    .from('products')
    .update({ requires_any_of: requiresAnyOf, hidden_if_has_any: hiddenIfHasAny })
    .eq('id', productId)

  revalidatePath('/admin/shop/products')
}
