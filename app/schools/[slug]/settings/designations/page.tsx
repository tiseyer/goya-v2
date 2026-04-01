import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

// ── Designation type labels ────────────────────────────────────────────────────

const DESIGNATION_LABELS: Record<string, string> = {
  rys_200: 'RYS 200 — 200-Hour Yoga School',
  rys_300: 'RYS 300 — 300-Hour Yoga School',
  rys_500: 'RYS 500 — 500-Hour Yoga School',
  rpys: 'RPYS — Prenatal Yoga School',
  rcys: 'RCYS — Children\'s Yoga School',
}

// ── Status Badge ──────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { classes: string; label: string }> = {
    active: { classes: 'bg-green-100 text-green-700', label: 'Active' },
    pending: { classes: 'bg-amber-100 text-amber-700', label: 'Pending Review' },
    cancelled: { classes: 'bg-red-100 text-red-700', label: 'Cancelled' },
    expired: { classes: 'bg-gray-100 text-gray-500', label: 'Expired' },
  }
  const config = map[status] ?? { classes: 'bg-gray-100 text-gray-500', label: status }
  return (
    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.classes}`}>
      {config.label}
    </span>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Designation {
  id: string
  designation_type: string
  status: string
  verified_at: string | null
  stripe_subscription_id: string | null
  created_at: string
}

export default async function DesignationsPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('id, name')
    .eq('slug', slug)
    .single()

  if (!school) redirect('/dashboard')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: designations } = await (supabase as any)
    .from('school_designations')
    .select('id, designation_type, status, verified_at, stripe_subscription_id, created_at')
    .eq('school_id', school.id)
    .order('created_at', { ascending: true })

  const list: Designation[] = designations ?? []

  return (
    <div className="p-6 max-w-3xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-[#1B3A5C]">Designations</h1>
        <p className="text-sm text-[#6B7280] mt-1">
          Your school&apos;s active GOYA designations and certification status.
        </p>
      </div>

      {list.length === 0 ? (
        <div className="bg-white border border-[#E5E7EB] rounded-xl p-6 text-center">
          <p className="text-sm text-[#6B7280]">No designations found for this school.</p>
          <p className="text-sm text-[#6B7280] mt-1">
            To add a designation, contact{' '}
            <a href="mailto:support@goya.community" className="text-[#1B3A5C] underline hover:no-underline">
              support@goya.community
            </a>
            .
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {list.map((d) => {
            const label = DESIGNATION_LABELS[d.designation_type] ?? d.designation_type
            const verifiedDate = d.verified_at
              ? new Date(d.verified_at).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })
              : null
            const createdDate = new Date(d.created_at).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
            })

            return (
              <div
                key={d.id}
                className="bg-white border border-[#E5E7EB] rounded-xl p-5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1B3A5C]">{label}</p>
                    <p className="text-xs text-[#6B7280] mt-0.5">
                      Applied {createdDate}
                    </p>
                    {verifiedDate && (
                      <p className="text-xs text-green-600 mt-0.5">
                        Verified {verifiedDate}
                      </p>
                    )}
                    {d.stripe_subscription_id && (
                      <p className="text-xs text-[#6B7280] mt-0.5">
                        Subscription active
                      </p>
                    )}
                  </div>
                  <StatusBadge status={d.status} />
                </div>
              </div>
            )
          })}

          <p className="text-xs text-[#9CA3AF] mt-4">
            To add new designations, contact{' '}
            <a href="mailto:support@goya.community" className="text-[#1B3A5C] underline hover:no-underline">
              support@goya.community
            </a>
            .
          </p>
        </div>
      )}
    </div>
  )
}
