import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug || slug.trim() === '') {
    return NextResponse.json({ available: false })
  }

  const supabase = await createSupabaseServerClient()
  const { data } = await supabase
    .from('schools')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()

  return NextResponse.json({ available: !data })
}
