import React from 'react'
import { render, screen } from '@testing-library/react'
import { vi, type Mock } from 'vitest'
import Home from './page'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

vi.mock('@/lib/supabaseServer', () => ({
  createSupabaseServerClient: vi.fn(),
}))

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: any) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}))

const mockCreateSupabaseServerClient = createSupabaseServerClient as Mock

describe('Home page', () => {
  beforeEach(() => {
    vi.resetAllMocks()
  })

  it('renders dashboard link and logout form when user exists', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: { email: 'test@example.com' } },
    })

    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: { getUser },
    })

    const ui = await Home()
    render(ui)

    expect(screen.getByText('Logged in as')).toBeInTheDocument()
    expect(screen.getByText('Go to Dashboard')).toHaveAttribute('href', '/dashboard')

    const logoutButton = screen.getByText('Logout')
    const logoutForm = logoutButton.closest('form')
    expect(logoutForm).toHaveAttribute('action', '/logout')
    expect(logoutForm).toHaveAttribute('method', 'post')
  })

  it('renders login button and no dashboard link when no user', async () => {
    const getUser = vi.fn().mockResolvedValue({
      data: { user: null },
    })

    mockCreateSupabaseServerClient.mockResolvedValue({
      auth: { getUser },
    })

    const ui = await Home()
    render(ui)

    expect(screen.getByText('Login')).toBeInTheDocument()
    expect(screen.queryByText('Go to Dashboard')).not.toBeInTheDocument()
  })
})
