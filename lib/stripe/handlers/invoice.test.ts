import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock getSupabaseService
const mockUpsert = vi.fn()
const mockFrom = vi.fn(() => ({ upsert: mockUpsert }))

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({ from: mockFrom }),
}))

// Import after mocks
const { handleInvoice } = await import('@/lib/stripe/handlers/invoice')

function makeEvent(type: string, overrides: Record<string, unknown> = {}) {
  return {
    id: 'evt_inv_test_001',
    type,
    data: {
      object: {
        id: 'in_test123',
        object: 'invoice',
        customer: 'cus_test789',
        amount_paid: 1999,
        total: 1999,
        currency: 'usd',
        subscription: null,
        metadata: {},
        ...overrides,
      },
    },
  }
}

describe('handleInvoice', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
  })

  it('Test 1: invoice.paid upserts with stripe_id=invoice.id, status=paid, returns {status: pending_cron}', async () => {
    const event = makeEvent('invoice.paid')
    const result = await handleInvoice(event as never)

    expect(mockFrom).toHaveBeenCalledWith('stripe_orders')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_id: 'in_test123',
        status: 'paid',
        stripe_event_id: 'evt_inv_test_001',
      }),
      expect.objectContaining({ onConflict: 'stripe_id' }),
    )
    expect(result).toEqual({ status: 'pending_cron' })
  })

  it('Test 2: invoice.payment_failed upserts with status=payment_failed, returns {status: processed}', async () => {
    const event = makeEvent('invoice.payment_failed')
    const result = await handleInvoice(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'payment_failed' }),
      expect.anything(),
    )
    expect(result).toEqual({ status: 'processed' })
  })

  it('Test 3: maps invoice.subscription string into metadata for cross-referencing', async () => {
    const event = makeEvent('invoice.paid', { subscription: 'sub_linked123' })
    await handleInvoice(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({ subscription_id: 'sub_linked123' }),
      }),
      expect.anything(),
    )
  })

  it('Test 4: stripe_customer_id extracted from invoice.customer string', async () => {
    const event = makeEvent('invoice.paid', { customer: 'cus_inv_customer' })
    await handleInvoice(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_customer_id: 'cus_inv_customer' }),
      expect.anything(),
    )
  })

  it('sets type=recurring when invoice has a subscription', async () => {
    const event = makeEvent('invoice.paid', { subscription: 'sub_abc' })
    await handleInvoice(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'recurring' }),
      expect.anything(),
    )
  })

  it('sets type=one_time when invoice has no subscription', async () => {
    const event = makeEvent('invoice.paid', { subscription: null })
    await handleInvoice(event as never)

    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'one_time' }),
      expect.anything(),
    )
  })

  it('throws when upsert returns an error', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })
    const event = makeEvent('invoice.paid')

    await expect(handleInvoice(event as never)).rejects.toThrow('stripe_orders upsert failed: DB error')
  })
})
