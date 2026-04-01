import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { resend, FROM_ADDRESS, REPLY_TO } from '@/lib/email/client'
import { wrapInEmailLayout } from '@/lib/email/wrapper'
import { applySandbox } from '@/lib/email/send'
import { TEMPLATE_VARIABLES } from '@/lib/email/variables'
import { DEFAULT_TEMPLATES } from '@/lib/email/defaults'

async function requireAdmin(req: NextRequest) {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) {
    return { error: 'Unauthorized', status: 401 }
  }
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    return { error: 'Forbidden', status: 403 }
  }
  return { user, supabase }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin(req)
  if ('error' in auth) {
    return NextResponse.json({ success: false, error: auth.error }, { status: auth.status })
  }

  const body = await req.json()
  const { recipient, templateKey } = body as { recipient?: string; templateKey?: string }

  if (!recipient || typeof recipient !== 'string') {
    return NextResponse.json({ success: false, error: 'Recipient email is required' }, { status: 400 })
  }

  try {
    let subject: string
    let html: string

    if (!templateKey || templateKey === 'simple') {
      // Simple test email
      subject = 'Test from GOYA'
      html = wrapInEmailLayout(
        '<h1 style="color:#0f2044;margin:0 0 16px;">Test Email</h1>' +
        '<p>Hello, this is a test email from the GOYA platform.</p>' +
        '<p style="color:#94a3b8;font-size:13px;margin-top:24px;">If you received this email, your email configuration is working correctly.</p>'
      )
    } else {
      // Template-based test email
      const { data: template } = await auth.supabase
        .from('email_templates')
        .select('subject, html_content')
        .eq('template_key', templateKey)
        .single()

      if (!template) {
        return NextResponse.json({ success: false, error: 'Template not found' }, { status: 404 })
      }

      const rawContent = template.html_content?.trim()
        ? template.html_content
        : (DEFAULT_TEMPLATES[templateKey]?.content ?? '')

      subject = template.subject
      let content = rawContent

      // Substitute variables with example values
      const variables = TEMPLATE_VARIABLES[templateKey] ?? []
      for (const variable of variables) {
        const placeholder = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g')
        subject = subject.replace(placeholder, variable.example)
        content = content.replace(placeholder, variable.example)
      }

      // Strip remaining placeholders
      subject = subject.replace(/\{\{[^}]+\}\}/g, '')
      content = content.replace(/\{\{[^}]+\}\}/g, '')

      html = wrapInEmailLayout(content)
      subject = `[TEST] ${subject}`
    }

    const sandboxed = await applySandbox(recipient, subject)
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: sandboxed.to,
      subject: sandboxed.subject,
      html,
    })

    if (error) {
      return NextResponse.json({ success: false, error: error.message })
    }

    return NextResponse.json({ success: true })
  } catch (err) {
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : 'Unknown error',
    })
  }
}
