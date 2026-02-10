import { redirect } from 'next/navigation'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import OnboardingClient from './OnboardingClient'

const TOTAL_STEPS = 8

export default async function OnboardingPage() {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect('/login')
  }

  const { data: state } = await supabase
    .from('onboarding_state')
    .select('current_step,max_step_reached,onboarding_complete')
    .eq('user_id', user.id)
    .maybeSingle()

  if (state?.onboarding_complete) {
    redirect('/welcome')
  }

  const defaultFirstName =
    (user.user_metadata?.first_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined)?.split(' ')[0] ||
    ''
  const defaultLastName =
    (user.user_metadata?.last_name as string | undefined) ||
    (user.user_metadata?.full_name as string | undefined)?.split(' ').slice(1).join(' ') ||
    ''

  const { data: profile } = await supabase
    .from('profiles')
    .select(
      'first_name,last_name,role,address_line1,address_line2,postal_code,state_region,country,language,practice_formats,avatar_url,code_of_conduct_accepted_at,code_of_ethics_accepted_at'
    )
    .eq('user_id', user.id)
    .maybeSingle()

  if (!profile) {
    await supabase.from('profiles').upsert(
      {
        user_id: user.id,
        first_name: defaultFirstName,
        last_name: defaultLastName,
      },
      { onConflict: 'user_id' }
    )
  }

  if (!state) {
    await supabase
      .from('onboarding_state')
      .insert({ user_id: user.id, current_step: 1, max_step_reached: 0, onboarding_complete: false })
  }

  const resumeStep = Math.min(Math.max((state?.max_step_reached ?? 0) + 1, 1), TOTAL_STEPS)
  const currentStep = Math.min(
    Math.max(state?.current_step ?? resumeStep, resumeStep),
    TOTAL_STEPS
  )

  return (
    <OnboardingClient
      userId={user.id}
      initialProfile={{
        first_name: profile?.first_name ?? defaultFirstName,
        last_name: profile?.last_name ?? defaultLastName,
        role: (profile?.role as any) ?? '',
        address_line1: profile?.address_line1 ?? '',
        address_line2: profile?.address_line2 ?? '',
        postal_code: profile?.postal_code ?? '',
        state_region: profile?.state_region ?? '',
        country: profile?.country ?? '',
        language: profile?.language ?? '',
        practice_formats: profile?.practice_formats ?? [],
        avatar_url: profile?.avatar_url ?? '',
        code_of_conduct_accepted_at: profile?.code_of_conduct_accepted_at ?? null,
        code_of_ethics_accepted_at: profile?.code_of_ethics_accepted_at ?? null,
      }}
      initialState={{
        current_step: currentStep,
        max_step_reached: state?.max_step_reached ?? 0,
      }}
    />
  )
}
