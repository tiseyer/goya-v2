'use client';

import { useState } from 'react';
import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

function validateUrl(v: string): string | null {
  if (!v) return null;
  if (!v.startsWith('https://')) return 'Must start with https://';
  return null;
}

export default function SocialStep() {
  const { answers, setAnswer, goToNext } = useOnboarding();
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fields = [
    { key: 'website' as const, label: 'Website or Booking Page', placeholder: 'https://' },
    { key: 'instagram' as const, label: 'Instagram', placeholder: 'https://instagram.com/' },
    { key: 'facebook' as const, label: 'Facebook', placeholder: 'https://facebook.com/' },
    { key: 'tiktok' as const, label: 'TikTok', placeholder: 'https://tiktok.com/@' },
    { key: 'youtube' as const, label: 'YouTube', placeholder: 'https://youtube.com/' },
  ];

  function validate(): boolean {
    const newErrors: Record<string, string> = {};
    for (const f of fields) {
      const val = answers[f.key] ?? '';
      const err = validateUrl(val);
      if (err) newErrors[f.key] = err;
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleNext() {
    if (!validate()) return;
    await goToNext();
  }

  return (
    <OnboardingStep
      title="Your Social Media & Website"
      subtitle="Add links to help other members find and connect with you. All fields are optional."
      onNext={handleNext}
    >
      <div className="space-y-4">
        {fields.map(f => (
          <TextInput
            key={f.key}
            label={f.label}
            value={answers[f.key] ?? ''}
            onChange={v => {
              setAnswer(f.key, v);
              if (errors[f.key]) {
                setErrors(prev => { const n = { ...prev }; delete n[f.key]; return n; });
              }
            }}
            placeholder={f.placeholder}
            type="url"
            error={errors[f.key]}
          />
        ))}
      </div>
    </OnboardingStep>
  );
}
