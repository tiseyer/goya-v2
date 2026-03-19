'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import FileUpload from '../components/inputs/FileUpload';

export default function Step_Avatar() {
  const { answers, setAnswer, userId } = useOnboarding();

  return (
    <OnboardingStep
      title="Your Profile Picture"
      subtitle="Upload a profile picture. This will appear in our Public Directory. Every profile must include a clear, recent photo of the member."
      nextDisabled={!answers.avatar_url}
    >
      <FileUpload
        accept="image/jpeg,image/jpg,image/png"
        maxSizeMB={11.7}
        bucket="profile-photos"
        storagePath={`${userId ?? 'unknown'}/avatar`}
        buttonLabel="UPLOAD IMAGE"
        onUploaded={url => setAnswer('avatar_url', url)}
        currentUrl={answers.avatar_url}
      />
    </OnboardingStep>
  );
}
