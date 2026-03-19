'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import { submitOnboarding } from '../lib/submitOnboarding';
import { supabase } from '@/lib/supabase';

export default function Step_T_Submit() {
  const { answers, userId } = useOnboarding();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!userId) return;
    setBusy(true);
    setError('');
    const err = await submitOnboarding(supabase, userId, answers, 'teacher');
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    // Fire-and-forget
    fetch('/api/email/onboarding-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, memberType: 'teacher' }),
    }).catch(() => {})
    router.push('/dashboard');
  }

  return (
    <OnboardingStep
      title="Application Complete!"
      nextLabel={busy ? 'Submitting…' : 'SUBMIT →'}
      nextDisabled={busy}
      onNext={handleSubmit}
    >
      <div className="space-y-3">
        <p className="text-sm text-slate-600 leading-relaxed">
          Click Submit to complete your Certified Teacher application. Our team will review your certificate and verify your account within 3–5 business days.
        </p>
        <p className="text-sm text-slate-500">
          You will receive an email notification when your account has been verified.
        </p>
        {error && <p className="text-sm text-rose-500">{error}</p>}
      </div>
    </OnboardingStep>
  );
}
