import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { isAdminOrAbove } from '@/lib/roles'

async function requireAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return { error: 'Unauthorized', status: 401 }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !isAdminOrAbove(profile.role as string)) return { error: 'Forbidden', status: 403 }
  return { user }
}

export async function POST() {
  const auth = await requireAdmin()
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  try {
    const service = getSupabaseService()

    // Get all non-admin user IDs
    const { data: nonAdminProfiles, error: fetchError } = await service
      .from('profiles')
      .select('id')
      .not('role', 'eq', 'admin')

    if (fetchError) {
      return NextResponse.json({
        success: false,
        message: `Failed to fetch users: ${fetchError.message}`,
      })
    }

    const userIds = nonAdminProfiles?.map(p => p.id) ?? []
    let invalidated = 0

    // Sign out each non-admin user via Supabase Admin API
    for (const userId of userIds) {
      const { error: signOutError } = await service.auth.admin.signOut(userId)
      if (!signOutError) invalidated++
    }

    console.log(`[danger] Invalidated ${invalidated}/${userIds.length} non-admin sessions`)

    return NextResponse.json({
      success: true,
      count: invalidated,
      message: `${invalidated} session${invalidated !== 1 ? 's' : ''} invalidated`,
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to invalidate sessions',
    })
  }
}
