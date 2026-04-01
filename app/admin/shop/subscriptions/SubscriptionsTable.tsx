'use client';

import { format } from 'date-fns';
import Link from 'next/link';

export type SubscriptionRow = {
  id: string;
  userId: string | null;
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

const STATUS_PILL: Record<string, string> = {
  active:     'bg-emerald-100 text-emerald-700',
  trialing:   'bg-blue-100 text-blue-700',
  past_due:   'bg-red-100 text-red-700',
  canceled:   'bg-red-100 text-red-700',
  incomplete: 'bg-yellow-100 text-yellow-700',
  paused:     'bg-amber-100 text-amber-700',
  unpaid:     'bg-red-100 text-red-700',
};

function formatDateTime(iso: string): string {
  try {
    return format(new Date(iso), 'MMM d, yyyy h:mm a');
  } catch {
    return iso;
  }
}

function formatCurrency(amountCents: number, currency: string): string {
  const symbol = currency.toLowerCase() === 'usd' ? '$' : currency.toUpperCase() + ' ';
  return `${symbol}${(amountCents / 100).toFixed(2)}`;
}

function formatNextPayment(row: SubscriptionRow): string {
  if (!row.currentPeriodEnd) return '–';
  const date = format(new Date(row.currentPeriodEnd), 'MMM d, yyyy');
  if (row.cancelAtPeriodEnd) return `Cancels ${date}`;
  return date;
}

export default function SubscriptionsTable({
  initialSubscriptions,
  totalCount,
}: {
  initialSubscriptions: SubscriptionRow[];
  totalCount: number;
}) {
  if (initialSubscriptions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
        <svg
          className="w-8 h-8 text-slate-300 mx-auto mb-3"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        <p className="text-sm font-medium text-[#374151]">No subscriptions found</p>
        <p className="text-xs text-[#6B7280] mt-1">
          Subscriptions will appear here once imported or created via Stripe.
        </p>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Plan</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Next Payment</th>
                <th className="px-4 py-3">Stripe ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {initialSubscriptions.map((sub) => (
                <tr key={sub.id} className="hover:bg-slate-50 transition-colors">
                  {/* Customer */}
                  <td className="px-4 py-3">
                    {sub.userId ? (
                      <Link
                        href={`/admin/users/${sub.userId}`}
                        className="text-sm font-medium text-[#1B3A5C] hover:underline truncate max-w-[160px] block"
                      >
                        {sub.customerName ?? 'Unknown'}
                      </Link>
                    ) : (
                      <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-[160px]">
                        {sub.customerName ?? 'Unknown'}
                      </p>
                    )}
                    {sub.customerEmail && (
                      <p className="text-xs text-[#6B7280] truncate max-w-[160px]">
                        {sub.customerEmail}
                      </p>
                    )}
                  </td>

                  {/* Plan */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#374151]">{sub.planName}</p>
                    <span className="inline-block text-[10px] font-medium px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 mt-0.5">
                      {sub.interval === 'year' ? 'Yearly' : 'Monthly'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_PILL[sub.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {sub.status.replace('_', ' ')}
                    </span>
                  </td>

                  {/* Amount */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[#374151]">
                      {formatCurrency(sub.amount, sub.currency)}/{sub.interval}
                    </span>
                  </td>

                  {/* Started */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#6B7280] whitespace-nowrap">
                      {sub.currentPeriodStart
                        ? formatDateTime(sub.currentPeriodStart)
                        : sub.createdAt
                          ? formatDateTime(sub.createdAt)
                          : '–'}
                    </span>
                  </td>

                  {/* Next Payment */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#374151] whitespace-nowrap">
                      {formatNextPayment(sub)}
                    </span>
                  </td>

                  {/* Stripe ID */}
                  <td className="px-4 py-3">
                    <a
                      href={`https://dashboard.stripe.com/subscriptions/${sub.stripeSubscriptionId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-[#1B3A5C] hover:underline"
                    >
                      {(() => {
                        const sid = sub.stripeSubscriptionId;
                        return sid.length > 15 ? sid.slice(0, 8) + '...' + sid.slice(-3) : sid;
                      })()}
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-2 text-xs text-[#9CA3AF] text-right">
        Showing {initialSubscriptions.length} of {totalCount.toLocaleString()} subscriptions
      </p>
    </div>
  );
}
