import { Suspense } from 'react';
import { getSupabaseService } from '@/lib/supabase/service';
import SubscriptionsTable, { SubscriptionRow } from './SubscriptionsTable';
import SubscriptionsFilters from './SubscriptionsFilters';
import SubscriptionsPagination from './SubscriptionsPagination';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '');
}

type RawSubscription = {
  id: string;
  stripe_subscription_id: string;
  stripe_customer_id: string | null;
  plan_name: string;
  status: string;
  amount: number | null;
  currency: string | null;
  interval: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  cancel_at_period_end: boolean | null;
  canceled_at: string | null;
  created_at: string | null;
  updated_at: string | null;
};

export default async function SubscriptionsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const search   = str(params.search);
  const status   = str(params.status) || 'all';
  const dateFrom = str(params.dateFrom);
  const dateTo   = str(params.dateTo);
  const sort     = str(params.sort) || 'newest';
  const page     = Math.max(1, parseInt(str(params.page) || '1', 10));
  const pageSize = [25, 50, 100].includes(parseInt(str(params.pageSize), 10))
    ? parseInt(str(params.pageSize), 10)
    : 25;

  let merged: SubscriptionRow[] = [];
  let totalCount = 0;
  let totalPages = 1;
  let displayedCount = 0;
  let fetchError: string | null = null;

  try {
    const supabase = getSupabaseService();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let query = (supabase as any)
      .from('subscriptions')
      .select('*', { count: 'exact' });

    if (status && status !== 'all') query = query.eq('status', status);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z');

    switch (sort) {
      case 'oldest':      query = query.order('created_at', { ascending: true });  break;
      case 'amount_high': query = query.order('amount', { ascending: false });      break;
      case 'amount_low':  query = query.order('amount', { ascending: true });       break;
      default:            query = query.order('created_at', { ascending: false });  break;
    }

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    query = query.range(from, to);

    const { data: subs, count } = await query;

    const rawSubs: RawSubscription[] = (subs ?? []) as RawSubscription[];

    // Fetch customer profiles via stripe_customer_id
    const customerIds: string[] = [...new Set(
      rawSubs
        .map((s) => s.stripe_customer_id)
        .filter((id): id is string => !!id),
    )];

    const profileMap = new Map<string, { full_name: string | null; email: string | null }>();
    if (customerIds.length > 0) {
      const { data: profiles } = await supabase
        .from('profiles')
        .select('stripe_customer_id, full_name, email')
        .in('stripe_customer_id', customerIds);

      for (const p of profiles ?? []) {
        if (p.stripe_customer_id) {
          profileMap.set(p.stripe_customer_id, {
            full_name: p.full_name ?? null,
            email: p.email ?? null,
          });
        }
      }
    }

    // Merge into SubscriptionRow[]
    merged = rawSubs.map((s) => {
      const profile = s.stripe_customer_id ? profileMap.get(s.stripe_customer_id) : undefined;
      return {
        id:                   s.id,
        stripeSubscriptionId: s.stripe_subscription_id,
        customerName:         profile?.full_name ?? null,
        customerEmail:        profile?.email ?? null,
        planName:             s.plan_name,
        status:               s.status,
        amount:               s.amount ?? 0,
        currency:             s.currency ?? 'usd',
        interval:             s.interval ?? 'month',
        currentPeriodStart:   s.current_period_start ?? null,
        currentPeriodEnd:     s.current_period_end ?? null,
        cancelAtPeriodEnd:    s.cancel_at_period_end ?? false,
        createdAt:            s.created_at ?? '',
      };
    });

    // Search filter (cross-table, done in JS)
    if (search) {
      const q = search.toLowerCase();
      merged = merged.filter(
        (s) =>
          (s.customerName?.toLowerCase().includes(q) ?? false) ||
          (s.customerEmail?.toLowerCase().includes(q) ?? false),
      );
    }

    totalCount     = count ?? 0;
    totalPages     = Math.max(1, Math.ceil(totalCount / pageSize));
    displayedCount = merged.length;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load subscriptions';
  }

  if (fetchError) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-4">Subscriptions</h1>
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <p className="text-sm text-red-600">{fetchError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Subscriptions</h1>
        <p className="text-sm text-[#6B7280]">
          <span className="font-medium text-[#374151]">{displayedCount}</span>
          {' / '}
          <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span>
          {' subscriptions'}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <Suspense>
          <SubscriptionsFilters
            initialSearch={search}
            initialStatus={status}
            initialSort={sort}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
          />
        </Suspense>
      </div>

      {/* Table */}
      <SubscriptionsTable initialSubscriptions={merged} totalCount={totalCount} />

      {/* Pagination */}
      <Suspense>
        <SubscriptionsPagination
          page={page}
          pageSize={pageSize}
          totalPages={totalPages}
          totalCount={totalCount}
          displayedCount={displayedCount}
        />
      </Suspense>
    </div>
  );
}
