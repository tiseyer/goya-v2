'use client';

import { useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

type Owner = {
  id: string;
  full_name: string | null;
  email: string | null;
} | null;

type School = {
  id: string;
  name: string;
  logo_url: string | null;
  city: string | null;
  country: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'suspended';
  rejection_reason: string | null;
  created_at: string;
  owner: Owner;
};

interface Props {
  initialSchools: School[];
}

function relativeDate(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  const months = Math.floor(days / 30);
  if (months < 12) return `${months}mo ago`;
  return `${Math.floor(months / 12)}y ago`;
}

const STATUS_STYLES: Record<School['status'], string> = {
  pending:   'bg-amber-50 text-amber-700 border border-amber-200',
  approved:  'bg-green-50 text-green-700 border border-green-200',
  rejected:  'bg-rose-50 text-rose-700 border border-rose-200',
  suspended: 'bg-orange-50 text-orange-700 border border-orange-200',
};

export default function SchoolRegistrationsTab({ initialSchools }: Props) {
  const [schools, setSchools] = useState<School[]>(initialSchools);
  const [busy, setBusy] = useState<string | null>(null); // schoolId being actioned
  const [rejectOpen, setRejectOpen] = useState<string | null>(null); // schoolId with reject input open
  const [rejectReason, setRejectReason] = useState('');

  async function handleApprove(schoolId: string) {
    setBusy(schoolId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('schools')
      .update({ status: 'approved', rejection_reason: null })
      .eq('id', schoolId);
    if (!error) {
      setSchools(prev =>
        prev.map(s => s.id === schoolId ? { ...s, status: 'approved', rejection_reason: null } : s)
      );
    }
    setBusy(null);
  }

  async function handleReject(schoolId: string) {
    setBusy(schoolId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('schools')
      .update({ status: 'rejected', rejection_reason: rejectReason || null })
      .eq('id', schoolId);
    if (!error) {
      setSchools(prev =>
        prev.map(s => s.id === schoolId ? { ...s, status: 'rejected', rejection_reason: rejectReason || null } : s)
      );
      setRejectOpen(null);
      setRejectReason('');
    }
    setBusy(null);
  }

  async function handleReset(schoolId: string) {
    setBusy(schoolId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any)
      .from('schools')
      .update({ status: 'pending', rejection_reason: null })
      .eq('id', schoolId);
    if (!error) {
      setSchools(prev =>
        prev.map(s => s.id === schoolId ? { ...s, status: 'pending', rejection_reason: null } : s)
      );
    }
    setBusy(null);
  }

  function openReject(schoolId: string) {
    setRejectOpen(schoolId);
    setRejectReason('');
  }

  if (schools.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
        <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.75} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <p className="font-semibold text-slate-700 mb-1">No school registrations yet</p>
        <p className="text-sm text-slate-400">School applications will appear here for review.</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
      {/* Table header */}
      <div className="hidden md:grid grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 px-6 py-3 border-b border-slate-100 bg-slate-50">
        {['SCHOOL', 'OWNER', 'LOCATION', 'SUBMITTED', 'STATUS', 'ACTIONS'].map(col => (
          <span key={col} className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
            {col}
          </span>
        ))}
      </div>

      <div className="divide-y divide-slate-100">
        {schools.map(school => {
          const isBusy = busy === school.id;
          const ownerDisplay = school.owner?.full_name || school.owner?.email || '—';
          const location = [school.city, school.country].filter(Boolean).join(', ') || '—';
          const initials = school.name?.[0]?.toUpperCase() ?? '?';

          return (
            <div key={school.id}>
              {/* Main row */}
              <div className="px-6 py-4 grid grid-cols-1 md:grid-cols-[2fr_1.5fr_1fr_1fr_1fr_auto] gap-4 items-center">

                {/* SCHOOL */}
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-[#4E87A0]/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {school.logo_url ? (
                      <img
                        src={school.logo_url}
                        alt={school.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <span className="text-xs font-bold text-[#4E87A0]">{initials}</span>
                    )}
                  </div>
                  <span className="font-semibold text-[#1B3A5C] text-sm truncate">
                    {school.name}
                  </span>
                </div>

                {/* OWNER */}
                <div className="text-sm text-slate-600 truncate min-w-0">
                  {school.owner ? (
                    <Link
                      href={`/admin/users?search=${encodeURIComponent(school.owner.id)}`}
                      className="hover:text-[#00B5A3] transition-colors"
                    >
                      {ownerDisplay}
                    </Link>
                  ) : (
                    <span className="text-slate-400">—</span>
                  )}
                </div>

                {/* LOCATION */}
                <div className="text-sm text-slate-500">
                  {location}
                </div>

                {/* SUBMITTED */}
                <div className="text-sm text-slate-400">
                  {relativeDate(school.created_at)}
                </div>

                {/* STATUS */}
                <div>
                  <span className={`inline-block text-xs px-2.5 py-1 rounded-full font-semibold capitalize ${STATUS_STYLES[school.status]}`}>
                    {school.status}
                  </span>
                </div>

                {/* ACTIONS */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <Link
                    href={`/schools/${school.id}/settings`}
                    className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 text-slate-600 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                  >
                    View
                  </Link>

                  {school.status !== 'approved' && (
                    <button
                      onClick={() => handleApprove(school.id)}
                      disabled={isBusy}
                      className="px-2.5 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      {isBusy && busy === school.id ? '…' : '✓ Approve'}
                    </button>
                  )}

                  {school.status !== 'rejected' && (
                    <button
                      onClick={() => openReject(school.id)}
                      disabled={isBusy}
                      className="px-2.5 py-1.5 text-xs font-semibold border border-rose-200 text-rose-600 rounded-lg hover:bg-rose-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      ✕ Reject
                    </button>
                  )}

                  {(school.status === 'approved' || school.status === 'rejected' || school.status === 'suspended') && (
                    <button
                      onClick={() => handleReset(school.id)}
                      disabled={isBusy}
                      className="px-2.5 py-1.5 text-xs font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      ↺ Reset
                    </button>
                  )}
                </div>
              </div>

              {/* Reject inline input */}
              {rejectOpen === school.id && (
                <div className="px-6 pb-4">
                  <div className="flex items-center gap-2 max-w-sm ml-11">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={e => setRejectReason(e.target.value)}
                      placeholder="Rejection reason (optional)"
                      className="flex-1 text-xs px-3 py-2 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-300 focus:ring-1 focus:ring-rose-100"
                      onKeyDown={e => { if (e.key === 'Enter') handleReject(school.id); if (e.key === 'Escape') setRejectOpen(null); }}
                      autoFocus
                    />
                    <button
                      onClick={() => handleReject(school.id)}
                      disabled={isBusy}
                      className="px-3 py-2 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-40 whitespace-nowrap"
                    >
                      {isBusy ? '…' : 'Confirm Reject'}
                    </button>
                    <button
                      onClick={() => setRejectOpen(null)}
                      className="px-3 py-2 text-xs font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 transition-colors whitespace-nowrap"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
