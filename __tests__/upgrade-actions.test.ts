/**
 * Tests for app/upgrade/actions.ts
 * Covers: uploadCertificate and createUpgradeCheckoutSession server actions
 */

import { vi, describe, it, expect, beforeEach } from 'vitest'

// vi.mock is hoisted — factories must NOT reference top-level variables.
// Use vi.hoisted() to create mocks that can be referenced in both the factory and tests.

const { mockGetUser, mockUpload, mockGetPublicUrl, mockSessionsCreate, mockRedirect } = vi.hoisted(() => ({
  mockGetUser: vi.fn(),
  mockUpload: vi.fn(),
  mockGetPublicUrl: vi.fn(),
  mockSessionsCreate: vi.fn(),
  mockRedirect: vi.fn(),
}))

vi.mock('@/lib/supabaseServer', () => ({
  createSupabaseServerActionClient: vi.fn().mockResolvedValue({
    auth: { getUser: mockGetUser },
    storage: {
      from: vi.fn().mockReturnValue({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
      }),
    },
  }),
}))

vi.mock('@/lib/stripe/client', () => ({
  getStripe: vi.fn().mockReturnValue({
    checkout: {
      sessions: {
        create: mockSessionsCreate,
      },
    },
  }),
}))

vi.mock('next/navigation', () => ({
  redirect: mockRedirect,
}))

import { uploadCertificate, createUpgradeCheckoutSession } from '@/app/upgrade/actions'

// --- Tests ---

describe('uploadCertificate', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
    mockUpload.mockResolvedValue({ data: { path: 'user-123/12345-cert.pdf' }, error: null })
    mockGetPublicUrl.mockReturnValue({ data: { publicUrl: 'https://supabase.example.com/upgrade-certificates/user-123/12345-cert.pdf' } })
  })

  it('rejects files larger than 4MB', async () => {
    const largeFile = new File(['x'.repeat(4 * 1024 * 1024 + 1)], 'big.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', largeFile)

    const result = await uploadCertificate(formData)
    expect(result).toEqual({ error: 'File too large' })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('rejects invalid file types', async () => {
    const invalidFile = new File(['content'], 'doc.docx', { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' })
    const formData = new FormData()
    formData.append('file', invalidFile)

    const result = await uploadCertificate(formData)
    expect(result).toEqual({ error: 'Invalid file type' })
    expect(mockUpload).not.toHaveBeenCalled()
  })

  it('accepts valid PDF files within size limit', async () => {
    const validFile = new File(['pdf content'], 'cert.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', validFile)

    const result = await uploadCertificate(formData)
    expect(result).toEqual({ url: 'https://supabase.example.com/upgrade-certificates/user-123/12345-cert.pdf' })
    expect(mockUpload).toHaveBeenCalled()
  })

  it('accepts valid image files (jpeg, png, webp)', async () => {
    for (const [name, type] of [['cert.jpg', 'image/jpeg'], ['cert.png', 'image/png'], ['cert.webp', 'image/webp']]) {
      vi.clearAllMocks()
      mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } })
      mockUpload.mockResolvedValue({ data: { path: `user-123/12345-${name}` }, error: null })
      mockGetPublicUrl.mockReturnValue({ data: { publicUrl: `https://supabase.example.com/upgrade-certificates/user-123/12345-${name}` } })

      const validFile = new File(['img content'], name, { type })
      const formData = new FormData()
      formData.append('file', validFile)

      const result = await uploadCertificate(formData)
      expect(result).toHaveProperty('url')
    }
  })

  it('uploads to the upgrade-certificates bucket at the correct path', async () => {
    const validFile = new File(['pdf content'], 'my-cert.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', validFile)

    await uploadCertificate(formData)

    const [bucketPath] = mockUpload.mock.calls[0]
    expect(bucketPath).toMatch(/^user-123\/\d+-my-cert\.pdf$/)
  })

  it('returns error on storage upload failure', async () => {
    mockUpload.mockResolvedValue({ data: null, error: { message: 'Storage error' } })
    const validFile = new File(['pdf content'], 'cert.pdf', { type: 'application/pdf' })
    const formData = new FormData()
    formData.append('file', validFile)

    const result = await uploadCertificate(formData)
    expect(result).toEqual({ error: 'Storage error' })
  })
})

describe('createUpgradeCheckoutSession', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-456' } } })
    mockSessionsCreate.mockResolvedValue({
      url: 'https://checkout.stripe.com/pay/session_abc',
    })
    process.env.NEXT_PUBLIC_APP_URL = 'https://example.com'
  })

  it('redirects to sign-in if no user', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null } })

    await createUpgradeCheckoutSession(['https://example.com/cert.pdf'])

    expect(mockRedirect).toHaveBeenCalledWith('/sign-in')
  })

  it('creates a Stripe Checkout Session with mode:payment and capture_method:manual', async () => {
    await createUpgradeCheckoutSession(['https://example.com/cert.pdf'])

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        mode: 'payment',
        payment_intent_data: expect.objectContaining({
          capture_method: 'manual',
        }),
      })
    )
  })

  it('uses the correct Teacher Membership price ID', async () => {
    await createUpgradeCheckoutSession(['https://example.com/cert.pdf'])

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        line_items: expect.arrayContaining([
          expect.objectContaining({ price: 'price_1TE4kfDLfij4i9P9sUpSD2Si' }),
        ]),
      })
    )
  })

  it('includes teacher_upgrade type and user_id in metadata', async () => {
    await createUpgradeCheckoutSession(['https://example.com/cert.pdf'])

    expect(mockSessionsCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        metadata: expect.objectContaining({
          type: 'teacher_upgrade',
          user_id: 'user-456',
        }),
      })
    )
  })

  it('serializes certificate_urls into metadata as JSON', async () => {
    const urls = ['https://example.com/cert1.pdf', 'https://example.com/cert2.pdf']
    await createUpgradeCheckoutSession(urls)

    const call = mockSessionsCreate.mock.calls[0][0]
    expect(call.metadata.certificate_urls).toBe(JSON.stringify(urls))
  })

  it('returns the Stripe Checkout Session URL', async () => {
    const result = await createUpgradeCheckoutSession(['https://example.com/cert.pdf'])

    expect(result).toEqual({ url: 'https://checkout.stripe.com/pay/session_abc' })
  })

  it('returns error on Stripe failure', async () => {
    mockSessionsCreate.mockRejectedValue(new Error('Stripe is down'))

    const result = await createUpgradeCheckoutSession(['https://example.com/cert.pdf'])

    expect(result).toEqual({ error: 'Stripe is down' })
  })
})
