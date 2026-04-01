'use client';

import { useState, useEffect, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  initialSearch: string;
  initialType: string;
  initialStatus: string;
  initialDateFrom: string;
  initialDateTo: string;
  initialPriceMin: string;
  initialPriceMax: string;
  initialSort: string;
}

export default function OrdersFilters({
  initialSearch,
  initialType,
  initialStatus,
  initialDateFrom,
  initialDateTo,
  initialPriceMin,
  initialPriceMax,
  initialSort,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('search', search);
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function updateParam(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    if (key !== 'page' && key !== 'pageSize') {
      params.set('page', '1');
    }
    startTransition(() => {
      router.replace(`/admin/shop/orders?${params.toString()}`);
    });
  }

  function handleReset() {
    setSearch('');
    startTransition(() => {
      router.replace('/admin/shop/orders');
    });
  }

  const selectClass =
    'h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3] cursor-pointer';

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          type="text"
          placeholder="Search by customer name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="h-9 pl-9 pr-3 w-64 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3]"
        />
      </div>

      {/* Type */}
      <select
        defaultValue={initialType}
        onChange={(e) => updateParam('type', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Types</option>
        <option value="one_time">One-time</option>
        <option value="recurring">Subscriptions</option>
      </select>

      {/* Status */}
      <select
        defaultValue={initialStatus}
        onChange={(e) => updateParam('status', e.target.value)}
        className={selectClass}
      >
        <option value="all">All Status</option>
        <option value="active">Active</option>
        <option value="succeeded">Succeeded</option>
        <option value="failed">Failed</option>
        <option value="canceled">Canceled</option>
        <option value="archived">Archived</option>
      </select>

      {/* Date from */}
      <input
        type="date"
        defaultValue={initialDateFrom}
        onChange={(e) => updateParam('dateFrom', e.target.value)}
        className={`${selectClass} text-[#6B7280]`}
        title="Date from"
      />

      {/* Date to */}
      <input
        type="date"
        defaultValue={initialDateTo}
        onChange={(e) => updateParam('dateTo', e.target.value)}
        className={`${selectClass} text-[#6B7280]`}
        title="Date to"
      />

      {/* Price min */}
      <input
        type="number"
        min="0"
        placeholder="Min $"
        defaultValue={initialPriceMin}
        onChange={(e) => updateParam('priceMin', e.target.value)}
        className="h-9 px-3 w-24 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3]"
      />

      {/* Price max */}
      <input
        type="number"
        min="0"
        placeholder="Max $"
        defaultValue={initialPriceMax}
        onChange={(e) => updateParam('priceMax', e.target.value)}
        className="h-9 px-3 w-24 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3]"
      />

      {/* Sort */}
      <select
        defaultValue={initialSort}
        onChange={(e) => updateParam('sort', e.target.value)}
        className={selectClass}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="amount_high">Amount (High)</option>
        <option value="amount_low">Amount (Low)</option>
      </select>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="h-9 px-3 text-sm font-medium text-[#6B7280] hover:text-[#1B3A5C] border border-[#E5E7EB] bg-white rounded-lg hover:bg-slate-50 transition-colors"
      >
        Reset
      </button>
    </div>
  );
}
