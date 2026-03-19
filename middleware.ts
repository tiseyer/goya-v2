import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          )
          response = NextResponse.next({ request })
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  const { data: { user } } = await supabase.auth.getUser()

  const pathname = request.nextUrl.pathname
  const protectedPaths = ['/dashboard', '/admin', '/profile', '/onboarding']
  const isProtected = protectedPaths.some(p => pathname.startsWith(p))

  // Require auth on protected paths
  if (isProtected && !user) {
    const next = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/sign-in?next=${next}`, request.url))
  }

  // Onboarding redirect logic for authenticated users
  if (user && (pathname.startsWith('/dashboard') || pathname.startsWith('/onboarding'))) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', user.id)
      .single()

    const onboardingCompleted = profile?.onboarding_completed ?? true

    // Redirect /dashboard → /onboarding if onboarding not done
    if (pathname.startsWith('/dashboard') && !onboardingCompleted) {
      return NextResponse.redirect(new URL('/onboarding', request.url))
    }

    // Redirect /onboarding → /dashboard if already completed
    if (pathname.startsWith('/onboarding') && onboardingCompleted) {
      return NextResponse.redirect(new URL('/dashboard', request.url))
    }
  }

  return response
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/admin/:path*',
    '/profile/:path*',
    '/onboarding/:path*',
  ],
}
