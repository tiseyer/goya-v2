import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import SchoolRegistrationsTab from './SchoolRegistrationsTab'
import TeacherUpgradesTab from './TeacherUpgradesTab'
import CreditsTab from './CreditsTab'
import SupportTicketsTab from './SupportTicketsTab'
import EventsTab from './EventsTab'
import CoursesTab from './CoursesTab'
import VerificationActions from '@/app/admin/verification/VerificationActions'
import { listSupportTickets } from './actions'

export const dynamic = 'force-dynamic'

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab =
    tab === 'upgrades'
      ? 'upgrades'
      : tab === 'verifications'
      ? 'verifications'
      : tab === 'tickets'
      ? 'tickets'
      : tab === 'schools'
      ? 'schools'
      : tab === 'events'
      ? 'events'
      : tab === 'courses'
      ? 'courses'
      : 'credits'

  const supabase = await createSupabaseServerClient()

  // Get admin user ID for support ticket operations
  const { data: { user: adminUser } } = await supabase.auth.getUser()
  const adminUserId = adminUser?.id ?? ''

  // Fetch all schools with owner profile info
  const { data: schoolsData } = await supabase
    .from('schools')
    .select(`
      id, name, logo_url, city, country, status, rejection_reason, created_at,
      owner:owner_id (id, full_name, email)
    `)
    .order('created_at', { ascending: false })

  // The join returns owner as an array; normalize to single object for the component
  const schools = (schoolsData ?? []).map((s) => ({
    ...s,
    owner: Array.isArray(s.owner) ? s.owner[0] ?? null : s.owner,
  }))
  const pendingSchoolCount = schools.filter((s) => s.status === 'pending').length

  // Fetch upgrade requests with joined profile info (service role needed for joined query)
  const supabaseService = getSupabaseService()
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: upgradeData } = await (supabaseService as any)
    .from('upgrade_requests')
    .select(`
      id, user_id, status, certificate_urls,
      stripe_payment_intent_id, stripe_subscription_id,
      rejection_reason, created_at, reviewed_at,
      profile:user_id (id, full_name, email, role, created_at)
    `)
    .order('created_at', { ascending: false })

  // Normalize profile (Supabase join returns as array)
  const upgradeRequests = (upgradeData ?? []).map((r: {
    profile: unknown
    status: string
    [key: string]: unknown
  }) => ({
    ...r,
    status: r.status as 'pending' | 'approved' | 'rejected',
    profile: Array.isArray(r.profile) ? r.profile[0] ?? null : r.profile,
  }))

  const pendingUpgradeCount = upgradeRequests.filter((r: { status: string }) => r.status === 'pending').length

  // Fetch credit entries (no join — credit_entries FK points to auth.users, not profiles)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: creditData } = await (supabaseService as any)
    .from('credit_entries')
    .select('id, user_id, credit_type, amount, activity_date, description, status, rejection_reason, source, created_at')
    .order('created_at', { ascending: false })

  // Fetch profiles separately for credit entry authors
  const creditUserIds = [...new Set((creditData ?? []).map((c: { user_id: string }) => c.user_id))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: creditProfiles } = creditUserIds.length > 0
    ? await (supabaseService as any)
        .from('profiles')
        .select('id, full_name, email, avatar_url')
        .in('id', creditUserIds)
    : { data: [] }

  const profileMap = new Map<string, { id: string; full_name: string | null; email: string | null; avatar_url: string | null }>()
  for (const p of creditProfiles ?? []) profileMap.set(p.id, p)

  const creditEntries = (creditData ?? []).map((c: {
    user_id: string
    status: string
    [key: string]: unknown
  }) => ({
    ...c,
    status: c.status as 'pending' | 'approved' | 'rejected',
    profile: profileMap.get(c.user_id) ?? null,
  }))

  const pendingCreditCount = creditEntries.filter((c: { status: string }) => c.status === 'pending').length

  // Fetch support tickets
  const supportTicketsResult = await listSupportTickets()
  const supportTickets = supportTicketsResult.success ? supportTicketsResult.tickets : []
  const openTicketCount = supportTickets.filter((t) => t.status === 'open').length

  // Fetch events with pending_review, published, rejected statuses (member events only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingEventsData } = await (supabaseService as any)
    .from('events')
    .select('id, title, category, date, status, created_at, created_by, rejection_reason')
    .in('status', ['pending_review', 'published', 'rejected'])
    .eq('event_type', 'member')
    .order('created_at', { ascending: false })

  // Batch-fetch profiles for event submitters
  const eventUserIds = [...new Set((pendingEventsData ?? []).filter((e: { created_by: string | null }) => e.created_by).map((e: { created_by: string }) => e.created_by))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: eventProfiles } = eventUserIds.length > 0
    ? await (supabaseService as any)
        .from('profiles')
        .select('id, full_name, email')
        .in('id', eventUserIds)
    : { data: [] }

  const eventProfileMap = new Map<string, { id: string; full_name: string | null; email: string | null }>()
  for (const p of eventProfiles ?? []) eventProfileMap.set(p.id, p)

  const normalizedEvents = (pendingEventsData ?? []).map((e: {
    created_by: string | null
    [key: string]: unknown
  }) => {
    const profile = e.created_by ? eventProfileMap.get(e.created_by) : null
    return {
      ...e,
      submitter_name: profile?.full_name ?? null,
      submitter_email: profile?.email ?? null,
    }
  })

  const pendingEventCount = normalizedEvents.filter((e: { status: string }) => e.status === 'pending_review').length

  // Fetch courses with pending_review, published, rejected statuses (member courses only)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pendingCoursesData } = await (supabaseService as any)
    .from('courses')
    .select('id, title, category, duration, status, created_at, created_by, rejection_reason')
    .in('status', ['pending_review', 'published', 'rejected'])
    .eq('course_type', 'member')
    .order('created_at', { ascending: false })

  // Batch-fetch profiles for course submitters
  const courseUserIds = [...new Set((pendingCoursesData ?? []).filter((c: { created_by: string | null }) => c.created_by).map((c: { created_by: string }) => c.created_by))]
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: courseProfiles } = courseUserIds.length > 0
    ? await (supabaseService as any)
        .from('profiles')
        .select('id, full_name, email')
        .in('id', courseUserIds)
    : { data: [] }

  const courseProfileMap = new Map<string, { id: string; full_name: string | null; email: string | null }>()
  for (const p of courseProfiles ?? []) courseProfileMap.set(p.id, p)

  const normalizedCourses = (pendingCoursesData ?? []).map((c: {
    created_by: string | null
    [key: string]: unknown
  }) => {
    const profile = c.created_by ? courseProfileMap.get(c.created_by) : null
    return {
      ...c,
      submitter_name: profile?.full_name ?? null,
      submitter_email: profile?.email ?? null,
    }
  })

  const pendingCourseCount = normalizedCourses.filter((c: { status: string }) => c.status === 'pending_review').length

  // Fetch verification-pending profiles
  const { data: pendingVerifications } = await supabase
    .from('profiles')
    .select('id, full_name, email, member_type, avatar_url, created_at, certificate_url')
    .eq('verification_status', 'pending')
    .order('created_at', { ascending: true })
  const verificationUsers = pendingVerifications ?? []
  const pendingVerificationCount = verificationUsers.length

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Inbox</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review credits, verifications, support tickets, teacher upgrades, school registrations, events, and courses
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit overflow-x-auto">
        <Link
          href="/admin/inbox?tab=credits"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'credits'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Credits & Hours
          {pendingCreditCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pendingCreditCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/inbox?tab=verifications"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'verifications'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Verifications
          {pendingVerificationCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pendingVerificationCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/inbox?tab=tickets"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'tickets'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Support Tickets
          {openTicketCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {openTicketCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/inbox?tab=upgrades"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'upgrades'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Teacher Upgrades
          {pendingUpgradeCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pendingUpgradeCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/inbox?tab=schools"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'schools'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          School Registrations
          {pendingSchoolCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pendingSchoolCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/inbox?tab=events"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'events'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Events
          {pendingEventCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pendingEventCount}
            </span>
          )}
        </Link>
        <Link
          href="/admin/inbox?tab=courses"
          className={`px-4 py-2 rounded-md text-sm font-medium transition-all whitespace-nowrap inline-flex items-center gap-1.5 ${
            activeTab === 'courses'
              ? 'bg-white text-[#1B3A5C] shadow-sm'
              : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          Courses
          {pendingCourseCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[1.25rem] h-5 px-1 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
              {pendingCourseCount}
            </span>
          )}
        </Link>
      </div>

      {/* Tab content */}
      {activeTab === 'credits' && <CreditsTab initialEntries={creditEntries} />}
      {activeTab === 'verifications' && (
        verificationUsers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 p-16 text-center">
            <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <p className="font-semibold text-slate-700 mb-1">All caught up!</p>
            <p className="text-sm text-slate-400">No pending verifications.</p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
            <div className="px-6 py-3 border-b border-slate-100 bg-slate-50">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
                {verificationUsers.length} pending
              </span>
            </div>
            <div className="divide-y divide-slate-100">
              {verificationUsers.map(user => (
                <div key={user.id} className="px-6 py-5 flex items-center gap-4">
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-[#4E87A0]/10 flex items-center justify-center shrink-0 overflow-hidden">
                    {user.avatar_url ? (
                      <img src={user.avatar_url} alt={user.full_name ?? ''} className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-sm font-bold text-[#4E87A0]">
                        {(user.full_name ?? user.email ?? '?')[0].toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[#1B3A5C] text-sm truncate">
                      {user.full_name ?? '\u2014'}
                    </p>
                    <p className="text-xs text-slate-400 truncate">{user.email}</p>
                    <span className="inline-block text-xs px-2 py-0.5 rounded-full font-medium mt-1 bg-blue-50 text-blue-700">
                      {user.member_type === 'teacher' ? 'Yoga Teacher' : 'Wellness Practitioner'}
                    </span>
                  </div>

                  {/* Date */}
                  <div className="text-xs text-slate-400 shrink-0 hidden sm:block">
                    {new Date(user.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </div>

                  {/* Actions */}
                  <VerificationActions userId={user.id} certificateUrl={user.certificate_url} />
                </div>
              ))}
            </div>
          </div>
        )
      )}
      {activeTab === 'tickets' && <SupportTicketsTab initialTickets={supportTickets} adminUserId={adminUserId} />}
      {activeTab === 'upgrades' && <TeacherUpgradesTab initialRequests={upgradeRequests} />}
      {activeTab === 'schools' && <SchoolRegistrationsTab initialSchools={schools} />}
      {activeTab === 'events' && <EventsTab events={normalizedEvents} />}
      {activeTab === 'courses' && <CoursesTab courses={normalizedCourses} />}
    </div>
  )
}
