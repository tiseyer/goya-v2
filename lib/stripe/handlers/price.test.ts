import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert })
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({ from: mockFrom }),
}))

const { handlePrice } = await import('@/lib/stripe/handlers/price')

describe('handlePrice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('price.created event calls upsert on stripe_prices with correct fields', async () => {
    const event = {
      type: 'price.created',
      data: {
        object: {
          id: 'price_123',
          product: 'prod_123',
          currency: 'usd',
          unit_amount: 2999,
          type: 'recurring',
          active: true,
          recurring: {
            interval: 'month',
            interval_count: 1,
          },
          metadata: { key: 'value' },
        },
      },
    } as any

    await handlePrice(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_prices')
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        stripe_id: 'price_123',
        stripe_product_id: 'prod_123',
        currency: 'usd',
        unit_amount: 2999,
        type: 'recurring',
        interval: 'month',
        interval_count: 1,
        active: true,
        metadata: { key: 'value' },
      },
      { onConflict: 'stripe_id' }
    )
  })

  it('price.deleted event calls upsert with active=false', async () => {
    const event = {
      type: 'price.deleted',
      data: {
        object: {
          id: 'price_del',
          product: 'prod_123',
          currency: 'usd',
          unit_amount: 999,
          type: 'one_time',
          active: true,
          recurring: null,
          metadata: {},
        },
      },
    } as any

    await handlePrice(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_prices')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_id: 'price_del',
        active: false,
      }),
      { onConflict: 'stripe_id' }
    )
  })

  it('recurring price maps interval and interval_count from price.recurring', async () => {
    const event = {
      type: 'price.created',
      data: {
        object: {
          id: 'price_rec',
          product: 'prod_123',
          currency: 'usd',
          unit_amount: 9900,
          type: 'recurring',
          active: true,
          recurring: {
            interval: 'year',
            interval_count: 1,
          },
          metadata: {},
        },
      },
    } as any

    await handlePrice(event)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'recurring',
        interval: 'year',
        interval_count: 1,
      }),
      expect.any(Object)
    )
  })

  it('one-time price sets type=one_time, interval=null, interval_count=null', async () => {
    const event = {
      type: 'price.created',
      data: {
        object: {
          id: 'price_one',
          product: 'prod_123',
          currency: 'usd',
          unit_amount: 4999,
          type: 'one_time',
          active: true,
          recurring: null,
          metadata: {},
        },
      },
    } as any

    await handlePrice(event)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'one_time',
        interval: null,
        interval_count: null,
      }),
      expect.any(Object)
    )
  })
})
