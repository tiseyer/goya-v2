'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function VerificationActions({ userId }: { userId: string }) {
  const router = useRouter();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);

  async function handle(action: 'approve' | 'reject') {
    setBusy(action);
    await supabase
      .from('profiles')
      .update({
        verification_status: action === 'approve' ? 'verified' : 'rejected',
        ...(action === 'approve' ? { is_verified: true } : {}),
      })
      .eq('id', userId);
    setBusy(null);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        onClick={() => handle('reject')}
        disabled={!!busy}
        className="px-3 py-1.5 text-xs font-semibold border border-slate-200 text-slate-500 rounded-lg hover:bg-slate-50 hover:text-rose-600 hover:border-rose-200 transition-colors disabled:opacity-40"
      >
        {busy === 'reject' ? '…' : 'Reject'}
      </button>
      <button
        onClick={() => handle('approve')}
        disabled={!!busy}
        className="px-3 py-1.5 text-xs font-semibold bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors disabled:opacity-40"
      >
        {busy === 'approve' ? '…' : 'Approve'}
      </button>
    </div>
  );
}
