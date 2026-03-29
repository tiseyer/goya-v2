import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { importUsersFromData, type ImportMode, type WPExportUser } from '../../../../migration/import-core'

export async function POST(request: Request) {
  // 1. Auth check — admin only
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

  // 2. Parse form data
  let formData: FormData
  try {
    formData = await request.formData()
  } catch {
    return NextResponse.json({ error: 'Invalid form data' }, { status: 400 })
  }

  const mode = (formData.get('mode') as string) || 'skip'
  if (mode !== 'skip' && mode !== 'overwrite') {
    return NextResponse.json({ error: 'Invalid mode — must be "skip" or "overwrite"' }, { status: 400 })
  }

  // Collect all uploaded files
  const files = formData.getAll('file') as File[]
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
  }

  // Parse JSON from all files and concatenate users
  const allUsers: WPExportUser[] = []
  for (const file of files) {
    try {
      const text = await file.text()
      const parsed = JSON.parse(text)
      const users = Array.isArray(parsed) ? parsed : parsed.users || [parsed]
      allUsers.push(...users)
    } catch {
      return NextResponse.json(
        { error: `Failed to parse JSON from file: ${file.name}` },
        { status: 400 }
      )
    }
  }

  if (allUsers.length === 0) {
    return NextResponse.json({ error: 'No users found in uploaded files' }, { status: 400 })
  }

  // 3. Run import with service role client
  try {
    const supabaseService = getSupabaseService()
    const log = await importUsersFromData(
      supabaseService,
      allUsers,
      mode as ImportMode
    )

    // 4. Return full MigrationLog
    return NextResponse.json(log)
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error'
    return NextResponse.json({ error: `Import failed: ${message}` }, { status: 500 })
  }
}
