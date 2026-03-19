'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useOnboarding } from './OnboardingProvider';

interface Props {
  message: string;
}

export default function BlockedScreen({ message }: Props) {
  const { userId, answers, persist, currentStepKey } = useOnboarding();
  const router = useRouter();
  const [submitted, setSubmitted] = useState(false);
  const [busy, setBusy] = useState(false);

  async function handleSubmit() {
    if (!userId) return;
    setBusy(true);
    // Save progress but do NOT set onboarding_completed = true
    await persist(answers, currentStepKey);
    await supabase
      .from('profiles')
      .update({ verification_status: 'pending' })
      .eq('id', userId);
    setBusy(false);
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-8 text-center">
        <div className="w-14 h-14 rounded-full bg-green-50 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-[#1B3A5C] mb-2">Thank you!</h2>
        <p className="text-sm text-slate-500 mb-6">
          Your information has been received. Our team will review your application and be in touch.
        </p>
        <button
          onClick={() => router.push('/')}
          className="px-6 py-3 rounded-xl text-sm font-semibold text-white"
          style={{ background: '#9e6b7a' }}
        >
          Return to Home
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-8">
      <div className="flex items-start gap-4 mb-6">
        <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center shrink-0">
          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.962-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-bold text-[#1B3A5C] mb-2">Unable to Process Registration</h2>
          <p className="text-sm text-slate-600 leading-relaxed">{message}</p>
        </div>
      </div>

      <div className="pt-4 border-t border-slate-100">
        <p className="text-sm text-slate-500 mb-4">
          You can submit your partial application and our team will be in touch to assist you.
        </p>
        <button
          onClick={handleSubmit}
          disabled={busy}
          className="w-full px-6 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50"
          style={{ background: '#9e6b7a' }}
        >
          {busy ? 'Submitting…' : 'SUBMIT →'}
        </button>
      </div>
    </div>
  );
}
