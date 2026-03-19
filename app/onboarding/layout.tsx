'use client';

import { useEffect, useState } from 'react';
import OnboardingProvider, { useOnboarding } from './components/OnboardingProvider';
import { supabase } from '@/lib/supabase';

function OnboardingShellInner({ children }: { children: React.ReactNode }) {
  const { currentIndex, totalSteps, currentStepKey, answers, userId } = useOnboarding();
  const showProgress = !!answers.member_type && currentStepKey !== 'member_type';
  const progressPct = totalSteps > 1 ? Math.round(((currentIndex) / (totalSteps - 1)) * 100) : 0;

  const [isPreviewMode, setIsPreviewMode] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);

  // Block browser back navigation
  useEffect(() => {
    window.history.pushState(null, '', window.location.href);
    const handler = () => {
      window.history.pushState(null, '', window.location.href);
    };
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, []);

  // Check preview mode and admin role
  useEffect(() => {
    const cookie = document.cookie.split(';').find(c => c.trim().startsWith('onboarding_preview_mode='));
    if (cookie?.includes('true')) setIsPreviewMode(true);

    if (userId) {
      supabase.from('profiles').select('role').eq('id', userId).single()
        .then(({ data }) => {
          if (data?.role === 'admin' || data?.role === 'moderator') setIsAdmin(true);
        });
    }
  }, [userId]);

  function exitPreview() {
    document.cookie = 'onboarding_preview_mode=; path=/; max-age=0';
    window.location.href = '/admin/dashboard';
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#f8f7f6' }}>
      {/* Header */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-20">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <span className="font-black text-xl tracking-tight text-[#1B3A5C] select-none">
            GOYA
          </span>
          <div className="flex items-center gap-3">
            {showProgress && (
              <span className="text-xs font-semibold text-slate-400">
                Step {currentIndex + 1} of {totalSteps}
              </span>
            )}
            {isPreviewMode && isAdmin && (
              <button
                onClick={exitPreview}
                className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
              >
                ← Exit Preview
              </button>
            )}
          </div>
        </div>
        {showProgress && (
          <div className="h-1 bg-slate-100">
            <div
              className="h-full transition-all duration-500"
              style={{ width: `${progressPct}%`, background: '#9e6b7a' }}
            />
          </div>
        )}
      </header>

      {/* Content */}
      <main className="flex-1 flex items-start justify-center py-10 px-4">
        <div className="w-full max-w-2xl">
          {children}
        </div>
      </main>
    </div>
  );
}

export default function OnboardingLayout({ children }: { children: React.ReactNode }) {
  return (
    <OnboardingProvider>
      <OnboardingShellInner>
        {children}
      </OnboardingShellInner>
    </OnboardingProvider>
  );
}
