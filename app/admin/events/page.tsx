import Link from 'next/link';
import { Suspense } from 'react';
import { createSupabaseServerClient } from '@/lib/supabaseServer';
import type { Event } from '@/lib/types';
import AdminEventsFilters from './AdminEventsFilters';
import AdminEventActions from './AdminEventActions';

const CATEGORY_BADGE: Record<string, string> = {
  Workshop:           'bg-blue-50 text-blue-700',
  'Teacher Training': 'bg-blue-50 text-blue-700',
  'Dharma Talk':      'bg-blue-50 text-blue-700',
  Conference:         'bg-blue-50 text-blue-700',
  'Yoga Sequence':    'bg-blue-50 text-blue-700',
  'Music Playlist':   'bg-blue-50 text-blue-700',
  Research:           'bg-blue-50 text-blue-700',
};

const STATUS_BADGE: Record<string, string> = {
  published:      'bg-emerald-50 text-emerald-700',
  draft:          'bg-amber-50 text-amber-700',
  pending_review: 'bg-amber-50 text-amber-700',
  rejected:       'bg-red-50 text-red-700',
  cancelled:      'bg-red-50 text-red-700',
  deleted:        'bg-red-50 text-red-700 line-through',
};

const TYPE_BADGE: Record<string, string> = {
  goya:   'bg-blue-50 text-blue-700',
  member: 'bg-indigo-50 text-indigo-700',
};

function fmtTime(t: string) {
  if (!t) return '';
  const [h, m] = t.split(':').map(Number);
  const ampm = h >= 12 ? 'PM' : 'AM';
  return `${h % 12 || 12}:${String(m).padStart(2, '0')} ${ampm}`;
}

const PAGE_SIZE = 25;

export default async function AdminEventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp       = await searchParams;
  const search    = sp.search   ?? '';
  const category  = sp.category ?? '';
  const format    = sp.format   ?? '';
  const status    = sp.status   ?? '';   // '' means "active" (exclude deleted)
  const eventType = sp.type     ?? '';   // '' = all, 'goya', 'member'
  const sort      = sp.sort     ?? 'date_asc';
  const page     = Math.max(1, parseInt(sp.page ?? '1', 10));

  // ── Current user's role ───────────────────────────────────────────────────
  const supabase   = await createSupabaseServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  const { data: profileRow } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user!.id)
    .single();
  const userRole = (profileRow?.role as string) ?? 'moderator';
  const isAdmin  = userRole === 'admin';

  // ── Guard: moderators cannot view deleted events ──────────────────────────
  // If a moderator somehow reaches ?status=deleted, treat it as no filter
  const effectiveStatus = (status === 'deleted' && !isAdmin) ? '' : status;

  // ── Query ─────────────────────────────────────────────────────────────────
  let query = supabase.from('events').select('*, profiles!created_by(full_name, email)', { count: 'exact' });

  if (effectiveStatus) {
    // Explicit status filter (including 'deleted' for admins)
    query = query.eq('status', effectiveStatus);
  } else {
    // Default: show active events only (not deleted)
    query = query.neq('status', 'deleted');
  }

  if (search)    query = query.ilike('title', `%${search}%`);
  if (category)  query = query.eq('category', category);
  if (format)    query = query.eq('format', format);
  if (eventType) query = query.eq('event_type', eventType);

  if (sort === 'date_desc')            query = query.order('date', { ascending: false });
  else if (sort === 'created_at_desc') query = query.order('created_at', { ascending: false });
  else                                 query = query.order('date', { ascending: true });

  const from = (page - 1) * PAGE_SIZE;
  query = query.range(from, from + PAGE_SIZE - 1);

  const { data, count, error } = await query;

  type EventWithProfile = Event & { profiles: { full_name: string; email: string } | null };
  const events     = (data as EventWithProfile[]) ?? [];
  const total      = count ?? 0;
  const totalPages = Math.ceil(total / PAGE_SIZE);
  const viewingDeleted = effectiveStatus === 'deleted';

  return (
    <div className="p-6 lg:p-8">
      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-[#1B3A5C]">Events</h1>
          <p className="text-sm text-[#6B7280] mt-0.5">{total} {viewingDeleted ? 'deleted' : 'active'} event{total !== 1 ? 's' : ''}</p>
        </div>
        <Link
          href="/admin/events/new"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white text-sm font-semibold rounded-lg hover:bg-primary-dark transition-colors"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add New Event
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-4 mb-6">
        <Suspense>
          <AdminEventsFilters userRole={userRole} />
        </Suspense>
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
          Error loading events: {error.message}
        </div>
      )}

      {/* Table */}
      <div className={`bg-white rounded-xl border shadow-sm overflow-hidden ${viewingDeleted ? 'border-red-200' : 'border-[#E5E7EB]'}`}>
        {events.length === 0 ? (
          <div className="text-center py-16">
            <svg className="w-10 h-10 text-slate-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-[#374151] font-medium">
              {viewingDeleted ? 'No deleted events' : 'No events found'}
            </p>
            <p className="text-[#9CA3AF] text-sm mt-1">
              {viewingDeleted ? 'Nothing has been soft-deleted yet.' : 'Try adjusting your filters or add a new event.'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className={`border-b border-[#E5E7EB] ${viewingDeleted ? 'bg-red-50' : 'bg-slate-50'}`}>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Event</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Type</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Date</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Time</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden md:table-cell">Instructor</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Price</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider hidden lg:table-cell">Spots</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-[#6B7280] uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E7EB]">
                {events.map(ev => {
                  const isDeleted = ev.status === 'deleted';
                  return (
                    <tr key={ev.id} className={`transition-colors ${isDeleted ? 'bg-red-50/30 hover:bg-red-50/60' : 'hover:bg-slate-50'}`}>
                      {/* Event title + badges */}
                      <td className="px-4 py-3 max-w-xs">
                        <p className={`font-medium truncate ${isDeleted ? 'text-[#9CA3AF] line-through' : 'text-[#1B3A5C]'}`}>
                          {ev.title}
                        </p>
                        {ev.event_type === 'member' && ev.profiles && (
                          <p className="text-[10px] text-[#6B7280] mt-0.5 truncate">
                            Submitted by {ev.profiles.full_name || ev.profiles.email}
                          </p>
                        )}
                        <div className="flex flex-wrap gap-1 mt-1">
                          <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full ${CATEGORY_BADGE[ev.category] ?? 'bg-slate-100 text-slate-600'}`}>
                            {ev.category}
                          </span>
                          <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
                            {ev.format}
                          </span>
                        </div>
                      </td>
                      {/* Type */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full uppercase ${TYPE_BADGE[ev.event_type] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ev.event_type === 'member' ? 'Member' : 'GOYA'}
                        </span>
                      </td>
                      {/* Date */}
                      <td className="px-4 py-3 text-[#374151] whitespace-nowrap">
                        {new Date(ev.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                      </td>
                      {/* Time */}
                      <td className="px-4 py-3 text-[#374151] whitespace-nowrap">{fmtTime(ev.time_start)}</td>
                      {/* Instructor */}
                      <td className="px-4 py-3 text-[#374151] hidden md:table-cell">{ev.instructor ?? '—'}</td>
                      {/* Price */}
                      <td className="px-4 py-3 text-[#374151] hidden lg:table-cell whitespace-nowrap">
                        {ev.is_free ? <span className="text-emerald-600 font-semibold">Free</span> : `$${ev.price}`}
                      </td>
                      {/* Spots */}
                      <td className="px-4 py-3 text-[#374151] hidden lg:table-cell">
                        {ev.spots_remaining !== null ? `${ev.spots_remaining} / ${ev.spots_total ?? '—'}` : '—'}
                      </td>
                      {/* Status */}
                      <td className="px-4 py-3">
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_BADGE[ev.status] ?? 'bg-slate-100 text-slate-600'}`}>
                          {ev.status === 'pending_review' ? 'Pending Review' : ev.status}
                        </span>
                        {isDeleted && ev.deleted_at && (
                          <p className="text-[9px] text-[#9CA3AF] mt-0.5">
                            {new Date(ev.deleted_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                          </p>
                        )}
                      </td>
                      {/* Actions */}
                      <td className="px-4 py-3">
                        <AdminEventActions
                          eventId={ev.id}
                          imageUrl={ev.featured_image_url}
                          isDeleted={isDeleted}
                          userRole={userRole}
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between mt-5">
          <p className="text-sm text-[#6B7280]">
            Showing {from + 1}–{Math.min(from + PAGE_SIZE, total)} of {total}
          </p>
          <div className="flex gap-2">
            {page > 1 && (
              <Link
                href={`/admin/events?${new URLSearchParams({ ...sp, page: String(page - 1) })}`}
                className="px-3 py-1.5 border border-[#E5E7EB] text-sm rounded-lg hover:bg-slate-50 text-[#374151]"
              >
                Previous
              </Link>
            )}
            {page < totalPages && (
              <Link
                href={`/admin/events?${new URLSearchParams({ ...sp, page: String(page + 1) })}`}
                className="px-3 py-1.5 border border-[#E5E7EB] text-sm rounded-lg hover:bg-slate-50 text-[#374151]"
              >
                Next
              </Link>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
