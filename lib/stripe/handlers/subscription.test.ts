import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock getSupabaseService
const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({ from: mockFrom }),
}))

// Import after mocks
const { handleSubscription } = await import('@/lib/stripe/handlers/subscription')

function makeEvent(type: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_test_001',
    type,
    data: {
      object: {
        id: 'sub_abc123',
        object: 'subscription',
        customer: 'cus_test123',
        status: 'active',
        currency: 'usd',
        cancel_at_period_end: false,
        canceled_at: null,
        current_period_start: 1700000000,
        current_period_end: 1702592000,
        items: {
          data: [
            {
              price: {
                id: 'price_test123',
                unit_amount: 999,
                product: 'prod_test123',
              },
            },
          ],
        },
        metadata: {},
        ...overrides,
      },
    },
  }
}

describe('handleSubscription', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('Test 1: subscription.created upserts with type=recurring and returns {status: processed}', async () => {
    const event = makeEvent('customer.subscription.created')
    const result = await handleSubscription(event as never)

    expect(mockFrom).toHaveBeenCalledWith('stripe_orders')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_id: 'sub_abc123',
        type: 'recurring',
        stripe_customer_id: 'cus_test123',
        subscription_status: 'active',
        stripe_event_id: 'evt_test_001',
      }),
      expect.objectContaining({ onConflict: 'stripe_id' }),
    )
    expect(result).toEqual({ status: 'processed' })
  })

  it('Test 2: subscription.updated upserts and returns {status: pending_cron}', async () => {
    const event = makeEvent('customer.subscription.updated')
    const result = await handleSubscription(event as never)

    expect(mockUpsert).toHaveBeenCalled()
    expect(result).toEqual({ status: 'pending_cron' })
  })

  it('Test 3: subscription.deleted upserts with canceled_at set and subscription_status=canceled, returns {status: pending_cron}', async () => {
    const event = makeEvent('customer.subscription.deleted', {
      status: 'canceled',
      canceled_at: 1700100000,
    })
    const result = await handleSubscription(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        subscription_status: 'canceled',
        canceled_at: new Date(1700100000 * 1000).toISOString(),
      }),
      expect.anything(),
    )
    expect(result).toEqual({ status: 'pending_cron' })
  })

  it('Test 4: stripe_customer_id is mapped from subscription.customer string', async () => {
    const event = makeEvent('customer.subscription.created', { customer: 'cus_string_id' })
    await handleSubscription(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_customer_id: 'cus_string_id' }),
      expect.anything(),
    )
  })

  it('Test 5: current_period_start/end mapped from Unix timestamps to ISO strings', async () => {
    const event = makeEvent('customer.subscription.created', {
      current_period_start: 1700000000,
      current_period_end: 1702592000,
    })
    await handleSubscription(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        current_period_start: new Date(1700000000 * 1000).toISOString(),
        current_period_end: new Date(1702592000 * 1000).toISOString(),
      }),
      expect.anything(),
    )
  })

  it('Test 6: cancel_at_period_end mapped from subscription boolean', async () => {
    const event = makeEvent('customer.subscription.updated', { cancel_at_period_end: true })
    await handleSubscription(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ cancel_at_period_end: true }),
      expect.anything(),
    )
  })

  it('throws when upsert returns an error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })
    const event = makeEvent('customer.subscription.created')

    await expect(handleSubscription(event as never)).rejects.toThrow('stripe_orders upsert failed: DB error')
  })
})
