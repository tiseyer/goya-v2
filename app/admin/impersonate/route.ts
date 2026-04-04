import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const token = searchParams.get('token')

  if (!token) {
    return NextResponse.redirect(new URL('/dashboard', origin))
  }

  // Build the redirect response first so session cookies are written directly onto it.
  // This isolates the session to this response (and therefore this tab) only —
  // the same pattern used in app/auth/callback/route.ts.
  const response = NextResponse.redirect(new URL('/dashboard', origin))

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options)
          })
        },
      },
    }
  )

  const { error } = await supabase.auth.verifyOtp({
    token_hash: token,
    type: 'magiclink',
  })

  if (error) {
    console.error('[admin/impersonate] verifyOtp error:', error.message)
    return NextResponse.redirect(new URL('/sign-in?error=impersonate_failed', origin))
  }

  // Session cookies have been written onto `response` by the setAll callback.
  // Return the redirect — only this tab receives the new session.
  return response
}
