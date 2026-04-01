import { vi, describe, it, expect, beforeEach } from 'vitest'

vi.mock('server-only', () => ({}))

const mockUpsert = vi.fn().mockResolvedValue({ error: null })
const mockFrom = vi.fn().mockReturnValue({ upsert: mockUpsert })
vi.mock('@/lib/supabase/service', () => ({
  getSupabaseService: () => ({ from: mockFrom }),
}))

const { handleProduct } = await import('@/lib/stripe/handlers/product')

describe('handleProduct', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockUpsert.mockResolvedValue({ error: null })
    mockFrom.mockReturnValue({ upsert: mockUpsert })
  })

  it('product.created event calls upsert on stripe_products with correct fields', async () => {
    const event = {
      type: 'product.created',
      data: {
        object: {
          id: 'prod_123',
          name: 'Test Product',
          description: 'A test product',
          active: true,
          images: ['https://example.com/img.png'],
          metadata: { key: 'value' },
        },
      },
    } as any

    await handleProduct(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_products')
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        stripe_id: 'prod_123',
        name: 'Test Product',
        description: 'A test product',
        active: true,
        images: ['https://example.com/img.png'],
        metadata: { key: 'value' },
      },
      { onConflict: 'stripe_id' }
    )
  })

  it('product.updated event calls same upsert pattern (idempotent)', async () => {
    const event = {
      type: 'product.updated',
      data: {
        object: {
          id: 'prod_456',
          name: 'Updated Product',
          description: null,
          active: true,
          images: [],
          metadata: {},
        },
      },
    } as any

    await handleProduct(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_products')
    expect(mockUpsert).toHaveBeenCalledWith(
      {
        stripe_id: 'prod_456',
        name: 'Updated Product',
        description: null,
        active: true,
        images: [],
        metadata: {},
      },
      { onConflict: 'stripe_id' }
    )
  })

  it('product.deleted event calls upsert with active=false', async () => {
    const event = {
      type: 'product.deleted',
      data: {
        object: {
          id: 'prod_789',
          name: 'Deleted Product',
          description: null,
          active: true,
          images: [],
          metadata: {},
        },
      },
    } as any

    await handleProduct(event)

    expect(mockFrom).toHaveBeenCalledWith('stripe_products')
    expect(mockUpsert).toHaveBeenCalledWith(
      expect.objectContaining({
        stripe_id: 'prod_789',
        active: false,
      }),
      { onConflict: 'stripe_id' }
    )
  })

  it('upsert error throws Error with message containing "stripe_products upsert failed"', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'DB error' } })

    const event = {
      type: 'product.created',
      data: {
        object: {
          id: 'prod_err',
          name: 'Error Product',
          description: null,
          active: true,
          images: [],
          metadata: {},
        },
      },
    } as any

    await expect(handleProduct(event)).rejects.toThrow('stripe_products upsert failed')
  })
})
