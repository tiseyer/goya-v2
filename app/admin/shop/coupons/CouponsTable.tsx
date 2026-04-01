'use client'
import { useRouter } from 'next/navigation'

export type CouponRow = {
  id: string
  stripe_coupon_id: string
  name: string
  code: string | null
  discount_type: 'percent' | 'amount' | 'free_product'
  percent_off: number | null
  amount_off: number | null
  currency: string | null
  times_redeemed: number | null
  max_redemptions: number | null
  redeem_by: string | null
  valid: boolean | null
  created_at: string | null
}

function formatDiscount(coupon: CouponRow): string {
  if (coupon.discount_type === 'free_product') return '100% off (Free)'
  if (coupon.discount_type === 'percent' && coupon.percent_off !== null) {
    return `${coupon.percent_off}% off`
  }
  if (coupon.discount_type === 'amount' && coupon.amount_off !== null) {
    const amount = coupon.amount_off / 100
    return `$${amount.toFixed(2)} off`
  }
  return '—'
}

function formatExpiry(redeemBy: string | null): string {
  if (!redeemBy) return 'No expiry'
  return new Date(redeemBy).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

const TYPE_PILL: Record<string, string> = {
  percent: 'bg-purple-100 text-purple-700',
  amount: 'bg-blue-100 text-blue-700',
  free_product: 'bg-emerald-100 text-emerald-700',
}

const TYPE_LABEL: Record<string, string> = {
  percent: 'Percentage',
  amount: 'Fixed Amount',
  free_product: 'Free Product',
}

export default function CouponsTable({ initialCoupons }: { initialCoupons: CouponRow[] }) {
  const router = useRouter()

  if (initialCoupons.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
        <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
        </svg>
        <p className="text-sm font-medium text-[#374151]">No coupons found</p>
        <p className="text-xs text-[#6B7280] mt-1">Try adjusting your filters or create a new coupon.</p>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px]">
          <thead>
            <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Code</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Discount</th>
              <th className="px-4 py-3">Usage</th>
              <th className="px-4 py-3">Expiry</th>
              <th className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#F1F5F9]">
            {initialCoupons.map((coupon) => (
              <tr
                key={coupon.id}
                className="hover:bg-slate-50 transition-colors cursor-pointer"
                onClick={() => router.push(`/admin/shop/coupons/${coupon.stripe_coupon_id}`)}
              >
                {/* Name */}
                <td className="px-4 py-3">
                  <span className="text-sm font-medium text-[#1B3A5C] hover:underline">
                    {coupon.name}
                  </span>
                </td>

                {/* Code */}
                <td className="px-4 py-3">
                  {coupon.code ? (
                    <span className="text-sm font-mono text-[#374151] bg-slate-100 px-2 py-0.5 rounded">
                      {coupon.code}
                    </span>
                  ) : (
                    <span className="text-sm text-[#9CA3AF]">No code</span>
                  )}
                </td>

                {/* Type pill */}
                <td className="px-4 py-3">
                  <span
                    className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${TYPE_PILL[coupon.discount_type] ?? 'bg-slate-100 text-slate-600'}`}
                  >
                    {TYPE_LABEL[coupon.discount_type] ?? coupon.discount_type}
                  </span>
                </td>

                {/* Discount */}
                <td className="px-4 py-3">
                  <span className="text-sm text-[#374151]">{formatDiscount(coupon)}</span>
                </td>

                {/* Usage */}
                <td className="px-4 py-3">
                  <span className="text-sm text-[#374151]">
                    {coupon.times_redeemed ?? 0}
                    {coupon.max_redemptions !== null && ` / ${coupon.max_redemptions}`}
                  </span>
                </td>

                {/* Expiry */}
                <td className="px-4 py-3">
                  <span className="text-sm text-[#6B7280]">{formatExpiry(coupon.redeem_by)}</span>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  {coupon.valid ? (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">
                      Active
                    </span>
                  ) : (
                    <span className="inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-100 text-red-700">
                      Expired
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
