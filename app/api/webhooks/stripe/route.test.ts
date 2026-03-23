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

// Import after mocks
const { POST } = await import('@/app/api/webhooks/stripe/route')

describe('POST /api/webhooks/stripe', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret'
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
})
