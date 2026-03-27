import Link from 'next/link'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import SchoolRegistrationsTab from './SchoolRegistrationsTab'
import TeacherUpgradesTab from './TeacherUpgradesTab'
import CreditsTab from './CreditsTab'

export const dynamic = 'force-dynamic'

export default async function InboxPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>
}) {
  const { tab } = await searchParams
  const activeTab = tab === 'upgrades' ? 'upgrades' : tab === 'credits' ? 'credits' : 'schools'

  const supabase = await createSupabaseServerClient()

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

  return (
    <div className="p-6 sm:p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#1B3A5C]">Inbox</h1>
        <p className="text-sm text-slate-500 mt-1">
          Review school registrations, teacher upgrade requests, and credit submissions
        </p>
      </div>

      {/* Tabs */}
      <div className="mb-6">
        {/* Tab bar */}
        <div className="border-b border-slate-200">
          <div className="flex items-center gap-0">
            <Link
              href="/admin/inbox?tab=schools"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'schools'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              School Registrations
              {pendingSchoolCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {pendingSchoolCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/inbox?tab=upgrades"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'upgrades'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              Teacher Upgrades
              {pendingUpgradeCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {pendingUpgradeCount}
                </span>
              )}
            </Link>
            <Link
              href="/admin/inbox?tab=credits"
              className={`relative px-5 py-3 text-sm font-semibold -mb-px transition-colors ${
                activeTab === 'credits'
                  ? 'text-[#00B5A3] border-b-2 border-[#00B5A3]'
                  : 'text-slate-500 hover:text-slate-700 border-b-2 border-transparent'
              }`}
            >
              Credits & Hours
              {pendingCreditCount > 0 && (
                <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs font-bold">
                  {pendingCreditCount}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>

      {/* Tab content */}
      {activeTab === 'schools' && <SchoolRegistrationsTab initialSchools={schools} />}
      {activeTab === 'upgrades' && <TeacherUpgradesTab initialRequests={upgradeRequests} />}
      {activeTab === 'credits' && <CreditsTab initialEntries={creditEntries} />}
    </div>
  )
}
