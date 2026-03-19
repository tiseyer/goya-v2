export type StepKey = string;

export interface OnboardingAnswers {
  member_type?: 'student' | 'teacher' | 'wellness_practitioner';
  first_name?: string;
  last_name?: string;
  email?: string;
  username?: string;
  practice_format?: 'online' | 'in_person' | 'hybrid';
  city?: string;
  country?: string;
  avatar_url?: string;
  introduction?: string;
  bio?: string;
  website?: string;
  instagram?: string;
  facebook?: string;
  tiktok?: string;
  youtube?: string;
  youtube_intro_url?: string;
  languages?: string[];
  agreed_terms?: boolean;
  // Student
  practice_level?: string;
  practice_styles?: string[];
  // Teacher
  teacher_status?: string;
  other_org_member?: boolean;
  other_org_names?: string[];
  other_org_name_other?: string;
  other_org_registration?: string;
  other_org_designations?: string;
  certificate_is_official?: boolean;
  certificate_url?: string;
  years_teaching?: string;
  teaching_styles?: string[];
  teaching_focus?: string[];
  influences?: string[];
  // Wellness
  wellness_org_name?: string;
  wellness_designations?: string[];
  wellness_designation_other?: string;
  wellness_regulatory_body?: boolean;
  wellness_regulatory_designations?: string;
  wellness_focus?: string[];
}

export function getStepSequence(answers: OnboardingAnswers): StepKey[] {
  const steps: StepKey[] = [
    'member_type',
    'intro_info',
    'full_name',
    'email',
    'username',
    'practice_format',
  ];

  if (answers.practice_format === 'in_person' || answers.practice_format === 'hybrid') {
    steps.push('location');
  }

  const mt = answers.member_type;

  if (mt === 'student') {
    steps.push(
      'avatar',
      's_introduction', 's_bio', 's_practice_level', 's_practice_styles',
      's_languages', 's_social', 's_legal', 's_submit'
    );
  } else if (mt === 'teacher') {
    steps.push('avatar', 't_status', 't_other_org_yn');
    if (answers.other_org_member === true) {
      steps.push('t_other_org_names', 't_other_org_reg', 't_other_org_desigs');
    }
    steps.push('t_cert_official');
    if (answers.certificate_is_official === false) {
      steps.push('t_cert_blocked');
    } else if (answers.certificate_is_official === true) {
      steps.push(
        't_cert_upload', 't_introduction', 't_bio', 't_video',
        't_years', 't_styles', 't_focus', 't_influences',
        't_languages', 't_social', 't_legal', 't_submit'
      );
    }
  } else if (mt === 'wellness_practitioner') {
    steps.push('w_org_name', 'w_designations', 'w_regulatory_yn');
    if (answers.wellness_regulatory_body === true) {
      steps.push('w_regulatory_desigs');
    }
    steps.push(
      'w_cert_upload', 'avatar', 'w_journey', 'w_focus',
      'w_languages', 'w_social', 'w_legal', 'w_submit'
    );
  }

  return steps;
}
