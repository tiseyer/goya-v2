import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export const dynamic = 'force-dynamic'

// ─── Types ──────────────────────────────────────────────────────────────────

interface TimeseriesPoint {
  visitors?: number
  pageViews?: number
  [key: string]: unknown
}

interface TopItem {
  key?: string
  total?: number
  [key: string]: unknown
}

interface VercelTimeseriesResponse {
  data?: TimeseriesPoint[]
  [key: string]: unknown
}

interface VercelTopResponse {
  data?: TopItem[]
  [key: string]: unknown
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function buildVercelHeaders() {
  return {
    Authorization: `Bearer ${process.env.VERCEL_ACCESS_TOKEN}`,
    'Content-Type': 'application/json',
  }
}

function todayRange() {
  const now = new Date()
  const from = new Date(now)
  from.setUTCHours(0, 0, 0, 0)
  return { from: from.toISOString(), to: now.toISOString() }
}

function last7DaysRange() {
  const now = new Date()
  const from = new Date(now)
  from.setUTCDate(from.getUTCDate() - 7)
  return { from: from.toISOString(), to: now.toISOString() }
}

function sumTimeseries(data?: TimeseriesPoint[]): { visitors: number; pageViews: number } {
  if (!Array.isArray(data)) return { visitors: 0, pageViews: 0 }
  let visitors = 0
  let pageViews = 0
  for (const point of data) {
    visitors += Number(point?.visitors) || 0
    pageViews += Number(point?.pageViews) || 0
  }
  return { visitors, pageViews }
}

// ─── Route handler ───────────────────────────────────────────────────────────

export async function GET() {
  // Auth check
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role as string)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  // Check env vars
  const accessToken = process.env.VERCEL_ACCESS_TOKEN
  const projectId = process.env.VERCEL_PROJECT_ID

  if (!accessToken || !projectId) {
    return NextResponse.json(
      { error: 'Analytics not configured' },
      {
        status: 503,
        headers: { 'Cache-Control': 'no-store' },
      }
    )
  }

  const headers = buildVercelHeaders()
  const today = todayRange()
  const last7 = last7DaysRange()
  const base = 'https://vercel.com/api/web-analytics'
  const env = 'production'
  const filter = encodeURIComponent('{}')

  // Fetch all four endpoints in parallel
  const [todayRes, last7Res, pagesRes, countriesRes] = await Promise.allSettled([
    fetch(
      `${base}/timeseries?projectId=${projectId}&environment=${env}&filter=${filter}&from=${encodeURIComponent(today.from)}&to=${encodeURIComponent(today.to)}`,
      { headers }
    ),
    fetch(
      `${base}/timeseries?projectId=${projectId}&environment=${env}&filter=${filter}&from=${encodeURIComponent(last7.from)}&to=${encodeURIComponent(last7.to)}`,
      { headers }
    ),
    fetch(
      `${base}/pages?projectId=${projectId}&environment=${env}&filter=${filter}&from=${encodeURIComponent(last7.from)}&to=${encodeURIComponent(last7.to)}&limit=5`,
      { headers }
    ),
    fetch(
      `${base}/countries?projectId=${projectId}&environment=${env}&filter=${filter}&from=${encodeURIComponent(last7.from)}&to=${encodeURIComponent(last7.to)}&limit=5`,
      { headers }
    ),
  ])

  // Parse timeseries today
  let visitorsToday = 0
  let pageViewsToday = 0
  if (todayRes.status === 'fulfilled' && todayRes.value.ok) {
    try {
      const json = (await todayRes.value.json()) as VercelTimeseriesResponse
      const sums = sumTimeseries(json?.data)
      visitorsToday = sums.visitors
      pageViewsToday = sums.pageViews
    } catch (err) {
      console.error('[analytics] failed to parse today timeseries:', err)
    }
  } else if (todayRes.status === 'fulfilled') {
    console.error('[analytics] today timeseries non-200:', todayRes.value.status)
  } else {
    console.error('[analytics] today timeseries fetch error:', todayRes.reason)
  }

  // Parse timeseries last 7 days
  let visitorsLast7 = 0
  let pageViewsLast7 = 0
  if (last7Res.status === 'fulfilled' && last7Res.value.ok) {
    try {
      const json = (await last7Res.value.json()) as VercelTimeseriesResponse
      const sums = sumTimeseries(json?.data)
      visitorsLast7 = sums.visitors
      pageViewsLast7 = sums.pageViews
    } catch (err) {
      console.error('[analytics] failed to parse last7 timeseries:', err)
    }
  } else if (last7Res.status === 'fulfilled') {
    console.error('[analytics] last7 timeseries non-200:', last7Res.value.status)
  } else {
    console.error('[analytics] last7 timeseries fetch error:', last7Res.reason)
  }

  // Parse top pages
  let topPages: Array<{ key: string; total: number }> = []
  if (pagesRes.status === 'fulfilled' && pagesRes.value.ok) {
    try {
      const json = (await pagesRes.value.json()) as VercelTopResponse
      topPages = (json?.data ?? []).map((item) => ({
        key: String(item?.key ?? ''),
        total: Number(item?.total ?? 0),
      }))
    } catch (err) {
      console.error('[analytics] failed to parse top pages:', err)
    }
  } else if (pagesRes.status === 'fulfilled') {
    console.error('[analytics] top pages non-200:', pagesRes.value.status)
  } else {
    console.error('[analytics] top pages fetch error:', pagesRes.reason)
  }

  // Parse top countries
  let topCountries: Array<{ key: string; total: number }> = []
  if (countriesRes.status === 'fulfilled' && countriesRes.value.ok) {
    try {
      const json = (await countriesRes.value.json()) as VercelTopResponse
      topCountries = (json?.data ?? []).map((item) => ({
        key: String(item?.key ?? ''),
        total: Number(item?.total ?? 0),
      }))
    } catch (err) {
      console.error('[analytics] failed to parse top countries:', err)
    }
  } else if (countriesRes.status === 'fulfilled') {
    console.error('[analytics] top countries non-200:', countriesRes.value.status)
  } else {
    console.error('[analytics] top countries fetch error:', countriesRes.reason)
  }

  return NextResponse.json(
    {
      visitors: { today: visitorsToday, last7Days: visitorsLast7 },
      pageViews: { today: pageViewsToday, last7Days: pageViewsLast7 },
      topPages,
      topCountries,
    },
    { headers: { 'Cache-Control': 'no-store' } }
  )
}
