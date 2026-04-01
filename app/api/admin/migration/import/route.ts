import 'server-only'
import { NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { importUsersFromData, type ImportMode, type WPExportUser, type UserResult } from '../../../../../migration/import-core'

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

  const files = formData.getAll('file') as File[]
  if (files.length === 0) {
    return NextResponse.json({ error: 'No files uploaded' }, { status: 400 })
  }

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

  // 3. Stream progress via SSE
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    async start(controller) {
      const counters = { created: 0, skipped: 0, updated: 0, failed: 0 }

      function sendEvent(data: Record<string, unknown>) {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      try {
        const supabaseService = getSupabaseService()
        const log = await importUsersFromData(
          supabaseService,
          allUsers,
          mode as ImportMode,
          (result: UserResult, index: number, total: number) => {
            if (result.status === 'created') counters.created++
            else if (result.status === 'skipped') counters.skipped++
            else if (result.status === 'updated') counters.updated++
            else if (result.status === 'error') counters.failed++

            sendEvent({
              total,
              processed: index + 1,
              created: counters.created,
              skipped: counters.skipped,
              updated: counters.updated,
              failed: counters.failed,
              status: 'running',
            })
          }
        )

        sendEvent({
          total: log.total,
          processed: log.total,
          created: log.created,
          skipped: log.skipped,
          updated: log.updated,
          failed: log.errors,
          status: 'done',
          log,
        })
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Unknown error'
        sendEvent({ status: 'error', error: message })
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
    },
  })
}
