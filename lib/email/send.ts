import { resend, FROM_ADDRESS, REPLY_TO } from './client'
import { render } from '@react-email/render'
import { createClient } from '@supabase/supabase-js'
import * as React from 'react'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

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
      reply_to: replyTo ?? REPLY_TO,
      subject,
      html,
    })

    // Log to email_log table
    supabaseAdmin.from('email_log').insert({
      recipient,
      subject,
      template_name: templateName,
      status: 'sent',
    }).then(() => {}).catch(() => {}) // fire-and-forget, don't fail on log error

    console.log('[email] sent:', subject, 'to', recipient)
    return { success: true, result }
  } catch (error) {
    console.error('[email] error:', error)

    supabaseAdmin.from('email_log').insert({
      recipient,
      subject,
      template_name: templateName,
      status: 'failed',
      error_message: String(error),
    }).then(() => {}).catch(() => {})

    return { success: false, error }
  }
}
