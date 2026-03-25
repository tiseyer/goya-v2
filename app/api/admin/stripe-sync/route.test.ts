import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock getStripe
const mockProductsList = vi.fn()
const mockPricesList = vi.fn()
const mockCouponsList = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    products: { list: mockProductsList },
    prices: { list: mockPricesList },
    coupons: { list: mockCouponsList },
  }),
}))

// Mock getSupabaseService
const mockUpsert = vi.fn()
const mockFromAdmin = vi.fn(() => ({
  upsert: mockUpsert,
}))

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({
    from: mockFromAdmin,
  }),
}))

// Import after mocks
const { POST } = await import('@/app/api/admin/stripe-sync/route')

const makeRequest = (authHeader?: string) =>
  new Request('http://localhost/api/admin/stripe-sync', {
    method: 'POST',
    headers: authHeader ? { authorization: authHeader } : {},
  })

describe('POST /api/admin/stripe-sync', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.CRON_SECRET = 'test_secret'

    // Default: upsert succeeds
    mockUpsert.mockResolvedValue({ error: null })

    // Default list responses: single page, no pagination
    mockProductsList.mockResolvedValue({
      data: [{ id: 'prod_1', name: 'Test Product', description: null, active: true, images: [], metadata: {} }],
      has_more: false,
    })
    mockPricesList.mockResolvedValue({
      data: [{
        id: 'price_1',
        product: 'prod_1',
        currency: 'usd',
        unit_amount: 999,
        type: 'one_time',
        recurring: null,
        active: true,
        metadata: {},
      }],
      has_more: false,
    })
    mockCouponsList.mockResolvedValue({
      data: [{
        id: 'cpn_1',
        name: 'Test Coupon',
        percent_off: 10,
        amount_off: null,
        currency: null,
        duration: 'once',
        duration_in_months: null,
        max_redemptions: null,
        times_redeemed: 0,
        redeem_by: null,
        valid: true,
        metadata: {},
      }],
      has_more: false,
    })
  })

  it('returns 401 when authorization header is missing', async () => {
    const response = await POST(makeRequest())
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('returns 401 when bearer token is wrong', async () => {
    const response = await POST(makeRequest('Bearer wrong_secret'))
    const json = await response.json()

    expect(response.status).toBe(401)
    expect(json.error).toBe('Unauthorized')
  })

  it('syncs products — calls stripe.products.list and upserts to stripe_products', async () => {
    const response = await POST(makeRequest('Bearer test_secret'))
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.ok).toBe(true)
    expect(mockProductsList).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }))
    expect(mockFromAdmin).toHaveBeenCalledWith('stripe_products')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_id: 'prod_1' }),
      { onConflict: 'stripe_id' }
    )
  })

  it('syncs prices — calls stripe.prices.list and upserts to stripe_prices', async () => {
    const response = await POST(makeRequest('Bearer test_secret'))

    expect(mockPricesList).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }))
    expect(mockFromAdmin).toHaveBeenCalledWith('stripe_prices')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_id: 'price_1', stripe_product_id: 'prod_1' }),
      { onConflict: 'stripe_id' }
    )
  })

  it('syncs coupons — calls stripe.coupons.list and upserts to stripe_coupons with stripe_coupon_id', async () => {
    const response = await POST(makeRequest('Bearer test_secret'))

    expect(mockCouponsList).toHaveBeenCalledWith(expect.objectContaining({ limit: 100 }))
    expect(mockFromAdmin).toHaveBeenCalledWith('stripe_coupons')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_coupon_id: 'cpn_1', percent_off: 10 }),
      { onConflict: 'stripe_coupon_id' }
    )
  })

  it('paginates when has_more=true — passes starting_after on second call', async () => {
    // First page has_more=true, second page has_more=false
    mockProductsList
      .mockResolvedValueOnce({
        data: [{ id: 'prod_1', name: 'First', description: null, active: true, images: [], metadata: {} }],
        has_more: true,
      })
      .mockResolvedValueOnce({
        data: [{ id: 'prod_2', name: 'Second', description: null, active: true, images: [], metadata: {} }],
        has_more: false,
      })

    await POST(makeRequest('Bearer test_secret'))

    expect(mockProductsList).toHaveBeenCalledTimes(2)
    expect(mockProductsList).toHaveBeenNthCalledWith(1, { limit: 100 })
    expect(mockProductsList).toHaveBeenNthCalledWith(2, { limit: 100, starting_after: 'prod_1' })
  })

  it('returns synced counts for all three entity types', async () => {
    const response = await POST(makeRequest('Bearer test_secret'))
    const json = await response.json()

    expect(json.ok).toBe(true)
    expect(json.synced).toEqual({ products: 1, prices: 1, coupons: 1 })
  })
})
