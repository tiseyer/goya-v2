'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { getOrCreateConversation } from '@/lib/messaging';

export default function MessageButton({
  memberId,
  memberName,
}: {
  memberId: string;
  memberName: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function handleClick() {
    setLoading(true);
    try {
      const { data } = await supabase.auth.getUser();
      if (!data.user) {
        router.push('/sign-in');
        return;
      }
      if (data.user.id === memberId) return;
      const convId = await getOrCreateConversation(data.user.id, memberId);
      router.push(`/messages?conversation=${convId}`);
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="w-full flex items-center justify-center gap-2 px-4 py-2.5 mt-2 rounded-xl bg-[#4E87A0]/20 hover:bg-[#4E87A0]/30 text-[#4E87A0] font-semibold text-sm transition-colors disabled:opacity-60"
    >
      <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
      </svg>
      {loading ? 'Opening…' : `Message ${memberName.split(' ')[0]}`}
    </button>
  );
}
