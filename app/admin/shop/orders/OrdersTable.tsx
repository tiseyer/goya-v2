'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { format } from 'date-fns';
import { bulkOrderAction } from './actions';

export type OrderRow = {
  id: string;
  stripeId: string;
  customerName: string | null;
  customerEmail: string | null;
  createdAt: string;
  status: string;
  amountTotal: number;
  currency: string;
  paymentMethod: string | null;
  type: 'one_time' | 'recurring';
  subscriptionStatus: string | null;
  currentPeriodEnd: string | null;
  cancelAtPeriodEnd: boolean;
  couponName: string | null;
};

const STATUS_PILL: Record<string, string> = {
  succeeded: 'bg-emerald-100 text-emerald-700',
  active:    'bg-blue-100 text-blue-700',
  failed:    'bg-red-100 text-red-700',
  canceled:  'bg-slate-100 text-slate-600',
  archived:  'bg-gray-100 text-gray-500',
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

function formatNextPayment(row: OrderRow): string {
  if (row.type !== 'recurring' || !row.currentPeriodEnd) return '–';
  const date = format(new Date(row.currentPeriodEnd), 'MMM d, yyyy');
  if (row.cancelAtPeriodEnd) return `Cancels ${date}`;
  return date;
}

export default function OrdersTable({
  initialOrders,
  totalCount,
}: {
  initialOrders: OrderRow[];
  totalCount: number;
}) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  function handleSelectAll() {
    if (selectAll) {
      setSelected(new Set());
      setSelectAll(false);
    } else {
      setSelected(new Set(initialOrders.map((o) => o.id)));
      setSelectAll(true);
    }
  }

  function handleSelectRow(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      setSelectAll(next.size === initialOrders.length);
      return next;
    });
  }

  function handleBulkAction(action: 'archive' | 'restore') {
    setActionError(null);
    startTransition(async () => {
      const result = await bulkOrderAction(Array.from(selected), action);
      if (!result.success) {
        setActionError(result.error ?? 'Unknown error');
      } else {
        setSelected(new Set());
        setSelectAll(false);
      }
    });
  }

  if (initialOrders.length === 0) {
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
            d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
          />
        </svg>
        <p className="text-sm font-medium text-[#374151]">No orders found</p>
        <p className="text-xs text-[#6B7280] mt-1">Try adjusting your filters.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="mb-3 flex items-center gap-3 px-4 py-2.5 bg-[#F8FAFC] border border-[#E5E7EB] rounded-xl">
          <span className="text-sm font-medium text-[#374151]">
            {selected.size} selected
          </span>
          <div className="flex items-center gap-2 ml-auto">
            {actionError && (
              <span className="text-xs text-red-600">{actionError}</span>
            )}
            <button
              onClick={() => handleBulkAction('archive')}
              disabled={isPending}
              className="h-8 px-3 text-sm font-medium text-[#374151] border border-[#E5E7EB] bg-white rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-50"
            >
              Archive
            </button>
            <button
              onClick={() => handleBulkAction('restore')}
              disabled={isPending}
              className="h-8 px-3 text-sm font-medium text-white bg-[#1B3A5C] rounded-lg hover:bg-[#1B3A5C]/90 transition-colors disabled:opacity-50"
            >
              Restore
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[1100px]">
            <thead>
              <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                <th className="px-4 py-3 w-10">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="rounded border-[#D1D5DB] text-[#00B5A3] focus:ring-[#00B5A3]"
                    aria-label="Select all"
                  />
                </th>
                <th className="px-4 py-3">Order #</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Date / Time</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Payment Method</th>
                <th className="px-4 py-3">Recurring Total</th>
                <th className="px-4 py-3">Next Payment</th>
                <th className="px-4 py-3">Coupon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F1F5F9]">
              {initialOrders.map((order) => (
                <tr
                  key={order.id}
                  className={`hover:bg-slate-50 transition-colors ${selected.has(order.id) ? 'bg-blue-50/40' : ''}`}
                >
                  {/* Checkbox */}
                  <td className="px-4 py-3">
                    <input
                      type="checkbox"
                      checked={selected.has(order.id)}
                      onChange={() => handleSelectRow(order.id)}
                      className="rounded border-[#D1D5DB] text-[#00B5A3] focus:ring-[#00B5A3]"
                      aria-label={`Select order ${order.stripeId}`}
                    />
                  </td>

                  {/* Order # */}
                  <td className="px-4 py-3">
                    <Link
                      href={`/admin/shop/orders/${order.id}`}
                      className="text-sm font-mono font-medium text-[#1B3A5C] hover:underline"
                    >
                      {order.stripeId.slice(0, 8)}
                    </Link>
                  </td>

                  {/* Customer */}
                  <td className="px-4 py-3">
                    <p className="text-sm font-medium text-[#1B3A5C] truncate max-w-[160px]">
                      {order.customerName ?? 'Unknown'}
                    </p>
                    {order.customerEmail && (
                      <p className="text-xs text-[#6B7280] truncate max-w-[160px]">
                        {order.customerEmail}
                      </p>
                    )}
                  </td>

                  {/* Date / Time */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#6B7280] whitespace-nowrap">
                      {order.createdAt ? formatDateTime(order.createdAt) : '–'}
                    </span>
                  </td>

                  {/* Status */}
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_PILL[order.status] ?? 'bg-slate-100 text-slate-600'}`}
                    >
                      {order.status}
                    </span>
                  </td>

                  {/* Total */}
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-[#374151]">
                      {formatCurrency(order.amountTotal, order.currency)}
                    </span>
                  </td>

                  {/* Payment Method */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#9CA3AF]">–</span>
                  </td>

                  {/* Recurring Total */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#374151]">
                      {order.type === 'recurring'
                        ? formatCurrency(order.amountTotal, order.currency)
                        : '–'}
                    </span>
                  </td>

                  {/* Next Payment */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#374151] whitespace-nowrap">
                      {formatNextPayment(order)}
                    </span>
                  </td>

                  {/* Coupon */}
                  <td className="px-4 py-3">
                    <span className="text-sm text-[#374151]">
                      {order.couponName ?? ''}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <p className="mt-2 text-xs text-[#9CA3AF] text-right">
        Showing {initialOrders.length} of {totalCount.toLocaleString()} orders
      </p>
    </div>
  );
}
