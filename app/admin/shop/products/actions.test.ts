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
} from './actions'

function makeSupabaseMock() {
  const eq = vi.fn().mockReturnThis()
  const update = vi.fn().mockReturnValue({ eq })
  const from = vi.fn().mockReturnValue({ update })
  return { from, update, eq }
}

function makeStripeMock() {
  const update = vi.fn().mockResolvedValue({})
  return { products: { update } }
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
