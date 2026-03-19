'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

const COUNTRIES = [
  'Afghanistan', 'Albania', 'Algeria', 'Argentina', 'Armenia', 'Australia', 'Austria',
  'Azerbaijan', 'Bahrain', 'Bangladesh', 'Belgium', 'Bolivia', 'Brazil', 'Bulgaria',
  'Cambodia', 'Canada', 'Chile', 'China', 'Colombia', 'Costa Rica', 'Croatia',
  'Cuba', 'Czech Republic', 'Denmark', 'Ecuador', 'Egypt', 'Estonia', 'Ethiopia',
  'Finland', 'France', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Guatemala',
  'Honduras', 'Hong Kong', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran',
  'Iraq', 'Ireland', 'Israel', 'Italy', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan',
  'Kenya', 'Kuwait', 'Latvia', 'Lebanon', 'Lithuania', 'Luxembourg', 'Malaysia',
  'Mexico', 'Morocco', 'Netherlands', 'New Zealand', 'Nigeria', 'Norway', 'Pakistan',
  'Panama', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal', 'Qatar',
  'Romania', 'Russia', 'Saudi Arabia', 'Serbia', 'Singapore', 'Slovakia', 'Slovenia',
  'South Africa', 'South Korea', 'Spain', 'Sri Lanka', 'Sweden', 'Switzerland',
  'Taiwan', 'Thailand', 'Tunisia', 'Turkey', 'Ukraine', 'United Arab Emirates',
  'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Venezuela',
  'Vietnam', 'Zimbabwe',
];

export default function Step_Location() {
  const { answers, setAnswer } = useOnboarding();
  const canProceed = !!(answers.city?.trim() && answers.country?.trim());

  return (
    <OnboardingStep
      title="Where are you based?"
      subtitle="This will be shown on the GOYA member map. We show your city only — your exact address is never displayed."
      nextDisabled={!canProceed}
    >
      <div className="grid grid-cols-2 gap-4">
        <TextInput
          label="City"
          value={answers.city ?? ''}
          onChange={v => setAnswer('city', v)}
          placeholder="e.g. Toronto"
          required
        />
        <div className="space-y-1.5">
          <label className="block text-sm font-semibold text-[#1B3A5C]">
            Country <span className="text-rose-500">*</span>
          </label>
          <select
            value={answers.country ?? ''}
            onChange={e => setAnswer('country', e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 text-[#1B3A5C] text-sm focus:outline-none focus:ring-2 focus:ring-[#9e6b7a]/40 focus:border-[#9e6b7a] transition-colors bg-white"
          >
            <option value="">Select country…</option>
            {COUNTRIES.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>
    </OnboardingStep>
  );
}
