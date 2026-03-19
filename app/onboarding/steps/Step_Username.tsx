'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';

type CheckState = 'idle' | 'checking' | 'available' | 'taken' | 'error';

function validateUsername(v: string): string | null {
  if (v.length < 5) return 'Must be at least 5 characters';
  if (v.length > 20) return 'Must be 20 characters or fewer';
  if (v.includes('@')) return 'Do not use @ in your username';
  if (!/^[a-zA-Z0-9_.-]+$/.test(v)) return 'Only letters, numbers, underscores, hyphens and dots allowed';
  return null;
}

export default function Step_Username() {
  const { answers, setAnswer, userId } = useOnboarding();
  const [checkState, setCheckState] = useState<CheckState>('idle');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const username = answers.username ?? '';
  const validationError = validateUsername(username);

  useEffect(() => {
    if (validationError || !username) {
      setCheckState('idle');
      return;
    }

    setCheckState('checking');

    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('id', userId ?? '')
        .maybeSingle();

      if (error) { setCheckState('error'); return; }
      setCheckState(data ? 'taken' : 'available');
    }, 500);

    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [username, userId, validationError]);

  const rightElement = (() => {
    if (checkState === 'checking') {
      return <div className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#9e6b7a', borderTopColor: 'transparent' }} />;
    }
    if (checkState === 'available') {
      return (
        <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      );
    }
    if (checkState === 'taken') {
      return (
        <svg className="w-5 h-5 text-rose-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      );
    }
    return null;
  })();

  const canProceed = checkState === 'available' && !validationError;

  return (
    <OnboardingStep
      title="Create Your Username"
      subtitle="Choose a unique username for your GOYA profile (similar to a social media handle)."
      nextDisabled={!canProceed}
    >
      <div className="space-y-4">
        <ul className="text-sm text-slate-500 space-y-1 list-disc list-inside">
          <li>Do NOT use @ symbol</li>
          <li>Minimum 5 characters, maximum 20</li>
          <li>Make it distinctive and personal</li>
        </ul>

        <TextInput
          label="Username"
          value={username}
          onChange={v => setAnswer('username', v)}
          placeholder="e.g. janesmith_yoga"
          error={
            checkState === 'taken'
              ? 'This username is already taken'
              : username && validationError
                ? validationError
                : undefined
          }
          rightElement={rightElement}
          required
        />

        <p className="text-xs font-semibold text-slate-400 uppercase tracking-wide">
          PLEASE DO NOT USE ONLY YOUR FIRST NAME. MAKE IT UNIQUE.
        </p>
      </div>
    </OnboardingStep>
  );
}
