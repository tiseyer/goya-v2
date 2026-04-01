import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock lib/stripe/client
vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn(),
}))

// Mock lib/supabase/service
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: vi.fn(),
}))

import { revalidatePath } from 'next/cache'
import { getStripe } from '@/lib/stripe/client'
import { getSupabaseService } from '@/lib/supabase/service'
import {
  toggleProductStatus,
  bulkProductAction,
  reorderProducts,
  softDeleteProduct,
  createLocalProduct,
  createProduct,
  editProduct,
  updateProductPrice,
  updateProductVisibility,
} from './actions'

function makeSupabaseMock() {
  const eq = vi.fn().mockReturnThis()
  const update = vi.fn().mockReturnValue({ eq })
  const upsert = vi.fn().mockResolvedValue({ error: null })
  const from = vi.fn().mockReturnValue({ update, upsert })
  return { from, update, upsert, eq }
}

function makeStripeMock() {
  const productsUpdate = vi.fn().mockResolvedValue({ id: 'sp_new', name: 'Test', description: '', active: true, images: [], metadata: {} })
  const productsCreate = vi.fn().mockResolvedValue({ id: 'sp_new', name: 'Test', description: '', active: true, images: [], metadata: {} })
  const pricesCreate = vi.fn().mockResolvedValue({ id: 'price_new', product: 'sp_new', unit_amount: 2999, currency: 'usd', type: 'one_time', active: true })
  const pricesUpdate = vi.fn().mockResolvedValue({ id: 'price_old', active: false })
  return {
    products: { update: productsUpdate, create: productsCreate },
    prices: { create: pricesCreate, update: pricesUpdate },
  }
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('reorderProducts', () => {
  it('updates priority for each product in order', async () => {
    const sb = makeSupabaseMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)

    await reorderProducts(['sp_1', 'sp_2', 'sp_3'])

    // Should call from('products') three times
    expect(sb.from).toHaveBeenCalledWith('products')
    // Verify priority values set correctly (1, 2, 3)
    expect(sb.update).toHaveBeenCalledWith({ priority: 1 })
    expect(sb.update).toHaveBeenCalledWith({ priority: 2 })
    expect(sb.update).toHaveBeenCalledWith({ priority: 3 })
    // Verify stripe_product_id equality
    expect(sb.eq).toHaveBeenCalledWith('stripe_product_id', 'sp_1')
    expect(sb.eq).toHaveBeenCalledWith('stripe_product_id', 'sp_2')
    expect(sb.eq).toHaveBeenCalledWith('stripe_product_id', 'sp_3')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/products')
  })
})

describe('toggleProductStatus', () => {
  it('updates is_active in supabase and syncs active state to Stripe', async () => {
    const sb = makeSupabaseMock()
    const stripe = makeStripeMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)
    vi.mocked(getStripe).mockReturnValue(stripe as any)

    await toggleProductStatus('prod-uuid', 'stripe_prod_id', true)

    expect(sb.from).toHaveBeenCalledWith('products')
    expect(sb.update).toHaveBeenCalledWith({ is_active: true })
    expect(sb.eq).toHaveBeenCalledWith('id', 'prod-uuid')
    expect(stripe.products.update).toHaveBeenCalledWith('stripe_prod_id', { active: true })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/products')
  })
})

describe('softDeleteProduct', () => {
  it('sets is_active to false in supabase and deactivates in Stripe', async () => {
    const sb = makeSupabaseMock()
    const stripe = makeStripeMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)
    vi.mocked(getStripe).mockReturnValue(stripe as any)

    await softDeleteProduct('prod-uuid', 'stripe_prod_id')

    expect(sb.from).toHaveBeenCalledWith('products')
    expect(sb.update).toHaveBeenCalledWith({ is_active: false })
    expect(sb.eq).toHaveBeenCalledWith('id', 'prod-uuid')
    expect(stripe.products.update).toHaveBeenCalledWith('stripe_prod_id', { active: false })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/products')
  })
})

describe('bulkProductAction', () => {
  it("sets is_active=true and stripe active=true for all items when action is 'publish'", async () => {
    const sb = makeSupabaseMock()
    const stripe = makeStripeMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)
    vi.mocked(getStripe).mockReturnValue(stripe as any)

    const items = [
      { productId: 'p1', stripeProductId: 'sp_1' },
      { productId: 'p2', stripeProductId: 'sp_2' },
    ]
    await bulkProductAction(items, 'publish')

    expect(sb.update).toHaveBeenCalledWith({ is_active: true })
    expect(stripe.products.update).toHaveBeenCalledWith('sp_1', { active: true })
    expect(stripe.products.update).toHaveBeenCalledWith('sp_2', { active: true })
  })
})

describe('createProduct', () => {
  it('creates stripe product and price, then updates local products table with stripe_product_id', async () => {
    const sb = makeSupabaseMock()
    const stripe = makeStripeMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)
    vi.mocked(getStripe).mockReturnValue(stripe as any)

    await createProduct({
      productId: 'local-uuid',
      name: 'Yoga Bundle',
      description: 'A great bundle',
      priceCents: 2999,
      priceType: 'one_time',
    })

    // Stripe product created
    expect(stripe.products.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Yoga Bundle', description: 'A great bundle' }),
    )
    // Stripe price created with correct amount
    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ unit_amount: 2999, currency: 'usd' }),
    )
    // Local products table updated with stripe_product_id
    expect(sb.from).toHaveBeenCalledWith('products')
    expect(sb.update).toHaveBeenCalledWith({ stripe_product_id: 'sp_new' })
    expect(sb.eq).toHaveBeenCalledWith('id', 'local-uuid')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/products')
  })

  it('passes recurring interval when priceType is recurring', async () => {
    const sb = makeSupabaseMock()
    const stripe = makeStripeMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)
    vi.mocked(getStripe).mockReturnValue(stripe as any)

    await createProduct({
      productId: 'local-uuid',
      name: 'Monthly Plan',
      description: 'Monthly subscription',
      priceCents: 999,
      priceType: 'recurring',
      interval: 'month',
    })

    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ recurring: { interval: 'month' } }),
    )
  })
})

describe('updateProductPrice', () => {
  it('creates new Stripe Price, archives old price with active:false, and upserts supabase rows', async () => {
    const sb = makeSupabaseMock()
    const stripe = makeStripeMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)
    vi.mocked(getStripe).mockReturnValue(stripe as any)

    await updateProductPrice('sp_prod', 'price_old', 4999, 'usd', 'one_time')

    // New price created in Stripe
    expect(stripe.prices.create).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'sp_prod', unit_amount: 4999, currency: 'usd' }),
    )
    // Old price archived in Stripe (NEVER updates unit_amount)
    expect(stripe.prices.update).toHaveBeenCalledWith('price_old', { active: false })
    // Stripe prices.update NOT called with unit_amount (immutability rule)
    const updateCalls = stripe.prices.update.mock.calls
    for (const call of updateCalls) {
      expect(call[1]).not.toHaveProperty('unit_amount')
    }
    // Supabase gets upsert for new price row
    expect(sb.from).toHaveBeenCalledWith('stripe_prices')
    expect(sb.upsert).toHaveBeenCalled()
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/products')
  })
})

describe('updateProductVisibility', () => {
  it('updates requires_any_of and hidden_if_has_any on GOYA products table only — not stripe_products', async () => {
    const sb = makeSupabaseMock()
    vi.mocked(getSupabaseService).mockReturnValue(sb as any)

    await updateProductVisibility('prod-uuid', ['prod-a', 'prod-b'], ['prod-c'])

    // Only writes to products (GOYA table), not stripe_products
    expect(sb.from).toHaveBeenCalledWith('products')
    expect(sb.from).not.toHaveBeenCalledWith('stripe_products')
    expect(sb.update).toHaveBeenCalledWith({
      requires_any_of: ['prod-a', 'prod-b'],
      hidden_if_has_any: ['prod-c'],
    })
    expect(sb.eq).toHaveBeenCalledWith('id', 'prod-uuid')
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/products')
  })
})

describe('createLocalProduct', () => {
  it('inserts a product row and returns the real UUID', async () => {
    const sbMock = makeSupabaseMock()
    const selectMock = vi.fn().mockReturnValue({
      single: vi.fn().mockResolvedValue({ data: { id: 'real-uuid-from-db' }, error: null }),
    })
    sbMock.from.mockReturnValue({
      ...sbMock.from(),
      insert: vi.fn().mockReturnValue({ select: selectMock }),
    })
    vi.mocked(getSupabaseService).mockReturnValue(sbMock as any)

    const result = await createLocalProduct({
      name: 'Test Product',
      description: 'A test',
      priceCents: 2999,
      priceType: 'one_time',
    })

    expect(result).toEqual({ productId: 'real-uuid-from-db' })
    expect(sbMock.from).toHaveBeenCalledWith('products')
  })
})
