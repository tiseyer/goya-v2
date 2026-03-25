'use client';

import { useState } from 'react';
import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import TextInput from '../components/inputs/TextInput';

function isValidYouTubeUrl(url: string): boolean {
  if (!url) return true; // optional
  return /^https:\/\/(www\.)?(youtube\.com\/watch\?v=|youtu\.be\/)/.test(url);
}

export default function Step_T_VideoIntro() {
  const { answers, setAnswer, goToNext } = useOnboarding();
  const [error, setError] = useState('');
  const val = answers.youtube_intro_url ?? '';

  async function handleNext() {
    if (val && !isValidYouTubeUrl(val)) {
      setError('Please enter a valid YouTube URL (youtube.com/watch?v= or youtu.be/)');
      return;
    }
    await goToNext();
  }

  return (
    <OnboardingStep
      title="Video Introduction"
      subtitle="Add a YouTube link to a short video introducing yourself to the GOYA community. This is optional but highly recommended."
      onNext={handleNext}
    >
      <TextInput
        label="YouTube Video URL (optional)"
        value={val || 'https://'}
        onChange={v => {
          setAnswer('youtube_intro_url', v === 'https://' ? '' : v);
          setError('');
        }}
        placeholder="https://youtube.com/watch?v=..."
        error={error}
        type="url"
      />
    </OnboardingStep>
  );
}
