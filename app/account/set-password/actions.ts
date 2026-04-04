'use server'

import { redirect } from 'next/navigation'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { validatePasswordServer } from '@/lib/password-rules'

export async function setNewPassword(formData: FormData) {
  const password = String(formData.get('password') || '')
  const confirmPassword = String(formData.get('confirmPassword') || '')

  // Validation — enforces all 5 strength rules server-side
  const strengthError = validatePasswordServer(password)
  if (strengthError) {
    return { error: strengthError }
  }
  if (password !== confirmPassword) {
    return { error: 'Passwords do not match' }
  }

  const supabase = await createSupabaseServerActionClient()

  // Verify user is authenticated
  const { data: { user }, error: userError } = await supabase.auth.getUser()
  if (!user || userError) {
    redirect('/sign-in')
  }

  // Update auth password
  const { error: updateError } = await supabase.auth.updateUser({ password })
  if (updateError) {
    return { error: updateError.message }
  }

  // Clear the requires_password_reset flag
  const { error: profileError } = await supabase
    .from('profiles')
    .update({ requires_password_reset: false })
    .eq('id', user.id)

  if (profileError) {
    return { error: 'Password updated but failed to clear reset flag. Please contact support.' }
  }

  redirect('/')
}
