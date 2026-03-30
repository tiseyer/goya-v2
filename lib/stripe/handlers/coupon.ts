import 'server-only'
import type Stripe from 'stripe'
import { getSupabaseService } from '@/lib/supabase/service'

export async function handleCoupon(
  event:
    | Stripe.CouponCreatedEvent
    | Stripe.CouponUpdatedEvent
    | Stripe.CouponDeletedEvent
): Promise<void> {
  const coupon = event.data.object

  const discount_type =
    coupon.percent_off !== null && coupon.percent_off !== undefined
      ? 'percent'
      : coupon.amount_off !== null && coupon.amount_off !== undefined
        ? 'amount'
        : 'percent' // fallback

  const { error } = await getSupabaseService()
    .from('stripe_coupons')
    .upsert(
      {
        stripe_coupon_id: coupon.id,
        name: coupon.name ?? coupon.id,
        discount_type,
        percent_off: coupon.percent_off ?? null,
        amount_off: coupon.amount_off ?? null,
        currency: coupon.currency ?? 'usd',
        duration: coupon.duration,
        duration_in_months: coupon.duration_in_months ?? null,
        max_redemptions: coupon.max_redemptions ?? null,
        times_redeemed: coupon.times_redeemed ?? 0,
        redeem_by: coupon.redeem_by
          ? new Date(coupon.redeem_by * 1000).toISOString()
          : null,
        valid: event.type === 'coupon.deleted' ? false : coupon.valid,
        metadata: (coupon.metadata as Record<string, string>) ?? {},
      },
      { onConflict: 'stripe_coupon_id' }
    )

  if (error) {
    throw new Error(`stripe_coupons upsert failed: ${error.message}`)
  }
}
