'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';

export default function Step_T_CertOfficial() {
  const { answers, setAnswer } = useOnboarding();
  const selected = answers.certificate_is_official;

  return (
    <OnboardingStep
      title="Is the Certificate you are uploading the OFFICIAL School Certificate?"
      subtitle="GOYA only accepts official certificates issued directly by the school or training program. We do not accept certificates from online platforms such as Udemy or Coursera."
      nextDisabled={selected === undefined}
    >
      <div className="grid grid-cols-2 gap-3">
        {[{ val: true, label: 'Yes' }, { val: false, label: 'No' }].map(opt => {
          const isSelected = selected === opt.val;
          return (
            <button
              key={String(opt.val)}
              type="button"
              onClick={() => setAnswer('certificate_is_official', opt.val)}
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
