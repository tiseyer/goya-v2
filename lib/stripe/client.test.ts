import { vi, describe, it, expect, beforeEach } from 'vitest'

// Mock server-only to prevent build error in test environment
vi.mock('server-only', () => ({}))

// Mock Stripe constructor
const MockStripe = vi.fn()
vi.mock('stripe', () => ({
  default: MockStripe,
}))

describe('getStripe', () => {
  beforeEach(() => {
    vi.resetModules()
    MockStripe.mockClear()
    delete process.env.STRIPE_SECRET_KEY
  })

  it('returns a Stripe instance when STRIPE_SECRET_KEY is set', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing'
    const mockInstance = { id: 'mock-stripe' }
    MockStripe.mockReturnValue(mockInstance)

    const { getStripe } = await import('@/lib/stripe/client')
    const result = getStripe()

    expect(MockStripe).toHaveBeenCalledWith('sk_test_fake_key_for_testing')
    expect(result).toBe(mockInstance)
  })

  it('throws when STRIPE_SECRET_KEY is not set', async () => {
    const { getStripe } = await import('@/lib/stripe/client')
    expect(() => getStripe()).toThrow('STRIPE_SECRET_KEY is not set')
  })

  it('returns the same instance on repeated calls (singleton)', async () => {
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key_for_testing'
    const mockInstance = { id: 'mock-stripe' }
    MockStripe.mockReturnValue(mockInstance)

    const { getStripe } = await import('@/lib/stripe/client')
    const first = getStripe()
    const second = getStripe()

    expect(first).toBe(second)
    expect(MockStripe).toHaveBeenCalledTimes(1)
  })
})
