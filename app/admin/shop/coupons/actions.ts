'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseService } from '@/lib/supabase/service'

export type CreateCouponData = {
  name: string
  publicCode?: string
  discountType: 'percent' | 'amount' | 'free_product'
  percentOff?: number
  amountOff?: number
  duration: 'forever' | 'once' | 'repeating'
  durationInMonths?: number
  maxRedemptions?: number
  singleUse?: boolean
  redeemBy?: string
  roleRestrictions?: { mode: 'whitelist' | 'blacklist'; roles: string[] }
  productRestrictions?: { mode: 'whitelist' | 'blacklist'; productIds: string[] }
}

export type EditCouponData = {
  name?: string
  metadata?: Record<string, string>
  roleRestrictions?: { mode: 'whitelist' | 'blacklist'; roles: string[] }
  productRestrictions?: { mode: 'whitelist' | 'blacklist'; productIds: string[] }
}

export async function createCoupon(
  data: CreateCouponData
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = getStripe()

    // Build Stripe coupon params (GOYA-local fields are NOT sent to Stripe)
    const stripeParams: Record<string, unknown> = {
      name: data.name,
      duration: data.duration,
    }

    if (data.discountType === 'percent') {
      stripeParams.percent_off = data.percentOff
    } else if (data.discountType === 'amount') {
      stripeParams.amount_off = data.amountOff
      stripeParams.currency = 'usd'
    } else if (data.discountType === 'free_product') {
      // Pitfall 6: free_product type = 100% off coupon in Stripe
      stripeParams.percent_off = 100
    }

    if (data.duration === 'repeating') {
      stripeParams.duration_in_months = data.durationInMonths
    }

    if (data.maxRedemptions) {
      stripeParams.max_redemptions = data.singleUse ? 1 : data.maxRedemptions
    } else if (data.singleUse) {
      stripeParams.max_redemptions = 1
    }

    if (data.redeemBy) {
      stripeParams.redeem_by = Math.floor(new Date(data.redeemBy).getTime() / 1000)
    }

    // Create coupon in Stripe
    const coupon = await stripe.coupons.create(stripeParams as Parameters<typeof stripe.coupons.create>[0])

    // Create promotion code if public code provided
    let promoCode: { id: string } | undefined
    if (data.publicCode) {
      promoCode = await stripe.promotionCodes.create({
        coupon: coupon.id,
        code: data.publicCode,
      })
    }

    // Upsert to stripe_coupons (includes GOYA-local restriction fields per CPN-02)
    const { error } = await getSupabaseService()
      .from('stripe_coupons')
      .upsert(
        {
          stripe_coupon_id: coupon.id,
          stripe_promotion_code_id: promoCode?.id ?? null,
          name: data.name,
          code: data.publicCode ?? null,
          discount_type: data.discountType,
          percent_off:
            data.discountType === 'percent'
              ? data.percentOff ?? null
              : data.discountType === 'free_product'
                ? 100
                : null,
          amount_off: data.discountType === 'amount' ? (data.amountOff ?? null) : null,
          currency: data.discountType === 'amount' ? 'usd' : null,
          duration: data.duration,
          duration_in_months: data.duration === 'repeating' ? (data.durationInMonths ?? null) : null,
          max_redemptions: data.singleUse ? 1 : (data.maxRedemptions ?? null),
          times_redeemed: 0,
          redeem_by: data.redeemBy ?? null,
          valid: true,
          metadata: {},
          // GOYA-local fields — NOT sent to Stripe
          role_restrictions: data.roleRestrictions ?? {},
          product_restrictions: data.productRestrictions ?? {},
        } as Record<string, unknown>,
        { onConflict: 'stripe_coupon_id' }
      )

    if (error) {
      return { success: false, error: `Failed to store coupon: ${error.message}` }
    }

    revalidatePath('/admin/shop/coupons')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}

export async function editCoupon(
  stripeCouponId: string,
  data: EditCouponData
): Promise<{ success: boolean; error?: string }> {
  try {
    const stripe = getStripe()

    // Stripe only accepts name + metadata for coupon updates
    await stripe.coupons.update(stripeCouponId, {
      name: data.name,
      metadata: data.metadata,
    })

    // Build local update object with GOYA-specific fields
    const localUpdate: Record<string, unknown> = {}
    if (data.name !== undefined) localUpdate.name = data.name
    if (data.metadata !== undefined) localUpdate.metadata = data.metadata
    // GOYA-local fields — NOT sent to Stripe
    if (data.roleRestrictions !== undefined) localUpdate.role_restrictions = data.roleRestrictions
    if (data.productRestrictions !== undefined) localUpdate.product_restrictions = data.productRestrictions

    const { error } = await getSupabaseService()
      .from('stripe_coupons')
      .update(localUpdate)
      .eq('stripe_coupon_id', stripeCouponId)

    if (error) {
      return { success: false, error: `Failed to update coupon: ${error.message}` }
    }

    revalidatePath('/admin/shop/coupons')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
