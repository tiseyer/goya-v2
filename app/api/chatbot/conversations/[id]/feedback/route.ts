import { getSupabaseService } from '@/lib/supabase/service'

export const runtime = 'nodejs'

/**
 * PATCH /api/chatbot/conversations/[id]/feedback
 *
 * Persists user feedback (thumbs up/down) to the chat_sessions table.
 * No auth check — the session ID itself is the access token.
 *
 * Body: { feedback: 'helpful' | 'not_helpful' }
 * Returns: 200 { success: true } | 400 | 500
 */
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  let body: { feedback?: unknown }
  try {
    body = await request.json()
  } catch {
    return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  const { feedback } = body

  if (feedback !== 'helpful' && feedback !== 'not_helpful') {
    return Response.json(
      { error: 'feedback must be "helpful" or "not_helpful"' },
      { status: 400 },
    )
  }

  // Map to DB enum values
  const mapped: 'up' | 'down' = feedback === 'helpful' ? 'up' : 'down'

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (getSupabaseService() as any)
    .from('chat_sessions')
    .update({ user_feedback: mapped, feedback_at: new Date().toISOString() })
    .eq('id', id)

  if (error) {
    console.error('[chatbot/feedback] DB error:', error.message)
    return Response.json({ error: 'Failed to save feedback' }, { status: 500 })
  }

  return Response.json({ success: true }, { status: 200 })
}
