'use client';

import { useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  page: number;
  pageSize: number;
  totalPages: number;
  totalCount: number;
  displayedCount: number;
}

export default function AdminUsersPagination({ page, pageSize, totalPages, totalCount, displayedCount }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  function navigate(updates: Record<string, string>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      params.set(key, value);
    }
    startTransition(() => {
      router.replace(`/admin/users?${params.toString()}`);
    });
  }

  const btnClass = (disabled: boolean) =>
    `px-3 py-1.5 text-sm font-medium rounded-lg border transition-colors ${
      disabled
        ? 'border-[#E5E7EB] text-[#9CA3AF] cursor-not-allowed bg-white'
        : 'border-[#E5E7EB] text-[#374151] hover:text-[#1B3A5C] hover:border-[#1B3A5C] bg-white cursor-pointer'
    }`;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 mt-4">
      {/* Count */}
      <p className="text-sm text-[#6B7280]">
        <span className="font-medium text-[#374151]">{displayedCount}</span>
        {' / '}
        <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span>
        {' users'}
      </p>

      {/* Pagination controls */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-[#6B7280]">
          Page <span className="font-medium text-[#374151]">{page}</span> of{' '}
          <span className="font-medium text-[#374151]">{totalPages}</span>
        </span>

        <button
          disabled={page <= 1}
          onClick={() => navigate({ page: String(page - 1) })}
          className={btnClass(page <= 1)}
        >
          ← Prev
        </button>
        <button
          disabled={page >= totalPages}
          onClick={() => navigate({ page: String(page + 1) })}
          className={btnClass(page >= totalPages)}
        >
          Next →
        </button>

        {/* Page size */}
        <select
          value={pageSize}
          onChange={e => navigate({ pageSize: e.target.value, page: '1' })}
          className="h-8 px-2 text-sm border border-[#E5E7EB] rounded-lg bg-white text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] cursor-pointer"
        >
          <option value="25">25 / page</option>
          <option value="50">50 / page</option>
          <option value="100">100 / page</option>
        </select>
      </div>
    </div>
  );
}
