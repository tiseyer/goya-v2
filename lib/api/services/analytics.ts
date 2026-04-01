import { getSupabaseService } from '@/lib/supabase/service';
import {
  computeFunnelMetrics,
  computeRevenueMetrics,
  bucketTimeSeries,
} from '@/lib/analytics/metrics';
import type { ProfileRow, OrderRow, PriceRow } from '@/lib/analytics/metrics';

// ---------------------------------------------------------------------------
// getOverviewMetrics — per ANLY-01
// ---------------------------------------------------------------------------

/**
 * Returns total member count, active members, and new registrations this month.
 * Queries profiles table only — no Stripe API calls.
 */
export async function getOverviewMetrics() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const { data, error } = await supabase
    .from('profiles')
    .select('id, role, member_type, created_at, onboarding_completed, subscription_status');

  if (error) {
    return { data: null, error };
  }

  const profiles = (data ?? []) as ProfileRow[];

  const total_members = profiles.length;
  const active_members = profiles.filter((p) => p.subscription_status === 'member').length;

  // First day of current month as ISO string "YYYY-MM-01"
  const now = new Date();
  const firstOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
  const new_this_month = profiles.filter((p) => p.created_at >= firstOfMonth).length;

  return {
    data: { total_members, active_members, new_this_month },
    error: null,
  };
}

// ---------------------------------------------------------------------------
// getMembershipStats — per ANLY-02
// ---------------------------------------------------------------------------

export interface MembershipStatsParams {
  date_from?: string;
  date_to?: string;
}

/**
 * Returns funnel/membership stats for the given date range.
 * Queries profiles, stripe_orders, schools — no Stripe API calls.
 */
export async function getMembershipStats(params: MembershipStatsParams = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const now = new Date();
  const from = params.date_from
    ? new Date(params.date_from)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = params.date_to ? new Date(params.date_to) : now;

  const [profilesRes, ordersRes, schoolsRes] = await Promise.all([
    supabase
      .from('profiles')
      .select('id, role, member_type, created_at, onboarding_completed, subscription_status'),
    supabase
      .from('stripe_orders')
      .select(
        'id, stripe_id, stripe_customer_id, stripe_price_id, stripe_product_id, user_id, amount_total, type, subscription_status, cancel_at_period_end, canceled_at, created_at',
      ),
    supabase.from('schools').select('owner_id'),
  ]);

  if (profilesRes.error) return { data: null, error: profilesRes.error };
  if (ordersRes.error) return { data: null, error: ordersRes.error };

  const profiles: ProfileRow[] = (profilesRes.data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    role: (p.role as string) ?? '',
    member_type: (p.member_type as string | null) ?? null,
    created_at: (p.created_at as string) ?? '',
    onboarding_completed: (p.onboarding_completed as boolean) ?? false,
    subscription_status: (p.subscription_status as string) ?? '',
  }));

  const orders: OrderRow[] = (ordersRes.data ?? []).map((o: Record<string, unknown>) => ({
    id: o.id as string,
    stripe_id: o.stripe_id as string,
    stripe_customer_id: (o.stripe_customer_id as string | null) ?? null,
    stripe_price_id: (o.stripe_price_id as string | null) ?? null,
    stripe_product_id: (o.stripe_product_id as string | null) ?? null,
    user_id: (o.user_id as string | null) ?? null,
    amount_total: (o.amount_total as number | null) ?? null,
    type: (o.type as string) ?? 'one_time',
    subscription_status: (o.subscription_status as string | null) ?? null,
    cancel_at_period_end: (o.cancel_at_period_end as boolean) ?? false,
    canceled_at: (o.canceled_at as string | null) ?? null,
    created_at: (o.created_at as string) ?? '',
  }));

  const schoolOwnerIds = new Set<string>(
    (schoolsRes.data ?? [])
      .map((s: Record<string, unknown>) => s.owner_id as string)
      .filter((id: unknown): id is string => typeof id === 'string' && !!id),
  );

  const funnelMetrics = computeFunnelMetrics(profiles, orders, from, to, 'all', schoolOwnerIds);

  return { data: funnelMetrics, error: null };
}

// ---------------------------------------------------------------------------
// getRevenueStats — per ANLY-03
// ---------------------------------------------------------------------------

export interface RevenueStatsParams {
  date_from?: string;
  date_to?: string;
}

/**
 * Returns ARR metrics and a time-series breakdown.
 * Queries stripe_orders, stripe_prices, profiles, schools — no Stripe API calls.
 */
export async function getRevenueStats(params: RevenueStatsParams = {}) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any;

  const now = new Date();
  const from = params.date_from
    ? new Date(params.date_from)
    : new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const to = params.date_to ? new Date(params.date_to) : now;

  const [ordersRes, pricesRes, profilesRes, schoolsRes] = await Promise.all([
    supabase
      .from('stripe_orders')
      .select(
        'id, stripe_id, stripe_customer_id, stripe_price_id, stripe_product_id, user_id, amount_total, type, subscription_status, cancel_at_period_end, canceled_at, created_at',
      ),
    supabase
      .from('stripe_prices')
      .select('stripe_id, unit_amount, type, interval, interval_count'),
    supabase
      .from('profiles')
      .select('id, role, member_type, created_at, onboarding_completed, subscription_status'),
    supabase.from('schools').select('owner_id'),
  ]);

  if (ordersRes.error) return { data: null, error: ordersRes.error };
  if (pricesRes.error) return { data: null, error: pricesRes.error };
  if (profilesRes.error) return { data: null, error: profilesRes.error };

  const orders: OrderRow[] = (ordersRes.data ?? []).map((o: Record<string, unknown>) => ({
    id: o.id as string,
    stripe_id: o.stripe_id as string,
    stripe_customer_id: (o.stripe_customer_id as string | null) ?? null,
    stripe_price_id: (o.stripe_price_id as string | null) ?? null,
    stripe_product_id: (o.stripe_product_id as string | null) ?? null,
    user_id: (o.user_id as string | null) ?? null,
    amount_total: (o.amount_total as number | null) ?? null,
    type: (o.type as string) ?? 'one_time',
    subscription_status: (o.subscription_status as string | null) ?? null,
    cancel_at_period_end: (o.cancel_at_period_end as boolean) ?? false,
    canceled_at: (o.canceled_at as string | null) ?? null,
    created_at: (o.created_at as string) ?? '',
  }));

  const prices: PriceRow[] = (pricesRes.data ?? []).map((p: Record<string, unknown>) => ({
    stripe_id: p.stripe_id as string,
    unit_amount: (p.unit_amount as number | null) ?? null,
    type: (p.type as string) ?? '',
    interval: (p.interval as string | null) ?? null,
    interval_count: (p.interval_count as number | null) ?? null,
  }));

  const profiles: ProfileRow[] = (profilesRes.data ?? []).map((p: Record<string, unknown>) => ({
    id: p.id as string,
    role: (p.role as string) ?? '',
    member_type: (p.member_type as string | null) ?? null,
    created_at: (p.created_at as string) ?? '',
    onboarding_completed: (p.onboarding_completed as boolean) ?? false,
    subscription_status: (p.subscription_status as string) ?? '',
  }));

  const schoolOwnerIds = new Set<string>(
    (schoolsRes.data ?? [])
      .map((s: Record<string, unknown>) => s.owner_id as string)
      .filter((id: unknown): id is string => typeof id === 'string' && !!id),
  );

  const profileMap = new Map(profiles.map((p) => [p.id, p]));

  const revenueMetrics = computeRevenueMetrics(
    orders,
    prices,
    from,
    to,
    'all',
    profileMap,
    schoolOwnerIds,
  );

  // Determine granularity: daily if range <= 60 days, else weekly
  const diffDays = Math.ceil((to.getTime() - from.getTime()) / (1000 * 60 * 60 * 24));
  const granularity: 'daily' | 'weekly' = diffDays <= 60 ? 'daily' : 'weekly';

  const time_series = bucketTimeSeries(orders, from, to, granularity);

  return {
    data: { ...revenueMetrics, time_series },
    error: null,
  };
}
