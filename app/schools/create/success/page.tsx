import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import PageContainer from '@/app/components/ui/PageContainer'

export default async function SchoolRegistrationSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string; slug?: string }>
}) {
  const params = await searchParams
  const { session_id, slug } = params

  if (!session_id) {
    redirect('/schools/create')
  }

  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    redirect('/sign-in')
  }

  // If slug was passed via success_url, redirect directly to onboarding
  if (slug) {
    redirect(`/schools/${slug}/onboarding`)
  }

  // Fallback: query for the school record (webhook may not have fired yet)
  const { data: school } = await supabase
    .from('schools')
    .select('slug')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (school?.slug) {
    redirect(`/schools/${school.slug}/onboarding`)
  }

  // Webhook hasn't fired yet — show a brief "setting up" message with auto-refresh
  return (
    <PageContainer className="py-16">
      <div className="text-center">
        <meta httpEquiv="refresh" content="3" />
        <h1 className="text-2xl font-semibold text-gray-900 mb-3">
          Setting up your school&hellip;
        </h1>
        <p className="text-gray-500">
          Your payment was successful. We&rsquo;re finalising your school registration.
          You&rsquo;ll be redirected automatically in a moment.
        </p>
      </div>
    </PageContainer>
  )
}
