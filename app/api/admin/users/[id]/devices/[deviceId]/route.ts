import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { isAdminOrAbove } from '@/lib/roles'

type Params = Promise<{ id: string; deviceId: string }>

export async function DELETE(
  _request: Request,
  { params }: { params: Params }
) {
  const { id, deviceId } = await params

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

  if (!profile || !isAdminOrAbove(profile.role)) {
    return NextResponse.json({ error: 'Forbidden — admin role required' }, { status: 403 })
  }

  const serviceClient = getSupabaseService()
  const { error: deleteError, count } = await serviceClient
    .from('trusted_devices')
    .delete({ count: 'exact' })
    .eq('id', deviceId)
    .eq('profile_id', id)

  if (deleteError || count === 0) {
    return NextResponse.json({ error: 'Device not found' }, { status: 404 })
  }

  return NextResponse.json({ success: true })
}
