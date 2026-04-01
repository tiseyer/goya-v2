'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createCoupon, editCoupon } from '@/app/admin/shop/coupons/actions'

export type CouponData = {
  id: string
  stripe_coupon_id: string
  name: string
  code: string | null
  discount_type: 'percent' | 'amount' | 'free_product'
  percent_off: number | null
  amount_off: number | null
  currency: string | null
  duration: 'forever' | 'once' | 'repeating' | string | null
  duration_in_months: number | null
  max_redemptions: number | null
  times_redeemed: number | null
  redeem_by: string | null
  valid: boolean | null
  // GOYA-local fields (cast as any — not in generated types yet)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  role_restrictions: any
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  product_restrictions: any
}

type RestrictionMode = 'none' | 'whitelist' | 'blacklist'

const GOYA_ROLES = [
  { value: 'student', label: 'Student' },
  { value: 'teacher', label: 'Teacher' },
  { value: 'wellness_practitioner', label: 'Wellness Practitioner' },
  { value: 'school', label: 'School' },
]

function RoleRestrictionsSection({
  mode,
  selectedRoles,
  onModeChange,
  onRolesChange,
}: {
  mode: RestrictionMode
  selectedRoles: string[]
  onModeChange: (m: RestrictionMode) => void
  onRolesChange: (roles: string[]) => void
}) {
  function toggleRole(role: string) {
    if (selectedRoles.includes(role)) {
      onRolesChange(selectedRoles.filter((r) => r !== role))
    } else {
      onRolesChange([...selectedRoles, role])
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#374151]">Role Restrictions</h3>
      <div className="flex flex-col gap-1.5">
        {(['none', 'whitelist', 'blacklist'] as RestrictionMode[]).map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="roleRestrictionMode"
              value={m}
              checked={mode === m}
              onChange={() => onModeChange(m)}
              className="accent-[#1B3A5C]"
            />
            {m === 'none' && 'No restriction'}
            {m === 'whitelist' && 'Whitelist (only these roles)'}
            {m === 'blacklist' && 'Blacklist (exclude these roles)'}
          </label>
        ))}
      </div>
      {mode !== 'none' && (
        <div className="ml-4 space-y-1.5 border-l-2 border-[#E5E7EB] pl-4">
          {GOYA_ROLES.map((role) => (
            <label key={role.value} className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={selectedRoles.includes(role.value)}
                onChange={() => toggleRole(role.value)}
                className="accent-[#1B3A5C]"
              />
              {role.label}
            </label>
          ))}
        </div>
      )}
    </div>
  )
}

function ProductRestrictionsSection({
  mode,
  selectedProductIds,
  allProducts,
  onModeChange,
  onProductsChange,
}: {
  mode: RestrictionMode
  selectedProductIds: string[]
  allProducts: Array<{ id: string; name: string; slug: string }>
  onModeChange: (m: RestrictionMode) => void
  onProductsChange: (ids: string[]) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = allProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.slug.toLowerCase().includes(search.toLowerCase())
  )

  function toggleProduct(id: string) {
    if (selectedProductIds.includes(id)) {
      onProductsChange(selectedProductIds.filter((x) => x !== id))
    } else {
      onProductsChange([...selectedProductIds, id])
    }
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#374151]">Product Restrictions</h3>
      <div className="flex flex-col gap-1.5">
        {(['none', 'whitelist', 'blacklist'] as RestrictionMode[]).map((m) => (
          <label key={m} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="radio"
              name="productRestrictionMode"
              value={m}
              checked={mode === m}
              onChange={() => onModeChange(m)}
              className="accent-[#1B3A5C]"
            />
            {m === 'none' && 'No restriction'}
            {m === 'whitelist' && 'Whitelist (only these products)'}
            {m === 'blacklist' && 'Blacklist (exclude these products)'}
          </label>
        ))}
      </div>
      {mode !== 'none' && (
        <div className="ml-4 space-y-2 border-l-2 border-[#E5E7EB] pl-4">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search products..."
            className="w-full px-3 py-1.5 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
          />
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {filtered.map((product) => (
              <label key={product.id} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedProductIds.includes(product.id)}
                  onChange={() => toggleProduct(product.id)}
                  className="accent-[#1B3A5C]"
                />
                {product.name}
              </label>
            ))}
            {filtered.length === 0 && (
              <p className="text-sm text-[#6B7280] py-1">No products match your search.</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

type DiscountType = 'percent' | 'amount' | 'free_product'
type Duration = 'forever' | 'once' | 'repeating'

interface CouponFormProps {
  coupon: CouponData | null
  isNew: boolean
  allProducts: Array<{ id: string; name: string; slug: string }>
}

export default function CouponForm({ coupon, isNew, allProducts }: CouponFormProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Form state
  const [name, setName] = useState(coupon?.name ?? '')
  const [publicCode, setPublicCode] = useState(coupon?.code ?? '')
  const [discountType, setDiscountType] = useState<DiscountType>(
    (coupon?.discount_type as DiscountType) ?? 'percent'
  )
  const [percentOff, setPercentOff] = useState(coupon?.percent_off?.toString() ?? '')
  const [amountOff, setAmountOff] = useState(
    coupon?.amount_off != null ? (coupon.amount_off / 100).toFixed(2) : ''
  )
  const [duration, setDuration] = useState<Duration>(
    (coupon?.duration as Duration) ?? 'once'
  )
  const [durationInMonths, setDurationInMonths] = useState(
    coupon?.duration_in_months?.toString() ?? ''
  )
  const [maxRedemptions, setMaxRedemptions] = useState(
    coupon?.max_redemptions?.toString() ?? ''
  )
  const [singleUse, setSingleUse] = useState(coupon?.max_redemptions === 1)
  const [redeemBy, setRedeemBy] = useState(
    coupon?.redeem_by ? coupon.redeem_by.split('T')[0] : ''
  )

  // Role restrictions
  const existingRoleRestrictions = coupon?.role_restrictions
  const [roleMode, setRoleMode] = useState<RestrictionMode>(
    existingRoleRestrictions?.mode ?? 'none'
  )
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    existingRoleRestrictions?.roles ?? []
  )

  // Product restrictions
  const existingProductRestrictions = coupon?.product_restrictions
  const [productMode, setProductMode] = useState<RestrictionMode>(
    existingProductRestrictions?.mode ?? 'none'
  )
  const [selectedProductIds, setSelectedProductIds] = useState<string[]>(
    existingProductRestrictions?.productIds ?? []
  )

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const roleRestrictions =
      roleMode !== 'none' ? { mode: roleMode, roles: selectedRoles } : undefined
    const productRestrictions =
      productMode !== 'none' ? { mode: productMode, productIds: selectedProductIds } : undefined

    startTransition(async () => {
      let result: { success: boolean; error?: string }

      if (isNew) {
        result = await createCoupon({
          name,
          publicCode: publicCode || undefined,
          discountType,
          percentOff: discountType === 'percent' ? Number(percentOff) : undefined,
          amountOff:
            discountType === 'amount'
              ? Math.round(Number(amountOff) * 100)
              : undefined,
          duration,
          durationInMonths: duration === 'repeating' ? Number(durationInMonths) : undefined,
          maxRedemptions: maxRedemptions ? Number(maxRedemptions) : undefined,
          singleUse,
          redeemBy: redeemBy || undefined,
          roleRestrictions,
          productRestrictions,
        })
      } else {
        result = await editCoupon(coupon!.stripe_coupon_id, {
          name,
          roleRestrictions,
          productRestrictions,
        })
      }

      if (result.success) {
        router.push('/admin/shop/coupons')
      } else {
        setError(result.error ?? 'An error occurred')
      }
    })
  }

  const inputClass =
    'w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] disabled:bg-[#F9FAFB] disabled:text-[#9CA3AF] disabled:cursor-not-allowed'
  const labelClass = 'block text-sm font-medium text-[#374151] mb-1'

  return (
    <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Edit-mode warning */}
        {!isNew && (
          <div className="rounded-lg bg-amber-50 border border-amber-200 px-4 py-3 text-sm text-amber-800">
            Discount type, amount, and duration cannot be changed after creation. Create a new coupon instead.
          </div>
        )}

        {/* Internal Name */}
        <div>
          <label className={labelClass} htmlFor="coupon-name">Internal Name</label>
          <input
            id="coupon-name"
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Summer 20% Off"
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[#6B7280]">Admin-only display name</p>
        </div>

        {/* Public Code */}
        <div>
          <label className={labelClass} htmlFor="coupon-code">Public Code</label>
          <input
            id="coupon-code"
            type="text"
            value={publicCode}
            onChange={(e) => setPublicCode(e.target.value)}
            placeholder="e.g. SUMMER20 (optional)"
            disabled={!isNew}
            className={inputClass}
          />
          <p className="mt-1 text-xs text-[#6B7280]">Optional promotion code customers enter at checkout</p>
        </div>

        {/* Discount Type */}
        <div>
          <p className={labelClass}>Discount Type</p>
          <div className="flex gap-4">
            {([
              { value: 'percent', label: 'Percentage' },
              { value: 'amount', label: 'Fixed Amount' },
              { value: 'free_product', label: 'Free Product' },
            ] as { value: DiscountType; label: string }[]).map((opt) => (
              <label key={opt.value} className="flex items-center gap-2 text-sm cursor-pointer">
                <input
                  type="radio"
                  value={opt.value}
                  checked={discountType === opt.value}
                  onChange={() => setDiscountType(opt.value)}
                  disabled={!isNew}
                  className="accent-[#1B3A5C]"
                />
                {opt.label}
              </label>
            ))}
          </div>
        </div>

        {/* Percentage Off */}
        {discountType === 'percent' && (
          <div>
            <label className={labelClass} htmlFor="coupon-percent-off">Percentage Off (%)</label>
            <input
              id="coupon-percent-off"
              type="number"
              min={1}
              max={100}
              value={percentOff}
              onChange={(e) => setPercentOff(e.target.value)}
              placeholder="e.g. 20"
              disabled={!isNew}
              required
              className={inputClass}
            />
          </div>
        )}

        {/* Amount Off */}
        {discountType === 'amount' && (
          <div>
            <label className={labelClass} htmlFor="coupon-amount-off">Amount Off (USD)</label>
            <input
              id="coupon-amount-off"
              type="number"
              min={0.01}
              step={0.01}
              value={amountOff}
              onChange={(e) => setAmountOff(e.target.value)}
              placeholder="e.g. 10.00"
              disabled={!isNew}
              required
              className={inputClass}
            />
          </div>
        )}

        {/* Duration */}
        <div>
          <label className={labelClass} htmlFor="coupon-duration">Duration</label>
          <select
            id="coupon-duration"
            value={duration}
            onChange={(e) => setDuration(e.target.value as Duration)}
            disabled={!isNew}
            className={inputClass}
          >
            <option value="once">Once</option>
            <option value="forever">Forever</option>
            <option value="repeating">Repeating</option>
          </select>
        </div>

        {/* Duration in Months */}
        {duration === 'repeating' && (
          <div>
            <label className={labelClass} htmlFor="coupon-duration-months">Duration in Months</label>
            <input
              id="coupon-duration-months"
              type="number"
              min={1}
              value={durationInMonths}
              onChange={(e) => setDurationInMonths(e.target.value)}
              placeholder="e.g. 3"
              disabled={!isNew}
              required
              className={inputClass}
            />
          </div>
        )}

        {/* Single Use Toggle */}
        <div>
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={singleUse}
              onChange={(e) => {
                setSingleUse(e.target.checked)
                if (e.target.checked) setMaxRedemptions('1')
              }}
              disabled={!isNew}
              className="accent-[#1B3A5C] w-4 h-4"
            />
            <span className="font-medium text-[#374151]">Single Use</span>
          </label>
          <p className="mt-1 text-xs text-[#6B7280] ml-6">Limits this coupon to one redemption total</p>
        </div>

        {/* Max Redemptions */}
        {!singleUse && (
          <div>
            <label className={labelClass} htmlFor="coupon-max-redemptions">Max Redemptions</label>
            <input
              id="coupon-max-redemptions"
              type="number"
              min={0}
              value={maxRedemptions}
              onChange={(e) => setMaxRedemptions(e.target.value)}
              placeholder="0 = unlimited"
              disabled={!isNew}
              className={inputClass}
            />
            <p className="mt-1 text-xs text-[#6B7280]">0 or blank = unlimited</p>
          </div>
        )}

        {/* Expiry Date */}
        <div>
          <label className={labelClass} htmlFor="coupon-redeem-by">Expiry Date</label>
          <input
            id="coupon-redeem-by"
            type="date"
            value={redeemBy}
            onChange={(e) => setRedeemBy(e.target.value)}
            disabled={!isNew}
            className={inputClass}
          />
        </div>

        {/* Divider */}
        <hr className="border-[#E5E7EB]" />

        {/* Role Restrictions */}
        <RoleRestrictionsSection
          mode={roleMode}
          selectedRoles={selectedRoles}
          onModeChange={setRoleMode}
          onRolesChange={setSelectedRoles}
        />

        {/* Product Restrictions */}
        <ProductRestrictionsSection
          mode={productMode}
          selectedProductIds={selectedProductIds}
          allProducts={allProducts}
          onModeChange={setProductMode}
          onProductsChange={setSelectedProductIds}
        />

        {/* Error */}
        {error && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-800">
            {error}
          </div>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={isPending}
            className="px-5 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#142d47] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPending ? 'Saving...' : isNew ? 'Create Coupon' : 'Save Changes'}
          </button>
          <a
            href="/admin/shop/coupons"
            className="px-5 py-2 text-sm font-medium rounded-lg border border-[#E5E7EB] text-[#374151] hover:border-[#1B3A5C] transition-colors"
          >
            Cancel
          </a>
        </div>
      </form>
    </div>
  )
}
