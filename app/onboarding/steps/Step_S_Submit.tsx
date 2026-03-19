'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import { submitOnboarding } from '../lib/submitOnboarding';
import { supabase } from '@/lib/supabase';

export default function Step_S_Submit() {
  const { answers, userId } = useOnboarding();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    if (!userId) return;
    setBusy(true);
    setError('');
    const err = await submitOnboarding(supabase, userId, answers, 'student');
    if (err) {
      setError(err.message);
      setBusy(false);
      return;
    }
    // Fire-and-forget
    fetch('/api/email/onboarding-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, memberType: 'student' }),
    }).catch(() => {})
    router.push('/dashboard');
  }

  return (
    <OnboardingStep
      title="You're all set!"
      nextLabel={busy ? 'Submitting…' : 'SUBMIT →'}
      nextDisabled={busy}
      onNext={handleSubmit}
    >
      <p className="text-sm text-slate-600 leading-relaxed">
        Click Submit to create your Student Practitioner account. Welcome to the GOYA community!
      </p>
      {error && (
        <p className="mt-3 text-sm text-rose-500">{error}</p>
      )}
    </OnboardingStep>
  );
}
