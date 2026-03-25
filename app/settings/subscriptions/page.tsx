import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { fetchSubscriptionsData } from './queries'
import { PortalButton } from './PortalButton'
import { DesignationsBox } from './DesignationsBox'

const ROLE_PLAN_NAMES: Record<string, string> = {
  student: 'GOYA Student Membership',
  teacher: 'GOYA Teacher Membership',
  wellness_practitioner: 'GOYA Wellness Practitioner Membership',
  admin: 'Admin Member',
  moderator: 'Moderator Member',
}

function formatPrice(cents: number, interval: string): string {
  const dollars = (cents / 100).toFixed(2)
  return `$${dollars} / ${interval}`
}

function Separator() {
  return (
    <div className="flex items-center justify-center py-1">
      <span className="text-[#9CA3AF] text-lg font-light select-none">+</span>
    </div>
  )
}

export default async function SettingsSubscriptionsPage() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const {
    profile,
    baseMembership,
    additionalSubscriptions,
    ownsSchool,
    schoolName,
    designations,
  } = await fetchSubscriptionsData(user.id)

  const basePlanName = baseMembership
    ? baseMembership.productName
    : (ROLE_PLAN_NAMES[profile.role] ?? 'No active membership')

  const basePriceText = baseMembership
    ? formatPrice(baseMembership.unitAmount, baseMembership.interval)
    : null

  return (
    <div className="p-6 max-w-4xl">
      <h1 className="text-xl font-semibold text-[#1B3A5C] mb-6">Subscriptions</h1>

      {/* BOX 1 — Base Membership (always shown) */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
        <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">Membership</h2>
        <p className="text-sm text-[#1B3A5C] font-medium">{basePlanName}</p>
        {basePriceText && (
          <p className="text-sm text-[#6B7280] mt-1">{basePriceText}</p>
        )}
        {/* Verwalten button — only if user has a Stripe customer ID and an active membership */}
        {baseMembership && profile.stripeCustomerId && (
          <PortalButton stripeCustomerId={profile.stripeCustomerId} />
        )}
      </div>

      {/* BOX 2 — Additional Subscriptions (only if any) */}
      {additionalSubscriptions.length > 0 && (
        <>
          <Separator />
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1B3A5C] mb-3">Additional Subscriptions</h2>
            <ul className="space-y-4">
              {additionalSubscriptions.map(sub => (
                <li key={sub.stripeOrderId} className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-[#1B3A5C] font-medium">{sub.productName}</p>
                    <p className="text-sm text-[#6B7280]">{formatPrice(sub.unitAmount, sub.interval)}</p>
                  </div>
                  {profile.stripeCustomerId && (
                    <PortalButton stripeCustomerId={profile.stripeCustomerId} />
                  )}
                </li>
              ))}
            </ul>
          </div>
        </>
      )}

      {/* BOX 3 — School Membership (only if user owns a school) */}
      {ownsSchool && (
        <>
          <Separator />
          <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
            <h2 className="text-base font-semibold text-[#1B3A5C] mb-1">School Membership</h2>
            <p className="text-sm text-[#1B3A5C] font-medium">{schoolName ?? 'Your School'}</p>
            <p className="text-sm text-[#6B7280] mt-1">This is your school membership.</p>
            {profile.stripeCustomerId && (
              <PortalButton stripeCustomerId={profile.stripeCustomerId} />
            )}
          </div>
        </>
      )}

      {/* BOX 4 — Designations (only if user has any active designations) */}
      {designations.length > 0 && (
        <>
          <Separator />
          <DesignationsBox designations={designations} />
        </>
      )}
    </div>
  )
}
