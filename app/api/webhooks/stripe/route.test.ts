import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock server-only (transitive through lib/stripe/client)
vi.mock('server-only', () => ({}))

// Mock next/headers
const mockGet = vi.fn()
vi.mock('next/headers', () => ({
  headers: vi.fn().mockResolvedValue({ get: mockGet }),
}))

// Mock getStripe
const mockConstructEvent = vi.fn()
vi.mock('@/lib/stripe/client', () => ({
  getStripe: () => ({
    webhooks: {
      constructEvent: mockConstructEvent,
    },
  }),
}))

// Mock getSupabaseService with chainable mock
const mockInsert = vi.fn()
const mockUpdate = vi.fn()
const mockEq = vi.fn()

const mockFrom = vi.fn(() => ({
  insert: mockInsert,
  update: mockUpdate,
  select: vi.fn(() => ({})),
}))

vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({
    from: mockFrom,
  }),
}))

// Mock handler modules to avoid real DB calls in tests
const mockHandleSubscription = vi.fn()
const mockHandlePaymentIntent = vi.fn()
const mockHandleInvoice = vi.fn()
const mockHandleProduct = vi.fn()
const mockHandlePrice = vi.fn()
const mockHandleCoupon = vi.fn()

vi.mock('@/lib/stripe/handlers/subscription', () => ({
  handleSubscription: (...args: any[]) => mockHandleSubscription(...args),
}))
vi.mock('@/lib/stripe/handlers/payment-intent', () => ({
  handlePaymentIntent: (...args: any[]) => mockHandlePaymentIntent(...args),
}))
vi.mock('@/lib/stripe/handlers/invoice', () => ({
  handleInvoice: (...args: any[]) => mockHandleInvoice(...args),
}))
vi.mock('@/lib/stripe/handlers/product', () => ({
  handleProduct: (...args: any[]) => mockHandleProduct(...args),
}))
vi.mock('@/lib/stripe/handlers/price', () => ({
  handlePrice: (...args: any[]) => mockHandlePrice(...args),
}))
vi.mock('@/lib/stripe/handlers/coupon', () => ({
  handleCoupon: (...args: any[]) => mockHandleCoupon(...args),
}))

// Import after mocks
const { POST } = await import('@/app/api/webhooks/stripe/route')

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'

    // Default: insert succeeds
    mockInsert.mockResolvedValue({ error: null })

    // Default: update returns chainable eq
    mockEq.mockResolvedValue({})
    mockUpdate.mockReturnValue({ eq: mockEq })
  })

  it('returns 400 when stripe-signature header is missing', async () => {
    mockGet.mockReturnValue(null)

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{}',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toBe('Missing stripe-signature header')
  })

  it('returns 400 when signature verification fails', async () => {
    mockGet.mockReturnValue('sig_invalid')
    mockConstructEvent.mockImplementation(() => {
      throw new Error('No signatures found matching the expected signature')
    })

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"type":"test"}',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(400)
    expect(json.error).toContain('Webhook signature verification failed')
    expect(json.error).toContain('No signatures found matching the expected signature')
  })

  it('returns 200 when signature is valid', async () => {
    mockGet.mockReturnValue('sig_valid')
    mockConstructEvent.mockReturnValue({
      id: 'evt_test_123',
      type: 'payment_intent.succeeded',
    })
    mockHandlePaymentIntent.mockResolvedValue({ status: 'processed' })

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"type":"payment_intent.succeeded"}',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.received).toBe(true)
  })

  it('passes raw text body to constructEvent (not parsed JSON)', async () => {
    const rawBody = '{"type":"payment_intent.succeeded","id":"evt_123"}'
    mockGet.mockReturnValue('sig_valid')
    mockConstructEvent.mockReturnValue({
      id: 'evt_123',
      type: 'payment_intent.succeeded',
    })
    mockHandlePaymentIntent.mockResolvedValue({ status: 'processed' })

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: rawBody,
    })

    await POST(request)

    expect(mockConstructEvent).toHaveBeenCalledWith(
      rawBody,
      'sig_valid',
      'whsec_test_secret'
    )
  })

  it('inserts event into webhook_events before dispatching', async () => {
    mockGet.mockReturnValue('sig_valid')
    mockConstructEvent.mockReturnValue({
      id: 'evt_insert_test',
      type: 'product.created',
    })
    mockHandleProduct.mockResolvedValue(undefined)

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"type":"product.created"}',
    })

    await POST(request)

    expect(mockFrom).toHaveBeenCalledWith('webhook_events')
    expect(mockInsert).toHaveBeenCalledWith(
      expect.objectContaining({ stripe_event_id: 'evt_insert_test' })
    )
  })

  it('returns 200 without dispatching when event is duplicate (23505 error)', async () => {
    mockGet.mockReturnValue('sig_valid')
    mockConstructEvent.mockReturnValue({
      id: 'evt_duplicate',
      type: 'product.created',
    })
    mockInsert.mockResolvedValue({
      error: { code: '23505', message: 'unique violation' },
    })

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"type":"product.created"}',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.received).toBe(true)
    expect(mockHandleProduct).not.toHaveBeenCalled()
  })

  it('updates webhook_events status to processed after successful dispatch', async () => {
    mockGet.mockReturnValue('sig_valid')
    mockConstructEvent.mockReturnValue({
      id: 'evt_success',
      type: 'product.created',
    })
    mockHandleProduct.mockResolvedValue(undefined)

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"type":"product.created"}',
    })

    await POST(request)

    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'processed' })
    )
  })

  it('updates webhook_events status to failed when handler throws', async () => {
    mockGet.mockReturnValue('sig_valid')
    mockConstructEvent.mockReturnValue({
      id: 'evt_fail',
      type: 'product.created',
    })
    mockHandleProduct.mockRejectedValue(new Error('DB connection lost'))

    const request = new Request('http://localhost/api/webhooks/stripe', {
      method: 'POST',
      body: '{"type":"product.created"}',
    })

    const response = await POST(request)
    const json = await response.json()

    expect(response.status).toBe(200)
    expect(json.received).toBe(true)
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ status: 'failed' })
    )
  })
})
