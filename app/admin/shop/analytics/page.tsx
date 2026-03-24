import { Suspense } from 'react'
import { getSupabaseService } from '@/lib/supabase/service'
import {
  computeFunnelMetrics,
  computeRevenueMetrics,
  bucketTimeSeries,
} from '@/lib/analytics/metrics'
import type { RoleFilter } from '@/lib/analytics/metrics'
import { subDays, subMonths } from 'date-fns'
import AnalyticsFilters from './AnalyticsFilters'
import AnalyticsCharts from './AnalyticsCharts'
import AnalyticsMetricCard from './AnalyticsMetricCard'
import CsvExportButton from './CsvExportButton'

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '')
}

function getRangeBoundaries(
  range: string,
  dateFrom: string,
  dateTo: string,
): { from: Date; to: Date } {
  const now = new Date()
  switch (range) {
    case '3mo':
      return { from: subMonths(now, 3), to: now }
    case '6mo':
      return { from: subMonths(now, 6), to: now }
    case 'custom': {
      const from = dateFrom ? new Date(dateFrom) : subDays(now, 30)
      const to = dateTo ? new Date(dateTo + 'T23:59:59Z') : now
      return { from, to }
    }
    case '30d':
    default:
      return { from: subDays(now, 30), to: now }
  }
}

export default async function AnalyticsPage({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const params = await searchParams

  const range = str(params.range) || '30d'
  const role = str(params.role) || 'all'
  const dateFrom = str(params.dateFrom)
  const dateTo = str(params.dateTo)

  const { from, to } = getRangeBoundaries(range, dateFrom, dateTo)

  // Determine chart granularity: <= 60 days → daily, else weekly
  const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24))
  const granularity: 'daily' | 'weekly' = diffDays <= 60 ? 'daily' : 'weekly'

  const supabase = getSupabaseService()

  // Parallel fetch all required data
  const [ordersRes, profilesRes, pricesRes, schoolsRes] = await Promise.all([
    supabase
      .from('stripe_orders')
      .select(
        'id, stripe_id, stripe_customer_id, stripe_price_id, stripe_product_id, user_id, amount_total, type, subscription_status, cancel_at_period_end, canceled_at, created_at',
      ),
    supabase
      .from('profiles')
      .select('id, role, member_type, created_at, onboarding_completed, subscription_status'),
    supabase
      .from('stripe_prices')
      .select('stripe_id, unit_amount, type, interval, interval_count'),
    supabase.from('schools').select('owner_id'),
  ])

  const orders = (ordersRes.data ?? []).map((o) => ({
    id: o.id,
    stripe_id: o.stripe_id,
    stripe_customer_id: o.stripe_customer_id ?? null,
    stripe_price_id: o.stripe_price_id ?? null,
    stripe_product_id: o.stripe_product_id ?? null,
    user_id: o.user_id ?? null,
    amount_total: o.amount_total ?? null,
    type: o.type ?? 'one_time',
    subscription_status: o.subscription_status ?? null,
    cancel_at_period_end: o.cancel_at_period_end ?? false,
    canceled_at: o.canceled_at ?? null,
    created_at: o.created_at ?? '',
  }))

  const profiles = (profilesRes.data ?? []).map((p) => ({
    id: p.id,
    role: p.role ?? '',
    member_type: p.member_type ?? null,
    created_at: p.created_at ?? '',
    onboarding_completed: p.onboarding_completed ?? false,
    subscription_status: p.subscription_status ?? '',
  }))

  const prices = (pricesRes.data ?? []).map((p) => ({
    stripe_id: p.stripe_id,
    unit_amount: p.unit_amount ?? null,
    type: p.type ?? '',
    interval: p.interval ?? null,
    interval_count: p.interval_count ?? null,
  }))

  const schoolOwnerIds = new Set(
    (schoolsRes.data ?? []).map((s) => s.owner_id).filter((id): id is string => !!id),
  )
  const profileMap = new Map(profiles.map((p) => [p.id, p]))
  const roleFilter = role as RoleFilter

  // Compute metrics
  const funnel = computeFunnelMetrics(profiles, orders, from, to, roleFilter, schoolOwnerIds)
  const revenue = computeRevenueMetrics(
    orders,
    prices,
    from,
    to,
    roleFilter,
    profileMap,
    schoolOwnerIds,
  )
  const chartData = bucketTimeSeries(orders, from, to, granularity)

  // CSV-ready data objects
  const funnelCsvData = [
    {
      'New Registrations': funnel.newRegistrations,
      'Completed Onboarding': funnel.completedOnboarding,
      'Conversion Rate': (funnel.conversionRate * 100).toFixed(1) + '%',
      'New Subscriptions': funnel.newSubscriptions,
      'Pending Cancellations': funnel.pendingCancellations,
      'New Cancellations': funnel.newCancellations,
      'Total Active Members': funnel.totalActiveMembers,
      'Net Growth': funnel.netGrowth,
    },
  ]
  const revenueCsvData = [
    {
      'ARR Total': '$' + revenue.arrTotal.toFixed(2),
      'New ARR': '$' + revenue.newArr.toFixed(2),
      'Churned ARR': '$' + revenue.churnedArr.toFixed(2),
      'Net New ARR': '$' + revenue.netNewArr.toFixed(2),
    },
  ]
  const chartCsvData = chartData.map((p) => ({
    Date: p.date,
    'Revenue ($)': p.revenue.toFixed(2),
    Orders: p.orders,
  }))

  return (
    <div className="p-6 lg:p-8">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Analytics</h1>
        </div>

        <Suspense>
          <AnalyticsFilters
            initialRange={range}
            initialRole={role}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
          />
        </Suspense>

        {/* Funnel Metrics Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#1B3A5C]">User Funnel</h2>
            <CsvExportButton data={funnelCsvData} filename="funnel-metrics.csv" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsMetricCard
              label="New Registrations"
              value={funnel.newRegistrations}
            />
            <AnalyticsMetricCard
              label="Completed Onboarding"
              value={funnel.completedOnboarding}
            />
            <AnalyticsMetricCard
              label="Conversion Rate"
              value={(funnel.conversionRate * 100).toFixed(1) + '%'}
            />
            <AnalyticsMetricCard
              label="New Subscriptions"
              value={funnel.newSubscriptions}
            />
            <AnalyticsMetricCard
              label="Pending Cancellations"
              value={funnel.pendingCancellations}
            />
            <AnalyticsMetricCard
              label="New Cancellations"
              value={funnel.newCancellations}
            />
            <AnalyticsMetricCard
              label="Total Active Members"
              value={funnel.totalActiveMembers}
            />
            <AnalyticsMetricCard
              label="Net Growth"
              value={funnel.netGrowth}
              trend={
                funnel.netGrowth > 0 ? 'up' : funnel.netGrowth < 0 ? 'down' : 'neutral'
              }
            />
          </div>
        </div>

        {/* Revenue Metrics Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#1B3A5C]">Revenue</h2>
            <CsvExportButton data={revenueCsvData} filename="revenue-metrics.csv" />
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <AnalyticsMetricCard
              label="ARR Total"
              value={
                '$' +
                revenue.arrTotal.toLocaleString(undefined, { minimumFractionDigits: 2 })
              }
            />
            <AnalyticsMetricCard
              label="New ARR"
              value={
                '$' +
                revenue.newArr.toLocaleString(undefined, { minimumFractionDigits: 2 })
              }
            />
            <AnalyticsMetricCard
              label="Churned ARR"
              value={
                '$' +
                revenue.churnedArr.toLocaleString(undefined, { minimumFractionDigits: 2 })
              }
            />
            <AnalyticsMetricCard
              label="Net New ARR"
              value={
                '$' +
                revenue.netNewArr.toLocaleString(undefined, { minimumFractionDigits: 2 })
              }
              trend={
                revenue.netNewArr > 0 ? 'up' : revenue.netNewArr < 0 ? 'down' : 'neutral'
              }
            />
          </div>
        </div>

        {/* Charts Section */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-[#1B3A5C]">Trends</h2>
            <CsvExportButton data={chartCsvData} filename="analytics-trends.csv" />
          </div>
          <AnalyticsCharts chartData={chartData} />
        </div>
      </div>
    </div>
  )
}
