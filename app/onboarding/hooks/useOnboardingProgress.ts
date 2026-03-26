'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getStepSequence, type OnboardingAnswers, type StepKey } from '../lib/steps';

export function useOnboardingProgress() {
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [currentStepKey, setCurrentStepKey] = useState<StepKey>('member_type');
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [savedFlash, setSavedFlash] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string>('');

  // Load on mount
  useEffect(() => {
    async function load() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      setUserId(user.id);
      setUserEmail(user.email ?? '');

      // Try to fetch existing progress
      const { data: progress } = await supabase
        .from('onboarding_progress')
        .select('current_step_key, answers')
        .eq('user_id', user.id)
        .maybeSingle();

      if (progress) {
        const restoredAnswers = { ...progress.answers, email: progress.answers.email ?? user.email ?? '' };
        setAnswers(restoredAnswers);
        setCurrentStepKey(progress.current_step_key ?? 'member_type');
      } else {
        // Insert new row
        await supabase.from('onboarding_progress').insert({
          user_id: user.id,
          current_step_key: 'member_type',
          answers: { email: user.email ?? '' },
        });
        setAnswers({ email: user.email ?? '' });
      }

      setIsLoading(false);
    }
    load();
  }, []);

  const stepSequence = getStepSequence(answers);
  const currentIndex = stepSequence.indexOf(currentStepKey);
  const totalSteps = stepSequence.length;

  const setAnswer = useCallback(<K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const persist = useCallback(async (newAnswers: OnboardingAnswers, newStepKey: StepKey) => {
    if (!userId) return;
    setIsSaving(true);
    await supabase.from('onboarding_progress').upsert({
      user_id: userId,
      current_step_key: newStepKey,
      answers: newAnswers,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'user_id' });
    setIsSaving(false);
    setSavedFlash(true);
    setTimeout(() => setSavedFlash(false), 2000);
  }, [userId]);

  const goToNext = useCallback(async (overrideAnswers?: Partial<OnboardingAnswers>) => {
    const merged = overrideAnswers ? { ...answers, ...overrideAnswers } : answers;
    setAnswers(merged);
    const seq = getStepSequence(merged);
    const idx = seq.indexOf(currentStepKey);
    const nextKey = seq[idx + 1];
    if (!nextKey) return;
    setCurrentStepKey(nextKey);
    await persist(merged, nextKey);
  }, [answers, currentStepKey, persist]);

  const goToPrev = useCallback(() => {
    const seq = getStepSequence(answers);
    const idx = seq.indexOf(currentStepKey);
    if (idx > 0) setCurrentStepKey(seq[idx - 1]);
  }, [answers, currentStepKey]);

  return {
    answers, setAnswer, currentStepKey, currentIndex, totalSteps,
    stepSequence, isLoading, isSaving, savedFlash, userId, userEmail,
    goToNext, goToPrev, persist,
  };
}
