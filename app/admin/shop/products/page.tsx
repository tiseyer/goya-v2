import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import ProductsTable, { type ProductRow } from './ProductsTable'
import ProductsFilters from './ProductsFilters'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '')
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams

  const search = str(params.search)
  const status = str(params.status) // all | published | draft | deleted
  const type = str(params.type) // all | one_time | recurring
  const sort = str(params.sort) || 'priority'
  const page = Math.max(1, parseInt(str(params.page) || '1', 10))
  const pageSize = [25, 50, 100].includes(parseInt(str(params.pageSize), 10))
    ? parseInt(str(params.pageSize), 10)
    : 25

  const supabase = await createSupabaseServerClient()

  // --- Query 1: GOYA products ---
  let productsQuery = supabase
    .from('products')
    .select('id, name, slug, price_cents, price_display, image_path, is_active, priority, stripe_product_id, category', { count: 'exact' })

  if (search) {
    productsQuery = productsQuery.or(`name.ilike.%${search}%,slug.ilike.%${search}%`)
  }

  switch (sort) {
    case 'name_asc':
      productsQuery = productsQuery.order('name', { ascending: true })
      break
    case 'name_desc':
      productsQuery = productsQuery.order('name', { ascending: false })
      break
    case 'newest':
      productsQuery = productsQuery.order('created_at', { ascending: false })
      break
    case 'oldest':
      productsQuery = productsQuery.order('created_at', { ascending: true })
      break
    default:
      productsQuery = productsQuery.order('priority', { ascending: true, nullsFirst: false })
      break
  }

  // Fetch all (we'll paginate after status filter)
  const { data: rawProducts } = await productsQuery

  if (!rawProducts) {
    return (
      <div className="p-6 lg:p-8">
        <p className="text-sm text-[#6B7280]">Failed to load products.</p>
      </div>
    )
  }

  // --- Query 2: stripe_products + stripe_prices ---
  const stripeProductIds = rawProducts
    .map((p) => p.stripe_product_id)
    .filter((id): id is string => Boolean(id))

  let stripeProductsMap = new Map<
    string,
    { active: boolean; priceType: 'one_time' | 'recurring' | null }
  >()

  if (stripeProductIds.length > 0) {
    const { data: stripePrices } = await supabase
      .from('stripe_prices')
      .select('stripe_product_id, type, active')
      .in('stripe_product_id', stripeProductIds)
      .eq('active', true)

    const { data: stripeProducts } = await supabase
      .from('stripe_products')
      .select('stripe_id, active')
      .in('stripe_id', stripeProductIds)

    const priceTypeByStripeProductId = new Map<string, 'one_time' | 'recurring'>()
    for (const price of stripePrices ?? []) {
      if (!priceTypeByStripeProductId.has(price.stripe_product_id)) {
        priceTypeByStripeProductId.set(
          price.stripe_product_id,
          price.type as 'one_time' | 'recurring',
        )
      }
    }

    for (const sp of stripeProducts ?? []) {
      stripeProductsMap.set(sp.stripe_id, {
        active: sp.active ?? false,
        priceType: priceTypeByStripeProductId.get(sp.stripe_id) ?? null,
      })
    }
  }

  // --- Query 3: Sales counts ---
  const { data: orderRows } = await supabase
    .from('stripe_orders')
    .select('stripe_product_id')

  const salesCountMap = new Map<string, number>()
  for (const row of orderRows ?? []) {
    if (row.stripe_product_id) {
      salesCountMap.set(
        row.stripe_product_id,
        (salesCountMap.get(row.stripe_product_id) ?? 0) + 1,
      )
    }
  }

  // --- Merge and derive status ---
  type DerivedStatus = 'Published' | 'Draft' | 'Deleted'

  function deriveStatus(
    isActive: boolean,
    stripeActive: boolean | null,
  ): DerivedStatus {
    if (stripeActive === false) return 'Deleted'
    if (!isActive) return 'Draft'
    return 'Published'
  }

  let allProducts: ProductRow[] = rawProducts.map((p) => {
    const stripeData = p.stripe_product_id
      ? stripeProductsMap.get(p.stripe_product_id)
      : undefined
    const stripeActive = stripeData?.active ?? null
    const derivedStatus = deriveStatus(p.is_active, stripeActive)

    return {
      id: p.id,
      name: p.name,
      slug: p.slug,
      priceCents: p.price_cents ?? 0,
      priceDisplay: p.price_display ?? '',
      imagePath: p.image_path ?? null,
      isActive: p.is_active,
      priority: p.priority ?? null,
      stripeProductId: p.stripe_product_id ?? null,
      stripeActive,
      priceType: stripeData?.priceType ?? null,
      salesCount: p.stripe_product_id
        ? (salesCountMap.get(p.stripe_product_id) ?? 0)
        : 0,
      derivedStatus,
    }
  })

  // --- Apply status filter ---
  if (status === 'published') {
    allProducts = allProducts.filter((p) => p.derivedStatus === 'Published')
  } else if (status === 'draft') {
    allProducts = allProducts.filter((p) => p.derivedStatus === 'Draft')
  } else if (status === 'deleted') {
    allProducts = allProducts.filter((p) => p.derivedStatus === 'Deleted')
  }

  // --- Apply type filter ---
  if (type === 'one_time') {
    allProducts = allProducts.filter((p) => p.priceType === 'one_time')
  } else if (type === 'recurring') {
    allProducts = allProducts.filter((p) => p.priceType === 'recurring')
  }

  const totalCount = allProducts.length
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize))
  const from = (page - 1) * pageSize
  const to = from + pageSize
  const pagedProducts = allProducts.slice(from, to)

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Products</h1>
        <p className="text-sm text-[#6B7280]">
          <span className="font-medium text-[#374151]">{pagedProducts.length}</span>
          {' / '}
          <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span>
          {' products'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense>
          <ProductsFilters
            initialSearch={search}
            initialStatus={status}
            initialType={type}
            initialSort={sort}
          />
        </Suspense>
      </div>

      {/* Table */}
      <ProductsTable initialProducts={pagedProducts} />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-[#6B7280]">
            Page <span className="font-medium text-[#374151]">{page}</span> of{' '}
            <span className="font-medium text-[#374151]">{totalPages}</span>
          </p>
          <div className="flex items-center gap-2">
            {page > 1 && (
              <a
                href={`/admin/shop/products?page=${page - 1}`}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E5E7EB] text-[#374151] hover:text-[#1B3A5C] hover:border-[#1B3A5C] bg-white transition-colors"
              >
                ← Prev
              </a>
            )}
            {page < totalPages && (
              <a
                href={`/admin/shop/products?page=${page + 1}`}
                className="px-3 py-1.5 text-sm font-medium rounded-lg border border-[#E5E7EB] text-[#374151] hover:text-[#1B3A5C] hover:border-[#1B3A5C] bg-white transition-colors"
              >
                Next →
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
