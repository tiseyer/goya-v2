import { redirect } from 'next/navigation'
import { headers } from 'next/headers'
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
import { parseActiveContext } from '@/lib/active-context'
import DashboardStudent from './components/DashboardStudent'
import DashboardTeacher from './components/DashboardTeacher'
import DashboardSchool from './components/DashboardSchool'
import DashboardWellness from './components/DashboardWellness'

const PROFILE_COLUMNS =
  'id, full_name, username, avatar_url, role, bio, location, website, instagram, youtube, teaching_styles, principal_trainer_school_id, member_type'

export default async function DashboardPage() {
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
  const isSchoolOwner =
    profile.role === 'teacher' && Boolean(profile.principal_trainer_school_id)

  // 3. Read active context from middleware header
  const headerList = await headers()
  const contextHeader = headerList.get('x-active-context')
  const activeContext = parseActiveContext(contextHeader, userId)
  const viewAsSchool = activeContext.type === 'school'

  // 4. Parallel data fetch via Promise.all
  const [events, courses, connections, creditTotals, inProgressCourses] =
    await Promise.all([
      fetchUpcomingEvents(supabase),
      fetchRecentCourses(supabase),
      fetchAcceptedConnections(supabase, userId),
      getUserCreditTotals(userId, supabase),
      fetchUserInProgressCourses(supabase, userId),
    ])

  // 5. School-specific data (only when in school context)
  let school = null
  let faculty: Awaited<ReturnType<typeof fetchSchoolFaculty>> = []
  if (viewAsSchool) {
    const schoolId = activeContext.type === 'school' ? activeContext.schoolId : null
    if (schoolId) {
      const [schoolRes, facultyRes] = await Promise.all([
        supabase
          .from('schools')
          .select('id, name, slug, bio, logo_url, status')
          .eq('id', schoolId)
          .single(),
        fetchSchoolFaculty(supabase, schoolId),
      ])
      school = schoolRes.data
      faculty = facultyRes
    }
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

  // School view (active school context)
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
