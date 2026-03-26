'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import { submitOnboardingAction } from '../lib/submitOnboardingAction';

export default function Step_T_Submit() {
  const { answers } = useOnboarding();
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit() {
    setBusy(true);
    setError('');
    const { error: err } = await submitOnboardingAction(answers, 'teacher');
    if (err) {
      setError(err);
      setBusy(false);
      return;
    }
    // Fire-and-forget
    fetch('/api/email/onboarding-complete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ memberType: 'teacher' }),
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
