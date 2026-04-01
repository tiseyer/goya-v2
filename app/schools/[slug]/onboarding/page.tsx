import { Suspense } from 'react'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { redirect } from 'next/navigation'
import PageContainer from '@/app/components/ui/PageContainer'
import OnboardingWizard from './OnboardingWizard'

export default async function SchoolOnboardingPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const supabase = await createSupabaseServerClient()

  // Auth gate
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  // Fetch school by slug
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('*')
    .eq('slug', slug)
    .single()

  // Owner gate: redirect if not found or not owner
  if (!school || school.owner_id !== user.id) {
    redirect('/dashboard')
  }

  // If onboarding already completed, redirect to settings
  if (school.onboarding_completed) {
    redirect(`/schools/${school.id}/settings`)
  }

  // Fetch school_designations
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: designations } = await (supabase as any)
    .from('school_designations')
    .select('id, designation_type, status')
    .eq('school_id', school.id)

  // Fetch existing faculty
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: faculty } = await (supabase as any)
    .from('school_faculty')
    .select('id, profile_id, invited_email, position, is_principal_trainer, status')
    .eq('school_id', school.id)

  // Fetch existing verification documents
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: documents } = await (supabase as any)
    .from('school_verification_documents')
    .select('id, designation_id, document_type, file_name, file_url')
    .eq('school_id', school.id)

  // Fetch owner's full name for the Faculty step
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: ownerProfile } = await (supabase as any)
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .maybeSingle()

  const ownerName: string = ownerProfile?.full_name ?? 'You'

  return (
    <PageContainer className="py-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="flex flex-col items-center gap-3 text-[#6B7280]">
              <svg
                className="animate-spin w-8 h-8 text-[#1B3A5C]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8z"
                />
              </svg>
              <span className="text-sm">Loading onboarding...</span>
            </div>
          </div>
        }
      >
        <OnboardingWizard
          school={school}
          designations={designations ?? []}
          faculty={faculty ?? []}
          documents={documents ?? []}
          ownerName={ownerName}
        />
      </Suspense>
    </PageContainer>
  )
}
