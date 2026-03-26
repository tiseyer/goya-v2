'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { resend, FROM_ADDRESS, REPLY_TO } from '@/lib/email/client'
import { wrapInEmailLayout } from '@/lib/email/wrapper'
import { TEMPLATE_VARIABLES } from '@/lib/email/variables'
import { DEFAULT_TEMPLATES } from '@/lib/email/defaults'

async function requireAdminOrModerator() {
  const supabase = await createSupabaseServerClient()
  const { data: { user }, error: authError } = await supabase.auth.getUser()
  if (authError || !user) throw new Error('Unauthorized')
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (profileError) throw new Error('Failed to verify role')
  if (!profile || !['admin', 'moderator'].includes(profile.role)) throw new Error('Forbidden')
  return { supabase, user }
}

export async function saveTemplate(
  key: string,
  subject: string,
  htmlContent: string,
): Promise<void> {
  const { supabase, user } = await requireAdminOrModerator()

  const { error } = await supabase
    .from('email_templates')
    .upsert(
      {
        template_key: key,
        subject,
        html_content: htmlContent,
        updated_at: new Date().toISOString(),
        last_edited_by: user.id,
      },
      { onConflict: 'template_key' },
    )

  if (error) throw new Error(`Failed to save template: ${error.message}`)
}

export async function toggleTemplateActive(
  key: string,
  isActive: boolean,
): Promise<void> {
  const { supabase } = await requireAdminOrModerator()

  const { error } = await supabase
    .from('email_templates')
    .update({ is_active: isActive })
    .eq('template_key', key)

  if (error) throw new Error(`Failed to toggle template: ${error.message}`)
}

export async function initializeDefaultTemplates(): Promise<void> {
  const { supabase } = await requireAdminOrModerator()

  // Fetch all existing templates
  const { data: existingTemplates, error: fetchError } = await supabase
    .from('email_templates')
    .select('template_key, html_content')

  if (fetchError) throw new Error(`Failed to fetch templates: ${fetchError.message}`)

  const existingMap = new Map(
    (existingTemplates ?? []).map((t) => [t.template_key, t.html_content]),
  )

  for (const [key, defaults] of Object.entries(DEFAULT_TEMPLATES)) {
    const existingContent = existingMap.get(key)
    const hasContent = existingContent && existingContent.trim() !== ''

    if (!hasContent) {
      // Upsert: create or update only the content if it is empty/blank
      const { error } = await supabase
        .from('email_templates')
        .upsert(
          {
            template_key: key,
            name: key,
            subject: defaults.subject,
            html_content: defaults.content,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'template_key' },
        )

      if (error) {
        throw new Error(`Failed to initialize template "${key}": ${error.message}`)
      }
    }
  }
}

export async function sendTestEmail(
  key: string,
  toAddress: string,
  currentSubject: string,
  currentContent: string,
): Promise<{ success: boolean; error?: string }> {
  try {
    await requireAdminOrModerator()

    const variables = TEMPLATE_VARIABLES[key] ?? []

    // Substitute all variables with their example values
    let subject = currentSubject
    let content = currentContent
    for (const variable of variables) {
      const placeholder = new RegExp(`\\{\\{${variable.key}\\}\\}`, 'g')
      subject = subject.replace(placeholder, variable.example)
      content = content.replace(placeholder, variable.example)
    }

    const html = wrapInEmailLayout(content)

    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      replyTo: REPLY_TO,
      to: toAddress,
      subject: `[TEST] ${subject}`,
      html,
    })

    if (error) return { success: false, error: error.message }
    return { success: true }
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) }
  }
}
