// Pure computation functions for analytics metrics.
// No Supabase or React imports — all functions are side-effect-free.

export interface ProfileRow {
  id: string
  role: string
  member_type: string | null
  created_at: string
  onboarding_completed: boolean
  subscription_status: string
}

export interface OrderRow {
  id: string
  stripe_id: string
  stripe_customer_id: string | null
  stripe_price_id: string | null
  stripe_product_id: string | null
  user_id: string | null
  amount_total: number | null
  type: string
  subscription_status: string | null
  cancel_at_period_end: boolean
  canceled_at: string | null
  created_at: string
}

export interface PriceRow {
  stripe_id: string
  unit_amount: number | null
  type: string
  interval: string | null
  interval_count: number | null
}

export interface FunnelMetrics {
  newRegistrations: number
  completedOnboarding: number
  conversionRate: number
  newSubscriptions: number
  pendingCancellations: number
  newCancellations: number
  totalActiveMembers: number
  netGrowth: number
}

export interface RevenueMetrics {
  arrTotal: number    // in dollars
  newArr: number      // in dollars
  churnedArr: number  // in dollars
  netNewArr: number   // in dollars
}

export interface ChartPoint {
  date: string
  revenue: number
  orders: number
}

export type RoleFilter = 'all' | 'student' | 'teacher' | 'wellness_practitioner' | 'school'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function inRange(dateStr: string, from: Date, to: Date): boolean {
  const d = new Date(dateStr)
  return d >= from && d <= to
}

/**
 * Compute the annual multiplier for a price interval.
 * month -> 12, year -> 1, week -> 52, day -> 365
 * Divides by interval_count for multi-period intervals (e.g., every 2 months).
 */
export function getAnnualMultiplier(
  interval: string | null,
  intervalCount: number | null
): number {
  const count = intervalCount && intervalCount > 0 ? intervalCount : 1
  switch (interval) {
    case 'month': return 12 / count
    case 'year':  return 1 / count
    case 'week':  return 52 / count
    case 'day':   return 365 / count
    default:      return 0
  }
}

function filterProfilesByRole(
  profiles: ProfileRow[],
  roleFilter: RoleFilter,
  schoolOwnerIds: Set<string>
): ProfileRow[] {
  if (roleFilter === 'all') return profiles
  if (roleFilter === 'school') return profiles.filter(p => schoolOwnerIds.has(p.id))
  // student | teacher | wellness_practitioner
  return profiles.filter(p => p.member_type === roleFilter)
}

function filterOrdersByRole(
  orders: OrderRow[],
  roleFilter: RoleFilter,
  profileMap: Map<string, ProfileRow>,
  schoolOwnerIds: Set<string>
): OrderRow[] {
  if (roleFilter === 'all') return orders
  return orders.filter(o => {
    if (!o.user_id) return false
    if (roleFilter === 'school') return schoolOwnerIds.has(o.user_id)
    const profile = profileMap.get(o.user_id)
    if (!profile) return false
    return profile.member_type === roleFilter
  })
}

// ---------------------------------------------------------------------------
// computeFunnelMetrics
// ---------------------------------------------------------------------------

export function computeFunnelMetrics(
  profiles: ProfileRow[],
  orders: OrderRow[],
  from: Date,
  to: Date,
  roleFilter: RoleFilter,
  schoolOwnerIds: Set<string>
): FunnelMetrics {
  const filteredProfiles = filterProfilesByRole(profiles, roleFilter, schoolOwnerIds)

  // Build a profileId set for order filtering (without profileMap, use id set)
  const profileIdSet = new Set(filteredProfiles.map(p => p.id))
  const filteredOrders = roleFilter === 'all'
    ? orders
    : orders.filter(o => o.user_id !== null && profileIdSet.has(o.user_id))

  // Period-filtered profiles
  const periodProfiles = filteredProfiles.filter(p => inRange(p.created_at, from, to))

  const newRegistrations = periodProfiles.length

  const completedOnboarding = periodProfiles.filter(p => p.onboarding_completed).length

  // Profiles in range that have at least one order
  const profilesWithOrders = new Set(
    filteredOrders
      .filter(o => o.user_id && inRange(o.created_at, from, to))
      .map(o => o.user_id)
  )
  const periodProfileIds = new Set(periodProfiles.map(p => p.id))
  const profilesInRangeWithOrders = [...periodProfileIds].filter(id => profilesWithOrders.has(id)).length
  const conversionRate = newRegistrations > 0
    ? profilesInRangeWithOrders / newRegistrations
    : 0

  // New subscriptions: recurring + active + created in range
  const newSubscriptions = filteredOrders.filter(
    o => o.type === 'recurring' &&
         o.subscription_status === 'active' &&
         inRange(o.created_at, from, to)
  ).length

  // Pending cancellations: cancel_at_period_end=true AND still active (snapshot)
  const pendingCancellations = filteredOrders.filter(
    o => o.cancel_at_period_end === true && o.subscription_status === 'active'
  ).length

  // New cancellations: canceled_at in range AND not active (fully churned)
  const newCancellations = filteredOrders.filter(
    o => o.canceled_at !== null &&
         inRange(o.canceled_at, from, to) &&
         o.subscription_status !== 'active'
  ).length

  // Total active members: ALL filtered profiles with subscription_status='member' (snapshot)
  const totalActiveMembers = filteredProfiles.filter(
    p => p.subscription_status === 'member'
  ).length

  const netGrowth = newSubscriptions - newCancellations

  return {
    newRegistrations,
    completedOnboarding,
    conversionRate,
    newSubscriptions,
    pendingCancellations,
    newCancellations,
    totalActiveMembers,
    netGrowth,
  }
}

// ---------------------------------------------------------------------------
// computeRevenueMetrics
// ---------------------------------------------------------------------------

export function computeRevenueMetrics(
  orders: OrderRow[],
  prices: PriceRow[],
  from: Date,
  to: Date,
  roleFilter: RoleFilter,
  profileMap: Map<string, ProfileRow>,
  schoolOwnerIds: Set<string>
): RevenueMetrics {
  // Build price lookup
  const priceMap = new Map<string, PriceRow>()
  for (const p of prices) {
    priceMap.set(p.stripe_id, p)
  }

  const filteredOrders = filterOrdersByRole(orders, roleFilter, profileMap, schoolOwnerIds)

  function arrForOrder(order: OrderRow): number {
    if (!order.stripe_price_id) return 0
    const price = priceMap.get(order.stripe_price_id)
    if (!price || price.unit_amount === null) return 0
    const multiplier = getAnnualMultiplier(price.interval, price.interval_count)
    return (price.unit_amount * multiplier) / 100
  }

  // ARR total: active recurring orders, deduplicated by stripe_customer_id|stripe_product_id
  const activeRecurring = filteredOrders.filter(
    o => o.type === 'recurring' && o.subscription_status === 'active'
  )
  // Dedup: keep latest by created_at for each customer+product pair
  const dedupMap = new Map<string, OrderRow>()
  for (const o of activeRecurring) {
    const key = `${o.stripe_customer_id}|${o.stripe_product_id}`
    const existing = dedupMap.get(key)
    if (!existing || new Date(o.created_at) > new Date(existing.created_at)) {
      dedupMap.set(key, o)
    }
  }
  const arrTotal = [...dedupMap.values()].reduce((sum, o) => sum + arrForOrder(o), 0)

  // New ARR: recurring active orders with created_at in range
  const newArrOrders = filteredOrders.filter(
    o => o.type === 'recurring' && o.subscription_status === 'active' && inRange(o.created_at, from, to)
  )
  const newArr = newArrOrders.reduce((sum, o) => sum + arrForOrder(o), 0)

  // Churned ARR: recurring orders with canceled_at in range
  const churnedArrOrders = filteredOrders.filter(
    o => o.type === 'recurring' && o.canceled_at !== null && inRange(o.canceled_at, from, to)
  )
  const churnedArr = churnedArrOrders.reduce((sum, o) => sum + arrForOrder(o), 0)

  const netNewArr = newArr - churnedArr

  return { arrTotal, newArr, churnedArr, netNewArr }
}

// ---------------------------------------------------------------------------
// bucketTimeSeries
// ---------------------------------------------------------------------------

import { format, eachDayOfInterval, eachWeekOfInterval, startOfWeek } from 'date-fns'

export function bucketTimeSeries(
  orders: OrderRow[],
  from: Date,
  to: Date,
  granularity: 'daily' | 'weekly'
): ChartPoint[] {
  const buckets = new Map<string, { revenue: number; orders: number }>()

  if (granularity === 'daily') {
    const days = eachDayOfInterval({ start: from, end: to })
    for (const day of days) {
      buckets.set(format(day, 'yyyy-MM-dd'), { revenue: 0, orders: 0 })
    }
    for (const o of orders) {
      const key = format(new Date(o.created_at), 'yyyy-MM-dd')
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.revenue += (o.amount_total ?? 0) / 100
        bucket.orders += 1
      }
    }
  } else {
    // weekly
    const weeks = eachWeekOfInterval({ start: from, end: to })
    for (const week of weeks) {
      buckets.set(format(startOfWeek(week), 'yyyy-MM-dd'), { revenue: 0, orders: 0 })
    }
    for (const o of orders) {
      const weekStart = startOfWeek(new Date(o.created_at))
      const key = format(weekStart, 'yyyy-MM-dd')
      const bucket = buckets.get(key)
      if (bucket) {
        bucket.revenue += (o.amount_total ?? 0) / 100
        bucket.orders += 1
      }
    }
  }

  return Array.from(buckets.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, v]) => ({ date, ...v }))
}
