'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import FileUpload from '../components/inputs/FileUpload';

export default function Step_W_CertUpload() {
  const { answers, setAnswer, userId } = useOnboarding();

  return (
    <OnboardingStep
      title="Upload a copy of your license or certificate"
      subtitle="Please upload your professional license or certificate. Accepted formats: PDF, JPEG, PNG."
    >
      <FileUpload
        accept="application/pdf,image/jpeg,image/png"
        maxSizeMB={48.8}
        bucket="member-documents"
        storagePath={`${userId ?? 'unknown'}/certificate`}
        buttonLabel="UPLOAD CERTIFICATE(S)"
        onUploaded={url => setAnswer('certificate_url', url)}
        currentUrl={answers.certificate_url}
      />
    </OnboardingStep>
  );
}
