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
// Note: /members is intentionally excluded — public profiles are readable by any logged-in user
const ONBOARDING_GATED_PATHS = [
  '/dashboard', '/profile', '/connections',
]

// Paths that bypass maintenance mode (auth + maintenance page itself)
const MAINTENANCE_BYPASS_PATHS = [
  '/maintenance',
  '/sign-in', '/sign-up', '/register', '/login', '/forgot-password', '/reset-password',
]

// ─── Maintenance settings cache (60s TTL, module-level for Edge Runtime) ──────

interface MaintenanceCache {
  enabled: boolean
  scheduled: boolean
  start: string
  end: string
  expires: number
}

let maintenanceCache: MaintenanceCache | null = null

function isMaintenanceActive(cache: MaintenanceCache): boolean {
  if (cache.enabled) return true
  if (cache.scheduled && cache.start && cache.end) {
    const now = Date.now()
    const start = new Date(cache.start).getTime()
    const end   = new Date(cache.end).getTime()
    return now >= start && now <= end
  }
  return false
}

async function getMaintenanceActive(): Promise<boolean> {
  const now = Date.now()
  if (maintenanceCache && now < maintenanceCache.expires) {
    return isMaintenanceActive(maintenanceCache)
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const url = `${supabaseUrl}/rest/v1/site_settings?key=in.(maintenance_mode_enabled,maintenance_mode_scheduled,maintenance_start_utc,maintenance_end_utc)&select=key,value`
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    if (!res.ok) return false
    const rows = (await res.json()) as Array<{ key: string; value: string }>
    const map: Record<string, string> = {}
    rows.forEach(r => { map[r.key] = r.value ?? '' })
    maintenanceCache = {
      enabled:   map.maintenance_mode_enabled   === 'true',
      scheduled: map.maintenance_mode_scheduled === 'true',
      start:     map.maintenance_start_utc ?? '',
      end:       map.maintenance_end_utc   ?? '',
      expires:   now + 60_000,
    }
    return isMaintenanceActive(maintenanceCache)
  } catch {
    return false
  }
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ─── Maintenance check (TTL-cached, no Supabase client needed) ──────────────
  const isMaintenanceBypass = MAINTENANCE_BYPASS_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProtectedPath     = PROTECTED_PATHS.some(p => pathname.startsWith(p))
  const isOnboardingPath    = pathname.startsWith('/onboarding')

  const maintenanceActive = await getMaintenanceActive()

  // Fast path: skip auth entirely for public paths when maintenance is off
  if (!maintenanceActive && !isProtectedPath && !isOnboardingPath) {
    return NextResponse.next({ request: { headers: request.headers } })
  }

  // ─── Set up Supabase client (needed for session refresh + auth) ──────────────
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

  // ─── Maintenance enforcement ─────────────────────────────────────────────────
  if (maintenanceActive && !isMaintenanceBypass) {
    if (!user) {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
    const { data: mmProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const role = mmProfile?.role ?? 'member'
    if (role !== 'admin' && role !== 'moderator') {
      return NextResponse.redirect(new URL('/maintenance', request.url))
    }
  }

  // ─── Impersonation cookie security ──────────────────────────────────────────
  // If the impersonation cookie exists, verify the real session user is an admin.
  // Guards against manually crafted cookies or stale sessions.
  const impersonatingValue = request.cookies.get('goya_impersonating')?.value
  if (impersonatingValue && user) {
    const { data: impersonatorProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (impersonatorProfile?.role !== 'admin') {
      // Non-admin has impersonation cookie — security violation, clear and redirect
      const cleanResponse = NextResponse.redirect(new URL('/', request.url))
      cleanResponse.cookies.delete('goya_impersonating')
      cleanResponse.cookies.delete('goya_impersonation_log_id')
      return cleanResponse
    }
  }
  if (impersonatingValue && !user) {
    // Cookie exists but no session — clear it
    const cleanResponse = NextResponse.redirect(new URL('/sign-in', request.url))
    cleanResponse.cookies.delete('goya_impersonating')
    cleanResponse.cookies.delete('goya_impersonation_log_id')
    return cleanResponse
  }

  // ─── Auth enforcement ────────────────────────────────────────────────────────
  if (isProtectedPath && !user) {
    const next = encodeURIComponent(pathname)
    return NextResponse.redirect(new URL(`/sign-in?next=${next}`, request.url))
  }

  // Onboarding redirect logic for authenticated users
  if (user) {
    const isOnboardingGated = ONBOARDING_GATED_PATHS.some(p => pathname.startsWith(p))
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
    '/((?!_next/static|_next/image|favicon\\.ico|images/|api/).*)',
  ],
}
