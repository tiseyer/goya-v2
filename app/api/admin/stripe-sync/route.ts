import 'server-only'
import { NextResponse } from 'next/server'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseService } from '@/lib/supabase/service'

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (!process.env.CRON_SECRET || authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  try {
    const [products, prices, coupons] = await Promise.all([
      syncProducts(),
      syncPrices(),
      syncCoupons(),
    ])
    return NextResponse.json({ ok: true, synced: { products, prices, coupons } })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[stripe-sync] error: ${message}`)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

async function syncProducts(): Promise<number> {
  const stripe = getStripe()
  const supabase = getSupabaseService()
  let count = 0
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const page = await stripe.products.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    for (const product of page.data) {
      const { error } = await supabase.from('stripe_products').upsert(
        {
          stripe_id: product.id,
          name: product.name,
          description: product.description ?? null,
          active: product.active,
          images: product.images ?? [],
          metadata: (product.metadata as Record<string, string>) ?? {},
        },
        { onConflict: 'stripe_id' }
      )
      if (error) console.error(`[stripe-sync] product ${product.id}: ${error.message}`)
      else count++
    }

    hasMore = page.has_more
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id
    }
  }
  return count
}

async function syncPrices(): Promise<number> {
  const stripe = getStripe()
  const supabase = getSupabaseService()
  let count = 0
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const page = await stripe.prices.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    for (const price of page.data) {
      const { error } = await supabase.from('stripe_prices').upsert(
        {
          stripe_id: price.id,
          stripe_product_id: typeof price.product === 'string' ? price.product : (price.product as { id: string }).id,
          currency: price.currency,
          unit_amount: price.unit_amount,
          type: price.type === 'recurring' ? 'recurring' : 'one_time',
          interval: price.recurring?.interval ?? null,
          interval_count: price.recurring?.interval_count ?? null,
          active: price.active,
          metadata: (price.metadata as Record<string, string>) ?? {},
        },
        { onConflict: 'stripe_id' }
      )
      if (error) console.error(`[stripe-sync] price ${price.id}: ${error.message}`)
      else count++
    }

    hasMore = page.has_more
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id
    }
  }
  return count
}

async function syncCoupons(): Promise<number> {
  const stripe = getStripe()
  const supabase = getSupabaseService()
  let count = 0
  let hasMore = true
  let startingAfter: string | undefined

  while (hasMore) {
    const page = await stripe.coupons.list({
      limit: 100,
      ...(startingAfter ? { starting_after: startingAfter } : {}),
    })

    for (const coupon of page.data) {
      const { error } = await supabase.from('stripe_coupons').upsert(
        {
          stripe_coupon_id: coupon.id,
          name: coupon.name ?? coupon.id,
          discount_type:
            coupon.percent_off != null ? 'percent' : coupon.amount_off != null ? 'amount' : 'percent',
          percent_off: coupon.percent_off ?? null,
          amount_off: coupon.amount_off ?? null,
          currency: coupon.currency ?? 'usd',
          duration: coupon.duration,
          duration_in_months: coupon.duration_in_months ?? null,
          max_redemptions: coupon.max_redemptions ?? null,
          times_redeemed: coupon.times_redeemed ?? 0,
          redeem_by: coupon.redeem_by ? new Date(coupon.redeem_by * 1000).toISOString() : null,
          valid: coupon.valid,
          metadata: (coupon.metadata as Record<string, string>) ?? {},
        },
        { onConflict: 'stripe_coupon_id' }
      )
      if (error) console.error(`[stripe-sync] coupon ${coupon.id}: ${error.message}`)
      else count++
    }

    hasMore = page.has_more
    if (page.data.length > 0) {
      startingAfter = page.data[page.data.length - 1].id
    }
  }
  return count
}
