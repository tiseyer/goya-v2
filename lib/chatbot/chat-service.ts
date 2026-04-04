import 'server-only'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { decrypt } from '@/lib/secrets/encryption'
import { getSupabaseService } from '@/lib/supabase/service'
import { detectEscalation } from './escalation'
import type { ChatStreamResult } from './types'

const ESCALATION_RESPONSE =
  "That's a great question -- I'll check with our team and get back to you, usually within 48 hours."

function encodeChunk(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data) + '\n')
}

/**
 * Main streaming chat handler.
 *
 * Orchestrates: session resolution, rate limit check, conversation history load,
 * escalation detection, AI provider call (OpenAI or Anthropic), FAQ context injection,
 * and message persistence.
 */
export async function streamChatResponse(params: {
  sessionId: string | null
  message: string
  userId: string | null
  anonymousId: string | null
  startedFrom?: 'chat_widget' | 'search_hint' | 'help_page'
}): Promise<ChatStreamResult> {
  const { sessionId, message, userId, anonymousId, startedFrom } = params
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabase = getSupabaseService() as any

  // 1. Load chatbot config
  const { data: config, error: configError } = await supabase
    .from('chatbot_config')
    .select('*')
    .single()

  if (configError || !config) {
    throw new Error('Chatbot configuration not found')
  }

  if (!config.is_active) {
    throw new Error('Chatbot is not active')
  }

  // 2. Resolve or create session
  let resolvedSessionId: string

  if (sessionId) {
    // Verify session exists
    const { data: session } = await supabase
      .from('chat_sessions')
      .select('id, user_id, anonymous_id')
      .eq('id', sessionId)
      .single()

    if (!session) {
      throw new Error('Session not found')
    }
    resolvedSessionId = session.id
  } else {
    // Create new session
    const { data: newSession, error: sessionError } = await supabase
      .from('chat_sessions')
      .insert({
        user_id: userId ?? null,
        anonymous_id: anonymousId ?? null,
        is_escalated: false,
        started_from: startedFrom ?? 'chat_widget',
      })
      .select('id')
      .single()

    if (sessionError || !newSession) {
      throw new Error('Failed to create chat session')
    }
    resolvedSessionId = newSession.id
  }

  // 3. Load conversation history (last 20 messages)
  const { data: historyRows } = await supabase
    .from('chat_messages')
    .select('role, content')
    .eq('session_id', resolvedSessionId)
    .order('created_at', { ascending: true })
    .limit(20)

  const history: { role: string; content: string }[] = historyRows ?? []

  // 4. Check escalation
  const isEscalated = detectEscalation(message, history)

  if (isEscalated) {
    // Save user message
    await supabase.from('chat_messages').insert({
      session_id: resolvedSessionId,
      role: 'user',
      content: message,
    })

    // Save escalation response and capture its ID
    const { data: escalationMsg } = await supabase
      .from('chat_messages')
      .insert({
        session_id: resolvedSessionId,
        role: 'assistant',
        content: ESCALATION_RESPONSE,
      })
      .select('id')
      .single()

    // Create support ticket
    await supabase.from('support_tickets').insert({
      session_id: resolvedSessionId,
      user_id: userId ?? null,
      question_summary: message,
      status: 'open',
    })

    // Mark session as escalated
    await supabase
      .from('chat_sessions')
      .update({ is_escalated: true })
      .eq('id', resolvedSessionId)

    // Return a stream that immediately writes the escalation message and closes
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(
          encodeChunk({
            type: 'escalation',
            message: ESCALATION_RESPONSE,
            session_id: resolvedSessionId,
            message_id: escalationMsg?.id ?? null,
          }),
        )
        controller.close()
      },
    })

    return { stream, session_id: resolvedSessionId, escalated: true }
  }

  // 5. Decrypt provider API key
  if (!config.selected_key_id) {
    throw new Error('No AI provider key configured')
  }

  const { data: secretRow, error: secretError } = await supabase
    .from('admin_secrets')
    .select('encrypted_value, iv, provider, model')
    .eq('id', config.selected_key_id)
    .single()

  if (secretError || !secretRow) {
    throw new Error('AI provider key not found')
  }

  const apiKey = decrypt(secretRow.encrypted_value, secretRow.iv)
  const provider = secretRow.provider as string
  const model = secretRow.model as string

  // 6. Build FAQ context
  const { data: faqRows } = await supabase
    .from('faq_items')
    .select('question, answer')
    .eq('status', 'published')

  let faqContext = ''
  if (faqRows && faqRows.length > 0) {
    const items = faqRows
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      .map((item: any) => `<item><q>${item.question}</q><a>${item.answer}</a></item>`)
      .join('\n')
    faqContext = `\n\n<faq_context>\n${items}\n</faq_context>`
  }

  // 7. Build messages array
  const systemPrompt = config.system_prompt + faqContext
  const messagesForAI = history.map((m) => ({
    role: m.role as 'user' | 'assistant',
    content: m.content,
  }))

  // 8. Save user message immediately (before AI call)
  await supabase.from('chat_messages').insert({
    session_id: resolvedSessionId,
    role: 'user',
    content: message,
  })

  // 9. Call AI provider and stream response
  if (provider === 'openai') {
    const openai = new OpenAI({ apiKey })

    const openaiMessages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      { role: 'system', content: systemPrompt },
      ...messagesForAI,
      { role: 'user', content: message },
    ]

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullContent = ''

        try {
          const completion = await openai.chat.completions.create({
            model,
            messages: openaiMessages,
            stream: true,
          })

          for await (const chunk of completion) {
            const token = chunk.choices[0]?.delta?.content ?? ''
            if (token) {
              fullContent += token
              controller.enqueue(encodeChunk({ type: 'token', content: token }))
            }
          }

          // Save full assistant message after stream completes and capture its ID
          const { data: openaiMsg } = await supabase
            .from('chat_messages')
            .insert({
              session_id: resolvedSessionId,
              role: 'assistant',
              content: fullContent,
            })
            .select('id')
            .single()

          controller.enqueue(encodeChunk({ type: 'done', session_id: resolvedSessionId, message_id: openaiMsg?.id ?? null }))
        } catch (err) {
          const message = err instanceof Error ? err.message : 'Something went wrong'
          controller.enqueue(encodeChunk({ type: 'error', message }))
        } finally {
          controller.close()
        }
      },
    })

    return { stream, session_id: resolvedSessionId }
  } else if (provider === 'anthropic') {
    const anthropic = new Anthropic({ apiKey })

    const anthropicMessages: Anthropic.MessageParam[] = [
      ...messagesForAI,
      { role: 'user', content: message },
    ]

    const stream = new ReadableStream<Uint8Array>({
      async start(controller) {
        let fullContent = ''

        try {
          const streamObj = await anthropic.messages.create({
            model,
            max_tokens: 1024,
            system: systemPrompt,
            messages: anthropicMessages,
            stream: true,
          })

          for await (const event of streamObj) {
            if (
              event.type === 'content_block_delta' &&
              event.delta.type === 'text_delta'
            ) {
              const token = event.delta.text
              if (token) {
                fullContent += token
                controller.enqueue(encodeChunk({ type: 'token', content: token }))
              }
            }
          }

          // Save full assistant message after stream completes and capture its ID
          const { data: anthropicMsg } = await supabase
            .from('chat_messages')
            .insert({
              session_id: resolvedSessionId,
              role: 'assistant',
              content: fullContent,
            })
            .select('id')
            .single()

          controller.enqueue(encodeChunk({ type: 'done', session_id: resolvedSessionId, message_id: anthropicMsg?.id ?? null }))
        } catch (err) {
          const errMessage = err instanceof Error ? err.message : 'Something went wrong'
          controller.enqueue(encodeChunk({ type: 'error', message: errMessage }))
        } finally {
          controller.close()
        }
      },
    })

    return { stream, session_id: resolvedSessionId }
  } else {
    throw new Error(`Unsupported AI provider: ${provider}`)
  }
}
