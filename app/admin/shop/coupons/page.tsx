import Link from 'next/link'
import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import CouponsTable from './CouponsTable'
import type { CouponRow } from './CouponsTable'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '')
}

export default async function CouponsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const search   = str(params.search)
  const status   = str(params.status) || 'all'
  const sort     = str(params.sort) || 'newest'
  const page     = Math.max(1, parseInt(str(params.page) || '1', 10))
  const pageSize = [25, 50, 100].includes(parseInt(str(params.pageSize), 10))
    ? parseInt(str(params.pageSize), 10)
    : 25

  const supabase = await createSupabaseServerClient()

  let query = supabase
    .from('stripe_coupons')
    .select('*', { count: 'exact' })

  if (status === 'active') query = query.eq('valid', true)
  if (status === 'expired') query = query.eq('valid', false)
  if (search) query = query.or(`name.ilike.%${search}%,code.ilike.%${search}%`)

  switch (sort) {
    case 'oldest':    query = query.order('created_at', { ascending: true });  break
    case 'name_asc':  query = query.order('name', { ascending: true });        break
    case 'name_desc': query = query.order('name', { ascending: false });       break
    default:          query = query.order('created_at', { ascending: false }); break
  }

  const from = (page - 1) * pageSize
  const to   = from + pageSize - 1
  query = query.range(from, to)

  const { data: rawCoupons, count } = await query

  const totalCount   = count ?? 0
  const totalPages   = Math.max(1, Math.ceil(totalCount / pageSize))
  const displayedCount = rawCoupons?.length ?? 0

  // Map to CouponRow type
  const coupons: CouponRow[] = (rawCoupons ?? []).map((c) => ({
    id: c.id,
    stripe_coupon_id: c.stripe_coupon_id,
    name: c.name,
    code: c.code,
    discount_type: c.discount_type as 'percent' | 'amount' | 'free_product',
    percent_off: c.percent_off ? Number(c.percent_off) : null,
    amount_off: c.amount_off,
    currency: c.currency,
    times_redeemed: c.times_redeemed,
    max_redemptions: c.max_redemptions,
    redeem_by: c.redeem_by,
    valid: c.valid,
    created_at: c.created_at,
  }))

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Coupons</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">
            <span className="font-medium text-[#374151]">{displayedCount}</span>
            {' / '}
            <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span>
            {' coupons'}
          </p>
        </div>
        <Link
          href="/admin/shop/coupons/new"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-medium hover:bg-[#142d47] transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Create Coupon
        </Link>
      </div>

      {/* Search + filter bar */}
      <Suspense>
        <CouponsFilters
          initialSearch={search}
          initialStatus={status}
          initialSort={sort}
        />
      </Suspense>

      {/* Table */}
      <CouponsTable initialCoupons={coupons} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between text-sm text-[#6B7280]">
          <span>
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`?page=${page - 1}&pageSize=${pageSize}&status=${status}&sort=${sort}&search=${search}`}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:border-[#1B3A5C] transition-colors"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`?page=${page + 1}&pageSize=${pageSize}&status=${status}&sort=${sort}&search=${search}`}
                className="px-3 py-1.5 rounded-lg border border-[#E5E7EB] hover:border-[#1B3A5C] transition-colors"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

// Inline filters component (Client Component via Suspense boundary)
function CouponsFilters({
  initialSearch,
  initialStatus,
  initialSort,
}: {
  initialSearch: string
  initialStatus: string
  initialSort: string
}) {
  return (
    <form method="get" className="flex flex-wrap gap-3 mb-4">
      <input
        type="text"
        name="search"
        defaultValue={initialSearch}
        placeholder="Search by name or code..."
        className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]"
      />
      <select
        name="status"
        defaultValue={initialStatus}
        className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] bg-white"
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="expired">Expired</option>
      </select>
      <select
        name="sort"
        defaultValue={initialSort}
        className="px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C] bg-white"
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name_asc">Name A–Z</option>
        <option value="name_desc">Name Z–A</option>
      </select>
      <button
        type="submit"
        className="px-4 py-2 text-sm font-medium rounded-lg bg-[#1B3A5C] text-white hover:bg-[#142d47] transition-colors"
      >
        Filter
      </button>
    </form>
  )
}
