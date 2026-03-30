'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';

export default function Step_W_RegulatoryYN() {
  const { answers, setAnswer } = useOnboarding();
  const selected = answers.wellness_regulatory_body;

  return (
    <OnboardingStep
      title="Do you belong to a Regulatory body for your profession?"
      nextDisabled={selected === undefined}
    >
      <div className="grid grid-cols-2 gap-3">
        {[{ val: true, label: 'YES' }, { val: false, label: 'NO' }].map(opt => {
          const isSelected = selected === opt.val;
          return (
            <button
              key={String(opt.val)}
              type="button"
              onClick={() => setAnswer('wellness_regulatory_body', opt.val)}
              className="px-4 py-4 rounded-xl border-2 font-semibold text-sm transition-all"
              style={isSelected
                ? { borderColor: '#9e6b7a', background: 'rgba(158,107,122,0.05)', color: '#1B3A5C' }
                : { borderColor: '#e2e8f0', background: '#fff', color: '#374151' }
              }
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </OnboardingStep>
  );
}
