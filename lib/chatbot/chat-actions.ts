'use server'
import 'server-only'
import { cookies } from 'next/headers'
import { getSupabaseService } from '@/lib/supabase/service'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export interface HistoryMessage {
  id: string
  role: string
  content: string
  created_at: string
}

/**
 * Get or create a chat session, returning the session ID and any existing messages.
 * If existingSessionId is provided and valid, restores the conversation.
 * Otherwise creates a new session row.
 */
export async function getOrCreateSession(params: {
  userId?: string
  anonymousId?: string
  existingSessionId?: string
}): Promise<{ session_id: string; messages: HistoryMessage[] }> {
  const supabase = getSupabaseService()

  // Try to restore existing session
  if (params.existingSessionId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: session } = await (supabase as any)
      .from('chat_sessions')
      .select('id, user_id, anonymous_id')
      .eq('id', params.existingSessionId)
      .single()

    if (session) {
      // Verify ownership — session must belong to this user or anonymous ID
      const ownerMatch =
        (params.userId && session.user_id === params.userId) ||
        (params.anonymousId && session.anonymous_id === params.anonymousId) ||
        (!params.userId && !params.anonymousId)

      if (ownerMatch) {
        const messages = await getChatHistory(params.existingSessionId)
        return { session_id: params.existingSessionId, messages }
      }
    }
  }

  // Create a new session
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: newSession, error } = await (supabase as any)
    .from('chat_sessions')
    .insert({
      user_id: params.userId ?? null,
      anonymous_id: params.anonymousId ?? null,
      is_escalated: false,
    })
    .select('id')
    .single()

  if (error || !newSession) {
    throw new Error(error?.message ?? 'Failed to create chat session')
  }

  return { session_id: newSession.id, messages: [] }
}

/**
 * Load message history for a session, ordered oldest-first, up to 100 messages.
 */
export async function getChatHistory(sessionId: string): Promise<HistoryMessage[]> {
  const supabase = getSupabaseService()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data, error } = await (supabase as any)
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('session_id', sessionId)
    .order('created_at', { ascending: true })
    .limit(100)

  if (error) {
    throw new Error(error.message)
  }

  return (data ?? []) as HistoryMessage[]
}

/**
 * Delete all messages then the session itself (FK order matters).
 */
export async function deleteSession(sessionId: string): Promise<void> {
  const supabase = getSupabaseService()

  // Delete messages first to respect FK constraint
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('chat_messages').delete().eq('session_id', sessionId)

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from('chat_sessions').delete().eq('id', sessionId)
}

/**
 * Get or generate an anonymous ID for guest users.
 * Reads/writes the goya_chat_session cookie.
 */
export async function getAnonymousId(): Promise<string> {
  const cookieStore = await cookies()
  const existing = cookieStore.get('goya_chat_session')

  if (existing?.value) {
    return existing.value
  }

  const id = crypto.randomUUID()
  cookieStore.set('goya_chat_session', id, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60, // 30 days
    path: '/',
  })
  return id
}

/**
 * Get the current authenticated user's ID, or null for guests.
 */
export async function getCurrentUserId(): Promise<string | null> {
  try {
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()
    return user?.id ?? null
  } catch {
    return null
  }
}
