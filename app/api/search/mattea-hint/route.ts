import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { decrypt } from '@/lib/secrets/encryption'
import { getSupabaseService } from '@/lib/supabase/service'

const SYSTEM_PROMPT =
  "You are Mattea, the GOYA support assistant. Answer the following question in 2-3 sentences maximum. Be direct and helpful. If you don't know the answer, say so briefly. Do not use markdown formatting. Do not introduce yourself."

// Simple in-memory cache (60s TTL)
const cache = new Map<string, { answer: string; ts: number }>()
const CACHE_TTL = 60_000

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const question = body?.question

    if (!question || typeof question !== 'string' || question.trim().length < 4) {
      return NextResponse.json({ answer: null })
    }

    const key = question.trim().toLowerCase()

    // Check cache — return cached answer as a single-chunk stream
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(cached.answer, {
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseService() as any

    const { data: config, error: configErr } = await supabase
      .from('chatbot_config')
      .select('selected_key_id, is_active')
      .single()

    if (configErr || !config?.is_active || !config.selected_key_id) {
      return NextResponse.json({ answer: null })
    }

    const { data: secretRow, error: secretErr } = await supabase
      .from('admin_secrets')
      .select('encrypted_value, iv, provider, model')
      .eq('id', config.selected_key_id)
      .single()

    if (secretErr || !secretRow) {
      return NextResponse.json({ answer: null })
    }

    const apiKey = decrypt(secretRow.encrypted_value, secretRow.iv)
    const provider = secretRow.provider as string
    const model = secretRow.model as string

    const { data: faqRows } = await supabase
      .from('faq_items')
      .select('question, answer')
      .eq('status', 'published')

    let faqContext = ''
    if (faqRows && faqRows.length > 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const items = faqRows.map((item: any) => `Q: ${item.question}\nA: ${item.answer}`).join('\n\n')
      faqContext = `\n\nRelevant FAQ:\n${items}`
    }

    const systemPrompt = SYSTEM_PROMPT + faqContext
    const encoder = new TextEncoder()

    // Stream the AI response
    const stream = new ReadableStream({
      async start(controller) {
        let fullContent = ''

        try {
          if (provider === 'openai') {
            const openai = new OpenAI({ apiKey })
            const completion = await openai.chat.completions.create({
              model,
              max_tokens: 150,
              stream: true,
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: question.trim() },
              ],
            })

            for await (const chunk of completion) {
              const token = chunk.choices[0]?.delta?.content ?? ''
              if (token) {
                fullContent += token
                controller.enqueue(encoder.encode(token))
              }
            }
          } else if (provider === 'anthropic') {
            const anthropic = new Anthropic({ apiKey })
            const streamObj = await anthropic.messages.create({
              model,
              max_tokens: 150,
              stream: true,
              system: systemPrompt,
              messages: [{ role: 'user', content: question.trim() }],
            })

            for await (const event of streamObj) {
              if (event.type === 'content_block_delta' && event.delta.type === 'text_delta') {
                const token = event.delta.text
                if (token) {
                  fullContent += token
                  controller.enqueue(encoder.encode(token))
                }
              }
            }
          }

          // Cache the full answer
          if (fullContent) {
            cache.set(key, { answer: fullContent, ts: Date.now() })
          }
        } catch (err) {
          console.error('[mattea-hint] Stream error:', err)
        } finally {
          controller.close()
        }
      },
    })

    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    })
  } catch (err) {
    console.error('[mattea-hint] Unexpected error:', err)
    return NextResponse.json({ answer: null })
  }
}
