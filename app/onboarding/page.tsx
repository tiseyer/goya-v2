'use client';

import { useOnboarding } from './components/OnboardingProvider';

// Common steps
import Step_MemberType from './steps/Step_MemberType';
import Step_IntroInfo from './steps/Step_IntroInfo';
import Step_FullName from './steps/Step_FullName';
import Step_Email from './steps/Step_Email';
import Step_Username from './steps/Step_Username';
import Step_PracticeFormat from './steps/Step_PracticeFormat';
import Step_Location from './steps/Step_Location';
import Step_Avatar from './steps/Step_Avatar';
import Step_Legal from './steps/Step_Legal';

// Student steps
import Step_S_Introduction from './steps/Step_S_Introduction';
import Step_S_Bio from './steps/Step_S_Bio';
import Step_S_PracticeLevel from './steps/Step_S_PracticeLevel';
import Step_S_PracticeStyles from './steps/Step_S_PracticeStyles';
import Step_S_Languages from './steps/Step_S_Languages';
import Step_S_Social from './steps/Step_S_Social';
import Step_S_Submit from './steps/Step_S_Submit';

// Teacher steps
import Step_T_Status from './steps/Step_T_Status';
import Step_T_OtherOrgYN from './steps/Step_T_OtherOrgYN';
import Step_T_OtherOrgNames from './steps/Step_T_OtherOrgNames';
import Step_T_OtherOrgReg from './steps/Step_T_OtherOrgReg';
import Step_T_OtherOrgDesigs from './steps/Step_T_OtherOrgDesigs';
import Step_T_CertOfficial from './steps/Step_T_CertOfficial';
import Step_T_CertBlocked from './steps/Step_T_CertBlocked';
import Step_T_CertUpload from './steps/Step_T_CertUpload';
import Step_T_Introduction from './steps/Step_T_Introduction';
import Step_T_Bio from './steps/Step_T_Bio';
import Step_T_VideoIntro from './steps/Step_T_VideoIntro';
import Step_T_YearsTeaching from './steps/Step_T_YearsTeaching';
import Step_T_Styles from './steps/Step_T_Styles';
import Step_T_Focus from './steps/Step_T_Focus';
import Step_T_Influences from './steps/Step_T_Influences';
import Step_T_Languages from './steps/Step_T_Languages';
import Step_T_Social from './steps/Step_T_Social';
import Step_T_Submit from './steps/Step_T_Submit';

// Wellness steps
import Step_W_OrgName from './steps/Step_W_OrgName';
import Step_W_Designations from './steps/Step_W_Designations';
import Step_W_RegulatoryYN from './steps/Step_W_RegulatoryYN';
import Step_W_RegulatoryDesigs from './steps/Step_W_RegulatoryDesigs';
import Step_W_CertUpload from './steps/Step_W_CertUpload';
import Step_W_Journey from './steps/Step_W_Journey';
import Step_W_Focus from './steps/Step_W_Focus';
import Step_W_Languages from './steps/Step_W_Languages';
import Step_W_Social from './steps/Step_W_Social';
import Step_W_Submit from './steps/Step_W_Submit';

const STEP_MAP: Record<string, React.ComponentType> = {
  member_type: Step_MemberType,
  intro_info: Step_IntroInfo,
  full_name: Step_FullName,
  email: Step_Email,
  username: Step_Username,
  practice_format: Step_PracticeFormat,
  location: Step_Location,
  avatar: Step_Avatar,
  s_legal: Step_Legal,
  t_legal: Step_Legal,
  w_legal: Step_Legal,
  s_introduction: Step_S_Introduction,
  s_bio: Step_S_Bio,
  s_practice_level: Step_S_PracticeLevel,
  s_practice_styles: Step_S_PracticeStyles,
  s_languages: Step_S_Languages,
  s_social: Step_S_Social,
  s_submit: Step_S_Submit,
  t_status: Step_T_Status,
  t_other_org_yn: Step_T_OtherOrgYN,
  t_other_org_names: Step_T_OtherOrgNames,
  t_other_org_reg: Step_T_OtherOrgReg,
  t_other_org_desigs: Step_T_OtherOrgDesigs,
  t_cert_official: Step_T_CertOfficial,
  t_cert_blocked: Step_T_CertBlocked,
  t_cert_upload: Step_T_CertUpload,
  t_introduction: Step_T_Introduction,
  t_bio: Step_T_Bio,
  t_video: Step_T_VideoIntro,
  t_years: Step_T_YearsTeaching,
  t_styles: Step_T_Styles,
  t_focus: Step_T_Focus,
  t_influences: Step_T_Influences,
  t_languages: Step_T_Languages,
  t_social: Step_T_Social,
  t_submit: Step_T_Submit,
  w_org_name: Step_W_OrgName,
  w_designations: Step_W_Designations,
  w_regulatory_yn: Step_W_RegulatoryYN,
  w_regulatory_desigs: Step_W_RegulatoryDesigs,
  w_cert_upload: Step_W_CertUpload,
  w_journey: Step_W_Journey,
  w_focus: Step_W_Focus,
  w_languages: Step_W_Languages,
  w_social: Step_W_Social,
  w_submit: Step_W_Submit,
};

export default function OnboardingPage() {
  const { currentStepKey, isLoading } = useOnboarding();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <div className="w-8 h-8 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: '#9e6b7a', borderTopColor: 'transparent' }} />
      </div>
    );
  }

  const StepComponent = STEP_MAP[currentStepKey];
  if (!StepComponent) {
    return (
      <div className="text-center py-24 text-slate-400">
        Unknown step: {currentStepKey}
      </div>
    );
  }

  return <StepComponent />;
}
