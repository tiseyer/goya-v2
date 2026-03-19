'use client';
import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface Props {
  userId: string;
  userName: string;
  isAdmin: boolean;
}

export default function ResetOnboardingButton({ userId, userName, isAdmin }: Props) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isAdmin) return null;

  async function handleReset() {
    setLoading(true);
    await supabase.from('profiles').update({
      onboarding_completed: false,
      onboarding_step: 0,
    }).eq('id', userId);

    await supabase.from('onboarding_progress').delete().eq('user_id', userId);

    setLoading(false);
    setConfirming(false);
    setSuccess(true);
    router.refresh();
  }

  if (success) {
    return (
      <div className="bg-green-50 border border-green-200 rounded-xl p-4">
        <p className="text-sm font-semibold text-green-700">✓ Onboarding reset successfully.</p>
        <p className="text-xs text-green-600 mt-1">{userName} will go through onboarding on their next login.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {!confirming ? (
        <button
          onClick={() => setConfirming(true)}
          className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg text-sm hover:bg-orange-600 transition-colors"
        >
          Reset Onboarding
        </button>
      ) : (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 space-y-3">
          <p className="text-sm text-orange-800">
            This will send <strong>{userName}</strong> back through the onboarding flow on their next login. Their existing profile data will be kept but they will need to complete onboarding again. Are you sure?
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleReset}
              disabled={loading}
              className="px-4 py-2 bg-orange-500 text-white font-semibold rounded-lg text-sm hover:bg-orange-600 disabled:opacity-50 transition-colors"
            >
              {loading ? 'Resetting…' : 'Yes, Reset Onboarding'}
            </button>
            <button
              onClick={() => setConfirming(false)}
              className="px-4 py-2 border border-slate-200 text-slate-600 font-semibold rounded-lg text-sm hover:bg-slate-50 transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
