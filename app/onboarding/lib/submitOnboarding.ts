import type { OnboardingAnswers } from './steps';
import type { SupabaseClient } from '@supabase/supabase-js';

export async function submitOnboarding(
  supabaseClient: SupabaseClient,
  userId: string,
  answers: OnboardingAnswers,
  memberType: 'student' | 'teacher' | 'wellness_practitioner'
) {
  const base = {
    first_name: answers.first_name,
    last_name: answers.last_name,
    full_name: [answers.first_name, answers.last_name].filter(Boolean).join(' '),
    username: answers.username,
    bio: answers.bio,
    introduction: answers.introduction,
    avatar_url: answers.avatar_url,
    city: answers.city,
    country: answers.country,
    practice_format: answers.practice_format,
    website: answers.website,
    instagram: answers.instagram,
    facebook: answers.facebook,
    tiktok: answers.tiktok,
    youtube: answers.youtube,
    youtube_intro_url: answers.youtube_intro_url,
    languages: answers.languages,
    member_type: memberType,
    onboarding_completed: true,
    onboarding_step: 999,
  };

  let specific: Record<string, unknown> = {};

  if (memberType === 'student') {
    specific = {
      practice_level: answers.practice_level,
      practice_styles: answers.practice_styles,
      verification_status: 'unverified',
    };
  } else if (memberType === 'teacher') {
    specific = {
      teacher_status: answers.teacher_status,
      teaching_styles: answers.teaching_styles,
      years_teaching: answers.years_teaching,
      teaching_focus_arr: answers.teaching_focus,
      influences_arr: answers.influences,
      other_org_member: answers.other_org_member,
      other_org_names: answers.other_org_names,
      other_org_name_other: answers.other_org_name_other,
      other_org_registration: answers.other_org_registration,
      other_org_designations: answers.other_org_designations,
      certificate_is_official: answers.certificate_is_official,
      certificate_url: answers.certificate_url,
      verification_status: 'pending',
    };
  } else if (memberType === 'wellness_practitioner') {
    specific = {
      wellness_designations: answers.wellness_designations,
      wellness_designation_other: answers.wellness_designation_other,
      wellness_org_name: answers.wellness_org_name,
      wellness_regulatory_body: answers.wellness_regulatory_body,
      wellness_regulatory_designations: answers.wellness_regulatory_designations,
      wellness_focus: answers.wellness_focus,
      certificate_url: answers.certificate_url,
      verification_status: 'pending',
    };
  }

  const { error } = await supabaseClient
    .from('profiles')
    .update({ ...base, ...specific })
    .eq('id', userId);

  return error;
}
