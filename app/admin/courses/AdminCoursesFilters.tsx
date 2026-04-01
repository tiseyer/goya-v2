'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

const CATEGORIES = ['Workshop', 'Yoga Sequence', 'Dharma Talk', 'Music Playlist', 'Research'];
const BASE_STATUSES: Array<{ value: string; label: string }> = [
  { value: 'published',      label: 'Published'      },
  { value: 'draft',          label: 'Draft'           },
  { value: 'pending_review', label: 'Pending Review'  },
  { value: 'rejected',       label: 'Rejected'        },
  { value: 'cancelled',      label: 'Cancelled'       },
];

const COURSE_TYPES: Array<{ value: string; label: string }> = [
  { value: 'goya',   label: 'GOYA Courses'   },
  { value: 'member', label: 'Member Courses'  },
];

const SORT_OPTS = [
  { value: 'created_at_desc', label: 'Recently added' },
  { value: 'title_asc',       label: 'Title (A-Z)'    },
  { value: 'title_desc',      label: 'Title (Z-A)'    },
];

const SEL = 'text-sm border border-[#E5E7EB] rounded-lg px-3 py-2 bg-white text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#4E87A0] focus:border-[#4E87A0]';

interface Props {
  userRole: string;
}

export default function AdminCoursesFilters({ userRole }: Props) {
  const router       = useRouter();
  const searchParams = useSearchParams();

  const [search,     setSearch]     = useState(searchParams.get('search')   ?? '');
  const [category,   setCategory]   = useState(searchParams.get('category') ?? '');
  const [access,     setAccess]     = useState(searchParams.get('access')   ?? '');
  const [status,     setStatus]     = useState(searchParams.get('status')   ?? '');
  const [courseType,  setCourseType] = useState(searchParams.get('type')     ?? '');
  const [sort,       setSort]       = useState(searchParams.get('sort')     ?? 'created_at_desc');

  const isAdmin = userRole === 'admin';

  const allStatuses = isAdmin
    ? [...BASE_STATUSES, { value: 'deleted', label: 'Deleted (trash)' }]
    : BASE_STATUSES;

  const apply = useCallback((overrides: Record<string, string> = {}) => {
    const params = new URLSearchParams();
    const vals = { search, category, access, status, type: courseType, sort, ...overrides };
    Object.entries(vals).forEach(([k, v]) => { if (v) params.set(k, v); });
    params.set('page', '1');
    router.replace(`/admin/courses?${params.toString()}`);
  }, [search, category, access, status, courseType, sort, router]);

  function reset() {
    setSearch(''); setCategory(''); setAccess(''); setStatus(''); setCourseType(''); setSort('created_at_desc');
    router.replace('/admin/courses');
  }

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {/* Search */}
      <input
        type="text"
        placeholder="Search courses..."
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

      {/* Access */}
      <select value={access} onChange={e => { setAccess(e.target.value); apply({ access: e.target.value }); }} className={SEL}>
        <option value="">All Access</option>
        <option value="free">Free</option>
        <option value="members_only">Members Only</option>
      </select>

      {/* Type */}
      <select value={courseType} onChange={e => { setCourseType(e.target.value); apply({ type: e.target.value }); }} className={SEL}>
        <option value="">All Types</option>
        {COURSE_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
      </select>

      {/* Status -- 'Deleted' option only shown to admins */}
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
          Viewing deleted courses -- admins only
        </span>
      )}
    </div>
  );
}
