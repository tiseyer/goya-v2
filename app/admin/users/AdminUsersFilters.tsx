'use client';

import { useState, useEffect, useTransition, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

const WP_ROLES = [
  'administrator', 'woo_sub', 'customer', 'student', 'wellness_practitioner',
  'teacher', 'school', 'robot', 'subscription_editor', 'faux', 'keymaster',
  'participant', '2fa_active', '2fa_inactive', 'pending', 'verification_requests',
] as const;

function wpRoleLabel(role: string): string {
  return role.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
}

interface Props {
  initialSearch: string;
  initialRole: string;
  initialVerified: string;
  initialStatus: string;
  initialCreditStatus: string;
  initialWpRoles: string[];
  initialWpRoleMode: string;
  initialDateFrom: string;
  initialDateTo: string;
  initialSort: string;
}

export default function AdminUsersFilters({
  initialSearch,
  initialRole,
  initialVerified,
  initialStatus,
  initialCreditStatus,
  initialWpRoles,
  initialWpRoleMode,
  initialDateFrom,
  initialDateTo,
  initialSort,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [wpRoles, setWpRoles] = useState<Set<string>>(new Set(initialWpRoles));
  const [wpMode, setWpMode] = useState(initialWpRoleMode || 'include');
  const [wpOpen, setWpOpen] = useState(false);
  const wpRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wpRef.current && !wpRef.current.contains(e.target as Node)) {
        setWpOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

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
      router.replace(`/admin/users?${params.toString()}`);
    });
  }

  function updateWpRoles(roles: Set<string>, mode: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (roles.size > 0) {
      params.set('wpRoles', Array.from(roles).join(','));
      params.set('wpRoleMode', mode);
    } else {
      params.delete('wpRoles');
      params.delete('wpRoleMode');
    }
    params.set('page', '1');
    startTransition(() => {
      router.replace(`/admin/users?${params.toString()}`);
    });
  }

  function toggleWpRole(role: string) {
    const next = new Set(wpRoles);
    if (next.has(role)) next.delete(role);
    else next.add(role);
    setWpRoles(next);
    updateWpRoles(next, wpMode);
  }

  function changeWpMode(mode: string) {
    setWpMode(mode);
    if (wpRoles.size > 0) {
      updateWpRoles(wpRoles, mode);
    }
  }

  function clearWpRoles() {
    setWpRoles(new Set());
    updateWpRoles(new Set(), 'include');
  }

  function handleReset() {
    setSearch('');
    setWpRoles(new Set());
    setWpMode('include');
    startTransition(() => {
      router.replace('/admin/users');
    });
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
          placeholder="Search by name, email, or username..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="h-9 pl-9 pr-3 w-64 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3]"
        />
      </div>

      {/* Role */}
      <select
        defaultValue={initialRole}
        onChange={e => updateParam('role', e.target.value)}
        className={selectClass}
      >
        <option value="">All Roles</option>
        <option value="student">Student</option>
        <option value="teacher">Teacher</option>
        <option value="wellness_practitioner">Wellness Practitioner</option>
        <option value="moderator">Moderator</option>
        <option value="admin">Admin</option>
      </select>

      {/* Verified */}
      <select
        defaultValue={initialVerified}
        onChange={e => updateParam('verified', e.target.value)}
        className={selectClass}
      >
        <option value="">All</option>
        <option value="true">Verified</option>
        <option value="false">Not Verified</option>
      </select>

      {/* Status */}
      <select
        defaultValue={initialStatus}
        onChange={e => updateParam('status', e.target.value)}
        className={selectClass}
      >
        <option value="">All Status</option>
        <option value="member">Member</option>
        <option value="guest">Guest</option>
      </select>

      {/* Credit Status */}
      <select
        defaultValue={initialCreditStatus}
        onChange={e => updateParam('creditStatus', e.target.value)}
        className={selectClass}
      >
        <option value="">All Credits</option>
        <option value="green">On Track</option>
        <option value="yellow">Expiring Soon</option>
        <option value="red">Needs Attention</option>
      </select>

      {/* WP Roles Multi-Select */}
      <div className="relative" ref={wpRef}>
        <button
          onClick={() => setWpOpen(!wpOpen)}
          className={`${selectClass} flex items-center gap-1.5 ${wpRoles.size > 0 ? 'border-[#00B5A3] text-[#00B5A3]' : ''}`}
        >
          WP Roles{wpRoles.size > 0 && ` (${wpRoles.size})`}
          <svg className={`w-3.5 h-3.5 transition-transform ${wpOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {wpOpen && (
          <div className="absolute top-full left-0 mt-1 w-64 bg-white border border-[#E5E7EB] rounded-xl shadow-lg z-50 overflow-hidden">
            {/* Mode toggle */}
            <div className="flex border-b border-[#E5E7EB]">
              <button
                onClick={() => changeWpMode('include')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${wpMode === 'include' ? 'bg-[#00B5A3] text-white' : 'text-[#6B7280] hover:bg-slate-50'}`}
              >
                Include
              </button>
              <button
                onClick={() => changeWpMode('exclude')}
                className={`flex-1 py-2 text-xs font-semibold transition-colors ${wpMode === 'exclude' ? 'bg-red-500 text-white' : 'text-[#6B7280] hover:bg-slate-50'}`}
              >
                Exclude
              </button>
            </div>

            {/* Checkbox list */}
            <div className="max-h-56 overflow-y-auto p-2 space-y-0.5">
              {WP_ROLES.map(r => (
                <label key={r} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={wpRoles.has(r)}
                    onChange={() => toggleWpRole(r)}
                    className="accent-[#00B5A3] rounded"
                  />
                  <span className="text-sm text-[#374151]">{wpRoleLabel(r)}</span>
                </label>
              ))}
            </div>

            {/* Clear */}
            {wpRoles.size > 0 && (
              <div className="border-t border-[#E5E7EB] p-2">
                <button
                  onClick={clearWpRoles}
                  className="w-full text-xs font-medium text-[#6B7280] hover:text-red-500 py-1.5"
                >
                  Clear all
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Date from */}
      <input
        type="date"
        defaultValue={initialDateFrom}
        onChange={e => updateParam('from', e.target.value)}
        className={`${selectClass} text-[#6B7280]`}
        title="Registered from"
      />

      {/* Date to */}
      <input
        type="date"
        defaultValue={initialDateTo}
        onChange={e => updateParam('to', e.target.value)}
        className={`${selectClass} text-[#6B7280]`}
        title="Registered to"
      />

      {/* Sort */}
      <select
        defaultValue={initialSort}
        onChange={e => updateParam('sort', e.target.value)}
        className={selectClass}
      >
        <option value="newest">Newest First</option>
        <option value="oldest">Oldest First</option>
        <option value="name_asc">Last Name A–Z</option>
        <option value="name_desc">Last Name Z–A</option>
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
