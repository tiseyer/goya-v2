import 'server-only'

import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

/**
 * Reusable admin auth guard for flow API routes.
 * Returns the authenticated user if they have admin or moderator role,
 * otherwise returns an appropriate error response.
 */
export async function requireFlowAdmin(): Promise<
  | { user: { id: string; email?: string }; error: null }
  | { user: null; error: NextResponse }
> {
  const supabase = await createSupabaseServerClient()
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser()

  if (authError || !user) {
    return {
      user: null,
      error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }),
    }
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    return {
      user: null,
      error: NextResponse.json(
        { error: 'Forbidden — admin or moderator role required' },
        { status: 403 }
      ),
    }
  }

  return { user, error: null }
}
