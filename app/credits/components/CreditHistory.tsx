'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import type { CreditEntry, CreditType } from '@/lib/credits';

interface Props {
  filterType?: CreditType;
}

const PAGE_SIZE = 25;

const TYPE_LABELS: Record<CreditType, string> = {
  ce: 'CE Credits',
  karma: 'Karma Hours',
  practice: 'Practice Hours',
  teaching: 'Teaching Hours',
  community: 'Community Credits',
};

const STATUS_STYLES: Record<string, string> = {
  approved: 'bg-emerald-100 text-emerald-700',
  pending:  'bg-slate-100 text-slate-600',
  rejected: 'bg-rose-100 text-rose-700',
};

const STATUS_LABELS: Record<string, string> = {
  approved: 'Approved',
  pending:  'Pending Review',
  rejected: 'Rejected',
};

function formatDate(dateStr: string) {
  // Append T00:00:00 to parse as local time, avoiding UTC-offset date shift
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isExpired(entry: CreditEntry): boolean {
  if (!entry.expires_at) return false;
  // Compare date strings directly to avoid timezone-induced off-by-one
  return entry.expires_at < new Date().toISOString().split('T')[0];
}

export default function CreditHistory({ filterType }: Props) {
  const [entries, setEntries] = useState<CreditEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      let query = supabase
        .from('credit_entries')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('activity_date', { ascending: false })
        .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE - 1);

      if (filterType) {
        query = query.eq('credit_type', filterType);
      }

      const { data, count } = await query;
      setEntries(data ?? []);
      setTotal(count ?? 0);
      setLoading(false);
    }
    load();
  }, [page, filterType]);

  const totalPages = Math.ceil(total / PAGE_SIZE);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-6 py-4 border-b border-slate-100">
        <h2 className="text-base font-semibold text-[#1B3A5C]">Credits History</h2>
        {total > 0 && <p className="text-xs text-slate-400 mt-0.5">{total} total entries</p>}
      </div>

      {loading ? (
        <div className="px-6 py-12 text-center">
          <svg className="w-6 h-6 text-slate-300 animate-spin mx-auto" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        </div>
      ) : entries.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <svg className="w-10 h-10 text-slate-200 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm font-medium text-slate-500">No credits submitted yet</p>
          <p className="text-xs text-slate-400 mt-1">Your submitted credits will appear here.</p>
        </div>
      ) : (
        <>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100">
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-6 py-3">Date</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Type</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Amount</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Description</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Status</th>
                  <th className="text-left text-xs font-semibold text-slate-500 uppercase tracking-wide px-4 py-3">Expires</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {entries.map(entry => {
                  const expired = isExpired(entry);
                  return (
                    <tr
                      key={entry.id}
                      className={`hover:bg-slate-50/50 transition-colors ${expired ? 'opacity-50' : ''}`}
                    >
                      <td className={`px-6 py-3.5 text-slate-600 whitespace-nowrap ${expired ? 'italic' : ''}`}>
                        {formatDate(entry.activity_date)}
                      </td>
                      <td className="px-4 py-3.5 text-slate-600 whitespace-nowrap">
                        {TYPE_LABELS[entry.credit_type] ?? entry.credit_type}
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-[#1B3A5C] whitespace-nowrap">
                        {entry.amount}
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 max-w-xs truncate">
                        {entry.description ?? '—'}
                      </td>
                      <td className="px-4 py-3.5 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_STYLES[entry.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {STATUS_LABELS[entry.status] ?? entry.status}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 text-slate-500 whitespace-nowrap text-xs">
                        {entry.expires_at ? formatDate(entry.expires_at) : '—'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile list */}
          <div className="sm:hidden divide-y divide-slate-100">
            {entries.map(entry => {
              const expired = isExpired(entry);
              return (
                <div
                  key={entry.id}
                  className={`px-4 py-3.5 ${expired ? 'opacity-50 italic' : ''}`}
                >
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <span className="text-sm font-semibold text-[#1B3A5C]">
                      {TYPE_LABELS[entry.credit_type] ?? entry.credit_type}
                    </span>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold shrink-0 ${STATUS_STYLES[entry.status] ?? 'bg-slate-100 text-slate-600'}`}>
                      {STATUS_LABELS[entry.status] ?? entry.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>{formatDate(entry.activity_date)}</span>
                    <span>·</span>
                    <span className="font-semibold text-[#1B3A5C]">{entry.amount} {entry.credit_type === 'ce' ? 'credits' : 'hrs'}</span>
                  </div>
                  {entry.description && (
                    <p className="text-xs text-slate-400 mt-1 line-clamp-2">{entry.description}</p>
                  )}
                </div>
              );
            })}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="px-6 py-4 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                Page {page + 1} of {totalPages}
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={page === 0}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <button
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  className="px-3 py-1.5 text-xs font-medium border border-slate-200 rounded-lg text-slate-600 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
