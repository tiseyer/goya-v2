import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert })
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({ from: mockFrom }),
}))

const { handleCoupon } = await import('@/lib/stripe/handlers/coupon')

describe('handleCoupon', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('coupon.created event calls upsert on stripe_coupons with onConflict: stripe_coupon_id', async () => {
    const event = {
      type: 'coupon.created',
      data: {
        object: {
          id: 'coup_123',
          name: 'Test Coupon',
          percent_off: 20,
          amount_off: null,
          currency: 'usd',
          duration: 'once',
          duration_in_months: null,
          max_redemptions: 100,
          times_redeemed: 0,
          redeem_by: null,
          valid: true,
          metadata: { campaign: 'spring' },
        },
      },
    } as any

    await handleCoupon(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_coupons')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_coupon_id: 'coup_123',
      }),
      { onConflict: 'stripe_coupon_id' }
    )
  })

  it('coupon.deleted event calls upsert with valid=false', async () => {
    const event = {
      type: 'coupon.deleted',
      data: {
        object: {
          id: 'coup_del',
          name: 'Deleted Coupon',
          percent_off: 10,
          amount_off: null,
          currency: 'usd',
          duration: 'once',
          duration_in_months: null,
          max_redemptions: null,
          times_redeemed: 5,
          redeem_by: null,
          valid: true,
          metadata: {},
        },
      },
    } as any

    await handleCoupon(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_coupons')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_coupon_id: 'coup_del',
        valid: false,
      }),
      { onConflict: 'stripe_coupon_id' }
    )
  })

  it('percent_off coupon maps discount_type=percent, percent_off=value, amount_off=null', async () => {
    const event = {
      type: 'coupon.created',
      data: {
        object: {
          id: 'coup_pct',
          name: 'Percent Coupon',
          percent_off: 25,
          amount_off: null,
          currency: 'usd',
          duration: 'forever',
          duration_in_months: null,
          max_redemptions: null,
          times_redeemed: 0,
          redeem_by: null,
          valid: true,
          metadata: {},
        },
      },
    } as any

    await handleCoupon(event)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        discount_type: 'percent',
        percent_off: 25,
        amount_off: null,
      }),
      expect.any(Object)
    )
  })

  it('amount_off coupon maps discount_type=amount, amount_off=value, percent_off=null', async () => {
    const event = {
      type: 'coupon.created',
      data: {
        object: {
          id: 'coup_amt',
          name: 'Amount Coupon',
          percent_off: null,
          amount_off: 500,
          currency: 'usd',
          duration: 'once',
          duration_in_months: null,
          max_redemptions: null,
          times_redeemed: 0,
          redeem_by: null,
          valid: true,
          metadata: {},
        },
      },
    } as any

    await handleCoupon(event)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        discount_type: 'amount',
        amount_off: 500,
        percent_off: null,
      }),
      expect.any(Object)
    )
  })
})
