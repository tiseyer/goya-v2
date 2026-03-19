'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface Props {
  courseId: string;
}

export default function AdminCourseActions({ courseId }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [busy,       setBusy]       = useState(false);
  const [error,      setError]      = useState('');

  async function handleDelete() {
    setBusy(true);
    setError('');
    const { error: dbErr } = await supabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    if (dbErr) { setError(dbErr.message); setBusy(false); return; }
    router.refresh();
  }

  if (confirming) {
    return (
      <div className="flex flex-col gap-1.5">
        <p className="text-[10px] text-[#374151] leading-snug max-w-[180px]">
          This will permanently delete the course and all enrolled progress data.
        </p>
        <div className="flex items-center gap-2">
          <button
            onClick={handleDelete}
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

  return (
    <div className="flex items-center gap-2">
      <Link
        href={`/admin/courses/${courseId}/edit`}
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
