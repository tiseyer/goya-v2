'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'

export async function removeConnectionAsAdmin(connectionId: string, userId: string) {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) redirect('/sign-in')

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  if (!['admin', 'moderator'].includes(profile?.role ?? '')) redirect('/')

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (getSupabaseService() as any).from('connections').delete().eq('id', connectionId)

  revalidatePath('/admin/users/' + userId, 'page')
}
