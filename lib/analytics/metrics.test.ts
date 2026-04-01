import { describe, it, expect } from 'vitest'
import {
  computeFunnelMetrics,
  computeRevenueMetrics,
  bucketTimeSeries,
  getAnnualMultiplier,
  ProfileRow,
  OrderRow,
  PriceRow,
} from './metrics'

// ---------------------------------------------------------------------------
// Helpers for building test data
// ---------------------------------------------------------------------------

function makeProfile(overrides: Partial<ProfileRow> = {}): ProfileRow {
  return {
    id: 'user-1',
    role: 'student',
    member_type: 'student',
    created_at: '2026-02-15T00:00:00Z',
    onboarding_completed: false,
    subscription_status: 'guest',
    ...overrides,
  }
}

function makeOrder(overrides: Partial<OrderRow> = {}): OrderRow {
  return {
    id: 'order-1',
    stripe_id: 'pi_1',
    stripe_customer_id: 'cus_1',
    stripe_price_id: 'price_monthly',
    stripe_product_id: 'prod_1',
    user_id: 'user-1',
    amount_total: 1000,
    type: 'recurring',
    subscription_status: 'active',
    cancel_at_period_end: false,
    canceled_at: null,
    created_at: '2026-02-15T00:00:00Z',
    ...overrides,
  }
}

function makePrice(overrides: Partial<PriceRow> = {}): PriceRow {
  return {
    stripe_id: 'price_monthly',
    unit_amount: 1000,
    type: 'recurring',
    interval: 'month',
    interval_count: 1,
    ...overrides,
  }
}

const FROM = new Date('2026-02-01T00:00:00Z')
const TO = new Date('2026-02-28T23:59:59Z')

// ---------------------------------------------------------------------------
// describe: computeFunnelMetrics
// ---------------------------------------------------------------------------

describe('computeFunnelMetrics', () => {
  it('counts new registrations in range', () => {
    const profiles = [
      makeProfile({ id: 'u1', created_at: '2026-02-10T00:00:00Z' }),
      makeProfile({ id: 'u2', created_at: '2026-02-15T00:00:00Z' }),
      makeProfile({ id: 'u3', created_at: '2026-02-20T00:00:00Z' }),
      makeProfile({ id: 'u4', created_at: '2026-02-25T00:00:00Z' }),
      makeProfile({ id: 'u5', created_at: '2026-02-28T00:00:00Z' }),
      makeProfile({ id: 'u6', created_at: '2026-01-15T00:00:00Z' }), // before range
      makeProfile({ id: 'u7', created_at: '2026-03-05T00:00:00Z' }), // after range
    ]
    const result = computeFunnelMetrics(profiles, [], FROM, TO, 'all', new Set())
    expect(result.newRegistrations).toBe(5)
  })

  it('counts completedOnboarding for profiles in range with onboarding_completed=true', () => {
    const profiles = [
      makeProfile({ id: 'u1', created_at: '2026-02-10T00:00:00Z', onboarding_completed: true }),
      makeProfile({ id: 'u2', created_at: '2026-02-15T00:00:00Z', onboarding_completed: true }),
      makeProfile({ id: 'u3', created_at: '2026-02-20T00:00:00Z', onboarding_completed: true }),
      makeProfile({ id: 'u4', created_at: '2026-02-25T00:00:00Z', onboarding_completed: false }),
      makeProfile({ id: 'u5', created_at: '2026-02-28T00:00:00Z', onboarding_completed: false }),
    ]
    const result = computeFunnelMetrics(profiles, [], FROM, TO, 'all', new Set())
    expect(result.newRegistrations).toBe(5)
    expect(result.completedOnboarding).toBe(3)
  })

  it('counts newSubscriptions for recurring active orders created in range', () => {
    const orders = [
      makeOrder({ id: 'o1', user_id: 'u1', type: 'recurring', subscription_status: 'active', created_at: '2026-02-10T00:00:00Z' }),
      makeOrder({ id: 'o2', user_id: 'u2', type: 'recurring', subscription_status: 'active', created_at: '2026-02-20T00:00:00Z' }),
      makeOrder({ id: 'o3', user_id: 'u3', type: 'one_time', subscription_status: null, created_at: '2026-02-15T00:00:00Z' }),
      makeOrder({ id: 'o4', user_id: 'u4', type: 'recurring', subscription_status: 'active', created_at: '2026-01-10T00:00:00Z' }), // out of range
    ]
    const result = computeFunnelMetrics([], orders, FROM, TO, 'all', new Set())
    expect(result.newSubscriptions).toBe(2)
  })

  it('counts pendingCancellations for orders with cancel_at_period_end=true and still active (snapshot)', () => {
    const orders = [
      makeOrder({ id: 'o1', cancel_at_period_end: true, subscription_status: 'active', created_at: '2026-01-10T00:00:00Z' }), // before range but counts as snapshot
      makeOrder({ id: 'o2', cancel_at_period_end: true, subscription_status: 'active', created_at: '2026-02-15T00:00:00Z' }),
      makeOrder({ id: 'o3', cancel_at_period_end: false, subscription_status: 'active', created_at: '2026-02-20T00:00:00Z' }),
      makeOrder({ id: 'o4', cancel_at_period_end: true, subscription_status: 'canceled', created_at: '2026-02-20T00:00:00Z' }),
    ]
    const result = computeFunnelMetrics([], orders, FROM, TO, 'all', new Set())
    expect(result.pendingCancellations).toBe(2)
  })

  it('counts newCancellations for orders with canceled_at in range and not active', () => {
    const orders = [
      makeOrder({ id: 'o1', canceled_at: '2026-02-10T00:00:00Z', subscription_status: 'canceled', created_at: '2026-01-01T00:00:00Z' }),
      makeOrder({ id: 'o2', canceled_at: '2026-01-10T00:00:00Z', subscription_status: 'canceled', created_at: '2026-01-01T00:00:00Z' }), // before range
      makeOrder({ id: 'o3', canceled_at: '2026-02-20T00:00:00Z', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }), // still active
    ]
    const result = computeFunnelMetrics([], orders, FROM, TO, 'all', new Set())
    expect(result.newCancellations).toBe(1)
  })

  it('counts totalActiveMembers as snapshot of profiles with subscription_status=member', () => {
    const profiles = [
      makeProfile({ id: 'u1', created_at: '2026-01-01T00:00:00Z', subscription_status: 'member' }), // before range
      makeProfile({ id: 'u2', created_at: '2026-02-10T00:00:00Z', subscription_status: 'member' }),
      makeProfile({ id: 'u3', created_at: '2026-03-01T00:00:00Z', subscription_status: 'member' }), // after range
      makeProfile({ id: 'u4', created_at: '2026-02-15T00:00:00Z', subscription_status: 'guest' }),
    ]
    const result = computeFunnelMetrics(profiles, [], FROM, TO, 'all', new Set())
    expect(result.totalActiveMembers).toBe(3) // all 3 members regardless of date range
  })

  it('returns conversionRate = 0 when no registrations in range', () => {
    const result = computeFunnelMetrics([], [], FROM, TO, 'all', new Set())
    expect(result.conversionRate).toBe(0)
  })

  it('computes conversionRate as profiles_with_orders / new_registrations', () => {
    const profiles = [
      makeProfile({ id: 'u1', created_at: '2026-02-10T00:00:00Z' }),
      makeProfile({ id: 'u2', created_at: '2026-02-15T00:00:00Z' }),
      makeProfile({ id: 'u3', created_at: '2026-02-20T00:00:00Z' }),
      makeProfile({ id: 'u4', created_at: '2026-02-25T00:00:00Z' }),
    ]
    // u1 and u2 have orders in range
    const orders = [
      makeOrder({ id: 'o1', user_id: 'u1', created_at: '2026-02-10T00:00:00Z' }),
      makeOrder({ id: 'o2', user_id: 'u2', created_at: '2026-02-15T00:00:00Z' }),
    ]
    const result = computeFunnelMetrics(profiles, orders, FROM, TO, 'all', new Set())
    expect(result.conversionRate).toBe(0.5)
  })

  it('computes netGrowth = newSubscriptions - newCancellations', () => {
    const orders = [
      makeOrder({ id: 'o1', type: 'recurring', subscription_status: 'active', created_at: '2026-02-10T00:00:00Z' }),
      makeOrder({ id: 'o2', type: 'recurring', subscription_status: 'active', created_at: '2026-02-12T00:00:00Z' }),
      makeOrder({ id: 'o3', canceled_at: '2026-02-20T00:00:00Z', subscription_status: 'canceled', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const result = computeFunnelMetrics([], orders, FROM, TO, 'all', new Set())
    expect(result.netGrowth).toBe(1) // 2 - 1
  })
})

// ---------------------------------------------------------------------------
// describe: computeRevenueMetrics
// ---------------------------------------------------------------------------

describe('computeRevenueMetrics', () => {
  it('computes arrTotal from 2 active recurring orders for different customer+product pairs', () => {
    // 2 orders, same price (monthly $10), different cus+prod pairs => ARR = 2 * $10 * 12 = $240
    const orders = [
      makeOrder({ id: 'o1', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }),
      makeOrder({ id: 'o2', stripe_customer_id: 'cus_2', stripe_product_id: 'prod_2', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const prices = [makePrice({ stripe_id: 'price_m', unit_amount: 1000, interval: 'month', interval_count: 1 })]
    const profileMap = new Map<string, ProfileRow>()
    const result = computeRevenueMetrics(orders, prices, FROM, TO, 'all', profileMap, new Set())
    expect(result.arrTotal).toBe(240) // 2 * 1000 * 12 / 100
  })

  it('deduplicates ARR by stripe_customer_id+stripe_product_id key (keeps latest)', () => {
    // 3 orders for same cus+prod pair — only 1 counted for ARR
    const orders = [
      makeOrder({ id: 'o1', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }),
      makeOrder({ id: 'o2', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', subscription_status: 'active', created_at: '2026-01-15T00:00:00Z' }),
      makeOrder({ id: 'o3', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', subscription_status: 'active', created_at: '2026-02-01T00:00:00Z' }),
    ]
    const prices = [makePrice({ stripe_id: 'price_m', unit_amount: 1000, interval: 'month', interval_count: 1 })]
    const profileMap = new Map<string, ProfileRow>()
    const result = computeRevenueMetrics(orders, prices, FROM, TO, 'all', profileMap, new Set())
    expect(result.arrTotal).toBe(120) // only 1 * 1000 * 12 / 100
  })

  it('computes ARR correctly for annual interval (year->*1)', () => {
    // Annual plan $120/year => ARR = $120
    const orders = [
      makeOrder({ id: 'o1', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_y', type: 'recurring', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const prices = [makePrice({ stripe_id: 'price_y', unit_amount: 12000, interval: 'year', interval_count: 1 })]
    const profileMap = new Map<string, ProfileRow>()
    const result = computeRevenueMetrics(orders, prices, FROM, TO, 'all', profileMap, new Set())
    expect(result.arrTotal).toBe(120) // 12000 * 1 / 100
  })

  it('computes newArr for recurring active orders created in range', () => {
    const orders = [
      makeOrder({ id: 'o1', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'active', created_at: '2026-02-10T00:00:00Z' }),
      makeOrder({ id: 'o2', stripe_customer_id: 'cus_2', stripe_product_id: 'prod_2', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }), // out of range
    ]
    const prices = [makePrice({ stripe_id: 'price_m', unit_amount: 1000, interval: 'month', interval_count: 1 })]
    const profileMap = new Map<string, ProfileRow>()
    const result = computeRevenueMetrics(orders, prices, FROM, TO, 'all', profileMap, new Set())
    expect(result.newArr).toBe(120) // only o1 in range
  })

  it('computes churnedArr for recurring orders with canceled_at in range', () => {
    const orders = [
      makeOrder({ id: 'o1', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'canceled', canceled_at: '2026-02-15T00:00:00Z', created_at: '2026-01-01T00:00:00Z' }),
      makeOrder({ id: 'o2', stripe_customer_id: 'cus_2', stripe_product_id: 'prod_2', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'canceled', canceled_at: '2026-03-01T00:00:00Z', created_at: '2026-01-01T00:00:00Z' }), // out of range
    ]
    const prices = [makePrice({ stripe_id: 'price_m', unit_amount: 1000, interval: 'month', interval_count: 1 })]
    const profileMap = new Map<string, ProfileRow>()
    const result = computeRevenueMetrics(orders, prices, FROM, TO, 'all', profileMap, new Set())
    expect(result.churnedArr).toBe(120) // only o1
  })

  it('computes netNewArr = newArr - churnedArr', () => {
    const orders = [
      makeOrder({ id: 'o1', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'active', created_at: '2026-02-10T00:00:00Z' }),
      makeOrder({ id: 'o2', stripe_customer_id: 'cus_2', stripe_product_id: 'prod_2', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'canceled', canceled_at: '2026-02-15T00:00:00Z', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const prices = [makePrice({ stripe_id: 'price_m', unit_amount: 1000, interval: 'month', interval_count: 1 })]
    const profileMap = new Map<string, ProfileRow>()
    const result = computeRevenueMetrics(orders, prices, FROM, TO, 'all', profileMap, new Set())
    expect(result.netNewArr).toBe(0) // 120 - 120
  })
})

// ---------------------------------------------------------------------------
// describe: Role filtering
// ---------------------------------------------------------------------------

describe('Role filtering', () => {
  it('computeFunnelMetrics with roleFilter=student only counts student profiles', () => {
    const profiles = [
      makeProfile({ id: 'u1', member_type: 'student', created_at: '2026-02-10T00:00:00Z' }),
      makeProfile({ id: 'u2', member_type: 'teacher', created_at: '2026-02-15T00:00:00Z' }),
      makeProfile({ id: 'u3', member_type: 'student', created_at: '2026-02-20T00:00:00Z' }),
    ]
    const result = computeFunnelMetrics(profiles, [], FROM, TO, 'student', new Set())
    expect(result.newRegistrations).toBe(2)
  })

  it('computeFunnelMetrics with roleFilter=school only counts profiles whose id is in schoolOwnerIds', () => {
    const profiles = [
      makeProfile({ id: 'u1', member_type: null, created_at: '2026-02-10T00:00:00Z' }),
      makeProfile({ id: 'u2', member_type: null, created_at: '2026-02-15T00:00:00Z' }),
      makeProfile({ id: 'u3', member_type: null, created_at: '2026-02-20T00:00:00Z' }),
    ]
    const schoolOwnerIds = new Set(['u1', 'u3'])
    const result = computeFunnelMetrics(profiles, [], FROM, TO, 'school', schoolOwnerIds)
    expect(result.newRegistrations).toBe(2)
  })

  it('computeRevenueMetrics with roleFilter filters orders by joining user_id to profile role', () => {
    const profiles = [
      makeProfile({ id: 'u1', member_type: 'teacher' }),
      makeProfile({ id: 'u2', member_type: 'student' }),
    ]
    const profileMap = new Map<string, ProfileRow>(profiles.map(p => [p.id, p]))
    const orders = [
      makeOrder({ id: 'o1', user_id: 'u1', stripe_customer_id: 'cus_1', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }),
      makeOrder({ id: 'o2', user_id: 'u2', stripe_customer_id: 'cus_2', stripe_product_id: 'prod_1', stripe_price_id: 'price_m', type: 'recurring', subscription_status: 'active', created_at: '2026-01-01T00:00:00Z' }),
    ]
    const prices = [makePrice({ stripe_id: 'price_m', unit_amount: 1000, interval: 'month', interval_count: 1 })]
    const result = computeRevenueMetrics(orders, prices, FROM, TO, 'teacher', profileMap, new Set())
    expect(result.arrTotal).toBe(120) // only u1 (teacher) counted
  })
})

// ---------------------------------------------------------------------------
// describe: bucketTimeSeries
// ---------------------------------------------------------------------------

describe('bucketTimeSeries', () => {
  it('produces daily buckets for a range, one bucket per day', () => {
    const from = new Date('2026-02-01T00:00:00Z')
    const to = new Date('2026-03-01T23:59:59Z')
    const result = bucketTimeSeries([], from, to, 'daily')
    // Buckets are counted by eachDayOfInterval inclusive — verify at least ~28 buckets
    expect(result.length).toBeGreaterThanOrEqual(28)
    // All entries have revenue=0 and orders=0 (no orders passed)
    expect(result.every(p => p.revenue === 0 && p.orders === 0)).toBe(true)
    // Dates are unique
    const dates = result.map(p => p.date)
    expect(new Set(dates).size).toBe(dates.length)
  })

  it('produces weekly buckets when granularity=weekly', () => {
    const from = new Date('2026-01-05T00:00:00Z')
    const to = new Date('2026-04-05T23:59:59Z') // ~3 months
    const result = bucketTimeSeries([], from, to, 'weekly')
    // Roughly 13 weeks, exact count depends on week boundaries
    expect(result.length).toBeGreaterThan(0)
  })

  it('empty days have revenue=0, orders=0', () => {
    const from = new Date('2026-02-01T00:00:00Z')
    const to = new Date('2026-02-07T23:59:59Z')
    const result = bucketTimeSeries([], from, to, 'daily')
    expect(result.every(p => p.revenue === 0 && p.orders === 0)).toBe(true)
  })

  it('correctly buckets orders by created_at date', () => {
    const from = new Date('2026-02-01T00:00:00Z')
    const to = new Date('2026-02-07T23:59:59Z')
    const orders = [
      makeOrder({ id: 'o1', created_at: '2026-02-03T10:00:00Z', amount_total: 5000 }),
      makeOrder({ id: 'o2', created_at: '2026-02-03T15:00:00Z', amount_total: 3000 }),
      makeOrder({ id: 'o3', created_at: '2026-02-05T10:00:00Z', amount_total: 2000 }),
    ]
    const result = bucketTimeSeries(orders, from, to, 'daily')
    const feb3 = result.find(p => p.date === '2026-02-03')
    const feb5 = result.find(p => p.date === '2026-02-05')
    expect(feb3).toBeDefined()
    expect(feb3!.orders).toBe(2)
    expect(feb3!.revenue).toBe(80) // (5000+3000)/100
    expect(feb5!.orders).toBe(1)
    expect(feb5!.revenue).toBe(20)
  })

  it('returns sorted array by date', () => {
    const from = new Date('2026-02-01T00:00:00Z')
    const to = new Date('2026-02-05T23:59:59Z')
    const result = bucketTimeSeries([], from, to, 'daily')
    for (let i = 1; i < result.length; i++) {
      expect(result[i].date >= result[i - 1].date).toBe(true)
    }
  })
})

// ---------------------------------------------------------------------------
// describe: getAnnualMultiplier
// ---------------------------------------------------------------------------

describe('getAnnualMultiplier', () => {
  it('month -> 12', () => expect(getAnnualMultiplier('month', 1)).toBe(12))
  it('year -> 1', () => expect(getAnnualMultiplier('year', 1)).toBe(1))
  it('week -> 52', () => expect(getAnnualMultiplier('week', 1)).toBe(52))
  it('day -> 365', () => expect(getAnnualMultiplier('day', 1)).toBe(365))
  it('every 2 months -> 12/2 = 6', () => expect(getAnnualMultiplier('month', 2)).toBe(6))
  it('null interval -> 0', () => expect(getAnnualMultiplier(null, null)).toBe(0))
})
