import { resend, FROM_ADDRESS, REPLY_TO } from './client'
import { render } from '@react-email/render'
import { createClient } from '@supabase/supabase-js'
import * as React from 'react'
import { wrapInEmailLayout } from './wrapper'
import { DEFAULT_TEMPLATES } from './defaults'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      replyTo: replyTo ?? REPLY_TO,
      subject,
      html,
    })

    // Log to email_log table (fire-and-forget)
    void supabaseAdmin.from('email_log').insert({
      recipient,
      subject,
      template_name: templateName,
      status: 'sent',
    })

    console.log('[email] sent:', subject, 'to', recipient)
    return { success: true, result }
  } catch (error) {
    console.error('[email] error:', error)

    void supabaseAdmin.from('email_log').insert({
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
  const { data: template } = await supabaseAdmin
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

  // 5. Wrap in email layout
  const html = wrapInEmailLayout(content)

  const recipient = Array.isArray(to) ? to.join(', ') : to

  // 6. Send via Resend directly
  try {
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
    })

    // 7. Log to email_log
    void supabaseAdmin.from('email_log').insert({
      recipient,
      subject,
      template_name: templateKey,
      status: 'sent',
    })

    console.log('[email] sent template:', templateKey, 'to', recipient)
    return { success: true }
  } catch (error) {
    console.error('[email] template send error:', error)

    void supabaseAdmin.from('email_log').insert({
      recipient,
      subject,
      template_name: templateKey,
      status: 'failed',
      error_message: String(error),
    })

    return { success: false, error }
  }
}
