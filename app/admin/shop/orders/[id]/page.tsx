import Link from 'next/link';
import { format } from 'date-fns';
import { notFound } from 'next/navigation';
import { getSupabaseService } from '@/lib/supabase/service';
import { getStripe } from '@/lib/stripe/client';
import OrderTimeline, { TimelineEvent } from './OrderTimeline';
// OrderActions uses refundOrder, cancelSubscription, resendInvoice, getInvoicePdfUrl from ./actions
import OrderActions from './OrderActions';

const STATUS_PILL: Record<string, string> = {
  succeeded: 'bg-emerald-100 text-emerald-700',
  active:    'bg-blue-100 text-blue-700',
  failed:    'bg-red-100 text-red-700',
  canceled:  'bg-slate-100 text-slate-600',
  archived:  'bg-gray-100 text-gray-500',
};

function formatCurrency(amountCents: number | null, currency: string | null): string {
  if (amountCents === null) return '–';
  const sym = (currency ?? 'usd').toLowerCase() === 'usd' ? '$' : (currency ?? '').toUpperCase() + ' ';
  return `${sym}${(amountCents / 100).toFixed(2)}`;
}

// Manual order creation form (rendered when id === 'new')
async function NewOrderPage() {
  const supabase = getSupabaseService();

  const [{ data: products }, { data: profiles }] = await Promise.all([
    supabase.from('products').select('id, name, stripe_product_id').not('stripe_product_id', 'is', null).order('name'),
    supabase.from('profiles').select('id, full_name, email, stripe_customer_id').order('full_name').limit(100),
  ]);

  return (
    <div className="p-6 lg:p-8">
      <Link href="/admin/shop/orders" className="text-sm text-[#6B7280] hover:text-[#374151] mb-4 inline-block">
        &larr; Back to Orders
      </Link>
      <h1 className="text-2xl font-bold text-[#1B3A5C] mb-6">Create Manual Order</h1>

      <div className="max-w-lg bg-white rounded-xl border border-[#E5E7EB] p-6">
        <ManualOrderForm
          products={products ?? []}
          profiles={profiles ?? []}
        />
      </div>
    </div>
  );
}

// This is intentionally a server component wrapper — ManualOrderForm is client
import ManualOrderForm from './ManualOrderForm';

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  // Special case: manual order creation
  if (id === 'new') {
    return <NewOrderPage />;
  }

  const supabase = getSupabaseService();

  // Fetch the order
  const { data: order, error: orderError } = await supabase
    .from('stripe_orders')
    .select('*')
    .eq('id', id)
    .single();

  if (orderError || !order) {
    notFound();
  }

  // Fetch customer profile (via stripe_customer_id)
  const { data: profile } = order.stripe_customer_id
    ? await supabase
        .from('profiles')
        .select('id, email, full_name, role, avatar_url, stripe_customer_id')
        .eq('stripe_customer_id', order.stripe_customer_id)
        .single()
    : { data: null };

  // Fetch billing and shipping address from Stripe (ORD-08)
  // profiles table has GOYA address fields but NOT billing/shipping distinction
  // Stripe customer object has both: customer.address (billing) and customer.shipping
  let billingAddress: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null = null;
  let shippingAddress: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null = null;

  if (order.stripe_customer_id) {
    try {
      const stripeCustomer = await getStripe().customers.retrieve(order.stripe_customer_id);
      if (stripeCustomer && !stripeCustomer.deleted) {
        billingAddress = stripeCustomer.address ?? null;
        shippingAddress = stripeCustomer.shipping?.address ?? null;
      }
    } catch {
      // Non-fatal: billing/shipping addresses simply won't show
    }
  }

  // Fetch product info
  const { data: product } = order.stripe_product_id
    ? await supabase
        .from('products')
        .select('id, name, slug, stripe_product_id')
        .eq('stripe_product_id', order.stripe_product_id)
        .single()
    : { data: null };

  // Fetch timeline events from webhook_events table
  // Filter by relevant event types, then narrow by stripe_id reference in payload
  const { data: rawEvents } = await supabase
    .from('webhook_events')
    .select('event_type, created_at, payload, status')
    .or(
      'event_type.like.%payment_intent%,' +
      'event_type.like.%subscription%,' +
      'event_type.like.%invoice%,' +
      'event_type.like.%charge%,' +
      'event_type.like.%refund%',
    )
    .order('created_at', { ascending: true });

  const timelineEvents: TimelineEvent[] = (rawEvents ?? [])
    .filter((e) => {
      if (!order.stripe_id) return false;
      try {
        return JSON.stringify(e.payload).includes(order.stripe_id);
      } catch {
        return false;
      }
    })
    .map((e) => ({
      eventType: e.event_type,
      createdAt: e.created_at ?? '',
      status: e.status ?? '',
    }));

  // Fetch customer journey (all orders from same customer)
  const { data: journeyOrders } = order.stripe_customer_id
    ? await supabase
        .from('stripe_orders')
        .select('id, stripe_id, amount_total, status, type, created_at, currency')
        .eq('stripe_customer_id', order.stripe_customer_id)
        .order('created_at', { ascending: false })
        .limit(10)
    : { data: null };

  const statusClass = STATUS_PILL[order.status ?? ''] ?? 'bg-slate-100 text-slate-600';

  return (
    <div className="p-6 lg:p-8">
      {/* Back link */}
      <Link
        href="/admin/shop/orders"
        className="text-sm text-[#6B7280] hover:text-[#374151] mb-4 inline-block"
      >
        &larr; Back to Orders
      </Link>

      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">
            Order {(order.stripe_id ?? '').slice(0, 12)}...
          </h1>
          <p className="text-sm text-[#6B7280]">
            {order.created_at
              ? format(new Date(order.created_at), 'MMM d, yyyy h:mm a')
              : '–'}
          </p>
        </div>
        <span
          className={`inline-block text-[11px] font-semibold px-2.5 py-1 rounded-full capitalize ${statusClass}`}
        >
          {order.status ?? 'unknown'}
        </span>
      </div>

      {/* Two-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column (2/3): Order summary + Actions + Timeline */}
        <div className="lg:col-span-2 space-y-6">

          {/* Order Summary Card */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h2 className="font-semibold text-lg text-[#1B3A5C] mb-4">Order Summary</h2>
            <dl className="space-y-2">
              <div className="flex justify-between text-sm">
                <dt className="text-[#6B7280]">Amount</dt>
                <dd className="font-medium text-[#374151]">
                  {formatCurrency(order.amount_total, order.currency)}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#6B7280]">Type</dt>
                <dd className="font-medium text-[#374151]">
                  {order.type === 'recurring' ? 'Subscription' : 'One-time'}
                </dd>
              </div>
              <div className="flex justify-between text-sm">
                <dt className="text-[#6B7280]">Stripe ID</dt>
                <dd className="font-mono text-xs text-[#374151] break-all">{order.stripe_id}</dd>
              </div>
              {order.type === 'recurring' && (
                <>
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#6B7280]">Subscription Status</dt>
                    <dd className="font-medium text-[#374151] capitalize">
                      {order.subscription_status ?? '–'}
                    </dd>
                  </div>
                  {order.current_period_end && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-[#6B7280]">Current Period Ends</dt>
                      <dd className="font-medium text-[#374151]">
                        {format(new Date(order.current_period_end), 'MMM d, yyyy')}
                      </dd>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <dt className="text-[#6B7280]">Cancel at Period End</dt>
                    <dd className="font-medium text-[#374151]">
                      {order.cancel_at_period_end ? 'Yes' : 'No'}
                    </dd>
                  </div>
                  {order.canceled_at && (
                    <div className="flex justify-between text-sm">
                      <dt className="text-[#6B7280]">Canceled At</dt>
                      <dd className="font-medium text-[#374151]">
                        {format(new Date(order.canceled_at), 'MMM d, yyyy h:mm a')}
                      </dd>
                    </div>
                  )}
                </>
              )}
            </dl>
          </div>

          {/* Actions Card — client component */}
          <OrderActions
            stripeId={order.stripe_id ?? ''}
            orderType={order.type as 'one_time' | 'recurring'}
          />

          {/* Timeline */}
          <OrderTimeline events={timelineEvents} />
        </div>

        {/* Right column (1/3): Customer info + Product link + Customer journey */}
        <div className="space-y-6">

          {/* Customer Info Card (ORD-08: email, billing address, shipping address) */}
          <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
            <h2 className="font-semibold text-lg text-[#1B3A5C] mb-4">Customer</h2>

            {profile ? (
              <>
                {/* Avatar + Name + Email */}
                <div className="flex items-center gap-3 mb-4">
                  {profile.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={profile.avatar_url}
                      alt={profile.full_name ?? 'Customer avatar'}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-500 text-sm font-semibold">
                      {(profile.full_name ?? '?')[0]?.toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-[#374151]">{profile.full_name ?? 'Unknown'}</p>
                    <p className="text-sm text-[#6B7280]">{profile.email}</p>
                  </div>
                </div>

                {/* Billing Address (from Stripe customer, per ORD-08) */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                    Billing Address
                  </h3>
                  {billingAddress && (billingAddress.line1 || billingAddress.city) ? (
                    <div className="text-sm text-[#374151] space-y-0.5">
                      {billingAddress.line1 && <p>{billingAddress.line1}</p>}
                      {billingAddress.line2 && <p>{billingAddress.line2}</p>}
                      {(billingAddress.city || billingAddress.state || billingAddress.postal_code) && (
                        <p>
                          {[billingAddress.city, billingAddress.state, billingAddress.postal_code]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      {billingAddress.country && <p>{billingAddress.country}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">No billing address on file</p>
                  )}
                </div>

                {/* Shipping Address (from Stripe customer, per ORD-08) */}
                <div className="mb-4">
                  <h3 className="text-xs font-semibold text-[#6B7280] uppercase tracking-wider mb-1">
                    Shipping Address
                  </h3>
                  {shippingAddress && (shippingAddress.line1 || shippingAddress.city) ? (
                    <div className="text-sm text-[#374151] space-y-0.5">
                      {shippingAddress.line1 && <p>{shippingAddress.line1}</p>}
                      {shippingAddress.line2 && <p>{shippingAddress.line2}</p>}
                      {(shippingAddress.city || shippingAddress.state || shippingAddress.postal_code) && (
                        <p>
                          {[shippingAddress.city, shippingAddress.state, shippingAddress.postal_code]
                            .filter(Boolean)
                            .join(', ')}
                        </p>
                      )}
                      {shippingAddress.country && <p>{shippingAddress.country}</p>}
                    </div>
                  ) : (
                    <p className="text-sm text-[#9CA3AF]">No shipping address on file</p>
                  )}
                </div>

                {/* Quick link to user page */}
                <Link
                  href={`/admin/users?search=${encodeURIComponent(profile.email ?? '')}`}
                  className="text-sm font-medium text-[#00B5A3] hover:underline"
                >
                  View User &rarr;
                </Link>
              </>
            ) : (
              <p className="text-sm text-[#9CA3AF]">Customer not found in GOYA database.</p>
            )}
          </div>

          {/* Product Link Card */}
          {product && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h2 className="font-semibold text-lg text-[#1B3A5C] mb-3">Product</h2>
              <p className="text-sm font-medium text-[#374151] mb-2">{product.name}</p>
              <Link
                href={`/admin/shop/products/${product.id}`}
                className="text-sm font-medium text-[#00B5A3] hover:underline"
              >
                View Product &rarr;
              </Link>
            </div>
          )}

          {/* Customer Journey Card */}
          {journeyOrders && journeyOrders.length > 0 && (
            <div className="bg-white rounded-xl border border-[#E5E7EB] p-6">
              <h2 className="font-semibold text-lg text-[#1B3A5C] mb-4">Customer Journey</h2>
              <ol className="space-y-3">
                {journeyOrders.map((j) => (
                  <li key={j.id} className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <Link
                        href={`/admin/shop/orders/${j.id}`}
                        className={`text-sm font-mono font-medium hover:underline ${j.id === id ? 'text-[#1B3A5C]' : 'text-[#00B5A3]'}`}
                      >
                        {(j.stripe_id ?? '').slice(0, 8)}
                        {j.id === id && <span className="ml-1 text-[10px] font-normal text-[#6B7280]">(current)</span>}
                      </Link>
                      <p className="text-xs text-[#6B7280]">
                        {j.created_at ? format(new Date(j.created_at), 'MMM d, yyyy') : '–'}
                      </p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <p className="text-sm font-medium text-[#374151]">
                        {formatCurrency(j.amount_total, j.currency ?? 'usd')}
                      </p>
                      <span
                        className={`inline-block text-[10px] font-semibold px-1.5 py-0.5 rounded-full capitalize ${STATUS_PILL[j.status ?? ''] ?? 'bg-slate-100 text-slate-600'}`}
                      >
                        {j.status}
                      </span>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
