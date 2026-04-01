'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

interface Props {
  initialSearch: string;
  initialCategory: string;
  initialSeverity: string;
  initialDateFrom: string;
  initialDateTo: string;
  initialSort: string;
  totalCount: number;
}

export default function AuditLogFilters({
  initialSearch,
  initialCategory,
  initialSeverity,
  initialDateFrom,
  initialDateTo,
  initialSort,
  totalCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);

  const updateParam = useCallback((key: string, value: string) => {
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
      router.replace(`/admin/audit-log?${params.toString()}`);
    });
  }, [searchParams, router]);

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('search', search);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  function handleReset() {
    setSearch('');
    startTransition(() => {
      router.replace('/admin/audit-log');
    });
  }

  function handleExportCSV() {
    const params = new URLSearchParams(searchParams.toString());
    // Remove pagination for export — fetch all matching
    params.delete('page');
    params.delete('pageSize');
    // Trigger client-side CSV generation via a dedicated route
    window.location.href = `/admin/audit-log/export?${params.toString()}`;
  }

  const selectClass = "h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3] cursor-pointer";

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Search */}
      <div className="relative">
        <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#6B7280]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input
          type="text"
          placeholder="Search actions, actors, targets..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 pl-9 pr-3 w-64 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3]"
        />
      </div>

      {/* Category */}
      <select
        defaultValue={initialCategory}
        onChange={e => updateParam('category', e.target.value)}
        className={selectClass}
      >
        <option value="">All Categories</option>
        <option value="admin">Admin</option>
        <option value="user">User</option>
        <option value="system">System</option>
      </select>

      {/* Severity */}
      <select
        defaultValue={initialSeverity}
        onChange={e => updateParam('severity', e.target.value)}
        className={selectClass}
      >
        <option value="">All Severities</option>
        <option value="info">Info</option>
        <option value="warning">Warning</option>
        <option value="error">Error</option>
      </select>

      {/* Date from */}
      <input
        type="date"
        defaultValue={initialDateFrom}
        onChange={e => updateParam('from', e.target.value)}
        className={`${selectClass} text-[#6B7280]`}
        title="From date"
      />

      {/* Date to */}
      <input
        type="date"
        defaultValue={initialDateTo}
        onChange={e => updateParam('to', e.target.value)}
        className={`${selectClass} text-[#6B7280]`}
        title="To date"
      />

      {/* Sort */}
      <select
        defaultValue={initialSort}
        onChange={e => updateParam('sort', e.target.value)}
        className={selectClass}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
      </select>

      {/* Reset */}
      <button
        onClick={handleReset}
        className="h-9 px-3 text-sm font-medium text-[#6B7280] hover:text-[#1B3A5C] border border-[#E5E7EB] bg-white rounded-lg hover:bg-slate-50 transition-colors"
      >
        Reset
      </button>

      {/* CSV Export */}
      <button
        onClick={handleExportCSV}
        disabled={totalCount === 0}
        className="h-9 px-3 text-sm font-medium text-white bg-[#00B5A3] rounded-lg hover:bg-[#009e8e] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1.5 ml-auto"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        Export CSV
      </button>
    </div>
  );
}
