import { redirect } from 'next/navigation'
import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId'
import { getUserCreditTotals } from '@/lib/credits'
import {
  fetchUpcomingEvents,
  fetchRecentCourses,
  fetchAcceptedConnections,
  fetchSchoolFaculty,
  fetchUserInProgressCourses,
} from '@/lib/dashboard/queries'
import { getProfileCompletion } from '@/lib/dashboard/profileCompletion'
import DashboardStudent from './components/DashboardStudent'
import DashboardTeacher from './components/DashboardTeacher'
import DashboardSchool from './components/DashboardSchool'
import DashboardWellness from './components/DashboardWellness'

const PROFILE_COLUMNS =
  'id, full_name, username, avatar_url, role, bio, location, website, instagram, youtube, teaching_styles, principal_trainer_school_id, member_type'

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const userId = await getEffectiveUserId()
  const supabase = await getEffectiveClient()

  // 1. Fetch profile
  const { data: profile } = await supabase
    .from('profiles')
    .select(PROFILE_COLUMNS)
    .eq('id', userId)
    .single()

  if (!profile) redirect('/sign-in')

  // 2. Detect school ownership
  // CRITICAL: school owners have role='teacher' AND principal_trainer_school_id IS NOT NULL
  // There is NO separate 'school' role — never check role === 'school'
  const isSchoolOwner =
    profile.role === 'teacher' && Boolean(profile.principal_trainer_school_id)

  // 3. "View as School" toggle — URL param ?view=school
  const viewAsSchool = isSchoolOwner && params.view === 'school'

  // 4. Parallel data fetch via Promise.all
  const [events, courses, connections, creditTotals, inProgressCourses] =
    await Promise.all([
      fetchUpcomingEvents(supabase),
      fetchRecentCourses(supabase),
      fetchAcceptedConnections(supabase, userId),
      getUserCreditTotals(userId, supabase),
      fetchUserInProgressCourses(supabase, userId),
    ])

  // 5. School-specific data (only when viewing as school)
  let school = null
  let faculty: Awaited<ReturnType<typeof fetchSchoolFaculty>> = []
  if (viewAsSchool && profile.principal_trainer_school_id) {
    const [schoolRes, facultyRes] = await Promise.all([
      supabase
        .from('schools')
        .select('id, name, slug, bio, logo_url, status')
        .eq('id', profile.principal_trainer_school_id)
        .single(),
      fetchSchoolFaculty(supabase, profile.principal_trainer_school_id),
    ])
    school = schoolRes.data
    faculty = facultyRes
  }

  // 6. Profile completion — computed server-side to avoid client flicker
  const hasContent =
    courses.some((c) => c.created_by === userId) ||
    events.some((e) => (e as unknown as { created_by?: string }).created_by === userId)
  const completion = getProfileCompletion(
    profile as Record<string, unknown>,
    hasContent,
  )

  // 7. Shared props for all role layouts
  const sharedProps = {
    profile,
    events,
    courses,
    connections,
    creditTotals,
    completion,
    inProgressCourses,
  }

  // 8. Role branching — in page.tsx, NOT layout.tsx (layouts don't re-run on navigation)

  // School view (teacher + school + ?view=school)
  if (viewAsSchool && school) {
    return (
      <DashboardSchool
        {...sharedProps}
        school={school}
        faculty={faculty}
        isSchoolOwner={isSchoolOwner}
      />
    )
  }

  // Teacher (with or without school ownership)
  if (profile.role === 'teacher') {
    return (
      <DashboardTeacher
        {...sharedProps}
        isSchoolOwner={isSchoolOwner}
        school={isSchoolOwner ? { id: profile.principal_trainer_school_id! } : null}
      />
    )
  }

  // Wellness practitioner
  if (profile.role === 'wellness_practitioner') {
    return <DashboardWellness {...sharedProps} />
  }

  // Student (default for student, moderator, admin, or unknown roles)
  return <DashboardStudent {...sharedProps} />
}
