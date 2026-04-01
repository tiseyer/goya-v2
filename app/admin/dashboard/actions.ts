'use server'

import { getSupabaseService } from '@/lib/supabase/service'

export async function getMemberGrowthData(
  range: string,
  roleFilter: string,
): Promise<{ date: string; count: number }[]> {
  const svc = getSupabaseService()

  // Calculate start date
  const now = new Date()
  let startDate: Date
  switch (range) {
    case '30D':  startDate = new Date(now.getTime() - 30  * 86400000); break
    case '90D':  startDate = new Date(now.getTime() - 90  * 86400000); break
    case '6M':   startDate = new Date(now.getTime() - 180 * 86400000); break
    case '1Y':   startDate = new Date(now.getTime() - 365 * 86400000); break
    case 'YTD':  startDate = new Date(now.getFullYear(), 0, 1);        break
    default:     startDate = new Date(2020, 0, 1);                     // All time
  }

  // ── Schools branch ─────────────────────────────────────────────────────────
  if (roleFilter === 'schools') {
    const { data, error } = await svc
      .from('schools')
      .select('created_at')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: true })

    if (error) return []

    const { count: baseCount } = await svc
      .from('schools')
      .select('*', { count: 'exact', head: true })
      .lt('created_at', startDate.toISOString())

    return buildCumulative(data ?? [], baseCount ?? 0)
  }

  // ── Profiles branch ────────────────────────────────────────────────────────
  let query = svc
    .from('profiles')
    .select('created_at')
    .not('wp_roles', 'cs', '{"faux"}')
    .not('wp_roles', 'cs', '{"robot"}')
    .gte('created_at', startDate.toISOString())
    .order('created_at', { ascending: true })

  if (roleFilter === 'teachers')  query = query.eq('role', 'teacher')
  else if (roleFilter === 'students') query = query.eq('role', 'student')
  else if (roleFilter === 'wellness') query = query.eq('role', 'wellness_practitioner')

  const { data, error } = await query
  if (error) return []

  let baseQuery = svc
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .not('wp_roles', 'cs', '{"faux"}')
    .not('wp_roles', 'cs', '{"robot"}')
    .lt('created_at', startDate.toISOString())

  if (roleFilter === 'teachers')  baseQuery = baseQuery.eq('role', 'teacher')
  else if (roleFilter === 'students') baseQuery = baseQuery.eq('role', 'student')
  else if (roleFilter === 'wellness') baseQuery = baseQuery.eq('role', 'wellness_practitioner')

  const { count: baseCount } = await baseQuery

  return buildCumulative(data ?? [], baseCount ?? 0)
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function buildCumulative(
  rows: { created_at: string }[],
  base: number,
): { date: string; count: number }[] {
  const dailyCounts = new Map<string, number>()
  for (const row of rows) {
    const date = row.created_at.split('T')[0] // YYYY-MM-DD
    dailyCounts.set(date, (dailyCounts.get(date) ?? 0) + 1)
  }

  let cumulative = base
  const chartData: { date: string; count: number }[] = []
  for (const date of [...dailyCounts.keys()].sort()) {
    cumulative += dailyCounts.get(date)!
    chartData.push({ date, count: cumulative })
  }
  return chartData
}
