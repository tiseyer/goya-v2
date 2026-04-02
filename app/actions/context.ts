'use server'

import { cookies } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { validateSchoolAccess } from '@/lib/active-context'

const COOKIE_NAME = 'goya_active_context'

/**
 * Switch the active context between personal and school.
 * Sets the goya_active_context cookie and revalidates the layout.
 */
export async function switchContext(target: string): Promise<{ error?: string }> {
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return { error: 'Not authenticated' }
  }

  const cookieStore = await cookies()

  if (target === 'personal') {
    cookieStore.set(COOKIE_NAME, 'personal', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    revalidatePath('/', 'layout')
    return {}
  }

  if (target.startsWith('school:')) {
    const schoolId = target.slice(7)

    // Validate access
    const hasAccess = await validateSchoolAccess(user.id, schoolId)
    if (!hasAccess) {
      return { error: 'No access to this school' }
    }

    cookieStore.set(COOKIE_NAME, target, {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: process.env.NODE_ENV === 'production',
    })
    revalidatePath('/', 'layout')
    return {}
  }

  return { error: 'Invalid target' }
}
