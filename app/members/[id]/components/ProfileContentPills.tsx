import { ProfilePillSection } from './ProfilePillSection';

interface ProfileContentPillsProps {
  role: string;
  // Teacher fields
  teaching_styles?: string[] | null;
  teaching_focus_arr?: string[] | null;
  lineage?: string[] | null;
  practice_format?: string | null;
  years_teaching?: string | null;
  // Student fields
  practice_styles?: string[] | null;
  practice_level?: string | null;
  // Wellness fields
  wellness_designations?: string[] | null;
  wellness_focus?: string[] | null;
  // School fields (passed from school data, not profile)
  school_practice_styles?: string[] | null;
  school_programs_offered?: string[] | null;
  school_lineage?: string | null;
  school_course_delivery_format?: string | null;
  school_established_year?: number | null;
}

function formatPracticeFormat(format: string | null | undefined): string[] {
  if (!format) return [];
  const map: Record<string, string> = {
    online: 'Online',
    in_person: 'In-Person',
    hybrid: 'Hybrid',
  };
  return [map[format] ?? format];
}

function formatDeliveryFormat(format: string | null | undefined): string[] {
  if (!format) return [];
  const map: Record<string, string> = {
    online: 'Online',
    in_person: 'In-Person',
    hybrid: 'Hybrid',
  };
  return [map[format] ?? format];
}

function hasContent(props: ProfileContentPillsProps): boolean {
  const {
    role,
    teaching_styles, teaching_focus_arr, lineage, practice_format, years_teaching,
    practice_styles, practice_level,
    wellness_designations, wellness_focus,
    school_practice_styles, school_programs_offered, school_lineage,
    school_course_delivery_format, school_established_year,
  } = props;

  if (role === 'teacher') {
    return !!(
      (teaching_styles && teaching_styles.length > 0) ||
      (teaching_focus_arr && teaching_focus_arr.length > 0) ||
      (lineage && lineage.length > 0) ||
      practice_format ||
      years_teaching
    );
  }
  if (role === 'student') {
    return !!(
      (practice_styles && practice_styles.length > 0) ||
      practice_level
    );
  }
  if (role === 'school') {
    return !!(
      (school_practice_styles && school_practice_styles.length > 0) ||
      (teaching_focus_arr && teaching_focus_arr.length > 0) ||
      (school_programs_offered && school_programs_offered.length > 0) ||
      school_lineage ||
      school_course_delivery_format ||
      school_established_year
    );
  }
  if (role === 'wellness_practitioner') {
    return !!(
      (wellness_designations && wellness_designations.length > 0) ||
      (wellness_focus && wellness_focus.length > 0) ||
      practice_format
    );
  }
  return false;
}

export default function ProfileContentPills(props: ProfileContentPillsProps) {
  const {
    role,
    teaching_styles, teaching_focus_arr, lineage, practice_format, years_teaching,
    practice_styles, practice_level,
    wellness_designations, wellness_focus,
    school_practice_styles, school_programs_offered, school_lineage,
    school_course_delivery_format, school_established_year,
  } = props;

  if (!hasContent(props)) return null;

  const currentYear = new Date().getFullYear();

  return (
    <div className="bg-white rounded-2xl p-6 sm:p-8 shadow-sm border border-slate-100">
      <h2 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
        <span className="w-1 h-4 bg-[#4E87A0] rounded-full" />
        Details
      </h2>
      <div className="space-y-4">
        {role === 'teacher' && (
          <>
            <ProfilePillSection label="Teaching Styles" items={teaching_styles ?? []} />
            <ProfilePillSection label="Teaching Focus" items={teaching_focus_arr ?? []} />
            <ProfilePillSection label="Lineage" items={lineage ?? []} />
            <ProfilePillSection
              label="Teaching Format"
              items={formatPracticeFormat(practice_format)}
              formatType="format"
            />
            {years_teaching && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Teaching Since</p>
                <p className="text-sm text-slate-600">
                  Teaching since {years_teaching} &middot;{' '}
                  {currentYear - parseInt(years_teaching, 10)} years teaching
                </p>
              </div>
            )}
          </>
        )}

        {role === 'student' && (
          <>
            <ProfilePillSection label="Practice Styles" items={practice_styles ?? []} />
            <ProfilePillSection label="Practice Level" items={practice_level ? [practice_level] : []} />
          </>
        )}

        {role === 'school' && (
          <>
            <ProfilePillSection label="Our Scope" items={school_practice_styles ?? []} />
            <ProfilePillSection label="Teaching Focus" items={teaching_focus_arr ?? []} />
            <ProfilePillSection label="Programs Offered" items={school_programs_offered ?? []} />
            <ProfilePillSection
              label="Lineage"
              items={school_lineage ? [school_lineage] : []}
            />
            <ProfilePillSection
              label="Course Delivery"
              items={formatDeliveryFormat(school_course_delivery_format)}
              formatType="format"
            />
            {school_established_year && (
              <div>
                <p className="text-sm font-semibold text-slate-700 mb-1">Founded</p>
                <p className="text-sm text-slate-600">Established {school_established_year}</p>
              </div>
            )}
          </>
        )}

        {role === 'wellness_practitioner' && (
          <>
            <ProfilePillSection label="Modalities" items={wellness_designations ?? []} />
            <ProfilePillSection label="Focus Areas" items={wellness_focus ?? []} />
            <ProfilePillSection
              label="Practice Format"
              items={formatPracticeFormat(practice_format)}
              formatType="format"
            />
          </>
        )}
      </div>
    </div>
  );
}
