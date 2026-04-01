'use client';

import { useState, useEffect, useTransition, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

/** All known action codes across the system */
const ACTION_CODES = [
  // User actions
  'user.login', 'user.logout', 'user.registered', 'user.password_reset_requested', 'user.password_reset_completed',
  'user.profile_updated', 'user.avatar_uploaded', 'user.onboarding_completed',
  'user.subscription_started', 'user.subscription_cancelled', 'user.subscription_upgraded',
  'user.purchase_completed', 'user.checkout_started',
  'user.credit_submitted', 'user.credit_approved', 'user.credit_rejected',
  'user.connection_requested', 'user.connection_accepted',
  'user.course_enrolled', 'user.course_completed',
  // Admin actions
  'admin.user_role_changed', 'admin.user_deleted', 'admin.user_impersonated', 'admin.user_created',
  'admin.school_approved', 'admin.school_rejected',
  'admin.verification_approved', 'admin.verification_rejected',
  'admin.event_created', 'admin.event_updated', 'admin.event_deleted', 'admin.event_status_changed',
  'admin.course_created', 'admin.course_updated', 'admin.course_deleted', 'admin.course_status_changed',
  'admin.settings_changed', 'admin.maintenance_mode_enabled', 'admin.maintenance_mode_disabled',
  'admin.email_sandbox_enabled', 'admin.email_sandbox_disabled',
  'admin.chatbot_sandbox_enabled', 'admin.chatbot_sandbox_disabled',
  'admin.api_key_created', 'admin.api_key_revoked',
  'admin.credit_approved', 'admin.credit_rejected',
  // System actions
  'system.cron_executed', 'system.cron_failed',
  'system.stripe_webhook_received', 'system.stripe_payment_succeeded', 'system.stripe_payment_failed',
  'system.stripe_subscription_created', 'system.stripe_subscription_updated', 'system.stripe_subscription_deleted',
  'system.stripe_webhook_failed',
  'system.email_sent', 'system.email_failed',
  'system.error',
];

const TARGET_TYPES = ['USER', 'SCHOOL', 'EVENT', 'COURSE', 'SUBSCRIPTION', 'CREDIT', 'API_KEY', 'SYSTEM'];

interface Props {
  initialSearch: string;
  initialCategory: string;
  initialSeverity: string;
  initialDateFrom: string;
  initialDateTo: string;
  initialSort: string;
  initialAction: string;
  initialActor: string;
  initialTargetType: string;
  totalCount: number;
}

export default function AuditLogFilters({
  initialSearch,
  initialCategory,
  initialSeverity,
  initialDateFrom,
  initialDateTo,
  initialSort,
  initialAction,
  initialActor,
  initialTargetType,
  totalCount,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [actor, setActor] = useState(initialActor);
  const [actionFilter, setActionFilter] = useState(initialAction);

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

  useEffect(() => {
    const timer = setTimeout(() => {
      updateParam('actor', actor);
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [actor]);

  function handleReset() {
    setSearch('');
    setActor('');
    setActionFilter('');
    startTransition(() => {
      router.replace('/admin/audit-log');
    });
  }

  function handleExportCSV() {
    const params = new URLSearchParams(searchParams.toString());
    params.delete('page');
    params.delete('pageSize');
    window.location.href = `/admin/audit-log/export?${params.toString()}`;
  }

  const selectClass = "h-9 px-3 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3] cursor-pointer";

  return (
    <div className="space-y-2">
      {/* Row 1: Search + core filters */}
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

      {/* Row 2: Advanced filters */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Action filter */}
        <select
          value={actionFilter}
          onChange={e => { setActionFilter(e.target.value); updateParam('action', e.target.value); }}
          className={`${selectClass} max-w-[220px]`}
        >
          <option value="">All Actions</option>
          <optgroup label="User">
            {ACTION_CODES.filter(a => a.startsWith('user.')).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </optgroup>
          <optgroup label="Admin">
            {ACTION_CODES.filter(a => a.startsWith('admin.')).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </optgroup>
          <optgroup label="System">
            {ACTION_CODES.filter(a => a.startsWith('system.')).map(a => (
              <option key={a} value={a}>{a}</option>
            ))}
          </optgroup>
        </select>

        {/* Actor filter */}
        <input
          type="text"
          placeholder="Filter by actor name..."
          value={actor}
          onChange={e => setActor(e.target.value)}
          className="h-9 px-3 w-48 bg-white border border-[#E5E7EB] rounded-lg text-sm text-[#374151] placeholder:text-[#9CA3AF] focus:outline-none focus:ring-1 focus:ring-[#00B5A3] focus:border-[#00B5A3]"
        />

        {/* Target Type */}
        <select
          defaultValue={initialTargetType}
          onChange={e => updateParam('targetType', e.target.value)}
          className={selectClass}
        >
          <option value="">All Targets</option>
          {TARGET_TYPES.map(t => (
            <option key={t} value={t}>{t}</option>
          ))}
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
      </div>
    </div>
  );
}
