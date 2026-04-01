import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock getSupabaseService
const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({ from: mockFrom }),
}))

// Import after mocks
const { handlePaymentIntent } = await import('@/lib/stripe/handlers/payment-intent')

function makeEvent(type: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_pi_test_001',
    type,
    data: {
      object: {
        id: 'pi_test123',
        object: 'payment_intent',
        customer: 'cus_test456',
        amount: 2999,
        currency: 'usd',
        status: 'succeeded',
        metadata: {},
        ...overrides,
      },
    },
  }
}

describe('handlePaymentIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('Test 1: payment_intent.succeeded upserts with type=one_time, status=succeeded, returns {status: processed}', async () => {
    const event = makeEvent('payment_intent.succeeded')
    const result = await handlePaymentIntent(event as never)

    expect(mockFrom).toHaveBeenCalledWith('stripe_orders')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_id: 'pi_test123',
        type: 'one_time',
        status: 'succeeded',
        stripe_event_id: 'evt_pi_test_001',
      }),
      expect.objectContaining({ onConflict: 'stripe_id' }),
    )
    expect(result).toEqual({ status: 'processed' })
  })

  it('Test 2: payment_intent.payment_failed upserts with status from event object, returns {status: processed}', async () => {
    const event = makeEvent('payment_intent.payment_failed', {
      status: 'requires_payment_method',
    })
    const result = await handlePaymentIntent(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'requires_payment_method' }),
      expect.anything(),
    )
    expect(result).toEqual({ status: 'processed' })
  })

  it('Test 3: stripe_customer_id extracted from payment_intent.customer string', async () => {
    const event = makeEvent('payment_intent.succeeded', { customer: 'cus_string_only' })
    await handlePaymentIntent(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_customer_id: 'cus_string_only' }),
      expect.anything(),
    )
  })

  it('Test 4: amount_total mapped from payment_intent.amount', async () => {
    const event = makeEvent('payment_intent.succeeded', { amount: 4999 })
    await handlePaymentIntent(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ amount_total: 4999 }),
      expect.anything(),
    )
  })

  it('handles null customer gracefully', async () => {
    const event = makeEvent('payment_intent.succeeded', { customer: null })
    await handlePaymentIntent(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_customer_id: null }),
      expect.anything(),
    )
  })

  it('throws when upsert returns an error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })
    const event = makeEvent('payment_intent.succeeded')

    await expect(handlePaymentIntent(event as never)).rejects.toThrow('stripe_orders upsert failed: DB error')
  })
})
