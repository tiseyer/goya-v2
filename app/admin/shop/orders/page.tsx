import { Suspense } from 'react';
import { getSupabaseService } from '@/lib/supabase/service';
import OrdersTable, { OrderRow } from './OrdersTable';
import OrdersFilters from './OrdersFilters';
import AdminUsersPagination from '@/app/admin/users/AdminUsersPagination';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '');
}

export default async function OrdersPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const search   = str(params.search);
  const type     = str(params.type) || 'all';
  const status   = str(params.status) || 'all';
  const dateFrom = str(params.dateFrom);
  const dateTo   = str(params.dateTo);
  const priceMin = str(params.priceMin);
  const priceMax = str(params.priceMax);
  const sort     = str(params.sort) || 'newest';
  const page     = Math.max(1, parseInt(str(params.page) || '1', 10));
  const pageSize = [25, 50, 100].includes(parseInt(str(params.pageSize), 10))
    ? parseInt(str(params.pageSize), 10)
    : 25;

  let merged: OrderRow[] = [];
  let totalCount = 0;
  let totalPages = 1;
  let displayedCount = 0;
  let fetchError: string | null = null;

  try {
    const supabase = getSupabaseService();

    // Build stripe_orders query
    let query = supabase
      .from('stripe_orders')
      .select('*', { count: 'exact' });

    if (type && type !== 'all') query = query.eq('type', type);
    if (status && status !== 'all') query = query.eq('status', status);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z');
    if (priceMin) query = query.gte('amount_total', parseInt(priceMin) * 100);
    if (priceMax) query = query.lte('amount_total', parseInt(priceMax) * 100);

    switch (sort) {
      case 'oldest':      query = query.order('created_at', { ascending: true });   break;
      case 'amount_high': query = query.order('amount_total', { ascending: false }); break;
      case 'amount_low':  query = query.order('amount_total', { ascending: true });  break;
      default:            query = query.order('created_at', { ascending: false });   break;
    }

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    query = query.range(from, to);

    const { data: orders, count } = await query;

    const rawOrders = orders ?? [];

    // Fetch profiles for customer names via stripe_customer_id join
    const customerIds = [...new Set(
      rawOrders
        .map((o) => o.stripe_customer_id)
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

    // Fetch coupons from order metadata (if present)
    const couponIds = [...new Set(
      rawOrders
        .map((o) => {
          const meta = o.metadata as Record<string, unknown> | null;
          return (meta?.coupon_id as string | undefined) ?? (meta?.discount_id as string | undefined);
        })
        .filter((id): id is string => !!id),
    )];

    const couponMap = new Map<string, string>();
    if (couponIds.length > 0) {
      const { data: coupons } = await supabase
        .from('stripe_coupons')
        .select('stripe_coupon_id, name')
        .in('stripe_coupon_id', couponIds);

      for (const c of coupons ?? []) {
        couponMap.set(c.stripe_coupon_id, c.name ?? '');
      }
    }

    // Merge into OrderRow[]
    merged = rawOrders.map((o) => {
      const profile = o.stripe_customer_id ? profileMap.get(o.stripe_customer_id) : undefined;
      const meta = o.metadata as Record<string, unknown> | null;
      const couponId =
        (meta?.coupon_id as string | undefined) ??
        (meta?.discount_id as string | undefined);

      return {
        id:                 o.id,
        stripeId:           o.stripe_id,
        customerName:       profile?.full_name ?? null,
        customerEmail:      profile?.email ?? null,
        createdAt:          o.created_at ?? '',
        status:             o.status,
        amountTotal:        o.amount_total ?? 0,
        currency:           o.currency ?? 'usd',
        paymentMethod:      null,
        type:               (o.type as 'one_time' | 'recurring'),
        subscriptionStatus: o.subscription_status ?? null,
        currentPeriodEnd:   o.current_period_end ?? null,
        cancelAtPeriodEnd:  o.cancel_at_period_end ?? false,
        couponName:         couponId ? (couponMap.get(couponId) ?? null) : null,
      };
    });

    // Search filter (cross-table, done in JS)
    if (search) {
      const q = search.toLowerCase();
      merged = merged.filter(
        (o) =>
          (o.customerName?.toLowerCase().includes(q) ?? false) ||
          (o.customerEmail?.toLowerCase().includes(q) ?? false),
      );
    }

    totalCount  = count ?? 0;
    totalPages  = Math.max(1, Math.ceil(totalCount / pageSize));
    displayedCount = merged.length;
  } catch (err) {
    fetchError = err instanceof Error ? err.message : 'Failed to load orders';
  }

  if (fetchError) {
    return (
      <div className="p-6 lg:p-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C] mb-4">Orders</h1>
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
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Orders</h1>
        <p className="text-sm text-[#6B7280]">
          <span className="font-medium text-[#374151]">{displayedCount}</span>
          {' / '}
          <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span>
          {' orders'}
        </p>
      </div>

      {/* Filter bar */}
      <div className="mb-4">
        <Suspense>
          <OrdersFilters
            initialSearch={search}
            initialType={type}
            initialStatus={status}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
            initialPriceMin={priceMin}
            initialPriceMax={priceMax}
            initialSort={sort}
          />
        </Suspense>
      </div>

      {/* Table */}
      <OrdersTable initialOrders={merged} totalCount={totalCount} />

      {/* Pagination */}
      <Suspense>
        <AdminUsersPagination
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
