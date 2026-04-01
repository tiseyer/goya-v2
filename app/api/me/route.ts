import { NextResponse } from 'next/server'
import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId'

export async function GET() {
  let userId: string
  try {
    userId = await getEffectiveUserId()
  } catch {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const client = await getEffectiveClient()

  const { data: profile } = await client
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()

  return NextResponse.json({ userId, profile })
}
