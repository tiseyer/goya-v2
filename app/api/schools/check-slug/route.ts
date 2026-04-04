import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const slug = searchParams.get('slug')

  if (!slug || slug.trim() === '') {
    return NextResponse.json({ available: false, resolvedSlug: '' })
  }

  const baseSlug = slug.trim()

  // Build all candidate slugs in one array: base + base-2 through base-99
  const candidates: string[] = [baseSlug]
  for (let i = 2; i <= 99; i++) {
    candidates.push(`${baseSlug}-${i}`)
  }

  const supabase = await createSupabaseServerClient()
  const { data: taken } = await supabase
    .from('schools')
    .select('slug')
    .in('slug', candidates)

  const takenSet = new Set((taken ?? []).map((row: { slug: string }) => row.slug))

  // Find the first candidate not already taken
  const resolvedSlug = candidates.find((c) => !takenSet.has(c))

  if (!resolvedSlug) {
    // All 99 suffixes taken — extremely unlikely
    return NextResponse.json({ available: false, resolvedSlug: '' })
  }

  return NextResponse.json({ available: true, resolvedSlug })
}
