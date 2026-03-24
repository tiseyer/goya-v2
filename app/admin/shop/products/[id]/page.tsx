import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import ProductEditForm from './ProductEditForm'

type Params = Promise<{ id: string }>

function computeSyncStatus(
  stripeUpdatedAt: string | null,
  productUpdatedAt: string | null,
): 'synced' | 'out_of_sync' | 'not_synced' {
  if (!stripeUpdatedAt) return 'not_synced'
  if (!productUpdatedAt) return 'synced'

  const stripeDate = new Date(stripeUpdatedAt).getTime()
  const productDate = new Date(productUpdatedAt).getTime()
  const diffMs = Math.abs(stripeDate - productDate)
  const fiveMinutesMs = 5 * 60 * 1000

  // If stripe_products is newer by more than 5 minutes, something is out of sync
  if (stripeDate > productDate && diffMs > fiveMinutesMs) return 'out_of_sync'
  return 'synced'
}

export default async function ProductDetailPage({ params }: { params: Params }) {
  const { id } = await params
  const isNew = id === 'new'
  const supabase = await createSupabaseServerClient()

  // Fetch all products for visibility config (Show-to / Don't-show-to lists)
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, name, stripe_product_id')
    .order('name')

  // For new product, render empty form
  if (isNew) {
    return (
      <div className="p-6 lg:p-8">
        {/* Back link */}
        <div className="mb-6">
          <Link
            href="/admin/shop/products"
            className="text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors inline-flex items-center gap-1"
          >
            ← Back to Products
          </Link>
        </div>

        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">New Product</h1>
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
            Not synced to Stripe
          </span>
        </div>

        <ProductEditForm
          product={null}
          stripeProduct={null}
          activePrice={null}
          allProducts={allProducts ?? []}
        />
      </div>
    )
  }

  // Fetch existing product
  const { data: product, error: productError } = await supabase
    .from('products')
    .select('*')
    .eq('id', id)
    .single()

  if (productError || !product) {
    return (
      <div className="p-6 lg:p-8">
        <div className="mb-6">
          <Link
            href="/admin/shop/products"
            className="text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors inline-flex items-center gap-1"
          >
            ← Back to Products
          </Link>
        </div>
        <p className="text-sm text-[#6B7280]">Product not found.</p>
      </div>
    )
  }

  // Fetch Stripe product if linked
  type StripeProductRow = {
    stripe_id: string
    name: string | null
    description: string | null
    active: boolean | null
    images: string[] | null
    metadata: Record<string, string> | null
    updated_at: string | null
    statement_descriptor?: string | null
    unit_label?: string | null
    marketing_features?: string[] | null
  }
  let stripeProduct: StripeProductRow | null = null

  if (product.stripe_product_id) {
    const { data } = await supabase
      .from('stripe_products')
      .select('stripe_id, name, description, active, images, metadata, updated_at')
      .eq('stripe_id', product.stripe_product_id)
      .single()
    if (data) {
      stripeProduct = {
        ...data,
        metadata: data.metadata as Record<string, string> | null,
      }
    }
  }

  // Fetch active price
  let activePrice: {
    stripe_id: string
    stripe_product_id: string
    currency: string | null
    unit_amount: number | null
    type: string | null
    interval: string | null
    active: boolean | null
  } | null = null

  if (product.stripe_product_id) {
    const { data } = await supabase
      .from('stripe_prices')
      .select('*')
      .eq('stripe_product_id', product.stripe_product_id)
      .eq('active', true)
      .single()
    activePrice = data
  }

  // Compute sync status
  const syncStatus = product.stripe_product_id
    ? computeSyncStatus(
        stripeProduct?.updated_at ?? null,
        (product as unknown as { updated_at?: string }).updated_at ?? null,
      )
    : 'not_synced'

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <div className="mb-6">
        <Link
          href="/admin/shop/products"
          className="text-sm text-[#6B7280] hover:text-[#1B3A5C] transition-colors inline-flex items-center gap-1"
        >
          ← Back to Products
        </Link>
      </div>

      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">{product.name}</h1>
        {syncStatus === 'synced' && (
          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200">
            Synced
          </span>
        )}
        {syncStatus === 'out_of_sync' && (
          <span className="inline-flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full border border-amber-200">
            Out of sync
          </span>
        )}
        {syncStatus === 'not_synced' && (
          <span className="inline-flex items-center gap-1 text-xs text-slate-500 bg-slate-50 px-2 py-1 rounded-full border border-slate-200">
            Not synced to Stripe
          </span>
        )}
      </div>

      <ProductEditForm
        product={product as Parameters<typeof ProductEditForm>[0]['product']}
        stripeProduct={stripeProduct}
        activePrice={activePrice}
        allProducts={allProducts ?? []}
      />
    </div>
  )
}
