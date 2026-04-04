import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { getSupabaseService } from '@/lib/supabase/service'
import { decrypt } from '@/lib/secrets/encryption'
import { isAdminOrAbove } from '@/lib/roles'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export const runtime = 'nodejs'
export const maxDuration = 60

const FAQ_SYSTEM_PROMPT =
  'You are generating a concise, helpful FAQ answer for the GOYA yoga association platform. Answer the following user question clearly and professionally, in 2-4 sentences.'

function encodeChunk(data: Record<string, unknown>): Uint8Array {
  return new TextEncoder().encode(JSON.stringify(data) + '\n')
}

/**
 * POST /api/chatbot/generate-answer
 *
 * Admin-only endpoint. Generates a streaming FAQ answer for an unanswered question.
 *
 * Body: { question: string }
 *
 * Returns a stream of NDJSON lines:
 *   { type: 'token', content: string }
 *   { type: 'done' }
 *   { type: 'error', message: string }
 */
export async function POST(request: Request) {
  try {
    // 1. Auth guard — require admin role
    const supabase = await createSupabaseServerClient()
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const serviceClient = getSupabaseService()
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: profile } = await (serviceClient as any)
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single()

    if (!profile || !isAdminOrAbove(profile.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 })
    }

    // 2. Parse and validate body
    let body: { question?: unknown }
    try {
      body = await request.json()
    } catch {
      return Response.json({ error: 'Invalid JSON body' }, { status: 400 })
    }

    const { question } = body
    if (!question || typeof question !== 'string' || question.trim().length === 0) {
      return Response.json({ error: 'Question is required' }, { status: 400 })
    }

    // 3. Load chatbot_config
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: config, error: configError } = await (serviceClient as any)
      .from('chatbot_config')
      .select('*')
      .single()

    if (configError || !config) {
      return Response.json({ error: 'Chatbot configuration not found' }, { status: 500 })
    }

    if (!config.selected_key_id) {
      return Response.json({ error: 'No AI provider key configured' }, { status: 500 })
    }

    // 4. Load and decrypt the API key
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: secretRow, error: secretError } = await (serviceClient as any)
      .from('admin_secrets')
      .select('encrypted_value, iv, provider, model')
      .eq('id', config.selected_key_id)
      .single()

    if (secretError || !secretRow) {
      return Response.json({ error: 'AI provider key not found' }, { status: 500 })
    }

    const apiKey = decrypt(secretRow.encrypted_value, secretRow.iv)
    const provider = secretRow.provider as string
    const model = secretRow.model as string

    // 5. Build messages for AI
    const userQuestion = question.trim()

    // 6. Stream response based on provider
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey })

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            const completion = await openai.chat.completions.create({
              model,
              messages: [
                { role: 'system', content: FAQ_SYSTEM_PROMPT },
                { role: 'user', content: userQuestion },
              ],
              stream: true,
            })

            for await (const chunk of completion) {
              const token = chunk.choices[0]?.delta?.content ?? ''
              if (token) {
                controller.enqueue(encodeChunk({ type: 'token', content: token }))
              }
            }

            controller.enqueue(encodeChunk({ type: 'done' }))
          } catch (err) {
            const message = err instanceof Error ? err.message : 'Something went wrong'
            controller.enqueue(encodeChunk({ type: 'error', message }))
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } else if (provider === 'anthropic') {
      const anthropic = new Anthropic({ apiKey })

      const stream = new ReadableStream<Uint8Array>({
        async start(controller) {
          try {
            const streamObj = await anthropic.messages.create({
              model,
              max_tokens: 1024,
              system: FAQ_SYSTEM_PROMPT,
              messages: [{ role: 'user', content: userQuestion }],
              stream: true,
            })

            for await (const event of streamObj) {
              if (
                event.type === 'content_block_delta' &&
                event.delta.type === 'text_delta'
              ) {
                const token = event.delta.text
                if (token) {
                  controller.enqueue(encodeChunk({ type: 'token', content: token }))
                }
              }
            }

            controller.enqueue(encodeChunk({ type: 'done' }))
          } catch (err) {
            const errMessage = err instanceof Error ? err.message : 'Something went wrong'
            controller.enqueue(encodeChunk({ type: 'error', message: errMessage }))
          } finally {
            controller.close()
          }
        },
      })

      return new Response(stream, {
        status: 200,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    } else {
      return Response.json({ error: `Unsupported provider: ${provider}` }, { status: 500 })
    }
  } catch (err) {
    console.error('[generate-answer] Error:', err instanceof Error ? err.message : err)
    return Response.json({ error: 'Something went wrong' }, { status: 500 })
  }
}
