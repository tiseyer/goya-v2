import { NextResponse } from 'next/server'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'

export async function POST(request: Request) {
  const supabase = await createSupabaseServerActionClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(new URL('/login', request.url), { status: 307 })
}
