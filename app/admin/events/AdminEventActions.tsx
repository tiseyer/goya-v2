'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  eventId: string;
  imageUrl: string | null;
}

export default function AdminEventActions({ eventId, imageUrl }: Props) {
  const router  = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [error,      setError]      = useState('');

  async function handleDelete() {
    setDeleting(true);
    setError('');

    // Remove storage image if present
    if (imageUrl) {
      const parts = imageUrl.split('/event-images/');
      if (parts[1]) {
        await supabase.storage.from('event-images').remove([parts[1]]);
      }
    }

    const { error: dbErr } = await supabase.from('events').delete().eq('id', eventId);
    if (dbErr) {
      setError(dbErr.message);
      setDeleting(false);
      return;
    }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-xs text-[#374151] whitespace-nowrap">Delete?</span>
        <button
          onClick={handleDelete}
          disabled={deleting}
          className="px-2 py-1 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition-colors disabled:opacity-60"
        >
          {deleting ? '…' : 'Yes'}
        </button>
        <button
          onClick={() => setConfirming(false)}
          className="px-2 py-1 border border-[#E5E7EB] text-[#374151] text-xs font-medium rounded-lg hover:bg-slate-50 transition-colors"
        >
          No
        </button>
        {error && <span className="text-xs text-red-500">{error}</span>}
      </div>
    );
  }

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
