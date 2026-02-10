'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'

const TOTAL_STEPS = 8

type StepPayload =
  | { step: 1; data: { first_name: string; last_name: string } }
  | { step: 2; data: { role: 'Student' | 'Teacher' | 'Wellness Practitioner' } }
  | {
      step: 3
      data: {
        address_line1: string
        address_line2: string
        postal_code: string
        state_region: string
        country: string
      }
    }
  | { step: 4; data: { language: string } }
  | { step: 5; data: { practice_formats: string[] } }
  | { step: 6; data: { avatar_url: string } }
  | {
      step: 7
      data: {
        code_of_conduct_accepted_at: string
        code_of_ethics_accepted_at: string
      }
    }

function normalizeString(value: string) {
  return value.trim()
}

async function ensureIdentifiers(userId: string) {
  const supabase = await createSupabaseServerActionClient()
  const { data: profile } = await supabase
    .from('profiles')
    .select('user_id, user_seq_id, mrn')
    .eq('user_id', userId)
    .maybeSingle()

  if (!profile) {
    return
  }

  if (profile.mrn) {
    return
  }

  let mrn = ''
  for (let i = 0; i < 5; i += 1) {
    const candidate = String(Math.floor(10000000 + Math.random() * 90000000))
    const { data: existing } = await supabase
      .from('profiles')
      .select('user_id')
      .eq('mrn', candidate)
      .maybeSingle()

    if (!existing) {
      mrn = candidate
      break
    }
  }

  if (mrn) {
    await supabase.from('profiles').update({ mrn }).eq('user_id', userId)
  }
}

export async function saveOnboardingStep(payload: StepPayload) {
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  const step = payload.step
  const data = payload.data

  const profileUpdates: Record<string, any> = { user_id: user.id }

  if (step === 1) {
    profileUpdates.first_name = normalizeString(data.first_name)
    profileUpdates.last_name = normalizeString(data.last_name)
  }

  if (step === 2) {
    profileUpdates.role = data.role
  }

  if (step === 3) {
    profileUpdates.address_line1 = normalizeString(data.address_line1)
    profileUpdates.address_line2 = normalizeString(data.address_line2)
    profileUpdates.postal_code = normalizeString(data.postal_code)
    profileUpdates.state_region = normalizeString(data.state_region)
    profileUpdates.country = normalizeString(data.country)
  }

  if (step === 4) {
    profileUpdates.language = normalizeString(data.language)
  }

  if (step === 5) {
    profileUpdates.practice_formats = data.practice_formats
  }

  if (step === 6) {
    profileUpdates.avatar_url = data.avatar_url
  }

  if (step === 7) {
    profileUpdates.code_of_conduct_accepted_at = data.code_of_conduct_accepted_at
    profileUpdates.code_of_ethics_accepted_at = data.code_of_ethics_accepted_at
  }

  await supabase.from('profiles').upsert(profileUpdates, { onConflict: 'user_id' })

  await ensureIdentifiers(user.id)

  const { data: state } = await supabase
    .from('onboarding_state')
    .select('current_step, max_step_reached')
    .eq('user_id', user.id)
    .maybeSingle()

  const nextStep = Math.min(step + 1, TOTAL_STEPS)
  const maxStepReached = Math.max(state?.max_step_reached ?? 0, step)
  const currentStep = Math.max(state?.current_step ?? 1, nextStep)

  await supabase
    .from('onboarding_state')
    .upsert(
      {
        user_id: user.id,
        current_step: currentStep,
        max_step_reached: maxStepReached,
        onboarding_complete: false,
      },
      { onConflict: 'user_id' }
    )

  return { current_step: currentStep, max_step_reached: maxStepReached }
}

export async function completeOnboarding() {
  const supabase = await createSupabaseServerActionClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Unauthorized')
  }

  await supabase
    .from('onboarding_state')
    .upsert(
      {
        user_id: user.id,
        onboarding_complete: true,
        current_step: TOTAL_STEPS,
        max_step_reached: TOTAL_STEPS,
      },
      { onConflict: 'user_id' }
    )

  redirect('/welcome')
}
