import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import { fetchSubscriptionsData } from './queries'
import { PortalButton } from './PortalButton'
import { DesignationsBox } from './DesignationsBox'
import SchoolRegistrationCTA from '@/app/components/SchoolRegistrationCTA'

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
    hasPendingUpgrade,
  } = await fetchSubscriptionsData(user.id)

  const isUpgradeEligible = profile.role === 'student' || profile.role === 'wellness_practitioner'

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

      {/* School Registration CTA — teachers without a school */}
      {(profile.role === 'teacher' || profile.role === 'admin') && !ownsSchool && (
        <>
          <Separator />
          <SchoolRegistrationCTA variant="callout" />
        </>
      )}

      {/* Upgrade CTA / Pending State — only for students and wellness practitioners */}
      {isUpgradeEligible && (
        <>
          <Separator />
          {hasPendingUpgrade ? (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6">
              <p className="text-sm font-medium text-[#1B3A5C]">Upgrade Request Pending</p>
              <p className="text-sm text-[#6B7280] mt-1">Your upgrade request is pending verification. You&apos;ll be notified within 48 hours.</p>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm p-6 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-semibold text-[#1B3A5C]">Ready to become a GOYA Certified Teacher?</p>
                <p className="text-sm text-[#6B7280] mt-1">Upgrade your membership and unlock teacher credentials.</p>
              </div>
              <a
                href="/upgrade"
                className="flex items-center gap-1.5 whitespace-nowrap bg-[#1B3A5C] text-white text-sm font-semibold px-4 py-2 rounded-lg hover:bg-[#162f4a] transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M10 17a.75.75 0 01-.75-.75V5.612L5.29 9.77a.75.75 0 01-1.08-1.04l5.25-5.5a.75.75 0 011.08 0l5.25 5.5a.75.75 0 11-1.08 1.04l-3.96-4.158V16.25A.75.75 0 0110 17z" clipRule="evenodd" />
                </svg>
                Upgrade to Teacher Membership
              </a>
            </div>
          )}
        </>
      )}

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
