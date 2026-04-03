import { NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { decrypt } from '@/lib/secrets/encryption'
import { getSupabaseService } from '@/lib/supabase/service'

const SYSTEM_PROMPT =
  'You are Mattea, the GOYA support assistant. Answer the following question in 2-3 sentences maximum. Be direct and helpful. If you don\'t know the answer, say so briefly. Do not use markdown formatting. Do not introduce yourself.'

// Simple in-memory cache (60s TTL)
const cache = new Map<string, { answer: string; expires: number }>()

export async function POST(req: Request) {
  try {
    const { question } = (await req.json()) as { question?: string }
    if (!question || question.trim().length < 4) {
      return NextResponse.json({ answer: null })
    }

    const cacheKey = question.trim().toLowerCase()
    const cached = cache.get(cacheKey)
    if (cached && cached.expires > Date.now()) {
      return NextResponse.json({ answer: cached.answer })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseService() as any

    // Load chatbot config to get the AI provider key
    const { data: config } = await supabase
      .from('chatbot_config')
      .select('selected_key_id, is_active')
      .single()

    if (!config?.is_active || !config.selected_key_id) {
      return NextResponse.json({ answer: null })
    }

    const { data: secretRow } = await supabase
      .from('admin_secrets')
      .select('encrypted_value, iv, provider, model')
      .eq('id', config.selected_key_id)
      .single()

    if (!secretRow) {
      return NextResponse.json({ answer: null })
    }

    const apiKey = decrypt(secretRow.encrypted_value, secretRow.iv)
    const provider = secretRow.provider as string
    const model = secretRow.model as string

    // Load FAQ context
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

    // Call AI with 3s timeout
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)

    let answer: string | null = null

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey })
        const completion = await openai.chat.completions.create(
          {
            model,
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: question },
            ],
            max_tokens: 150,
          },
          { signal: controller.signal },
        )
        answer = completion.choices[0]?.message?.content?.trim() ?? null
      } else if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey })
        const response = await anthropic.messages.create(
          {
            model,
            max_tokens: 150,
            system: systemPrompt,
            messages: [{ role: 'user', content: question }],
          },
          { signal: controller.signal },
        )
        const block = response.content[0]
        answer = block.type === 'text' ? block.text.trim() : null
      }
    } catch {
      // Timeout or API error — return null gracefully
      return NextResponse.json({ answer: null })
    } finally {
      clearTimeout(timeout)
    }

    // Cache for 60s
    if (answer) {
      cache.set(cacheKey, { answer, expires: Date.now() + 60_000 })
    }

    return NextResponse.json({ answer })
  } catch {
    return NextResponse.json({ answer: null })
  }
}
