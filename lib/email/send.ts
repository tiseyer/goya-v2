import { resend, FROM_ADDRESS, REPLY_TO } from './client'
import { render } from '@react-email/render'
import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/supabase'
import * as React from 'react'
import { wrapInEmailLayout } from './wrapper'
import { DEFAULT_TEMPLATES } from './defaults'

let _supabaseAdmin: ReturnType<typeof createClient<Database>> | null = null
function getSupabaseAdmin() {
  if (!_supabaseAdmin) {
    _supabaseAdmin = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    )
  }
  return _supabaseAdmin
}

// ─── Email Sandbox ────────────────────────────────────────────────────────────

interface SandboxCache {
  enabled: boolean
  recipient: string
  fetchedAt: number
}

let _sandboxCache: SandboxCache | null = null
const SANDBOX_CACHE_TTL_MS = 30_000 // 30 seconds

async function applySandbox(
  to: string | string[],
  subject: string
): Promise<{ to: string | string[]; subject: string }> {
  const now = Date.now()

  // Use cached result if fresh
  if (!_sandboxCache || now - _sandboxCache.fetchedAt > SANDBOX_CACHE_TTL_MS) {
    const { data } = await getSupabaseAdmin()
      .from('site_settings')
      .select('key, value')
      .in('key', ['email_sandbox_enabled', 'email_sandbox_recipient'])

    const map: Record<string, string> = {}
    if (data) {
      ;(data as Array<{ key: string; value: string }>).forEach(r => {
        map[r.key] = r.value ?? ''
      })
    }

    _sandboxCache = {
      enabled: map.email_sandbox_enabled === 'true',
      recipient: map.email_sandbox_recipient ?? '',
      fetchedAt: now,
    }
  }

  if (!_sandboxCache.enabled || !_sandboxCache.recipient) {
    return { to, subject }
  }

  const originalTo = Array.isArray(to) ? to.join(', ') : to
  console.log(`[email] SANDBOX: redirecting email for ${originalTo} to ${_sandboxCache.recipient}`)

  return {
    to: _sandboxCache.recipient,
    subject: `[SANDBOX → ${originalTo}] ${subject}`,
  }
}

/**
 * Export applySandbox so other send sites (e.g. email-templates action) can use it.
 */
export { applySandbox }

/**
 * @deprecated Use sendEmailFromTemplate() instead.
 */
export async function sendEmail({
  to,
  subject,
  template,
  templateName,
  replyTo,
}: {
  to: string | string[]
  subject: string
  template: React.ReactElement
  templateName: string
  replyTo?: string
}) {
  let html: string
  try {
    html = await render(template)
  } catch (err) {
    console.error('Email render error:', err)
    return { success: false, error: err }
  }

  const recipient = Array.isArray(to) ? to.join(', ') : to

  try {
    const sandboxed = await applySandbox(to, subject)
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: sandboxed.to,
      replyTo: replyTo ?? REPLY_TO,
      subject: sandboxed.subject,
      html,
    })

    // Log to email_log table (fire-and-forget)
    void getSupabaseAdmin().from('email_log').insert({
      recipient,
      subject,
      template_name: templateName,
      status: 'sent',
    })

    console.log('[email] sent:', subject, 'to', recipient)
    return { success: true, result }
  } catch (error) {
    console.error('[email] error:', error)

    void getSupabaseAdmin().from('email_log').insert({
      recipient,
      subject,
      template_name: templateName,
      status: 'failed',
      error_message: String(error),
    })

    return { success: false, error }
  }
}

export async function sendEmailFromTemplate({
  to,
  templateKey,
  variables,
}: {
  to: string | string[]
  templateKey: string
  variables: Record<string, string>
}): Promise<{ success: boolean; reason?: string; error?: unknown }> {
  // 1. Fetch template from DB
  const { data: template } = await getSupabaseAdmin()
    .from('email_templates')
    .select('subject, html_content, is_active')
    .eq('template_key', templateKey)
    .single()

  // 2. If not found or inactive: return silently (no throw, no log noise)
  if (!template || template.is_active === false) {
    return { success: false, reason: 'template_inactive' }
  }

  // 3. If html_content is empty: use fallback from defaults
  const rawContent =
    template.html_content?.trim()
      ? template.html_content
      : (DEFAULT_TEMPLATES[templateKey]?.content ?? '')

  let subject = template.subject

  // 4. Variable substitution on both subject and content
  let content = rawContent
  for (const [key, value] of Object.entries(variables)) {
    const pattern = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    subject = subject.replace(pattern, value)
    content = content.replace(pattern, value)
  }

  // Strip any remaining unsubstituted placeholders
  subject = subject.replace(/\{\{[^}]+\}\}/g, '')
  content = content.replace(/\{\{[^}]+\}\}/g, '')

  // 5. Wrap in email layout
  const html = wrapInEmailLayout(content)

  const recipient = Array.isArray(to) ? to.join(', ') : to

  // 6. Send via Resend directly
  try {
    const sandboxed = await applySandbox(to, subject)
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to: sandboxed.to,
      replyTo: REPLY_TO,
      subject: sandboxed.subject,
      html,
    })

    // 7. Log to email_log
    void getSupabaseAdmin().from('email_log').insert({
      recipient,
      subject,
      template_name: templateKey,
      status: 'sent',
    })

    console.log('[email] sent template:', templateKey, 'to', recipient)
    return { success: true }
  } catch (error) {
    console.error('[email] template send error:', error)

    void getSupabaseAdmin().from('email_log').insert({
      recipient,
      subject,
      template_name: templateKey,
      status: 'failed',
      error_message: String(error),
    })

    return { success: false, error }
  }
}
