'use client';

import { useOnboarding } from '../components/OnboardingProvider';
import OnboardingStep from '../components/OnboardingStep';
import FileUpload from '../components/inputs/FileUpload';

export default function Step_T_CertUpload() {
  const { answers, setAnswer, userId } = useOnboarding();

  return (
    <OnboardingStep
      title="Upload your School Certificate"
      subtitle="Please upload the official certificate issued by your school. Accepted formats: PDF, JPEG, PNG. We take the security of your documents seriously — your files are stored securely and only reviewed by GOYA staff."
      nextDisabled={!answers.certificate_url}
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
