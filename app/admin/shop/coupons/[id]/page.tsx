import Link from 'next/link'
import { notFound } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { format } from 'date-fns'
import CouponForm from './CouponForm'
import type { CouponData } from './CouponForm'
import CouponAssignment from './CouponAssignment'

type Params = Promise<{ id: string }>

export default async function CouponDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const isNew = id === 'new'

  const supabase = await createSupabaseServerClient()

  // Fetch all products for product restrictions multi-select
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, slug')
    .order('name')

  // Fetch all profiles for assignment dropdown (first 200)
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('id, full_name, email')
    .order('full_name')
    .limit(200)

  if (isNew) {
    return (
      <div className="p-6 lg:p-8">
        <Link
          href="/admin/shop/coupons"
          className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors mb-4"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Coupons
        </Link>

        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Create Coupon</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <CouponForm
              coupon={null}
              isNew={true}
              allProducts={allProducts ?? []}
            />
          </div>
        </div>
      </div>
    )
  }

  // Fetch coupon by uuid id
  const { data: rawCoupon, error: couponError } = await supabase
    .from('stripe_coupons')
    .select('*')
    .eq('id', id)
    .single()

  if (couponError || !rawCoupon) {
    notFound()
  }

  // Cast to CouponData (role_restrictions / product_restrictions not in generated types)
  const coupon: CouponData = {
    id: rawCoupon.id,
    stripe_coupon_id: rawCoupon.stripe_coupon_id,
    name: rawCoupon.name,
    code: rawCoupon.code,
    discount_type: rawCoupon.discount_type as CouponData['discount_type'],
    percent_off: rawCoupon.percent_off ? Number(rawCoupon.percent_off) : null,
    amount_off: rawCoupon.amount_off,
    currency: rawCoupon.currency,
    duration: rawCoupon.duration,
    duration_in_months: rawCoupon.duration_in_months,
    max_redemptions: rawCoupon.max_redemptions,
    times_redeemed: rawCoupon.times_redeemed,
    redeem_by: rawCoupon.redeem_by,
    valid: rawCoupon.valid,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    role_restrictions: (rawCoupon as any).role_restrictions ?? {},
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    product_restrictions: (rawCoupon as any).product_restrictions ?? {},
  }

  // Fetch redemption history
  const { data: redemptions } = await supabase
    .from('stripe_coupon_redemptions')
    .select('id, user_id, stripe_order_id, redeemed_at')
    .eq('stripe_coupon_id', coupon.stripe_coupon_id)
    .order('redeemed_at', { ascending: false })

  // Fetch user profiles for redemption history
  const userIds = [...new Set((redemptions ?? []).map((r) => r.user_id).filter(Boolean))] as string[]
  const { data: redemptionProfiles } = userIds.length > 0
    ? await supabase.from('profiles').select('id, full_name, email').in('id', userIds)
    : { data: [] }

  const profileMap = new Map(
    (redemptionProfiles ?? []).map((p) => [p.id, p])
  )

  // Fetch order references for redemptions
  const orderIds = [...new Set(
    (redemptions ?? []).map((r) => r.stripe_order_id).filter(Boolean)
  )] as string[]

  const { data: orders } = orderIds.length > 0
    ? await supabase
        .from('stripe_orders')
        .select('id, stripe_id, amount_total')
        .in('stripe_id', orderIds)
    : { data: [] }

  const orderMap = new Map(
    (orders ?? []).map((o) => [o.stripe_id, o])
  )

  // Merge redemptions with profile + order data
  const enrichedRedemptions = (redemptions ?? []).map((r) => ({
    id: r.id,
    user: r.user_id ? profileMap.get(r.user_id) : null,
    order: r.stripe_order_id ? orderMap.get(r.stripe_order_id) : null,
    redeemed_at: r.redeemed_at,
    stripe_order_id: r.stripe_order_id,
  }))

  return (
    <div className="p-6 lg:p-8">
      <Link
        href="/admin/shop/coupons"
        className="inline-flex items-center gap-1.5 text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors mb-4"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        Back to Coupons
      </Link>

      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">{coupon.name}</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left (2/3): CouponForm */}
        <div className="lg:col-span-2">
          <CouponForm
            coupon={coupon}
            isNew={false}
            allProducts={allProducts ?? []}
          />
        </div>

        {/* Right (1/3): Assignment + Redemption History */}
        <div className="space-y-6">
          {/* Assign Coupon Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h2 className="text-sm font-semibold text-[#374151] mb-3">Assign to User</h2>
            <CouponAssignment
              stripeCouponId={coupon.stripe_coupon_id}
              allProfiles={allProfiles ?? []}
            />
          </div>

          {/* Redemption History Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h2 className="text-sm font-semibold text-[#374151] mb-3">
              Usage History
              {enrichedRedemptions.length > 0 && (
                <span className="ml-2 text-xs font-normal text-[#6B7280]">
                  ({enrichedRedemptions.length})
                </span>
              )}
            </h2>

            {enrichedRedemptions.length === 0 ? (
              <p className="text-sm text-[#6B7280]">No redemptions yet.</p>
            ) : (
              <ul className="space-y-3">
                {enrichedRedemptions.map((r) => (
                  <li key={r.id} className="text-sm border-b border-[#F3F4F6] pb-3 last:border-0 last:pb-0">
                    {/* User */}
                    <div className="font-medium text-[#374151]">
                      {r.user ? (
                        <a
                          href={`/admin/users?search=${encodeURIComponent(r.user.email ?? '')}`}
                          className="hover:text-[#1B3A5C] hover:underline"
                        >
                          {r.user.full_name ?? r.user.email ?? 'Unknown user'}
                        </a>
                      ) : (
                        <span className="text-[#6B7280]">Unknown user</span>
                      )}
                    </div>
                    {/* Date */}
                    <div className="text-[#6B7280] text-xs mt-0.5">
                      {r.redeemed_at
                        ? format(new Date(r.redeemed_at), 'MMM d, yyyy h:mm a')
                        : 'Unknown date'}
                    </div>
                    {/* Order */}
                    <div className="text-xs mt-0.5">
                      {r.stripe_order_id && r.order ? (
                        <a
                          href={`/admin/shop/orders/${r.order.id}`}
                          className="text-[#1B3A5C] hover:underline"
                        >
                          Order #{r.order.stripe_id.slice(-8).toUpperCase()}
                          {r.order.amount_total != null && (
                            <> &mdash; ${(r.order.amount_total / 100).toFixed(2)}</>
                          )}
                        </a>
                      ) : (
                        <span className="text-[#9CA3AF]">Manual assignment</span>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
