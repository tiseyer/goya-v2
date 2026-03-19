import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/sign-in', '/sign-up', '/register', '/login', '/forgot-password', '/reset-password',
  '/events', '/academy',
]

// Paths that require auth
const PROTECTED_PATHS = [
  '/dashboard', '/admin', '/profile', '/onboarding', '/connections', '/members',
]

// Paths that need the onboarding gate (if onboarding not completed)
const ONBOARDING_GATED_PATHS = [
  '/dashboard', '/profile', '/connections', '/members',
]

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

  // Check if path is protected
  const isProtected = PROTECTED_PATHS.some(p => pathname.startsWith(p))

  // Require auth on protected paths
  if (isProtected && !user) {
    const next = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/sign-in?next=${next}`, request.url))
  }

  // Onboarding redirect logic for authenticated users
  if (user) {
    const isOnboardingGated = ONBOARDING_GATED_PATHS.some(p => pathname.startsWith(p))
    const isOnboardingPath = pathname.startsWith('/onboarding')
    const isAdminPath = pathname.startsWith('/admin')

    // Only fetch profile when we need to check onboarding status
    if (isOnboardingGated || isOnboardingPath) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_completed, role')
        .eq('id', user.id)
        .single()

      const onboardingCompleted = profile?.onboarding_completed ?? false
      const role = profile?.role ?? 'member'
      const isAdminOrMod = role === 'admin' || role === 'moderator'

      const previewMode = request.cookies.get('onboarding_preview_mode')?.value === 'true'

      // Admins/moderators bypass onboarding gate (unless in preview mode on /onboarding)
      if (isAdminOrMod && !previewMode) {
        // No onboarding redirects for admins/moderators
        return response
      }

      // Redirect onboarding-gated paths → /onboarding if not completed
      if (isOnboardingGated && !onboardingCompleted) {
        return NextResponse.redirect(new URL('/onboarding', request.url))
      }

      // Redirect /onboarding → /dashboard if already completed (unless admin in preview mode)
      if (isOnboardingPath && onboardingCompleted) {
        if (isAdminOrMod && previewMode) {
          // Allow admin to stay on onboarding in preview mode
          return response
        }
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }

    // Admin paths: fetch profile to check role
    if (isAdminPath) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single()

      const role = profile?.role ?? 'member'
      const isAdminOrMod = role === 'admin' || role === 'moderator'

      if (!isAdminOrMod) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
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
    '/connections/:path*',
    '/members/:path*',
  ],
}
