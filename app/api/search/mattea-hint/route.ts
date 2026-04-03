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

    // Check cache
    const cached = cache.get(key)
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return NextResponse.json({ answer: cached.answer })
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const supabase = getSupabaseService() as any

    // Load chatbot config
    const { data: config, error: configErr } = await supabase
      .from('chatbot_config')
      .select('selected_key_id, is_active')
      .single()

    if (configErr || !config?.is_active || !config.selected_key_id) {
      console.error('[mattea-hint] Config issue:', { configErr, config })
      return NextResponse.json({ answer: null })
    }

    // Get AI provider key
    const { data: secretRow, error: secretErr } = await supabase
      .from('admin_secrets')
      .select('encrypted_value, iv, provider, model')
      .eq('id', config.selected_key_id)
      .single()

    if (secretErr || !secretRow) {
      console.error('[mattea-hint] Secret issue:', { secretErr })
      return NextResponse.json({ answer: null })
    }

    const apiKey = decrypt(secretRow.encrypted_value, secretRow.iv)
    const provider = secretRow.provider as string
    const model = secretRow.model as string

    // Load FAQ context for better answers
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

    let answer: string | null = null

    try {
      if (provider === 'openai') {
        const openai = new OpenAI({ apiKey })
        const completion = await openai.chat.completions.create({
          model,
          max_tokens: 150,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: question.trim() },
          ],
        })
        answer = completion.choices[0]?.message?.content?.trim() ?? null
      } else if (provider === 'anthropic') {
        const anthropic = new Anthropic({ apiKey })
        const response = await anthropic.messages.create({
          model,
          max_tokens: 150,
          system: systemPrompt,
          messages: [{ role: 'user', content: question.trim() }],
        })
        const block = response.content[0]
        answer = block.type === 'text' ? block.text.trim() : null
      }
    } catch (aiErr) {
      console.error('[mattea-hint] AI call error:', aiErr)
      return NextResponse.json({ answer: null })
    }

    // Cache successful answers
    if (answer) {
      cache.set(key, { answer, ts: Date.now() })
    }

    return NextResponse.json({ answer })
  } catch (err) {
    console.error('[mattea-hint] Unexpected error:', err)
    return NextResponse.json({ answer: null })
  }
}
