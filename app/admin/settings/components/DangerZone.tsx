'use client';

import { useState, useCallback } from 'react';
import { logAuditEventAction } from '@/app/actions/audit';
import { supabase } from '@/lib/supabase';

function ConfirmDialog({
  open,
  title,
  description,
  confirmWord,
  confirmLabel,
  loading,
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title: string;
  description: string;
  confirmWord: string;
  confirmLabel: string;
  loading: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const [input, setInput] = useState('');

  if (!open) return null;

  const isMatch = input.toUpperCase() === confirmWord.toUpperCase();

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl max-w-sm w-full p-6">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center shrink-0 mt-0.5">
            <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.07 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-[#1B3A5C]">{title}</h3>
            <p className="text-sm text-[#6B7280] mt-1.5 leading-relaxed">{description}</p>
          </div>
        </div>

        <div className="mb-4">
          <label className="block text-xs font-medium text-[#374151] mb-1.5">
            Type <span className="font-bold text-red-600">{confirmWord}</span> to confirm
          </label>
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder={`Type ${confirmWord} to confirm`}
            className="w-full px-3 py-2 text-sm border border-[#E5E7EB] rounded-lg focus:outline-none focus:ring-2 focus:ring-red-300 focus:border-red-400 transition-colors"
            autoFocus
          />
        </div>

        <div className="flex gap-3 justify-end">
          <button
            onClick={() => { setInput(''); onCancel(); }}
            className="px-4 py-2 text-sm text-[#6B7280] border border-[#E5E7EB] rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => { setInput(''); onConfirm(); }}
            disabled={!isMatch || loading}
            className="px-4 py-2 text-sm font-semibold bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
          >
            {loading ? 'Processing...' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function DangerZone() {
  const [cacheDialog, setCacheDialog] = useState(false);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheResult, setCacheResult] = useState<{ success: boolean; message: string } | null>(null);

  const [sessionDialog, setSessionDialog] = useState(false);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionResult, setSessionResult] = useState<{ success: boolean; message: string } | null>(null);

  const clearResult = useCallback((setter: typeof setCacheResult) => {
    setTimeout(() => setter(null), 5000);
  }, []);

  async function handleClearCache() {
    setCacheLoading(true);
    setCacheDialog(false);
    try {
      const res = await fetch('/api/admin/danger/clear-cache', { method: 'POST' });
      const data = await res.json();
      setCacheResult({ success: data.success, message: data.message || (data.success ? 'Cache cleared' : 'Failed') });
      if (data.success) {
        const { data: { user } } = await supabase.auth.getUser();
        void logAuditEventAction({ category: 'admin', action: 'admin.cache_cleared', actor_id: user?.id ?? undefined, description: 'Server-side cache cleared via Danger Zone' });
      }
    } catch {
      setCacheResult({ success: false, message: 'Network error' });
    } finally {
      setCacheLoading(false);
      clearResult(setCacheResult);
    }
  }

  async function handleInvalidateSessions() {
    setSessionLoading(true);
    setSessionDialog(false);
    try {
      const res = await fetch('/api/admin/danger/invalidate-sessions', { method: 'POST' });
      const data = await res.json();
      setSessionResult({ success: data.success, message: data.message || (data.success ? 'Sessions invalidated' : 'Failed') });
      if (data.success) {
        const { data: { user } } = await supabase.auth.getUser();
        void logAuditEventAction({ category: 'admin', action: 'admin.sessions_invalidated', actor_id: user?.id ?? undefined, description: `${data.count ?? 0} non-admin sessions invalidated`, metadata: { count: String(data.count ?? 0) } });
      }
    } catch {
      setSessionResult({ success: false, message: 'Network error' });
    } finally {
      setSessionLoading(false);
      clearResult(setSessionResult);
    }
  }

  return (
    <>
      <div className="rounded-xl border-2 border-red-200 overflow-hidden">
        <div className="px-6 py-4 bg-red-50 border-b border-red-200">
          <h2 className="text-base font-semibold text-red-700">Danger Zone</h2>
        </div>
        <div className="px-6 py-5 bg-white space-y-5">
          {/* Clear Cache */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Clear Cache</p>
              <p className="text-xs text-[#6B7280] mt-1">
                Force-clear all server-side caches. Use this if settings changes or content updates are not appearing correctly.
              </p>
              {cacheResult && (
                <p className={`text-xs mt-1.5 ${cacheResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                  {cacheResult.message}
                </p>
              )}
            </div>
            <button
              onClick={() => setCacheDialog(true)}
              disabled={cacheLoading}
              className="shrink-0 px-4 py-2 text-sm font-medium text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {cacheLoading ? 'Clearing...' : 'Clear Cache'}
            </button>
          </div>

          <div className="border-t border-[#E5E7EB]" />

          {/* Invalidate Sessions */}
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-[#374151]">Invalidate All Sessions</p>
              <p className="text-xs text-[#6B7280] mt-1">
                Force all users to log out immediately. Their current sessions will be terminated and they will need to sign in again. Admins are not affected.
              </p>
              {sessionResult && (
                <p className={`text-xs mt-1.5 ${sessionResult.success ? 'text-emerald-600' : 'text-red-600'}`}>
                  {sessionResult.message}
                </p>
              )}
            </div>
            <button
              onClick={() => setSessionDialog(true)}
              disabled={sessionLoading}
              className="shrink-0 px-4 py-2 text-sm font-medium text-red-600 border-2 border-red-200 rounded-lg hover:bg-red-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {sessionLoading ? 'Invalidating...' : 'Invalidate All Sessions'}
            </button>
          </div>
        </div>
      </div>

      <ConfirmDialog
        open={cacheDialog}
        title="Clear All Caches?"
        description="This will force-clear all server-side caches including Next.js page cache and any cached settings. The site may be temporarily slower while caches rebuild."
        confirmWord="CLEAR"
        confirmLabel="Clear Cache"
        loading={cacheLoading}
        onConfirm={handleClearCache}
        onCancel={() => setCacheDialog(false)}
      />

      <ConfirmDialog
        open={sessionDialog}
        title="Invalidate All Sessions?"
        description="All non-admin users will be logged out immediately. They will need to sign in again. Admin sessions are preserved."
        confirmWord="INVALIDATE"
        confirmLabel="Invalidate Sessions"
        loading={sessionLoading}
        onConfirm={handleInvalidateSessions}
        onCancel={() => setSessionDialog(false)}
      />
    </>
  );
}
