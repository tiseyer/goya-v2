'use client';

import { useOnboarding } from './OnboardingProvider';
import OnboardingStep from './OnboardingStep';
import FileUpload from './inputs/FileUpload';

export default function Step3Documents() {
  const { answers, setAnswer, userId, goToNext, isSaving } = useOnboarding();
  const isTeacher = answers.member_type === 'teacher' || answers.member_type === 'wellness_practitioner';

  return (
    <OnboardingStep
      title={isTeacher ? 'Photo & Verification' : 'Add a profile photo'}
      subtitle={isTeacher
        ? 'Upload a photo and any relevant credentials or certificates for verification.'
        : 'A profile photo helps the community recognise you.'}
      onNext={goToNext}
      nextLabel="Complete Setup →"
    >
      <div className="space-y-6">
        <FileUpload
          label="Profile photo"
          bucket="profile-photos"
          storagePath={userId ?? 'unknown'}
          accept="image/jpeg,image/png,image/webp"
          helpText="JPG, PNG or WebP · max 5 MB"
          onUploaded={url => setAnswer('avatar_url', url)}
          currentUrl={answers.avatar_url}
        />

        {isTeacher && (
          <FileUpload
            label="Credentials / Certificate (optional)"
            bucket="member-documents"
            storagePath={userId ?? 'unknown'}
            accept="application/pdf,image/jpeg,image/png"
            helpText="Upload a teaching certification, RYT certificate, or other credential. PDF, JPG or PNG · max 10 MB."
            onUploaded={url => setAnswer('certificate_url', url)}
            currentUrl={answers.certificate_url}
          />
        )}

        <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
          <p className="text-xs text-slate-500 leading-relaxed">
            {isTeacher
              ? 'You can skip these uploads and add them later from your profile settings. Verification may take 1–3 business days after documents are submitted.'
              : 'You can skip this and add a photo later from your profile settings.'}
          </p>
        </div>
      </div>
    </OnboardingStep>
  );
}
