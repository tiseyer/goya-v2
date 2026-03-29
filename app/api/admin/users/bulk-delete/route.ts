import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'

export async function POST(request: Request) {
  // Auth check — admin only
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!profile || profile.role !== 'admin') {
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
  const skippedAdmins: string[] = []

  // Safety: never delete yourself
  const safeIds = userIds.filter(id => id !== user.id)
  if (safeIds.length < userIds.length) {
    errors.push('Cannot delete yourself — skipped')
  }

  // Safety: never delete admins — check roles first
  const { data: profiles } = await serviceClient
    .from('profiles')
    .select('id, role, email')
    .in('id', safeIds)

  const adminIds = new Set(
    (profiles ?? []).filter(p => p.role === 'admin').map(p => {
      skippedAdmins.push(p.email)
      return p.id
    })
  )

  const deletableIds = safeIds.filter(id => !adminIds.has(id))

  if (skippedAdmins.length > 0) {
    errors.push(`Skipped ${skippedAdmins.length} admin(s): ${skippedAdmins.join(', ')}`)
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
