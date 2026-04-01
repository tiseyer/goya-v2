'use server'

import { getEffectiveUserId, getEffectiveClient } from '@/lib/supabase/getEffectiveUserId'
import { getSupabaseService } from '@/lib/supabase/service'
import { logImpersonationAction } from '@/lib/impersonation'
import { IMPERSONATION_COOKIE } from '@/lib/impersonation'
import { cookies } from 'next/headers'

/**
 * Send a message using the effective user ID (impersonated or real).
 * Uses the service role client when impersonating to bypass RLS.
 */
export async function sendMessageAction(
  conversationId: string,
  content: string,
  senderName: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    const effectiveUserId = await getEffectiveUserId()
    const client = await getEffectiveClient()

    // Insert message
    const { error: msgError } = await (client as ReturnType<typeof getSupabaseService>)
      .from('messages')
      .insert({ conversation_id: conversationId, sender_id: effectiveUserId, content })

    if (msgError) return { success: false, error: msgError.message }

    // Update conversation last_message_at
    await (client as ReturnType<typeof getSupabaseService>)
      .from('conversations')
      .update({ last_message_at: new Date().toISOString() })
      .eq('id', conversationId)

    // Find recipient and create notification using service client
    const svc = getSupabaseService()
    const { data: conv } = await svc
      .from('conversations')
      .select('participant_1, participant_2')
      .eq('id', conversationId)
      .single()

    if (conv) {
      const recipientId = (conv as { participant_1: string; participant_2: string }).participant_1 === effectiveUserId
        ? (conv as { participant_1: string; participant_2: string }).participant_2
        : (conv as { participant_1: string; participant_2: string }).participant_1

      await svc.from('notifications').insert({
        user_id: recipientId,
        type: 'new_message',
        title: `${senderName} sent you a message`,
        body: content.slice(0, 80),
        link: `/messages?conversation=${conversationId}`,
        actor_id: effectiveUserId,
      })
    }

    // Log impersonation action if impersonating
    const cookieStore = await cookies()
    if (cookieStore.get(IMPERSONATION_COOKIE)?.value) {
      await logImpersonationAction('message_sent', { conversationId, content: content.slice(0, 50) })
    }

    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to send message' }
  }
}
