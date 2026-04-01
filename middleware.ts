import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { createServerClient } from '@supabase/ssr'

// Public paths that don't require authentication
const PUBLIC_PATHS = [
  '/sign-in', '/sign-up', '/register', '/login', '/forgot-password', '/reset-password',
  '/events', '/academy', '/auth/callback', '/account/set-password',
]

// Paths that require auth
const PROTECTED_PATHS = [
  '/dashboard', '/admin', '/profile', '/connections', '/members',
]

// Paths that bypass maintenance mode (auth + maintenance page itself)
const MAINTENANCE_BYPASS_PATHS = [
  '/maintenance',
  '/sign-in', '/sign-up', '/register', '/login', '/forgot-password', '/reset-password',
  '/auth/callback', '/account/set-password',
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

// ─── Page visibility cache (60s TTL) ─────────────────────────────────────────

interface PageVisibilityEntry {
  enabled: boolean
  fallback1: string
  fallback2: string
}

interface PageVisibilityCache {
  pages: Record<string, PageVisibilityEntry>
  expires: number
}

let pageVisibilityCache: PageVisibilityCache | null = null

async function getPageVisibility(): Promise<Record<string, PageVisibilityEntry> | null> {
  const now = Date.now()
  if (pageVisibilityCache && now < pageVisibilityCache.expires) {
    return pageVisibilityCache.pages
  }

  try {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    const url = `${supabaseUrl}/rest/v1/site_settings?key=eq.page_visibility&select=value`
    const res = await fetch(url, {
      headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
    })
    if (!res.ok) return null
    const rows = (await res.json()) as Array<{ value: string }>
    if (!rows[0]?.value) return null
    const pages = JSON.parse(rows[0].value) as Record<string, PageVisibilityEntry>
    pageVisibilityCache = { pages, expires: now + 60_000 }
    return pages
  } catch {
    return null
  }
}

function getPageRedirect(pathname: string, pages: Record<string, PageVisibilityEntry>): string | null {
  // Find the matching page entry
  let entry: PageVisibilityEntry | undefined
  for (const path of Object.keys(pages)) {
    if (pathname === path || pathname.startsWith(path + '/')) {
      entry = pages[path]
      break
    }
  }
  if (!entry || entry.enabled) return null

  // Check fallback1
  const fb1 = pages[entry.fallback1]
  if (!fb1 || fb1.enabled) return entry.fallback1

  // Check fallback2
  const fb2 = pages[entry.fallback2]
  if (!fb2 || fb2.enabled) return entry.fallback2

  // Both fallbacks disabled — do not redirect (loop protection)
  return null
}

// ─── Middleware ───────────────────────────────────────────────────────────────

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname

  // ─── Maintenance check (TTL-cached, no Supabase client needed) ──────────────
  const isMaintenanceBypass = MAINTENANCE_BYPASS_PATHS.some(p => pathname === p || pathname.startsWith(p + '/'))
  const isProtectedPath     = PROTECTED_PATHS.some(p => pathname.startsWith(p))

  const maintenanceActive = await getMaintenanceActive()

  // Fast path: skip auth entirely for public paths when maintenance is off
  // For `/`, check if auth cookie exists — only then do full auth to redirect logged-in users
  const hasAuthCookie = pathname === '/' && request.cookies.getAll().some(c => c.name.startsWith('sb-'))
  if (!maintenanceActive && !isProtectedPath && !(pathname === '/' && hasAuthCookie)) {
    const requestHeaders = new Headers(request.headers)
    requestHeaders.set('x-pathname', pathname)
    const res = NextResponse.next({ request: { headers: requestHeaders } })
    res.headers.set('x-pathname', pathname)
    return res
  }

  // ─── Set up Supabase client (needed for session refresh + auth) ──────────────
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-pathname', pathname)
  let response = NextResponse.next({ request: { headers: requestHeaders } })

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
          response = NextResponse.next({ request: { headers: requestHeaders } })
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

  // ─── Logged-in users on / → /dashboard ─────────────────────────────────────
  if (pathname === '/' && user) {
    return NextResponse.redirect(new URL('/dashboard', request.url))
  }

  // Auth checks for authenticated users
  if (user) {
    const isAdminPath = pathname.startsWith('/admin')
    const isSetPasswordPage = pathname === '/account/set-password'

    // ─── Fetch profile once for all auth checks ──────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, requires_password_reset')
      .eq('id', user.id)
      .single()

    // ─── Password reset interception (migrated users) ────────────────────────
    if (!isSetPasswordPage && profile?.requires_password_reset === true) {
      return NextResponse.redirect(new URL('/account/set-password', request.url))
    }

    // Admin paths: check role
    if (isAdminPath) {
      const role = profile?.role ?? 'member'
      const isAdminOrMod = role === 'admin' || role === 'moderator'

      if (!isAdminOrMod) {
        return NextResponse.redirect(new URL('/dashboard', request.url))
      }
    }
  }

  // ─── Page visibility enforcement ──────────────────────────────────────────────
  // Only redirect non-admin users away from disabled pages
  if (user) {
    const { data: pvProfile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()
    const pvRole = pvProfile?.role ?? 'member'
    if (pvRole !== 'admin' && pvRole !== 'moderator') {
      const pages = await getPageVisibility()
      if (pages) {
        const redirect = getPageRedirect(pathname, pages)
        if (redirect) {
          return NextResponse.redirect(new URL(redirect, request.url))
        }
      }
    }
  }

  // Ensure x-pathname is on the final response (setAll may have replaced it)
  response.headers.set('x-pathname', pathname)
  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon\\.ico|images/|api/).*)',
  ],
}
