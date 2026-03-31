'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const CATEGORIES = ['Workshop', 'Teacher Training', 'Dharma Talk', 'Conference', 'Yoga Sequence', 'Music Playlist', 'Research'];
const FORMATS    = ['Online', 'In Person', 'Hybrid'];
const BASE_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'published',      label: 'Published'      },
  { value: 'draft',          label: 'Draft'           },
  { value: 'pending_review', label: 'Pending Review'  },
  { value: 'rejected',       label: 'Rejected'        },
  { value: 'cancelled',      label: 'Cancelled'       },
];

const EVENT_TYPES: Array<{ value: string; label: string }> = [
  { value: 'goya',   label: 'GOYA Events'   },
  { value: 'member', label: 'Member Events'  },
];
const SORT_OPTS = [
  { value: 'date_asc',        label: 'Date (oldest first)' },
  { value: 'date_desc',       label: 'Date (newest first)' },
  { value: 'created_at_desc', label: 'Recently added'      },
];

const SEL = 'text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0]';

interface Props {
  userRole: string;
}

export default function AdminEventsFilters({ userRole }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [search,    setSearch]    = useState(searchParams.get('search')   ?? '');
  const [category,  setCategory]  = useState(searchParams.get('category') ?? '');
  const [format,    setFormat]    = useState(searchParams.get('format')   ?? '');
  const [status,    setStatus]    = useState(searchParams.get('status')   ?? '');
  const [eventType, setEventType] = useState(searchParams.get('type')     ?? '');
  const [sort,      setSort]      = useState(searchParams.get('sort')     ?? 'date_asc');

  const isAdmin = userRole === 'admin';

  const allStatuses = isAdmin
    ? [...BASE_STATUSES, { value: 'deleted', label: 'Deleted (trash)' }]
    : BASE_STATUSES;

  const apply = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const vals = { search, category, format, status, type: eventType, sort, ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', '1');
    router.replace(`/admin/events?${params.toString()}`);
  }, [search, category, format, status, eventType, sort, router]);

  function reset() {
    setSearch(''); setCategory(''); setFormat(''); setStatus(''); setEventType(''); setSort('date_asc');
    router.replace('/admin/events');
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        placeholder="Search events…"
        value={search}
        onChange={e => setSearch(e.target.value)}
        onKeyDown={e => e.key === 'Enter' && apply({ search })}
        className={`${SEL} min-w-[200px]`}
      />

      {/* Category */}
      <select value={category} onChange={e => { setCategory(e.target.value); apply({ category: e.target.value }); }} className={SEL}>
        <option value="">All Categories</option>
        {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
      </select>

      {/* Format */}
      <select value={format} onChange={e => { setFormat(e.target.value); apply({ format: e.target.value }); }} className={SEL}>
        <option value="">All Formats</option>
        {FORMATS.map(f => <option key={f} value={f}>{f}</option>)}
      </select>

      {/* Type */}
      <select value={eventType} onChange={e => { setEventType(e.target.value); apply({ type: e.target.value }); }} className={SEL}>
        <option value="">All Types</option>
        {EVENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {/* Status — 'Deleted' option only shown to admins */}
      <select value={status} onChange={e => { setStatus(e.target.value); apply({ status: e.target.value }); }} className={SEL}>
        <option value="">Active (all non-deleted)</option>
        {allStatuses.map(s => (
          <option key={s.value} value={s.value}>{s.label}</option>
        ))}
      </select>

      {/* Sort */}
      <select value={sort} onChange={e => { setSort(e.target.value); apply({ sort: e.target.value }); }} className={SEL}>
        {SORT_OPTS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>

      {/* Apply / Reset */}
      <button onClick={() => apply()} className="px-4 py-2 bg-[#4E87A0] text-white text-sm font-semibold rounded-lg hover:bg-[#3A7190] transition-colors">
        Apply
      </button>
      <button onClick={reset} className="px-4 py-2 border border-[#E5E7EB] text-[#374151] text-sm font-medium rounded-lg hover:bg-slate-50 transition-colors">
        Reset
      </button>

      {/* Deleted-view indicator */}
      {status === 'deleted' && (
        <span className="text-xs text-red-500 font-semibold bg-red-50 border border-red-200 px-3 py-1.5 rounded-lg">
          Viewing deleted events — admins only
        </span>
      )}
    </div>
  );
}
