'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { logAuditEventAction } from '@/app/actions/audit';

interface Props {
  userId: string;
  certificateUrl?: string | null;
}

export default function VerificationActions({ userId, certificateUrl }: Props) {
  const router = useRouter();
  const [busy, setBusy] = useState<'approve' | 'reject' | null>(null);
  const [showRejectInput, setShowRejectInput] = useState(false);
  const [rejectReason, setRejectReason] = useState('');

  async function handle(action: 'approve' | 'reject') {
    setBusy(action);
    await supabase
      .from('profiles')
      .update({
        verification_status: action === 'approve' ? 'verified' : 'rejected',
        ...(action === 'approve' ? { is_verified: true } : {}),
      })
      .eq('id', userId);

    // Send email notification (fire-and-forget)
    const { data: prof } = await supabase
      .from('profiles')
      .select('email, first_name, full_name, teacher_status')
      .eq('id', userId)
      .single()

    if (prof?.email) {
      const firstName = prof.first_name || prof.full_name?.split(' ')[0] || 'there'
      if (action === 'approve') {
        fetch('/api/email/verification-approved', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: prof.email, firstName, designation: prof.teacher_status ?? 'GOYA Member' }),
        }).catch(() => {})
      } else {
        fetch('/api/email/verification-rejected', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email: prof.email, firstName, reason: rejectReason || undefined }),
        }).catch(() => {})
      }
    }

    void logAuditEventAction({
      category: 'admin',
      action: action === 'approve' ? 'admin.verification_approved' : 'admin.verification_rejected',
      severity: action === 'reject' ? 'warning' : 'info',
      target_type: 'USER',
      target_id: userId,
      target_label: prof?.full_name ?? undefined,
      description: action === 'approve'
        ? `Approved verification for ${prof?.full_name ?? userId}`
        : `Rejected verification for ${prof?.full_name ?? userId}`,
      metadata: action === 'reject' && rejectReason ? { rejection_reason: rejectReason } : undefined,
    })

    setBusy(null);
    setShowRejectInput(false);
    setRejectReason('');
    router.refresh();
  }

  function openCertificate() {
    if (!certificateUrl) return;
    window.open(certificateUrl, '_blank', 'noopener,noreferrer');
  }

  return (
    <div className="flex flex-col items-end gap-2 shrink-0">
      <div className="flex items-center gap-2">
        {certificateUrl && (
          <button
            onClick={openCertificate}
            className="px-3 py-1.5 text-xs font-semibold border border-blue-200 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors"
          >
            View Cert
          </button>
        )}
        <button
          onClick={() => setShowRejectInput(v => !v)}
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

      {showRejectInput && (
        <div className="flex items-center gap-2 w-full max-w-xs">
          <input
            type="text"
            value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            placeholder="Reason (optional)"
            className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-slate-200 focus:outline-none focus:border-rose-300"
          />
          <button
            onClick={() => handle('reject')}
            disabled={!!busy}
            className="px-3 py-1.5 text-xs font-semibold bg-rose-500 text-white rounded-lg hover:bg-rose-600 transition-colors disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      )}
    </div>
  );
}
