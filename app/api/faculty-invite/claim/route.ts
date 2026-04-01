import { NextResponse } from 'next/server'
import { createSupabaseServerActionClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'

export async function POST(request: Request) {
  // 1. Get authenticated user
  const supabase = await createSupabaseServerActionClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Parse body
  let body: { invite_token?: string }
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const { invite_token } = body
  if (!invite_token) {
    return NextResponse.json({ error: 'invite_token is required' }, { status: 400 })
  }

  const service = getSupabaseService()

  // 3. Look up pending faculty invite by token
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: faculty, error: lookupError } = await (service as any)
    .from('school_faculty')
    .select('id, school_id')
    .eq('invite_token', invite_token)
    .eq('status', 'pending')
    .is('profile_id', null)
    .maybeSingle()

  if (lookupError) {
    console.error('[faculty-invite/claim] lookup error:', lookupError)
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }

  if (!faculty) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }

  const schoolId: string = faculty.school_id

  // 4. Update school_faculty: link profile, activate, clear invited_email
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateFacultyError } = await (service as any)
    .from('school_faculty')
    .update({
      profile_id: user.id,
      status: 'active',
      invited_email: null,
    })
    .eq('id', faculty.id)

  if (updateFacultyError) {
    console.error('[faculty-invite/claim] faculty update error:', updateFacultyError)
    return NextResponse.json({ error: 'Failed to claim invite' }, { status: 500 })
  }

  // 5. Update profiles: append school_id to faculty_school_ids
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: profile, error: profileFetchError } = await (service as any)
    .from('profiles')
    .select('faculty_school_ids')
    .eq('id', user.id)
    .single()

  if (profileFetchError) {
    console.error('[faculty-invite/claim] profile fetch error:', profileFetchError)
    // Non-fatal — faculty record is already linked; log and continue
  } else {
    const currentIds: string[] = (profile?.faculty_school_ids as string[] | null) ?? []
    if (!currentIds.includes(schoolId)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (service as any)
        .from('profiles')
        .update({ faculty_school_ids: [...currentIds, schoolId] })
        .eq('id', user.id)
    }
  }

  return NextResponse.json({ success: true, school_id: schoolId })
}
