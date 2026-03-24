import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Mock getStripe
const mockCouponsCreate = vi.fn()
const mockCouponsUpdate = vi.fn()
const mockPromotionCodesCreate = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    coupons: {
      create: mockCouponsCreate,
      update: mockCouponsUpdate,
    },
    promotionCodes: {
      create: mockPromotionCodesCreate,
    },
  }),
}))

// Mock getSupabaseService
const mockUpsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({
    from: mockFrom,
  }),
}))

// Import after mocks
const { createCoupon, editCoupon } = await import('./actions')

describe('createCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Default: stripe coupon create returns a coupon
    mockCouponsCreate.mockResolvedValue({
      id: 'cpn_test123',
      name: 'Test Coupon',
    })

    // Default: supabase upsert returns no error
    mockUpsert.mockResolvedValue({ error: null })

    // Default: from returns object with upsert
    mockFrom.mockReturnValue({ upsert: mockUpsert, update: mockUpdate })

    // Default: update returns object with eq
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
  })

  it('creates a percent-off coupon with percent_off in Stripe', async () => {
    const result = await createCoupon({
      name: 'Summer Sale',
      discountType: 'percent',
      percentOff: 25,
      duration: 'once',
    })

    expect(mockCouponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ percent_off: 25, duration: 'once', name: 'Summer Sale' })
    )
    expect(result).toEqual({ success: true })
  })

  it('creates an amount-off coupon with amount_off and currency: usd in Stripe', async () => {
    const result = await createCoupon({
      name: 'Dollar Off',
      discountType: 'amount',
      amountOff: 1000,
      duration: 'forever',
    })

    expect(mockCouponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ amount_off: 1000, currency: 'usd', duration: 'forever' })
    )
    expect(result).toEqual({ success: true })
  })

  it('creates a free_product coupon with percent_off: 100 in Stripe (Pitfall 6)', async () => {
    const result = await createCoupon({
      name: 'Free Product',
      discountType: 'free_product',
      duration: 'once',
    })

    expect(mockCouponsCreate).toHaveBeenCalledWith(
      expect.objectContaining({ percent_off: 100, duration: 'once' })
    )
    // Must NOT pass amount_off or percent discount value
    const callArgs = mockCouponsCreate.mock.calls[0][0]
    expect(callArgs.amount_off).toBeUndefined()
    expect(result).toEqual({ success: true })
  })

  it('creates a promotion code when publicCode is provided', async () => {
    mockPromotionCodesCreate.mockResolvedValue({ id: 'promo_test123' })

    const result = await createCoupon({
      name: 'Public Coupon',
      discountType: 'percent',
      percentOff: 10,
      duration: 'once',
      publicCode: 'SUMMER25',
    })

    expect(mockPromotionCodesCreate).toHaveBeenCalledWith(
      expect.objectContaining({ coupon: 'cpn_test123', code: 'SUMMER25' })
    )
    expect(result).toEqual({ success: true })
  })

  it('does NOT create a promotion code when publicCode is not provided', async () => {
    await createCoupon({
      name: 'Internal Coupon',
      discountType: 'percent',
      percentOff: 10,
      duration: 'once',
    })

    expect(mockPromotionCodesCreate).not.toHaveBeenCalled()
  })

  it('stores both stripe_coupon_id and stripe_promotion_code_id in supabase', async () => {
    mockPromotionCodesCreate.mockResolvedValue({ id: 'promo_test456' })

    await createCoupon({
      name: 'Promo Coupon',
      discountType: 'percent',
      percentOff: 15,
      duration: 'forever',
      publicCode: 'PROMO15',
    })

    expect(mockFrom).toHaveBeenCalledWith('stripe_coupons')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_coupon_id: 'cpn_test123',
        stripe_promotion_code_id: 'promo_test456',
      }),
      { onConflict: 'stripe_coupon_id' }
    )
  })

  it('stores role_restrictions as GOYA-local field in supabase', async () => {
    await createCoupon({
      name: 'Student Coupon',
      discountType: 'percent',
      percentOff: 20,
      duration: 'once',
      roleRestrictions: { mode: 'whitelist', roles: ['student'] },
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        role_restrictions: { mode: 'whitelist', roles: ['student'] },
      }),
      { onConflict: 'stripe_coupon_id' }
    )
  })

  it('stores product_restrictions as GOYA-local field in supabase', async () => {
    await createCoupon({
      name: 'Product Coupon',
      discountType: 'amount',
      amountOff: 500,
      duration: 'once',
      productRestrictions: { mode: 'blacklist', productIds: ['prod-1'] },
    })

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        product_restrictions: { mode: 'blacklist', productIds: ['prod-1'] },
      }),
      { onConflict: 'stripe_coupon_id' }
    )
  })

  it('does NOT pass role_restrictions or product_restrictions to stripe.coupons.create', async () => {
    await createCoupon({
      name: 'Restricted Coupon',
      discountType: 'percent',
      percentOff: 30,
      duration: 'once',
      roleRestrictions: { mode: 'whitelist', roles: ['teacher'] },
      productRestrictions: { mode: 'whitelist', productIds: ['prod-2'] },
    })

    const stripeCallArgs = mockCouponsCreate.mock.calls[0][0]
    expect(stripeCallArgs.role_restrictions).toBeUndefined()
    expect(stripeCallArgs.product_restrictions).toBeUndefined()
    expect(stripeCallArgs.roleRestrictions).toBeUndefined()
    expect(stripeCallArgs.productRestrictions).toBeUndefined()
  })
})

describe('editCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    mockCouponsUpdate.mockResolvedValue({ id: 'cpn_test123', name: 'Updated Name' })
    mockEq.mockResolvedValue({ error: null })
    mockUpdate.mockReturnValue({ eq: mockEq })
    mockFrom.mockReturnValue({ upsert: mockUpsert, update: mockUpdate })
  })

  it('calls stripe.coupons.update with name and metadata only', async () => {
    const result = await editCoupon('cpn_test123', {
      name: 'New Name',
      metadata: { promo_id: 'abc' },
    })

    expect(mockCouponsUpdate).toHaveBeenCalledWith('cpn_test123', {
      name: 'New Name',
      metadata: { promo_id: 'abc' },
    })
    expect(result).toEqual({ success: true })
  })

  it('updates role_restrictions and product_restrictions in supabase', async () => {
    await editCoupon('cpn_test123', {
      name: 'Updated',
      roleRestrictions: { mode: 'blacklist', roles: ['admin'] },
      productRestrictions: { mode: 'whitelist', productIds: ['prod-3'] },
    })

    expect(mockFrom).toHaveBeenCalledWith('stripe_coupons')
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({
        role_restrictions: { mode: 'blacklist', roles: ['admin'] },
        product_restrictions: { mode: 'whitelist', productIds: ['prod-3'] },
      })
    )
    expect(mockEq).toHaveBeenCalledWith('stripe_coupon_id', 'cpn_test123')
  })

  it('does NOT pass role_restrictions or product_restrictions to stripe.coupons.update', async () => {
    await editCoupon('cpn_test123', {
      name: 'Test',
      roleRestrictions: { mode: 'whitelist', roles: ['student'] },
    })

    const stripeUpdateArgs = mockCouponsUpdate.mock.calls[0][1]
    expect(stripeUpdateArgs.role_restrictions).toBeUndefined()
    expect(stripeUpdateArgs.product_restrictions).toBeUndefined()
    expect(stripeUpdateArgs.roleRestrictions).toBeUndefined()
  })
})
