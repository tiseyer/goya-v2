import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import SchoolRegistrationsTab from './SchoolRegistrationsTab'
import TeacherUpgradesTab from './TeacherUpgradesTab'
import CreditsTab from './CreditsTab'
import SupportTicketsTab from './SupportTicketsTab'
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
      : tab === 'credits'
      ? 'credits'
      : tab === 'tickets'
      ? 'tickets'
      : 'schools'

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

  return (
    <div className="p-6 lg:p-8">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Inbox</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review school registrations, teacher upgrade requests, credit submissions, and support tickets
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 rounded-lg p-1 mb-8 w-fit overflow-x-auto">
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
      </div>

      {/* Tab content */}
      {activeTab === 'schools' && <SchoolRegistrationsTab initialSchools={schools} />}
      {activeTab === 'upgrades' && <TeacherUpgradesTab initialRequests={upgradeRequests} />}
      {activeTab === 'credits' && <CreditsTab initialEntries={creditEntries} />}
      {activeTab === 'tickets' && <SupportTicketsTab initialTickets={supportTickets} adminUserId={adminUserId} />}
    </div>
  )
}
