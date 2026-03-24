import { Suspense } from 'react';
import { getSupabaseService } from '@/lib/supabase/service';
import AuditLogFilters from './AuditLogFilters';
import AuditLogPagination from './AuditLogPagination';

type SearchParams = Promise<{ [key: string]: string | string[] | undefined }>;

function str(v: string | string[] | undefined): string {
  return Array.isArray(v) ? v[0] : (v ?? '');
}

type AuditRow = {
  id: string;
  category: string;
  action: string;
  severity: string;
  actor_name: string | null;
  actor_role: string | null;
  target_type: string | null;
  target_label: string | null;
  description: string | null;
  metadata: Record<string, unknown> | null;
  ip_address: string | null;
  created_at: string;
};

const SEVERITY_STYLES: Record<string, string> = {
  info: 'bg-blue-50 text-blue-700',
  warning: 'bg-amber-50 text-amber-700',
  error: 'bg-red-50 text-red-700',
};

const CATEGORY_STYLES: Record<string, string> = {
  admin: 'bg-purple-50 text-purple-700',
  user: 'bg-emerald-50 text-emerald-700',
  system: 'bg-slate-100 text-slate-600',
};

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString('de-DE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export default async function AuditLogPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;

  const search   = str(params.search);
  const category = str(params.category);
  const severity = str(params.severity);
  const dateFrom = str(params.from);
  const dateTo   = str(params.to);
  const sort     = str(params.sort) || 'newest';
  const page     = Math.max(1, parseInt(str(params.page) || '1', 10));
  const pageSize = [25, 50, 100].includes(parseInt(str(params.pageSize), 10))
    ? parseInt(str(params.pageSize), 10)
    : 25;

  let rows: AuditRow[] = [];
  let totalCount = 0;
  let error: string | null = null;

  try {
    const supabase = getSupabaseService();

    // audit_log table is not in generated types — cast to any
    let query = (supabase as any)
      .from('audit_log')
      .select(
        'id, category, action, severity, actor_name, actor_role, target_type, target_label, description, metadata, ip_address, created_at',
        { count: 'exact' }
      );

    if (search) {
      query = query.or(
        `description.ilike.%${search}%,actor_name.ilike.%${search}%,action.ilike.%${search}%,target_label.ilike.%${search}%`
      );
    }
    if (category) query = query.eq('category', category);
    if (severity) query = query.eq('severity', severity);
    if (dateFrom) query = query.gte('created_at', dateFrom);
    if (dateTo)   query = query.lte('created_at', dateTo + 'T23:59:59Z');

    switch (sort) {
      case 'oldest': query = query.order('created_at', { ascending: true }); break;
      default:       query = query.order('created_at', { ascending: false }); break;
    }

    const from = (page - 1) * pageSize;
    const to   = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count, error: dbError } = await query;

    if (dbError) {
      error = dbError.message;
    } else {
      rows = ((data as unknown) as AuditRow[]) ?? [];
      totalCount = count ?? 0;
    }
  } catch (e) {
    error = e instanceof Error ? e.message : 'Failed to load audit log';
  }

  const totalPages    = Math.max(1, Math.ceil(totalCount / pageSize));
  const displayedCount = rows.length;

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Audit Log</h1>
        <p className="text-sm text-[#6B7280]">
          <span className="font-medium text-[#374151]">{displayedCount}</span>
          {' / '}
          <span className="font-medium text-[#374151]">{totalCount.toLocaleString()}</span>
          {' entries'}
        </p>
      </div>

      {/* Filters */}
      <div className="mb-4">
        <Suspense>
          <AuditLogFilters
            initialSearch={search}
            initialCategory={category}
            initialSeverity={severity}
            initialDateFrom={dateFrom}
            initialDateTo={dateTo}
            initialSort={sort}
            totalCount={totalCount}
          />
        </Suspense>
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4">
          <p className="text-sm text-red-700">
            <span className="font-medium">Error:</span> {error}
          </p>
        </div>
      )}

      {/* Empty state */}
      {!error && rows.length === 0 ? (
        <div className="bg-white rounded-xl border border-[#E5E7EB] p-12 text-center">
          <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-sm font-medium text-[#374151]">No audit log entries found.</p>
          <p className="text-xs text-[#6B7280] mt-1">Entries will appear here as actions are performed.</p>
        </div>
      ) : !error && (
        /* Table */
        <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[1000px]">
              <thead>
                <tr className="text-left text-[11px] font-semibold text-[#6B7280] uppercase tracking-wider border-b border-[#E5E7EB] bg-slate-50">
                  <th className="px-4 py-3">Time</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Severity</th>
                  <th className="px-4 py-3">Actor</th>
                  <th className="px-4 py-3">Action</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Description</th>
                  <th className="px-4 py-3">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F1F5F9]">
                {rows.map(row => (
                  <tr key={row.id} className="hover:bg-slate-50 transition-colors align-top">
                    {/* Time */}
                    <td className="px-4 py-3">
                      <span className="text-xs text-[#6B7280] whitespace-nowrap">
                        {formatDateTime(row.created_at)}
                      </span>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${CATEGORY_STYLES[row.category] ?? 'bg-slate-100 text-slate-600'}`}>
                        {row.category}
                      </span>
                    </td>

                    {/* Severity */}
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[11px] font-semibold px-2 py-0.5 rounded-full ${SEVERITY_STYLES[row.severity] ?? 'bg-slate-100 text-slate-600'}`}>
                        {row.severity}
                      </span>
                    </td>

                    {/* Actor */}
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-medium text-[#1B3A5C]">
                          {row.actor_name ?? '—'}
                        </span>
                        {row.actor_role && (
                          <span className="block text-[11px] text-[#6B7280]">{row.actor_role}</span>
                        )}
                      </div>
                    </td>

                    {/* Action */}
                    <td className="px-4 py-3">
                      <code className="text-xs font-mono text-[#374151] bg-slate-50 px-1.5 py-0.5 rounded">
                        {row.action}
                      </code>
                    </td>

                    {/* Target */}
                    <td className="px-4 py-3">
                      {row.target_type ? (
                        <div>
                          <span className="text-[11px] text-[#6B7280] uppercase">{row.target_type}</span>
                          {row.target_label && (
                            <span className="block text-sm text-[#374151]">{row.target_label}</span>
                          )}
                        </div>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>

                    {/* Description */}
                    <td className="px-4 py-3 max-w-[200px]">
                      <span className="text-sm text-[#374151] line-clamp-2">
                        {row.description ?? '—'}
                      </span>
                    </td>

                    {/* Metadata */}
                    <td className="px-4 py-3">
                      {row.metadata && Object.keys(row.metadata).length > 0 ? (
                        <details className="group">
                          <summary className="cursor-pointer inline-flex items-center gap-1.5 text-xs font-semibold text-[#4E87A0] hover:text-[#1B3A5C] transition-colors select-none list-none">
                            <svg className="w-3.5 h-3.5 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                            {Object.keys(row.metadata).length} fields
                          </summary>
                          <pre className="mt-2 p-2 bg-slate-50 border border-[#E5E7EB] rounded-lg text-[10px] text-[#374151] max-w-xs overflow-auto max-h-48 whitespace-pre-wrap break-all">
                            {JSON.stringify(row.metadata, null, 2)}
                          </pre>
                        </details>
                      ) : (
                        <span className="text-sm text-slate-400">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Pagination */}
      {!error && totalCount > 0 && (
        <Suspense>
          <AuditLogPagination
            page={page}
            pageSize={pageSize}
            totalPages={totalPages}
            totalCount={totalCount}
            displayedCount={displayedCount}
          />
        </Suspense>
      )}
    </div>
  );
}
