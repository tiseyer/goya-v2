import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { isAdminOrAbove } from '@/lib/roles'

export async function POST(request: Request) {
  // Auth check — admin only
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role, is_superuser')
    .eq('id', user.id)
    .single()

  if (!profile || !isAdminOrAbove(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 })
  }

  const body = await request.json().catch(() => null)
  if (!body?.userIds || !Array.isArray(body.userIds) || body.userIds.length === 0) {
    return NextResponse.json({ error: 'userIds array required' }, { status: 400 })
  }

  const userIds: string[] = body.userIds
  const serviceClient = getSupabaseService()
  const errors: string[] = []
  let deleted = 0
  const skippedUsers: string[] = []

  // Safety: never delete yourself
  const safeIds = userIds.filter(id => id !== user.id)
  if (safeIds.length < userIds.length) {
    errors.push('Cannot delete yourself — skipped')
  }

  // Safety: apply role-based deletion rules — check roles first
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('id, role, email, is_superuser')
    .in('id', safeIds)

  const callerIsSuperuser = profile?.is_superuser === true

  const undeletableIds = new Set(
    (profiles ?? []).filter(p => {
      // Superusers are NEVER deletable by anyone
      if (p.is_superuser) {
        skippedUsers.push(`${p.email ?? 'unknown'} (cannot be deleted)`)
        return true
      }
      // Admins only deletable by superuser
      if ((p.role as string) === 'admin' && !callerIsSuperuser) {
        skippedUsers.push(`${p.email ?? 'unknown'} (admin — skipped)`)
        return true
      }
      return false
    }).map(p => p.id)
  )

  const deletableIds = safeIds.filter(id => !undeletableIds.has(id))

  if (skippedUsers.length > 0) {
    errors.push(`Skipped ${skippedUsers.length} user(s): ${skippedUsers.join(', ')}`)
  }

  for (const userId of deletableIds) {
    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId)
    if (deleteError) {
      const email = (profiles ?? []).find(p => p.id === userId)?.email ?? userId
      errors.push(`Failed to delete ${email}: ${deleteError.message}`)
    } else {
      deleted++
    }
  }

  return NextResponse.json({ deleted, errors })
}
