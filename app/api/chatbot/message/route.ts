import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { checkChatRateLimit } from '@/lib/chatbot/rate-limit'
import { streamChatResponse } from '@/lib/chatbot/chat-service'

export const runtime = 'nodejs'
export const maxDuration = 60

/**
 * POST /api/chatbot/message
 *
 * Public endpoint — guests can chat without being signed in.
 * Optional auth: if a valid session cookie is present, user is identified.
 * Rate limited: 20 messages per session/anonymous_id/user per hour.
 *
 * Body: { session_id?: string, message: string, anonymous_id?: string }
 *
 * Returns:
 * - 200 text/plain stream of JSON lines (token chunks + done event) for normal chat
 * - 200 application/json { type: 'escalation', message, session_id } for escalations
 * - 400 for invalid input
 * - 401 if neither cookie session nor anonymous_id provided
 * - 429 if rate limit exceeded
 * - 500 on unexpected errors
 */
export async function POST(request: Request) {
  try {
    // Parse and validate body
    let body: { session_id?: string; message?: unknown; anonymous_id?: string }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { session_id, anonymous_id } = body
    const message = body.message

    // Validate message
    if (!message || typeof message !== 'string' || message.trim().length === 0) {
      return Response.json({ error: 'Message is required' }, { status: 400 })
    }
    if (message.length > 2000) {
      return Response.json(
        { error: 'Message must be 2000 characters or fewer' },
        { status: 400 },
      )
    }

    // Determine user identity (optional — guests allowed)
    let userId: string | null = null
    try {
      const supabase = await createSupabaseServerClient()
      const {
        data: { user },
      } = await supabase.auth.getUser()
      userId = user?.id ?? null
    } catch {
      // Not authenticated — continue as guest
    }

    // Require at least one identity signal
    if (!userId && !anonymous_id && !session_id) {
      return Response.json({ error: 'Session required' }, { status: 401 })
    }

    // Rate limit by session_id, then anonymous_id, then userId
    const rateLimitKey = session_id ?? anonymous_id ?? userId!
    const rateLimitResponse = checkChatRateLimit(rateLimitKey)
    if (rateLimitResponse) return rateLimitResponse

    // Call AI backend
    const result = await streamChatResponse({
      sessionId: session_id ?? null,
      message: message.trim(),
      userId,
      anonymousId: anonymous_id ?? null,
    })

    // Escalation: return JSON directly (no stream needed)
    if (result.escalated) {
      return Response.json(
        {
          type: 'escalation',
          message:
            "That's a great question -- I'll check with our team and get back to you, usually within 48 hours.",
          session_id: result.session_id,
        },
        { status: 200 },
      )
    }

    // Normal streaming response
    return new Response(result.stream, {
      status: 200,
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
        'X-Session-Id': result.session_id,
      },
    })
  } catch (err) {
    console.error('[chatbot/message] Error:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
