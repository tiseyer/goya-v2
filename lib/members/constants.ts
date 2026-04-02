/**
 * Explicit column allowlist for public profile fetches via service role.
 * NEVER use select('*') — add columns here as they become publicly needed.
 * Security: excludes email, phone, certificate_url, certificate_is_official,
 * other_org_registration, other_org_designations, wellness_regulatory_designations,
 * wellness_designation_other, onboarding_completed, onboarding_step.
 */
export const PUBLIC_PROFILE_COLUMNS = `
  id, full_name, first_name, last_name, username, mrn,
  role, member_type, avatar_url, bio, introduction,
  location, city, country, cover_image_url,
  location_lat, location_lng, location_place_id,
  website, instagram, facebook, tiktok, youtube, youtube_intro_url,
  is_verified, verification_status, subscription_status,
  practice_format, languages,
  practice_level, practice_styles,
  teacher_status, teaching_styles, years_teaching,
  teaching_focus_arr, influences_arr, lineage,
  principal_trainer_school_id, faculty_school_ids,
  other_org_member, other_org_names,
  wellness_designations, wellness_focus, wellness_org_name, wellness_regulatory_body,
  created_at
`.replace(/\s+/g, ' ').trim()
