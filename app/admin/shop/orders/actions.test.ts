import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock server-only
vi.mock('server-only', () => ({}))

// Mock next/cache
vi.mock('next/cache', () => ({
  revalidatePath: vi.fn(),
}))

// Stripe method mocks
const mockRefundsCreate = vi.fn()
const mockSubscriptionsUpdate = vi.fn()
const mockSubscriptionsCancel = vi.fn()
const mockSubscriptionsCreate = vi.fn()
const mockInvoicesSend = vi.fn()
const mockInvoicesRetrieve = vi.fn()
const mockCustomersCreate = vi.fn()
const mockPaymentIntentsCreate = vi.fn()

vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    refunds: { create: mockRefundsCreate },
    subscriptions: {
      update: mockSubscriptionsUpdate,
      cancel: mockSubscriptionsCancel,
      create: mockSubscriptionsCreate,
    },
    invoices: {
      sendInvoice: mockInvoicesSend,
      retrieve: mockInvoicesRetrieve,
    },
    customers: { create: mockCustomersCreate },
    paymentIntents: { create: mockPaymentIntentsCreate },
  }),
}))

// Supabase mocks
const mockSelect = vi.fn()
const mockEq = vi.fn()
const mockSingle = vi.fn()
const mockUpdate = vi.fn()
const mockFrom = vi.fn()

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({
    from: mockFrom,
  }),
}))

// Import after mocks
const {
  refundOrder,
  cancelSubscription,
  resendInvoice,
  getInvoicePdfUrl,
  createManualOrder,
} = await import('./[id]/actions')

import { revalidatePath } from 'next/cache'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('refundOrder', () => {
  it('issues a full refund without amount when amountCents not provided', async () => {
    mockRefundsCreate.mockResolvedValue({ id: 're_123' })

    const result = await refundOrder('pi_test123')

    expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test123' })
    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/orders')
  })

  it('issues a partial refund with amount when amountCents provided', async () => {
    mockRefundsCreate.mockResolvedValue({ id: 're_456' })

    const result = await refundOrder('pi_test456', 5000)

    expect(mockRefundsCreate).toHaveBeenCalledWith({ payment_intent: 'pi_test456', amount: 5000 })
    expect(result).toEqual({ success: true })
  })

  it('returns error on stripe failure', async () => {
    mockRefundsCreate.mockRejectedValue(new Error('card_declined'))

    const result = await refundOrder('pi_bad')

    expect(result).toEqual({ success: false, error: 'card_declined' })
  })
})

describe('cancelSubscription', () => {
  it("schedule mode calls subscriptions.update with cancel_at_period_end: true", async () => {
    mockSubscriptionsUpdate.mockResolvedValue({ id: 'sub_123', cancel_at_period_end: true })

    const result = await cancelSubscription('sub_123', 'schedule')

    expect(mockSubscriptionsUpdate).toHaveBeenCalledWith('sub_123', { cancel_at_period_end: true })
    expect(mockSubscriptionsCancel).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true })
    expect(revalidatePath).toHaveBeenCalledWith('/admin/shop/orders')
  })

  it("immediate mode calls subscriptions.cancel", async () => {
    mockSubscriptionsCancel.mockResolvedValue({ id: 'sub_456', status: 'canceled' })

    const result = await cancelSubscription('sub_456', 'immediate')

    expect(mockSubscriptionsCancel).toHaveBeenCalledWith('sub_456')
    expect(mockSubscriptionsUpdate).not.toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it('returns error on stripe failure', async () => {
    mockSubscriptionsCancel.mockRejectedValue(new Error('sub_not_found'))

    const result = await cancelSubscription('sub_bad', 'immediate')

    expect(result).toEqual({ success: false, error: 'sub_not_found' })
  })
})

describe('resendInvoice', () => {
  it('calls stripe.invoices.sendInvoice with the invoiceId', async () => {
    mockInvoicesSend.mockResolvedValue({ id: 'in_123' })

    const result = await resendInvoice('in_123')

    expect(mockInvoicesSend).toHaveBeenCalledWith('in_123')
    expect(result).toEqual({ success: true })
  })

  it('returns error on failure', async () => {
    mockInvoicesSend.mockRejectedValue(new Error('invoice_not_found'))

    const result = await resendInvoice('in_bad')

    expect(result).toEqual({ success: false, error: 'invoice_not_found' })
  })
})

describe('getInvoicePdfUrl', () => {
  it('returns the invoice_pdf url from stripe', async () => {
    mockInvoicesRetrieve.mockResolvedValue({ id: 'in_123', invoice_pdf: 'https://pdf.stripe.com/in_123' })

    const result = await getInvoicePdfUrl('in_123')

    expect(mockInvoicesRetrieve).toHaveBeenCalledWith('in_123')
    expect(result).toBe('https://pdf.stripe.com/in_123')
  })

  it('returns null when invoice_pdf is missing', async () => {
    mockInvoicesRetrieve.mockResolvedValue({ id: 'in_456', invoice_pdf: null })

    const result = await getInvoicePdfUrl('in_456')

    expect(result).toBeNull()
  })
})

describe('createManualOrder', () => {
  it('creates a Stripe customer when user has no stripe_customer_id, then creates payment intent for one_time', async () => {
    // Profile without stripe_customer_id
    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: null, email: 'user@test.com', full_name: 'Test User' },
      error: null,
    })
    const mockEqUpdate = vi.fn().mockResolvedValue({ error: null })
    const mockUpdateFn = vi.fn().mockReturnValue({ eq: mockEqUpdate })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
          update: mockUpdateFn,
        }
      }
      return {}
    })
    mockCustomersCreate.mockResolvedValue({ id: 'cus_new123' })
    mockPaymentIntentsCreate.mockResolvedValue({ id: 'pi_new123' })

    const result = await createManualOrder({
      userId: 'user-uuid',
      productId: 'prod-uuid',
      stripeProductId: 'stripe_prod_id',
      stripePriceId: 'price_id',
      priceType: 'one_time',
    })

    expect(mockCustomersCreate).toHaveBeenCalledWith(
      expect.objectContaining({ email: 'user@test.com', name: 'Test User' })
    )
    expect(mockPaymentIntentsCreate).toHaveBeenCalled()
    expect(result).toEqual({ success: true })
  })

  it('creates a subscription for recurring price type', async () => {
    mockSingle.mockResolvedValue({
      data: { stripe_customer_id: 'cus_existing', email: 'user@test.com', full_name: 'Test User' },
      error: null,
    })
    mockFrom.mockImplementation((table: string) => {
      if (table === 'profiles') {
        return {
          select: vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ single: mockSingle }) }),
        }
      }
      return {}
    })
    mockSubscriptionsCreate.mockResolvedValue({ id: 'sub_new123' })

    const result = await createManualOrder({
      userId: 'user-uuid',
      productId: 'prod-uuid',
      stripeProductId: 'stripe_prod_id',
      stripePriceId: 'price_recurring',
      priceType: 'recurring',
    })

    expect(mockCustomersCreate).not.toHaveBeenCalled()
    expect(mockSubscriptionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        customer: 'cus_existing',
        items: [{ price: 'price_recurring' }],
      })
    )
    expect(result).toEqual({ success: true })
  })
})
