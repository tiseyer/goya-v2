'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  eventId:   string;
  imageUrl:  string | null;
  isDeleted: boolean;
  userRole:  string;
}

export default function AdminEventActions({ eventId, imageUrl, isDeleted, userRole }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState('');

  // ── Soft delete ────────────────────────────────────────────────────────────
  async function handleSoftDelete() {
    setBusy(true);
    setError('');
    const { error: dbErr } = await supabase
      .from('events')
      .update({ status: 'deleted', deleted_at: new Date().toISOString() })
      .eq('id', eventId);
    if (dbErr) { setError(dbErr.message); setBusy(false); return; }
    router.refresh();
  }

  // ── Restore ────────────────────────────────────────────────────────────────
  async function handleRestore() {
    setBusy(true);
    setError('');
    const { error: dbErr } = await supabase
      .from('events')
      .update({ status: 'draft', deleted_at: null })
      .eq('id', eventId);
    if (dbErr) { setError(dbErr.message); setBusy(false); return; }
    router.refresh();
  }

  // ── Deleted row: show Restore (admin only — moderators can't reach this view) ──
  if (isDeleted) {
    return (
      <div className="flex items-center gap-2">
        <button
          onClick={handleRestore}
          disabled={busy}
          className="px-3 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-700 text-xs font-semibold rounded-lg hover:bg-emerald-100 transition-colors disabled:opacity-60"
        >
          {busy ? '…' : 'Restore'}
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  // ── Confirmation state ─────────────────────────────────────────────────────
  if (confirming) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] text-[#374151] leading-snug max-w-[180px]">
          This event will be moved to Deleted. Admins can restore it later.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleSoftDelete}
            disabled={busy}
            className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
          >
            {busy ? '…' : 'Confirm'}
          </button>
          <button
            onClick={() => setConfirming(false)}
            className="px-2 py-1 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
          >
            Cancel
          </button>
        </div>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

  // ── Default: Edit + Delete ─────────────────────────────────────────────────
  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/events/${eventId}/edit`}
        className="px-3 py-1.5 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
      >
        Edit
      </Link>
      <button
        onClick={() => setConfirming(true)}
        className="px-3 py-1.5 border border-red-200 text-red-600 text-xs font-medium rounded-lg hover:bg-red-50 transition-colors"
      >
        Delete
      </button>
    </div>
  );
}
