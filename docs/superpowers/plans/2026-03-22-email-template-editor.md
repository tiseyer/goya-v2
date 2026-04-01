# Email Template Editor Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a WYSIWYG email template editor in the GOYA admin backend that stores all transactional email templates in Supabase and replaces the existing React Email system.

**Architecture:** 10 templates stored in a new `email_templates` table; a new `sendEmailFromTemplate()` function fetches from DB, substitutes `{{variables}}`, wraps in the GOYA layout HTML, and sends via Resend. The admin editor at `/admin/email-templates/[key]` uses Tiptap for rich-text editing with live preview, variable chips, auto-save, and test email sending.

**Tech Stack:** Next.js App Router, Tiptap (rich text), Supabase (storage + RLS), Resend (email delivery), React Server Actions, Tailwind CSS.

---

## File Map

**New files:**
- `supabase/migrations/20260337_add_email_templates.sql` — DB table + RLS + seed
- `lib/email/wrapper.ts` — `wrapInEmailLayout(content)` → full HTML document
- `lib/email/defaults.ts` — `DEFAULT_TEMPLATES` record (subject + content for all 10)
- `lib/email/variables.ts` — `TEMPLATE_VARIABLES` record (chips + examples for all 10)
- `app/actions/email-templates.ts` — server actions: saveTemplate, toggleTemplateActive, initializeDefaultTemplates, sendTestEmail
- `app/admin/settings/components/EmailTemplatesList.tsx` — list view of all 10 templates
- `app/admin/email-templates/[key]/page.tsx` — full-page 3-column editor

**Modified files:**
- `lib/email/send.ts` — add `sendEmailFromTemplate()`, deprecate `sendEmail()`
- `app/admin/settings/page.tsx` — add 3rd tab "Email Templates"
- `app/api/email/welcome/route.ts` — migrate to sendEmailFromTemplate
- `app/api/email/onboarding-complete/route.ts` — migrate
- `app/api/email/verification-approved/route.ts` — migrate
- `app/api/email/verification-rejected/route.ts` — migrate
- `app/api/cron/admin-digest/route.ts` — migrate

**Deleted after migration:**
- `app/emails/WelcomeEmail.tsx`
- `app/emails/OnboardingCompleteEmail.tsx`
- `app/emails/VerificationApprovedEmail.tsx`
- `app/emails/VerificationRejectedEmail.tsx`
- `app/emails/AdminInboxDigestEmail.tsx`
- `app/emails/CreditsExpiringEmail.tsx`
- `app/emails/NewMessageEmail.tsx`
- `app/emails/SchoolApprovedEmail.tsx`
- `app/emails/SchoolRejectedEmail.tsx`
- `app/emails/layouts/` (entire directory)

---

## Task 1: Install Tiptap Dependencies

**Files:** `package.json`

- [ ] Run install:
```bash
cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2"
npm install @tiptap/react @tiptap/starter-kit @tiptap/extension-color @tiptap/extension-text-style @tiptap/extension-link @tiptap/extension-underline @tiptap/extension-text-align @tiptap/extension-placeholder
```
- [ ] Verify no peer dep errors in output.
- [ ] Commit:
```bash
git add package.json package-lock.json
git commit -m "deps: install Tiptap rich text editor packages"
```

---

## Task 2: Database Migration

**Files:** `supabase/migrations/20260337_add_email_templates.sql`

- [ ] Create the migration file:

```sql
-- supabase/migrations/20260337_add_email_templates.sql

CREATE TABLE public.email_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_key text NOT NULL UNIQUE,
  name text NOT NULL,
  description text,
  subject text NOT NULL,
  html_content text NOT NULL DEFAULT '',
  is_active boolean DEFAULT true,
  last_edited_by uuid REFERENCES auth.users(id),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;

-- Admins and moderators can CRUD
CREATE POLICY "Admins can manage email templates"
  ON public.email_templates
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- Auto-update updated_at (reuses existing trigger function)
CREATE TRIGGER update_email_templates_updated_at
  BEFORE UPDATE ON public.email_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Seed 10 template rows (empty html_content — populated via admin UI)
INSERT INTO public.email_templates (template_key, name, description, subject) VALUES
  ('welcome',               'Welcome Email',             'Sent immediately after a user registers',                        'Welcome to GOYA, {{firstName}}!'),
  ('onboarding_complete',   'Onboarding Complete',       'Sent after the user finishes the onboarding flow',               'Your GOYA profile is live!'),
  ('verification_approved', 'Verification Approved',     'Sent when an admin approves a teacher or wellness registration', '🎉 Your GOYA status has been verified!'),
  ('verification_rejected', 'Verification Rejected',     'Sent when an admin rejects a registration',                     'Update required on your GOYA registration'),
  ('credits_expiring',      'Credits Expiring',          'Sent 30 days before a user''s credits expire',                  '⚠️ Your GOYA credits are expiring soon'),
  ('new_message',           'New Message Notification',  'Sent when a user receives a direct message',                    '{{senderName}} sent you a message on GOYA'),
  ('school_approved',       'School Approved',           'Sent when a school registration is approved',                   '🏫 Your school is now live on GOYA!'),
  ('school_rejected',       'School Rejected',           'Sent when a school registration is rejected',                   'Update required on your school registration'),
  ('admin_digest',          'Admin Weekly Digest',       'Sent every Monday to admins with pending inbox summary',        'GOYA Admin: {{count}} items need your attention'),
  ('password_reset',        'Password Reset',            'Available for custom password reset flows',                     'Reset your GOYA password')
ON CONFLICT (template_key) DO NOTHING;
```

- [ ] Apply migration:
```bash
npx supabase db push
```
- [ ] Verify: no errors in output, confirm table exists.
- [ ] Commit:
```bash
git add supabase/migrations/20260337_add_email_templates.sql
git commit -m "feat: add email_templates table migration"
```

---

## Task 3: Email Layout Wrapper

**Files:** `lib/email/wrapper.ts`

- [ ] Create `lib/email/wrapper.ts`:

```typescript
export function wrapInEmailLayout(content: string): string {
  const year = new Date().getFullYear()
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
</head>
<body style="margin:0;padding:0;background-color:#f6f9fc;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f2044;">
    <tr>
      <td style="padding:24px;text-align:center;">
        <div style="color:white;font-size:28px;font-weight:bold;letter-spacing:2px;">GOYA</div>
        <div style="color:#94a3b8;font-size:12px;margin-top:4px;">Global Online Yoga Association</div>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table width="600" cellpadding="0" cellspacing="0" style="background:white;border-radius:8px;overflow:hidden;max-width:100%;">
          <tr>
            <td style="padding:40px 32px;color:#1e293b;font-size:15px;line-height:1.6;">
              ${content}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>

  <table width="100%" cellpadding="0" cellspacing="0">
    <tr>
      <td align="center" style="padding:24px;color:#94a3b8;font-size:12px;text-align:center;">
        <p style="margin:0 0 8px;">© ${year} Global Online Yoga Association. All rights reserved.</p>
        <p style="margin:0 0 8px;">Questions? Reply to this email or contact us at <a href="mailto:member@globalonlineyogaassociation.org" style="color:#94a3b8;">member@globalonlineyogaassociation.org</a></p>
        <p style="margin:0 0 8px;">
          <a href="https://globalonlineyogaassociation.org/privacy-policy" style="color:#94a3b8;">Privacy Policy</a> ·
          <a href="https://globalonlineyogaassociation.org/terms-of-use" style="color:#94a3b8;">Terms of Use</a> ·
          <a href="https://globalonlineyogaassociation.org/unsubscribe" style="color:#94a3b8;">Unsubscribe</a>
        </p>
        <p style="margin:0;font-size:11px;">GOYA · Canada · Sent in accordance with Canadian anti-spam legislation (CASL).</p>
      </td>
    </tr>
  </table>
</body>
</html>`
}
```

- [ ] Commit:
```bash
git add lib/email/wrapper.ts
git commit -m "feat: add email layout wrapper with GOYA header/footer"
```

---

## Task 4: Template Defaults & Variables

**Files:** `lib/email/defaults.ts`, `lib/email/variables.ts`

- [ ] Create `lib/email/defaults.ts`:

```typescript
export const DEFAULT_TEMPLATES: Record<string, { subject: string; content: string }> = {
  welcome: {
    subject: 'Welcome to GOYA, {{firstName}}!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Welcome, {{firstName}}! 🎉</h1>
<p>Your GOYA account has been created successfully.</p>
<p>Your Member Number (MRN) is: <strong>{{mrn}}</strong></p>
<p>GOYA connects yoga teachers, students, schools, and wellness practitioners from around the world. We're thrilled to have you as part of our community.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{loginUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Complete Your Profile →</a>
</p>`,
  },
  onboarding_complete: {
    subject: 'Your GOYA profile is live!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">You're all set, {{firstName}}!</h1>
<p>Your GOYA profile has been created. You are now a <strong>{{memberType}}</strong>.</p>
<p>Explore the Academy, connect with other members, and track your credits and hours — all in one place.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{dashboardUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Go to Dashboard →</a>
</p>`,
  },
  verification_approved: {
    subject: '🎉 Your GOYA status has been verified!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Congratulations, {{firstName}}! 🎉</h1>
<p>Your GOYA registration has been reviewed and <strong>approved</strong>.</p>
<p>Your designation: <strong>{{designation}}</strong></p>
<p>You are now a verified GOYA member. Your profile is live and visible in the member directory.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{profileUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">View Your Profile →</a>
</p>`,
  },
  verification_rejected: {
    subject: 'Update required on your GOYA registration',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Action Required, {{firstName}}</h1>
<p>Thank you for submitting your GOYA registration. After careful review, we were unable to approve your registration at this time.</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p>Please don't hesitate to reach out — we're happy to help you resolve any issues.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{contactUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Contact Us →</a>
</p>`,
  },
  credits_expiring: {
    subject: '⚠️ Your GOYA credits are expiring soon',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Your Credits Are Expiring, {{firstName}}</h1>
<p>This is a reminder that you have <strong>{{amount}} {{creditType}}</strong> expiring on <strong>{{expiryDate}}</strong>.</p>
<p>To maintain your membership status, please ensure you submit the required credits before they expire.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{submitUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Submit New Credits →</a>
</p>`,
  },
  new_message: {
    subject: '{{senderName}} sent you a message on GOYA',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">You have a new message, {{firstName}}</h1>
<p><strong>{{senderName}}</strong> sent you a message:</p>
<blockquote style="border-left:4px solid #14b8a6;padding:12px 16px;margin:16px 0;background:#f8fafc;border-radius:0 6px 6px 0;color:#475569;">{{messagePreview}}</blockquote>
<p style="text-align:center;margin-top:32px;">
  <a href="{{messagesUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Read Message →</a>
</p>`,
  },
  school_approved: {
    subject: '🏫 Your school is now live on GOYA!',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Your school is live, {{firstName}}! 🏫</h1>
<p><strong>{{schoolName}}</strong> has been approved and is now visible in the GOYA school directory.</p>
<p>Students and teachers from around the world can now discover your school and connect with your teachers.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{schoolUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">View Your School →</a>
</p>`,
  },
  school_rejected: {
    subject: 'Update required on your school registration',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Action Required, {{firstName}}</h1>
<p>Thank you for submitting <strong>{{schoolName}}</strong> to the GOYA directory. After review, we were unable to approve the registration at this time.</p>
<p><strong>Reason:</strong> {{reason}}</p>
<p>Please reply to this email if you have any questions or would like to appeal this decision.</p>`,
  },
  admin_digest: {
    subject: 'GOYA Admin: {{count}} items need your attention',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Weekly Admin Summary</h1>
<p>Here's what's waiting for your review in the GOYA admin inbox:</p>
<table style="width:100%;border-collapse:collapse;margin:16px 0;">
  <tr style="background:#f8fafc;">
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">📋 Pending Verifications</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingVerifications}}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">🏅 Pending Credit Submissions</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingCredits}}</td>
  </tr>
  <tr style="background:#f8fafc;">
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">🏫 Pending School Registrations</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingSchools}}</td>
  </tr>
  <tr>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;">✉️ New Contact Messages</td>
    <td style="padding:12px 16px;border:1px solid #e2e8f0;font-weight:bold;text-align:right;">{{pendingContacts}}</td>
  </tr>
</table>
<p style="text-align:center;margin-top:32px;">
  <a href="{{inboxUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Go to Inbox →</a>
</p>`,
  },
  password_reset: {
    subject: 'Reset your GOYA password',
    content: `<h1 style="color:#0f2044;margin:0 0 16px;">Password Reset Request</h1>
<p>Hi {{firstName}},</p>
<p>We received a request to reset your GOYA password. Click the button below to create a new password. This link expires in <strong>{{expiryMinutes}} minutes</strong>.</p>
<p style="text-align:center;margin-top:32px;">
  <a href="{{resetUrl}}" style="display:inline-block;background-color:#14b8a6;color:white;padding:12px 32px;border-radius:6px;text-decoration:none;font-weight:bold;">Reset Password →</a>
</p>
<p style="color:#94a3b8;font-size:13px;margin-top:24px;">If you didn't request a password reset, you can safely ignore this email.</p>`,
  },
}
```

- [ ] Create `lib/email/variables.ts`:

```typescript
export const TEMPLATE_VARIABLES: Record<string, Array<{ key: string; label: string; example: string }>> = {
  welcome: [
    { key: 'firstName',  label: 'First Name',    example: 'Sarah'                          },
    { key: 'mrn',        label: 'Member Number', example: '12345678'                        },
    { key: 'loginUrl',   label: 'Login URL',     example: 'https://goya.community/login'   },
  ],
  onboarding_complete: [
    { key: 'firstName',     label: 'First Name',   example: 'Sarah'                              },
    { key: 'memberType',    label: 'Member Type',  example: 'Certified Teacher'                  },
    { key: 'dashboardUrl',  label: 'Dashboard URL',example: 'https://goya.community/dashboard'   },
  ],
  verification_approved: [
    { key: 'firstName',    label: 'First Name',   example: 'Sarah'                                     },
    { key: 'designation',  label: 'Designation',  example: 'GOYA CYT200'                              },
    { key: 'profileUrl',   label: 'Profile URL',  example: 'https://goya.community/members/123'        },
  ],
  verification_rejected: [
    { key: 'firstName',    label: 'First Name',        example: 'Sarah'                                                  },
    { key: 'reason',       label: 'Rejection Reason',  example: 'Certificate could not be verified'                     },
    { key: 'contactUrl',   label: 'Contact URL',       example: 'mailto:member@globalonlineyogaassociation.org'          },
  ],
  credits_expiring: [
    { key: 'firstName',    label: 'First Name',          example: 'Sarah'               },
    { key: 'amount',       label: 'Credit Amount',       example: '25'                  },
    { key: 'creditType',   label: 'Credit Type',         example: 'CE Credits'          },
    { key: 'expiryDate',   label: 'Expiry Date',         example: 'April 19, 2026'      },
    { key: 'submitUrl',    label: 'Submit Credits URL',  example: 'https://goya.community/credits' },
  ],
  new_message: [
    { key: 'firstName',       label: 'First Name',      example: 'Sarah'                                            },
    { key: 'senderName',      label: 'Sender Name',     example: 'Michael Torres'                                   },
    { key: 'messagePreview',  label: 'Message Preview', example: 'Hi Sarah, I wanted to reach out about...'        },
    { key: 'messagesUrl',     label: 'Messages URL',    example: 'https://goya.community/messages'                  },
  ],
  school_approved: [
    { key: 'firstName',   label: 'First Name',   example: 'Sarah'                                             },
    { key: 'schoolName',  label: 'School Name',  example: 'Zen Yoga Studio'                                   },
    { key: 'schoolUrl',   label: 'School URL',   example: 'https://goya.community/schools/zen-yoga-studio'    },
  ],
  school_rejected: [
    { key: 'firstName',   label: 'First Name',        example: 'Sarah'                              },
    { key: 'schoolName',  label: 'School Name',       example: 'Zen Yoga Studio'                   },
    { key: 'reason',      label: 'Rejection Reason',  example: 'Incomplete information provided'   },
  ],
  admin_digest: [
    { key: 'count',                 label: 'Total Pending',            example: '12'  },
    { key: 'pendingVerifications',  label: 'Pending Verifications',    example: '4'   },
    { key: 'pendingCredits',        label: 'Pending Credits',          example: '6'   },
    { key: 'pendingSchools',        label: 'Pending Schools',          example: '1'   },
    { key: 'pendingContacts',       label: 'Pending Contacts',         example: '1'   },
    { key: 'inboxUrl',              label: 'Inbox URL',                example: 'https://goya.community/admin/inbox' },
  ],
  password_reset: [
    { key: 'firstName',      label: 'First Name',  example: 'Sarah'                                                },
    { key: 'resetUrl',       label: 'Reset URL',   example: 'https://goya.community/reset-password?token=...'     },
    { key: 'expiryMinutes',  label: 'Link Expiry', example: '60'                                                   },
  ],
}
```

- [ ] Commit:
```bash
git add lib/email/defaults.ts lib/email/variables.ts
git commit -m "feat: add email template defaults and variable definitions"
```

---

## Task 5: Update send.ts — Add sendEmailFromTemplate

**Files:** `lib/email/send.ts`

- [ ] Read the current `lib/email/send.ts` in full, then add the new function. The key additions:
  1. Import `wrapInEmailLayout` and `DEFAULT_TEMPLATES`
  2. Create a service role client (separate from the existing `supabaseAdmin` — use the same pattern already in the file)
  3. Add `sendEmailFromTemplate`

- [ ] Add to `lib/email/send.ts` (after existing imports and before `sendEmail`):

```typescript
import { wrapInEmailLayout } from './wrapper'
import { DEFAULT_TEMPLATES } from './defaults'
import { getResend, FROM_ADDRESS, REPLY_TO } from './client'

// Service role client for reading templates (bypasses RLS)
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function sendEmailFromTemplate({
  to,
  templateKey,
  variables,
}: {
  to: string | string[]
  templateKey: string
  variables: Record<string, string>
}): Promise<{ success: boolean; reason?: string }> {
  const { data: template } = await serviceClient
    .from('email_templates')
    .select('subject, html_content, is_active')
    .eq('template_key', templateKey)
    .single()

  if (!template || !template.is_active) {
    console.log(`[email] template '${templateKey}' not found or inactive, skipping`)
    return { success: false, reason: 'template_inactive' }
  }

  // Fall back to hardcoded default if html_content is empty
  const rawContent = template.html_content?.trim()
    ? template.html_content
    : (DEFAULT_TEMPLATES[templateKey]?.content ?? '')

  // Substitute {{variables}}
  let subject = template.subject
  let content = rawContent
  for (const [key, value] of Object.entries(variables)) {
    const re = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
    subject = subject.replace(re, value ?? '')
    content = content.replace(re, value ?? '')
  }

  const html = wrapInEmailLayout(content)
  const recipient = Array.isArray(to) ? to.join(', ') : to

  try {
    const resend = getResend()
    const result = await resend.emails.send({
      from: FROM_ADDRESS,
      to,
      replyTo: REPLY_TO,
      subject,
      html,
    })

    void serviceClient.from('email_log').insert({
      recipient,
      subject,
      template_name: templateKey,
      status: 'sent',
    })

    console.log('[email] sent:', subject, 'to', recipient)
    return { success: true, ...result }
  } catch (error) {
    console.error('[email] sendEmailFromTemplate error:', error)

    void serviceClient.from('email_log').insert({
      recipient,
      subject,
      template_name: templateKey,
      status: 'failed',
      error_message: String(error),
    })

    return { success: false, reason: String(error) }
  }
}
```

- [ ] Also mark the existing `sendEmail` with a `@deprecated` JSDoc comment at its definition line.

- [ ] **REQUIRED:** Read `lib/email/send.ts` before editing. If `supabaseAdmin` is already created with the service role key, reuse it — do NOT create a second `const serviceClient = createClient(...)` with the same credentials. Just rename `supabaseAdmin` references or alias it: `const serviceClient = supabaseAdmin`.

- [ ] Commit:
```bash
git add lib/email/send.ts
git commit -m "feat: add sendEmailFromTemplate() — DB-driven email sending"
```

---

## Task 6: Server Actions

**Files:** `app/actions/email-templates.ts`

- [ ] Create `app/actions/email-templates.ts`:

```typescript
'use server'

import { createSupabaseServerClient } from '@/lib/supabaseServer'
import { createClient } from '@supabase/supabase-js'
import { DEFAULT_TEMPLATES } from '@/lib/email/defaults'
import { TEMPLATE_VARIABLES } from '@/lib/email/variables'
import { wrapInEmailLayout } from '@/lib/email/wrapper'
import { getResend, FROM_ADDRESS, REPLY_TO } from '@/lib/email/client'
import { revalidatePath } from 'next/cache'

// Service role client
const serviceClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

async function assertAdmin() {
  const supabase = await createSupabaseServerClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Unauthorized')
  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()
  if (!profile || !['admin', 'moderator'].includes(profile.role)) {
    throw new Error('Forbidden')
  }
  return user
}

export async function saveTemplate(
  key: string,
  subject: string,
  htmlContent: string
): Promise<void> {
  const user = await assertAdmin()
  await serviceClient
    .from('email_templates')
    .update({
      subject,
      html_content: htmlContent,
      last_edited_by: user.id,
      updated_at: new Date().toISOString(),
    })
    .eq('template_key', key)
  revalidatePath('/admin/settings')
}

export async function toggleTemplateActive(
  key: string,
  isActive: boolean
): Promise<void> {
  await assertAdmin()
  await serviceClient
    .from('email_templates')
    .update({ is_active: isActive })
    .eq('template_key', key)
}

export async function initializeDefaultTemplates(): Promise<void> {
  await assertAdmin()
  for (const [key, tpl] of Object.entries(DEFAULT_TEMPLATES)) {
    // Only fill rows with empty html_content
    await serviceClient
      .from('email_templates')
      .update({ html_content: tpl.content, subject: tpl.subject })
      .eq('template_key', key)
      .eq('html_content', '')
  }
  revalidatePath('/admin/settings')
}

export async function sendTestEmail(
  key: string,
  toAddress: string,
  currentSubject: string,
  currentContent: string
): Promise<{ success: boolean; error?: string }> {
  await assertAdmin()

  const vars = TEMPLATE_VARIABLES[key] ?? []
  const examples: Record<string, string> = {}
  for (const v of vars) {
    examples[v.key] = v.example
  }

  let subject = currentSubject
  let content = currentContent
  for (const [k, v] of Object.entries(examples)) {
    const re = new RegExp(`\\{\\{${k}\\}\\}`, 'g')
    subject = subject.replace(re, v)
    content = content.replace(re, v)
  }

  const html = wrapInEmailLayout(content)

  try {
    const resend = getResend()
    await resend.emails.send({
      from: FROM_ADDRESS,
      to: toAddress,
      replyTo: REPLY_TO,
      subject: `[TEST] ${subject}`,
      html,
    })
    return { success: true }
  } catch (error) {
    return { success: false, error: String(error) }
  }
}
```

- [ ] Commit:
```bash
git add app/actions/email-templates.ts
git commit -m "feat: add email template server actions"
```

---

## Task 7: EmailTemplatesList Component

**Files:** `app/admin/settings/components/EmailTemplatesList.tsx`

- [ ] Create `app/admin/settings/components/EmailTemplatesList.tsx`:

```tsx
'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { toggleTemplateActive, initializeDefaultTemplates } from '@/app/actions/email-templates'

interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  subject: string
  html_content: string
  is_active: boolean
  updated_at: string | null
}

function SkeletonRow() {
  return (
    <div className="flex items-center justify-between py-4 px-5 animate-pulse">
      <div className="flex-1 space-y-2">
        <div className="h-4 w-40 bg-slate-200 rounded" />
        <div className="h-3 w-64 bg-slate-100 rounded" />
        <div className="h-3 w-52 bg-slate-100 rounded" />
      </div>
      <div className="flex items-center gap-3 shrink-0">
        <div className="h-4 w-20 bg-slate-100 rounded" />
        <div className="h-6 w-11 bg-slate-200 rounded-full" />
        <div className="h-8 w-14 bg-slate-200 rounded-lg" />
      </div>
    </div>
  )
}

export default function EmailTemplatesList() {
  const router = useRouter()
  const [templates, setTemplates] = useState<EmailTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [initializing, setInitializing] = useState(false)
  const [initDone, setInitDone] = useState(false)
  const [togglingKey, setTogglingKey] = useState<string | null>(null)

  useEffect(() => {
    supabase
      .from('email_templates')
      .select('*')
      .order('name')
      .then(({ data }) => {
        setTemplates((data as EmailTemplate[]) ?? [])
        setLoading(false)
      })
  }, [])

  const hasEmpty = templates.some(t => !t.html_content?.trim())

  async function handleToggle(key: string, current: boolean) {
    setTogglingKey(key)
    // Optimistic update
    setTemplates(prev =>
      prev.map(t => t.template_key === key ? { ...t, is_active: !current } : t)
    )
    await toggleTemplateActive(key, !current)
    setTogglingKey(null)
  }

  async function handleInitialize() {
    setInitializing(true)
    await initializeDefaultTemplates()
    // Refresh list
    const { data } = await supabase.from('email_templates').select('*').order('name')
    setTemplates((data as EmailTemplate[]) ?? [])
    setInitializing(false)
    setInitDone(true)
    setTimeout(() => setInitDone(false), 3000)
  }

  function formatDate(iso: string | null) {
    if (!iso) return 'Never edited'
    return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
  }

  return (
    <div className="space-y-4">
      {/* Header row */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">
          Manage transactional email templates. Toggle active/inactive to control sending.
        </p>
        {!loading && hasEmpty && (
          <button
            onClick={handleInitialize}
            disabled={initializing || initDone}
            className="text-xs px-3 py-1.5 border border-slate-300 rounded-lg text-slate-600 hover:border-slate-400 hover:text-slate-800 transition-colors disabled:opacity-60"
          >
            {initializing
              ? 'Initializing...'
              : initDone
              ? 'All templates initialized ✓'
              : 'Initialize Default Content'}
          </button>
        )}
      </div>

      {/* Template list */}
      <div className="bg-white rounded-xl border border-[#E5E7EB] shadow-sm overflow-hidden divide-y divide-slate-100">
        {loading
          ? [1, 2, 3, 4, 5].map(i => <SkeletonRow key={i} />)
          : templates.map(t => (
            <div key={t.template_key} className="flex items-center justify-between py-4 px-5 hover:bg-slate-50 transition-colors">
              {/* Left: info */}
              <div className="flex-1 min-w-0 pr-6">
                <p className="text-sm font-semibold text-[#1B3A5C]">{t.name}</p>
                {t.description && (
                  <p className="text-xs text-slate-500 mt-0.5">{t.description}</p>
                )}
                <p className="text-xs text-slate-400 italic mt-0.5 truncate max-w-md">{t.subject}</p>
              </div>

              {/* Right: date + toggle + edit */}
              <div className="flex items-center gap-4 shrink-0">
                <span className="text-xs text-slate-400 whitespace-nowrap">
                  {formatDate(t.updated_at)}
                </span>

                {/* Active toggle */}
                <button
                  role="switch"
                  aria-checked={t.is_active}
                  disabled={togglingKey === t.template_key}
                  onClick={() => handleToggle(t.template_key, t.is_active)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none disabled:opacity-60 ${
                    t.is_active ? 'bg-emerald-500' : 'bg-slate-300'
                  }`}
                  title={t.is_active ? 'Active — emails will send' : 'Inactive — emails skipped'}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    t.is_active ? 'translate-x-6' : 'translate-x-1'
                  }`} />
                </button>

                {/* Edit button */}
                <button
                  onClick={() => router.push(`/admin/email-templates/${t.template_key}`)}
                  className="text-xs px-3 py-1.5 bg-[#1B3A5C] text-white rounded-lg hover:bg-[#152e4a] transition-colors font-medium"
                >
                  Edit
                </button>
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}
```

- [ ] Commit:
```bash
git add app/admin/settings/components/EmailTemplatesList.tsx
git commit -m "feat: add EmailTemplatesList component for admin settings"
```

---

## Task 8: Add Email Templates Tab to Admin Settings

**Files:** `app/admin/settings/page.tsx`

- [ ] Read the bottom of the file (lines 706–744) to confirm the tab structure.

- [ ] Make these three targeted edits:

**Edit 1** — add the import after the existing imports (NEVER above the `'use client'` directive — it must stay the first line):
```typescript
import EmailTemplatesList from './components/EmailTemplatesList';
```

**Edit 2** — extend the Tab type and TABS array:
```typescript
// Change:
type Tab = 'general' | 'analytics';
const TABS: { key: Tab; label: string }[] = [
  { key: 'general',   label: 'General'   },
  { key: 'analytics', label: 'Analytics' },
];

// To:
type Tab = 'general' | 'analytics' | 'email-templates';
const TABS: { key: Tab; label: string }[] = [
  { key: 'general',         label: 'General'          },
  { key: 'analytics',       label: 'Analytics'        },
  { key: 'email-templates', label: 'Email Templates'  },
];
```

**Edit 3** — add the tab render:
```typescript
// After: {tab === 'analytics' && <AnalyticsTab />}
// Add:
{tab === 'email-templates' && <EmailTemplatesList />}
```

- [ ] Commit:
```bash
git add app/admin/settings/page.tsx
git commit -m "feat: add Email Templates tab to admin settings"
```

---

## Task 9: Email Template Editor Page

**Files:** `app/admin/email-templates/[key]/page.tsx`

- [ ] Create directory: `app/admin/email-templates/[key]/`

- [ ] Create `app/admin/email-templates/[key]/page.tsx` — this is the largest file. Write it in full:

```tsx
'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { Color } from '@tiptap/extension-color'
import TextStyle from '@tiptap/extension-text-style'
import { Link as TiptapLink } from '@tiptap/extension-link'
import Underline from '@tiptap/extension-underline'
import TextAlign from '@tiptap/extension-text-align'
import Placeholder from '@tiptap/extension-placeholder'
import { supabase } from '@/lib/supabase'
import { saveTemplate, sendTestEmail } from '@/app/actions/email-templates'
import { DEFAULT_TEMPLATES } from '@/lib/email/defaults'
import { TEMPLATE_VARIABLES } from '@/lib/email/variables'
import { wrapInEmailLayout } from '@/lib/email/wrapper'

// ─── Types ────────────────────────────────────────────────────────────────────

interface EmailTemplate {
  id: string
  template_key: string
  name: string
  description: string | null
  subject: string
  html_content: string
  is_active: boolean
  updated_at: string | null
}

// ─── Variable substitution helper ─────────────────────────────────────────────

function substituteVars(text: string, key: string): string {
  const vars = TEMPLATE_VARIABLES[key] ?? []
  let result = text
  for (const v of vars) {
    result = result.replace(new RegExp(`\\{\\{${v.key}\\}\\}`, 'g'), v.example)
  }
  return result
}

// ─── Toolbar button ───────────────────────────────────────────────────────────

function ToolbarBtn({
  active,
  onClick,
  title,
  children,
}: {
  active?: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onMouseDown={e => { e.preventDefault(); onClick() }}
      title={title}
      className={`w-8 h-8 flex items-center justify-center rounded text-sm transition-colors ${
        active
          ? 'bg-[#1B3A5C] text-white'
          : 'text-slate-600 hover:bg-slate-100'
      }`}
    >
      {children}
    </button>
  )
}

// ─── Color presets ────────────────────────────────────────────────────────────

const COLOR_PRESETS = ['#0f2044', '#14b8a6', '#9e6b7a', '#ffffff', '#64748b', '#1e293b']

function ColorPicker({ onSelect }: { onSelect: (color: string) => void }) {
  const [open, setOpen] = useState(false)
  return (
    <div className="relative">
      <button
        type="button"
        onMouseDown={e => { e.preventDefault(); setOpen(o => !o) }}
        title="Text color"
        className="w-8 h-8 flex items-center justify-center rounded text-slate-600 hover:bg-slate-100 transition-colors text-xs font-bold"
      >
        A
      </button>
      {open && (
        <div className="absolute top-9 left-0 bg-white border border-slate-200 rounded-lg shadow-lg p-2 flex gap-1.5 z-20">
          {COLOR_PRESETS.map(c => (
            <button
              key={c}
              type="button"
              onMouseDown={e => { e.preventDefault(); onSelect(c); setOpen(false) }}
              className="w-5 h-5 rounded-full border border-slate-200 hover:scale-110 transition-transform"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      )}
    </div>
  )
}

// ─── Reset confirmation dialog ────────────────────────────────────────────────

function ResetDialog({ onConfirm, onCancel }: { onConfirm: () => void; onCancel: () => void }) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-sm w-full mx-4">
        <h3 className="text-base font-semibold text-[#1B3A5C] mb-2">Reset to Default?</h3>
        <p className="text-sm text-slate-500 mb-5">
          This will replace the current content with the original default template. You can still undo by closing without saving.
        </p>
        <div className="flex gap-3 justify-end">
          <button onClick={onCancel} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button onClick={onConfirm} className="px-4 py-2 text-sm text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors font-medium">
            Reset
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Send Test Modal ──────────────────────────────────────────────────────────

function SendTestModal({
  templateKey,
  currentSubject,
  currentContent,
  adminEmail,
  onClose,
}: {
  templateKey: string
  currentSubject: string
  currentContent: string
  adminEmail: string
  onClose: () => void
}) {
  const [toAddress, setToAddress] = useState(adminEmail)
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<string | null>(null)
  const subjectPreview = substituteVars(currentSubject, templateKey)

  async function handleSend() {
    if (!toAddress.includes('@')) return
    setSending(true)
    const r = await sendTestEmail(templateKey, toAddress, currentSubject, currentContent)
    setSending(false)
    if (r.success) {
      setResult(`Test email sent to ${toAddress} ✓`)
      setTimeout(onClose, 2000)
    } else {
      setResult(`Failed to send: ${r.error}`)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h3 className="text-base font-semibold text-[#1B3A5C] mb-4">Send Test Email</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1">Send to</label>
            <input
              type="email"
              value={toAddress}
              onChange={e => setToAddress(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/30 focus:border-[#14b8a6]"
            />
          </div>

          <div className="bg-slate-50 rounded-lg p-3 text-xs text-slate-500">
            All variables will be replaced with example values for the test.
            <div className="mt-1.5 font-medium text-slate-700 truncate">Subject: {subjectPreview}</div>
          </div>

          {result && (
            <p className={`text-sm font-medium ${result.includes('Failed') ? 'text-red-600' : 'text-emerald-600'}`}>
              {result}
            </p>
          )}
        </div>

        <div className="flex gap-3 justify-end mt-5">
          <button onClick={onClose} className="px-4 py-2 text-sm text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors">
            Cancel
          </button>
          <button
            onClick={handleSend}
            disabled={sending || !toAddress.includes('@')}
            className="px-4 py-2 text-sm text-white bg-[#14b8a6] rounded-lg hover:bg-[#0d9488] transition-colors font-medium disabled:opacity-60"
          >
            {sending ? 'Sending...' : 'Send Test'}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function EmailTemplateEditorPage() {
  const params = useParams()
  const router = useRouter()
  const templateKey = params.key as string

  const [template, setTemplate] = useState<EmailTemplate | null>(null)
  const [loading, setLoading] = useState(true)
  const [subject, setSubject] = useState('')
  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [saveError, setSaveError] = useState(false)
  const [toast, setToast] = useState<string | null>(null)
  const [showReset, setShowReset] = useState(false)
  const [showTestModal, setShowTestModal] = useState(false)
  const [previewWithExamples, setPreviewWithExamples] = useState(true)
  const [adminEmail, setAdminEmail] = useState('')
  const subjectRef = useRef<HTMLInputElement>(null)
  const isSavingRef = useRef(false)
  const lastSavedContentRef = useRef('')
  const lastSavedSubjectRef = useRef('')

  // Load template
  useEffect(() => {
    async function load() {
      const { data } = await supabase
        .from('email_templates')
        .select('*')
        .eq('template_key', templateKey)
        .single()

      if (!data) {
        router.push('/admin/settings#email-templates')
        return
      }

      setTemplate(data as EmailTemplate)
      setSubject(data.subject)
      lastSavedSubjectRef.current = data.subject
      lastSavedContentRef.current = data.html_content ?? ''
      setLoading(false)
    }

    // Get admin email
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) setAdminEmail(user.email)
    })

    load()
  }, [templateKey, router])

  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      Underline,
      TiptapLink.configure({ openOnClick: false }),
      TextAlign.configure({ types: ['heading', 'paragraph'] }),
      Placeholder.configure({ placeholder: 'Start writing your email content here...' }),
    ],
    content: '',
    onUpdate: () => setIsDirty(true),
  })

  // Set editor content once template loads
  useEffect(() => {
    if (editor && template && !editor.isDestroyed) {
      const content = template.html_content?.trim()
        ? template.html_content
        : (DEFAULT_TEMPLATES[templateKey]?.content ?? '')
      editor.commands.setContent(content)
      lastSavedContentRef.current = content
    }
  }, [editor, template, templateKey])

  // Auto-save every 30 seconds
  useEffect(() => {
    const timer = setInterval(async () => {
      if (!isDirty || !editor || isSavingRef.current) return
      const content = editor.getHTML()
      if (content === lastSavedContentRef.current && subject === lastSavedSubjectRef.current) return
      await performSave(content, subject)
    }, 30000)
    return () => clearInterval(timer)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, editor, subject, performSave])

  // Unsaved changes guard
  useEffect(() => {
    function onBeforeUnload(e: BeforeUnloadEvent) {
      if (isDirty) e.preventDefault()
    }
    window.addEventListener('beforeunload', onBeforeUnload)
    return () => window.removeEventListener('beforeunload', onBeforeUnload)
  }, [isDirty])

  const performSave = useCallback(async (content: string, subj: string) => {
    if (isSavingRef.current) return
    isSavingRef.current = true
    setIsSaving(true)
    setSaveError(false)
    try {
      await saveTemplate(templateKey, subj, content)
      lastSavedContentRef.current = content
      lastSavedSubjectRef.current = subj
      setIsDirty(false)
      setToast('Template saved ✓')
      setTimeout(() => setToast(null), 3000)
    } catch {
      setSaveError(true)
    } finally {
      isSavingRef.current = false
      setIsSaving(false)
    }
  }, [templateKey])

  function handleSave() {
    if (!editor) return
    performSave(editor.getHTML(), subject)
  }

  function handleReset() {
    const def = DEFAULT_TEMPLATES[templateKey]
    if (!def || !editor) return
    editor.commands.setContent(def.content)
    setSubject(def.subject)
    setIsDirty(true)
    setShowReset(false)
  }

  function insertVariable(varKey: string) {
    const text = `{{${varKey}}}`
    // Try to insert into editor at current cursor
    if (editor && !editor.isDestroyed) {
      editor.chain().focus().insertContent(text).run()
    }
  }

  // Build preview HTML
  const previewHtml = (() => {
    if (!editor) return ''
    let content = editor.getHTML()
    let subj = subject
    if (previewWithExamples) {
      content = substituteVars(content, templateKey)
      subj = substituteVars(subj, templateKey)
    }
    return wrapInEmailLayout(content)
  })()

  const vars = TEMPLATE_VARIABLES[templateKey] ?? []

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-[#14b8a6] border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!template) return null

  return (
    <div className="flex flex-col h-screen overflow-hidden">
      {/* Top sticky bar */}
      <div className="shrink-0 flex items-center justify-between px-5 py-3 bg-white border-b border-slate-200 z-10">
        <Link href="/admin/settings" className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-[#1B3A5C] transition-colors">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Templates
        </Link>

        <span className="text-sm font-semibold text-[#1B3A5C]">{template.name}</span>

        <div className="flex items-center gap-2">
          {isSaving && <span className="text-xs text-slate-400">Saving...</span>}
          {saveError && <span className="text-xs text-red-500">Save failed</span>}
          {toast && <span className="text-xs text-emerald-600 font-medium">{toast}</span>}

          <button
            onClick={() => setShowReset(true)}
            className="text-xs px-3 py-1.5 text-red-500 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
          >
            Reset to Default
          </button>
          <button
            onClick={() => setShowTestModal(true)}
            className="text-xs px-3 py-1.5 text-[#14b8a6] border border-[#14b8a6] rounded-lg hover:bg-[#14b8a6]/5 transition-colors"
          >
            Send Test Email
          </button>
          <button
            onClick={handleSave}
            disabled={isSaving}
            className="text-xs px-4 py-1.5 bg-[#14b8a6] text-white rounded-lg hover:bg-[#0d9488] transition-colors font-semibold disabled:opacity-60"
          >
            Save Template
          </button>
        </div>
      </div>

      {/* 3-column layout */}
      <div className="flex flex-1 overflow-hidden">

        {/* LEFT PANEL — 280px */}
        <div className="w-[280px] shrink-0 border-r border-slate-200 bg-white overflow-y-auto flex flex-col gap-5 p-5">
          <div>
            <h2 className="text-sm font-bold text-[#1B3A5C]">{template.name}</h2>
            {template.description && (
              <p className="text-xs text-slate-500 mt-1">{template.description}</p>
            )}
          </div>

          {/* Subject */}
          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Email Subject</label>
            <input
              ref={subjectRef}
              type="text"
              value={subject}
              onChange={e => { setSubject(e.target.value); setIsDirty(true) }}
              className="w-full px-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#14b8a6]/30 focus:border-[#14b8a6]"
            />
            {/* Variable chips for subject */}
            <div className="flex flex-wrap gap-1 mt-2">
              {vars.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => {
                    const input = subjectRef.current
                    if (!input) return
                    const start = input.selectionStart ?? subject.length
                    const end = input.selectionEnd ?? subject.length
                    const newVal = subject.slice(0, start) + `{{${v.key}}}` + subject.slice(end)
                    setSubject(newVal)
                    setIsDirty(true)
                  }}
                  className="text-[10px] px-1.5 py-0.5 border border-[#14b8a6]/40 text-[#0d9488] rounded hover:bg-[#14b8a6]/10 transition-colors font-mono"
                >
                  {`{{${v.key}}}`}
                </button>
              ))}
            </div>
          </div>

          {/* Variables list */}
          <div>
            <p className="text-xs font-medium text-slate-600 mb-1">Available Variables</p>
            <p className="text-[10px] text-slate-400 mb-2">Click to insert at editor cursor</p>
            <div className="space-y-1.5">
              {vars.map(v => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  title={`Example: ${v.example}`}
                  className="w-full text-left group"
                >
                  <span className="block text-[11px] px-2 py-1 border border-[#14b8a6]/40 text-[#0d9488] rounded-md hover:bg-[#14b8a6]/10 transition-colors font-mono">
                    {`{{${v.key}}}`}
                  </span>
                  <span className="block text-[10px] text-slate-400 ml-1 mt-0.5">{v.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* CENTER — editor */}
        <div className="flex-1 flex flex-col overflow-hidden bg-slate-50">
          {/* Toolbar */}
          {editor && (
            <div className="shrink-0 bg-white border-b border-slate-200 px-3 py-2 space-y-1">
              {/* Row 1 */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <ToolbarBtn active={editor.isActive('bold')} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
                  <strong>B</strong>
                </ToolbarBtn>
                <ToolbarBtn active={editor.isActive('italic')} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
                  <em>I</em>
                </ToolbarBtn>
                <ToolbarBtn active={editor.isActive('underline')} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
                  <span className="underline">U</span>
                </ToolbarBtn>
                <ToolbarBtn active={editor.isActive('strike')} onClick={() => editor.chain().focus().toggleStrike().run()} title="Strikethrough">
                  <span className="line-through">S</span>
                </ToolbarBtn>

                <span className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarBtn active={editor.isActive('heading', { level: 1 })} onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} title="Heading 1">H1</ToolbarBtn>
                <ToolbarBtn active={editor.isActive('heading', { level: 2 })} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading 2">H2</ToolbarBtn>
                <ToolbarBtn active={editor.isActive('heading', { level: 3 })} onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} title="Heading 3">H3</ToolbarBtn>
                <ToolbarBtn active={editor.isActive('paragraph')} onClick={() => editor.chain().focus().setParagraph().run()} title="Paragraph">¶</ToolbarBtn>

                <span className="w-px h-5 bg-slate-200 mx-1" />

                <ColorPicker onSelect={color => editor.chain().focus().setColor(color).run()} />
              </div>

              {/* Row 2 */}
              <div className="flex items-center gap-0.5 flex-wrap">
                <ToolbarBtn active={editor.isActive({ textAlign: 'left' })} onClick={() => editor.chain().focus().setTextAlign('left').run()} title="Align left">←</ToolbarBtn>
                <ToolbarBtn active={editor.isActive({ textAlign: 'center' })} onClick={() => editor.chain().focus().setTextAlign('center').run()} title="Align center">≡</ToolbarBtn>
                <ToolbarBtn active={editor.isActive({ textAlign: 'right' })} onClick={() => editor.chain().focus().setTextAlign('right').run()} title="Align right">→</ToolbarBtn>

                <span className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarBtn active={editor.isActive('bulletList')} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">•</ToolbarBtn>
                <ToolbarBtn active={editor.isActive('orderedList')} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">1.</ToolbarBtn>

                <span className="w-px h-5 bg-slate-200 mx-1" />

                <ToolbarBtn active={editor.isActive('link')} onClick={() => {
                  const url = window.prompt('URL')
                  if (url) editor.chain().focus().setLink({ href: url, target: '_blank' }).run()
                }} title="Insert link">🔗</ToolbarBtn>

                <ToolbarBtn active={false} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Horizontal rule">—</ToolbarBtn>
              </div>
            </div>
          )}

          {/* Editor canvas */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="max-w-[600px] mx-auto bg-white border border-slate-200 shadow-sm rounded-sm min-h-[400px]">
              <style>{`
                .tiptap { padding: 32px; min-height: 400px; outline: none; font-size: 15px; line-height: 1.6; color: #1e293b; }
                .tiptap p.is-editor-empty:first-child::before { content: attr(data-placeholder); color: #94a3b8; pointer-events: none; float: left; height: 0; }
                .tiptap h1 { font-size: 24px; font-weight: bold; color: #0f2044; margin: 0 0 12px; }
                .tiptap h2 { font-size: 20px; font-weight: bold; color: #0f2044; margin: 0 0 10px; }
                .tiptap h3 { font-size: 16px; font-weight: bold; color: #0f2044; margin: 0 0 8px; }
                .tiptap p { margin: 0 0 12px; }
                .tiptap ul, .tiptap ol { padding-left: 24px; margin: 0 0 12px; }
                .tiptap a { color: #14b8a6; text-decoration: underline; }
                .tiptap hr { border: none; border-top: 1px solid #e2e8f0; margin: 24px 0; }
              `}</style>
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>

        {/* RIGHT PANEL — preview */}
        <div className="w-[320px] shrink-0 border-l border-slate-200 bg-white flex flex-col overflow-hidden">
          <div className="shrink-0 flex items-center justify-between px-4 py-3 border-b border-slate-100">
            <span className="text-xs font-semibold text-[#1B3A5C]">Preview</span>
            <label className="flex items-center gap-1.5 cursor-pointer">
              <input
                type="checkbox"
                checked={previewWithExamples}
                onChange={e => setPreviewWithExamples(e.target.checked)}
                className="w-3.5 h-3.5 accent-[#14b8a6]"
              />
              <span className="text-[10px] text-slate-500">Show with example data</span>
            </label>
          </div>
          <div className="flex-1 overflow-y-auto">
            {/* Scale 600px email into 320px panel: 320/600 = 0.533, compensated width = 100/0.533 = 187.5% */}
          <div
              className="text-[11px] leading-relaxed origin-top-left"
              style={{ transform: 'scale(0.533)', width: '187.5%', transformOrigin: 'top left' }}
              dangerouslySetInnerHTML={{ __html: previewHtml }}
            />
          </div>
        </div>
      </div>

      {/* Modals */}
      {showReset && (
        <ResetDialog onConfirm={handleReset} onCancel={() => setShowReset(false)} />
      )}
      {showTestModal && (
        <SendTestModal
          templateKey={templateKey}
          currentSubject={subject}
          currentContent={editor?.getHTML() ?? ''}
          adminEmail={adminEmail}
          onClose={() => setShowTestModal(false)}
        />
      )}
    </div>
  )
}
```

- [ ] Commit:
```bash
git add "app/admin/email-templates/[key]/page.tsx"
git commit -m "feat: add email template editor page with Tiptap, live preview, auto-save"
```

---

## Task 10: Migrate Existing Email Routes

**Files:** `app/api/email/welcome/route.ts`, `app/api/email/onboarding-complete/route.ts`, `app/api/email/verification-approved/route.ts`, `app/api/email/verification-rejected/route.ts`, `app/api/cron/admin-digest/route.ts`

- [ ] Update `app/api/email/welcome/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { sendEmailFromTemplate } from '@/lib/email/send'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { userId } = await req.json()
    const supabase = await createSupabaseServerClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, full_name, mrn')
      .eq('id', userId)
      .single()

    if (!profile?.email) return NextResponse.json({ error: 'No profile' }, { status: 404 })

    const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'there'

    await sendEmailFromTemplate({
      to: profile.email,
      templateKey: 'welcome',
      variables: {
        firstName,
        mrn: profile.mrn ?? '',
        loginUrl: 'https://goya.community/login',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] Update `app/api/email/onboarding-complete/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { sendEmailFromTemplate } from '@/lib/email/send'
import { createSupabaseServerClient } from '@/lib/supabaseServer'

export async function POST(req: Request) {
  try {
    const { userId, memberType } = await req.json()
    const supabase = await createSupabaseServerClient()

    const { data: profile } = await supabase
      .from('profiles')
      .select('email, first_name, full_name')
      .eq('id', userId)
      .single()

    if (!profile?.email) return NextResponse.json({ error: 'No profile' }, { status: 404 })

    const firstName = profile.first_name || profile.full_name?.split(' ')[0] || 'there'

    await sendEmailFromTemplate({
      to: profile.email,
      templateKey: 'onboarding_complete',
      variables: {
        firstName,
        memberType: memberType ?? 'member',
        dashboardUrl: 'https://goya.community/dashboard',
      },
    })

    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] Update `app/api/email/verification-approved/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { sendEmailFromTemplate } from '@/lib/email/send'

export async function POST(req: Request) {
  try {
    const { email, firstName, designation } = await req.json()
    await sendEmailFromTemplate({
      to: email,
      templateKey: 'verification_approved',
      variables: {
        firstName,
        designation: designation ?? '',
        profileUrl: 'https://goya.community/members',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] Update `app/api/email/verification-rejected/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { sendEmailFromTemplate } from '@/lib/email/send'

export async function POST(req: Request) {
  try {
    const { email, firstName, reason } = await req.json()
    await sendEmailFromTemplate({
      to: email,
      templateKey: 'verification_rejected',
      variables: {
        firstName,
        reason: reason ?? '',
        contactUrl: 'mailto:member@globalonlineyogaassociation.org',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
```

- [ ] Update `app/api/cron/admin-digest/route.ts`:

```typescript
import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import { sendEmailFromTemplate } from '@/lib/email/send'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export async function GET(req: Request) {
  const authHeader = req.headers.get('authorization')
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { count: pendingVerifications } = await supabase
    .from('profiles')
    .select('*', { count: 'exact', head: true })
    .eq('verification_status', 'pending')

  const { data: admins } = await supabase
    .from('profiles')
    .select('email')
    .eq('role', 'admin')
    .not('email', 'is', null)

  const total = pendingVerifications ?? 0

  if (total === 0) {
    console.log('[cron] admin-digest: nothing to report')
    return NextResponse.json({ ok: true, message: 'Nothing to report' })
  }

  for (const admin of admins ?? []) {
    if (!admin.email) continue
    await sendEmailFromTemplate({
      to: admin.email,
      templateKey: 'admin_digest',
      variables: {
        count: String(total),
        pendingVerifications: String(pendingVerifications ?? 0),
        pendingCredits: '0',
        pendingSchools: '0',
        pendingContacts: '0',
        inboxUrl: 'https://goya.community/admin/inbox',
      },
    })
  }

  return NextResponse.json({ ok: true, sent: admins?.length ?? 0 })
}
```

- [ ] Commit:
```bash
git add app/api/email/welcome/route.ts \
        app/api/email/onboarding-complete/route.ts \
        app/api/email/verification-approved/route.ts \
        app/api/email/verification-rejected/route.ts \
        app/api/cron/admin-digest/route.ts
git commit -m "feat: migrate all email routes to sendEmailFromTemplate"
```

---

## Task 11: Delete Old React Email Components

**Files:** `app/emails/` directory

- [ ] Verify no remaining imports of `@/app/emails/` before deleting:
```bash
grep -r "from '@/app/emails/'" "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2/app" --include="*.ts" --include="*.tsx"
```
Expected: no output (all routes already migrated in Task 10).

- [ ] Delete the old React Email components:
```bash
rm -rf "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2/app/emails"
```

- [ ] Note: `lib/email/send.ts` retains `import { render } from '@react-email/render'` for the deprecated `sendEmail()`. This is intentional — the function is kept as a safety net. Do NOT remove the `@react-email/render` import or the `sendEmail` function body in this task.

- [ ] Commit:
```bash
git add -A
git commit -m "chore: remove old React Email template components"
```

---

## Task 12: Push to develop

- [ ] Push all commits:
```bash
cd "/Users/tillseyer/Library/Mobile Documents/com~apple~CloudDocs/Documents/Claude/GOYA v2"
git push origin develop
```

- [ ] Verify Vercel build passes (no TypeScript or missing-import errors).

---

## Manual Verification Checklist

After the build is green:

1. Go to `/admin/settings` → "Email Templates" tab → 10 templates listed
2. Click "Initialize Default Content" → all 10 get HTML, button disappears
3. Click "Edit" on Welcome Email → editor page opens with content loaded
4. Edit heading text → right panel updates in real time
5. Toggle "Show with example data" off → `{{firstName}}` appears raw
6. Click variable chip `{{mrn}}` → inserted at editor cursor
7. Click "Send Test Email" → modal opens with admin email pre-filled → send → email arrives with GOYA header/footer
8. Click "Save Template" → toast "Template saved ✓"
9. Navigate away with unsaved changes → browser prompts
10. Click "Reset to Default" → confirmation → editor resets
11. Toggle a template to Inactive → `is_active = false` in DB
12. Trigger welcome email (register test user) → email arrives using DB template
13. Auto-save fires after 30s of inactivity with unsaved changes → "Saving..." appears
