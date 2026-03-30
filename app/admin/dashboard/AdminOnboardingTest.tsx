'use client';
import { useRouter } from 'next/navigation';

export default function AdminOnboardingTest() {
  const router = useRouter();

  function launchTest() {
    document.cookie = 'onboarding_preview_mode=true; path=/; max-age=3600';
    router.push('/onboarding');
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6">
      <h3 className="font-semibold text-[#1B3A5C] mb-1">Test Onboarding Flow</h3>
      <p className="text-sm text-slate-500 mb-4">Preview the onboarding experience as it appears to new members.</p>
      <button
        onClick={launchTest}
        className="px-4 py-2 bg-[#4E87A0] text-white font-semibold rounded-lg text-sm hover:bg-[#3A7190] transition-colors"
      >
        Launch Test Onboarding →
      </button>
    </div>
  );
}
