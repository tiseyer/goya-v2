import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get('q')
  const schoolId = searchParams.get('school_id')

  // Validate query params
  if (!q || q.trim().length < 2) {
    return NextResponse.json({ error: 'Query must be at least 2 characters' }, { status: 400 })
  }
  if (!schoolId) {
    return NextResponse.json({ error: 'school_id is required' }, { status: 400 })
  }

  // Auth check
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
  }

  // Verify caller owns the school
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: school } = await (supabase as any)
    .from('schools')
    .select('id')
    .eq('id', schoolId)
    .eq('owner_id', user.id)
    .maybeSingle()

  if (!school) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const service = getSupabaseService()

  // Get existing faculty profile IDs for this school (to exclude them)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingFaculty } = await (service as any)
    .from('school_faculty')
    .select('profile_id')
    .eq('school_id', schoolId)
    .not('profile_id', 'is', null)

  const existingProfileIds: string[] = (existingFaculty ?? [])
    .map((f: { profile_id: string | null }) => f.profile_id)
    .filter(Boolean) as string[]

  // Search profiles by full_name
  const searchTerm = `%${q.trim()}%`
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let query = (service as any)
    .from('profiles')
    .select('id, full_name, avatar_url')
    .ilike('full_name', searchTerm)
    .neq('id', user.id)
    .limit(10)

  // Exclude profiles already in faculty
  for (const id of existingProfileIds) {
    query = query.neq('id', id)
  }

  const { data: results, error } = await query

  if (error) {
    console.error('[faculty-search] profiles query error:', error)
    return NextResponse.json({ error: 'Search failed' }, { status: 500 })
  }

  return NextResponse.json({
    results: (results ?? []) as { id: string; full_name: string; avatar_url: string | null }[],
  })
}
