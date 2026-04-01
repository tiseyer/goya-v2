import { NextRequest, NextResponse } from 'next/server';
import { getSupabaseService } from '@/lib/supabase/service';

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

export type SubscriptionRow = {
  id: string;
  stripeSubscriptionId: string;
  customerName: string | null;
  customerEmail: string | null;
  planName: string;
  status: string;
  amount: number;
  currency: string;
  interval: string;
  currentPeriodStart: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  createdAt: string;
};

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = req.nextUrl;

    const search   = searchParams.get('search') ?? '';
    const status   = searchParams.get('status') ?? 'all';
    const sort     = searchParams.get('sort') ?? 'newest';
    const dateFrom = searchParams.get('dateFrom') ?? '';
    const dateTo   = searchParams.get('dateTo') ?? '';
    const page     = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10));
    const limitParam = parseInt(searchParams.get('limit') ?? '25', 10);
    const limit    = [25, 50, 100].includes(limitParam) ? limitParam : 25;

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

    const from = (page - 1) * limit;
    const to   = from + limit - 1;
    query = query.range(from, to);

    const { data: subs, count, error } = await query;

    if (error) throw error;

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

    let rows: SubscriptionRow[] = rawSubs.map((s) => {
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
      rows = rows.filter(
        (s) =>
          (s.customerName?.toLowerCase().includes(q) ?? false) ||
          (s.customerEmail?.toLowerCase().includes(q) ?? false),
      );
    }

    const totalCount    = count ?? 0;
    const totalPages    = Math.max(1, Math.ceil(totalCount / limit));
    const displayedCount = rows.length;

    return NextResponse.json({ subscriptions: rows, totalCount, totalPages, displayedCount });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load subscriptions';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
