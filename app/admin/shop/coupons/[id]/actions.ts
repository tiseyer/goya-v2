'use server'
import 'server-only'
import { revalidatePath } from 'next/cache'
import { getSupabaseService } from '@/lib/supabase/service'

export async function assignCoupon(
  stripeCouponId: string,
  userId: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const supabase = getSupabaseService()

    // Append-only insert — never update rows in stripe_coupon_redemptions
    const { error: insertError } = await supabase
      .from('stripe_coupon_redemptions')
      .insert({
        stripe_coupon_id: stripeCouponId,
        user_id: userId,
        stripe_order_id: null,
        redeemed_at: new Date().toISOString(),
      })

    if (insertError) {
      return { success: false, error: `Failed to assign coupon: ${insertError.message}` }
    }

    // Increment times_redeemed on stripe_coupons
    const { data: coupon } = await supabase
      .from('stripe_coupons')
      .select('times_redeemed')
      .eq('stripe_coupon_id', stripeCouponId)
      .single()

    await supabase
      .from('stripe_coupons')
      .update({ times_redeemed: (coupon?.times_redeemed ?? 0) + 1 })
      .eq('stripe_coupon_id', stripeCouponId)

    revalidatePath('/admin/shop/coupons')
    return { success: true }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return { success: false, error: message }
  }
}
