import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { revalidatePath } from 'next/cache'
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
    // Revalidate all Next.js cached paths
    revalidatePath('/', 'layout')

    return NextResponse.json({
      success: true,
      message: 'Cache cleared successfully',
    })
  } catch (err) {
    return NextResponse.json({
      success: false,
      message: err instanceof Error ? err.message : 'Failed to clear cache',
    })
  }
}
