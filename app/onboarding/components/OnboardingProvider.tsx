'use client';

import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export type MemberType = 'student' | 'teacher' | 'wellness_practitioner';

export interface OnboardingAnswers {
  member_type?: MemberType;
  full_name?: string;
  bio?: string;
  location?: string;
  practice_styles?: string[];
  practice_level?: string;
  years_teaching?: string;
  avatar_url?: string;
  document_url?: string;
}

interface OnboardingContextValue {
  currentStep: number;
  answers: OnboardingAnswers;
  isSaving: boolean;
  isLoading: boolean;
  userId: string | null;
  goToNext: () => Promise<void>;
  goToPrev: () => void;
  saveAnswer: <K extends keyof OnboardingAnswers>(key: K, value: OnboardingAnswers[K]) => void;
  completeOnboarding: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue | null>(null);

export function useOnboarding() {
  const ctx = useContext(OnboardingContext);
  if (!ctx) throw new Error('useOnboarding must be used inside OnboardingProvider');
  return ctx;
}

export default function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [answers, setAnswers] = useState<OnboardingAnswers>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  // Load user + existing progress on mount
  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setIsLoading(false); return; }
      setUserId(user.id);

      // Fetch current step from profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('onboarding_step, member_type, full_name, bio, location')
        .eq('id', user.id)
        .single();

      const savedStep = profile?.onboarding_step ?? 0;
      setCurrentStep(savedStep);

      // Pre-fill answers from profile
      const baseAnswers: OnboardingAnswers = {};
      if (profile?.member_type) baseAnswers.member_type = profile.member_type as MemberType;
      if (profile?.full_name)   baseAnswers.full_name   = profile.full_name;
      if (profile?.bio)         baseAnswers.bio         = profile.bio;
      if (profile?.location)    baseAnswers.location    = profile.location;

      // Load saved step answers
      const { data: progressRows } = await supabase
        .from('onboarding_progress')
        .select('step, answers')
        .eq('user_id', user.id);

      if (progressRows) {
        const merged: OnboardingAnswers = { ...baseAnswers };
        progressRows.forEach(row => {
          Object.assign(merged, row.answers);
        });
        setAnswers(merged);
      } else {
        setAnswers(baseAnswers);
      }

      setIsLoading(false);
    }
    init();
  }, []);

  const saveAnswer = useCallback(<K extends keyof OnboardingAnswers>(
    key: K,
    value: OnboardingAnswers[K]
  ) => {
    setAnswers(prev => ({ ...prev, [key]: value }));
  }, []);

  const goToNext = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    const nextStep = currentStep + 1;

    try {
      // Persist current step answers
      await supabase
        .from('onboarding_progress')
        .upsert(
          { user_id: userId, step: currentStep, answers, saved_at: new Date().toISOString() },
          { onConflict: 'user_id,step' }
        );

      // Update onboarding_step in profile
      await supabase
        .from('profiles')
        .update({ onboarding_step: nextStep })
        .eq('id', userId);

      setCurrentStep(nextStep);
    } finally {
      setIsSaving(false);
    }
  }, [userId, currentStep, answers]);

  const goToPrev = useCallback(() => {
    setCurrentStep(prev => Math.max(0, prev - 1));
  }, []);

  const completeOnboarding = useCallback(async () => {
    if (!userId) return;
    setIsSaving(true);
    try {
      // Update profile with collected answers
      await supabase
        .from('profiles')
        .update({
          onboarding_completed: true,
          onboarding_step: 4,
          member_type: answers.member_type ?? null,
          full_name: answers.full_name ?? undefined,
          bio: answers.bio ?? undefined,
          location: answers.location ?? undefined,
          avatar_url: answers.avatar_url ?? undefined,
          // Set verification_status to 'pending' for teachers and wellness practitioners
          ...(answers.member_type && answers.member_type !== 'student'
            ? { verification_status: 'pending' }
            : {}),
        })
        .eq('id', userId);

      setCurrentStep(4);
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  }, [userId, answers, router]);

  return (
    <OnboardingContext.Provider value={{
      currentStep,
      answers,
      isSaving,
      isLoading,
      userId,
      goToNext,
      goToPrev,
      saveAnswer,
      completeOnboarding,
    }}>
      {children}
    </OnboardingContext.Provider>
  );
}
