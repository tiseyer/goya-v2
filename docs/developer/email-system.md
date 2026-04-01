---
title: Email System
audience: ["developer"]
section: developer
order: 7
last_updated: "2026-03-31"
---

# Email System

GOYA v2 sends transactional email via Resend. Templates are stored in the database and editable by admins without a code deploy. All sends are logged to `email_log`.

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Resend Client](#resend-client)
- [Sending Email](#sending-email)
  - [sendEmailFromTemplate (preferred)](#sendemailfromtemplate-preferred)
  - [sendEmail (legacy)](#sendemail-legacy)
- [Template System](#template-system)
  - [DB Templates](#db-templates)
  - [Variable Substitution](#variable-substitution)
  - [HTML Layout Wrapper](#html-layout-wrapper)
  - [Fallback Defaults](#fallback-defaults)
- [Email Sandbox (dev/staging)](#email-sandbox-devstaging)
- [Email Log](#email-log)
- [Adding a New Email Template](#adding-a-new-email-template)

---

## Architecture Overview

```
Server Action / Route Handler
        │
        ▼
sendEmailFromTemplate()          ← lib/email/send.ts
        │
        ├── Fetch template from DB (email_templates table)
        ├── Substitute {{variables}} in subject + content
        ├── Wrap content in wrapInEmailLayout()
        ├── Apply sandbox redirect (if enabled)
        └── resend.emails.send()
                │
                ├── Log result to email_log table
                └── Return { success, reason?, error? }
```

---

## Resend Client

`lib/email/client.ts` exports a lazy-initialised Resend singleton. The client is only instantiated on first call, so a missing `RESEND_API_KEY` does not crash the build — it throws at send time.

```ts
FROM_ADDRESS = 'hello@globalonlineyogaassociation.org'
REPLY_TO     = 'member@globalonlineyogaassociation.org'
```

---

## Sending Email

### sendEmailFromTemplate (preferred)

Use this for all new code. It reads the template from the database, performs variable substitution, wraps the HTML, and sends via Resend.

```ts
import { sendEmailFromTemplate } from '@/lib/email/send'

await sendEmailFromTemplate({
  to: 'member@example.com',
  templateKey: 'welcome_member',
  variables: {
    first_name: 'Priya',
    login_url: 'https://app.goya.org/sign-in',
  },
})
```

**Return value:**

```ts
{
  success: boolean
  reason?: 'template_inactive'   // Template not found or disabled — silently skipped
  error?: unknown                // Resend API or render error
}
```

If `template_inactive` is returned, no error is logged and no exception is thrown. This is intentional — disabled templates should fail silently.

---

### sendEmail (legacy)

`@deprecated` — accepts a React Email `template` prop. Do not use for new templates. It still works but bypasses the DB-driven template system.

---

## Template System

### DB Templates

Templates live in the `email_templates` table:

| Column | Description |
|---|---|
| `template_key` | Unique string identifier e.g. `welcome_member`, `verification_approved` |
| `subject` | Email subject line — supports `{{variables}}` |
| `html_content` | HTML body content — supports `{{variables}}` |
| `is_active` | Set to `false` to disable a template without deleting it |

Templates are managed from the admin panel at `/admin/email-templates`.

### Variable Substitution

Both `subject` and `html_content` support `{{variable_name}}` placeholders. These are replaced by the `variables` object passed to `sendEmailFromTemplate`.

```html
<!-- Template html_content -->
<p>Hi {{first_name}},</p>
<p>Your verification has been approved. <a href="{{login_url}}">Sign in</a></p>
```

Any `{{placeholder}}` that has no matching key in `variables` is stripped (replaced with empty string) before sending.

### HTML Layout Wrapper

`lib/email/wrapper.ts` exports `wrapInEmailLayout(content: string): string`. It wraps any HTML fragment in a full email document with:

- GOYA branded header (dark navy `#0f2044` background with wordmark)
- White content card (600px max-width, responsive)
- Footer with copyright, contact email, Privacy Policy, Terms of Use, and Unsubscribe links

`sendEmailFromTemplate` automatically wraps content before sending. You do not need to call `wrapInEmailLayout` manually.

### Fallback Defaults

`lib/email/defaults.ts` exports `DEFAULT_TEMPLATES` — a record of `templateKey → { content: string }`. If a template row exists in the DB but `html_content` is empty, the fallback content is used. This allows templates to exist in the DB (for admin editing) before content has been written.

---

## Email Sandbox (dev/staging)

To avoid sending real emails during development or QA, the email sandbox intercepts all outgoing sends and redirects them to a configured address.

**Controlled via `site_settings`:**

| Key | Value |
|---|---|
| `email_sandbox_enabled` | `"true"` to activate |
| `email_sandbox_recipient` | Address to redirect all sends to |

When active, every email is redirected and the subject is prefixed with `[SANDBOX → original@address.com]`. The sandbox state is cached for 30 seconds to avoid repeated DB queries.

**Set from the admin panel at** `/admin/settings`.

---

## Email Log

Every send attempt (success or failure) is recorded in `email_log`:

| Column | Value |
|---|---|
| `recipient` | Original intended recipient (before sandbox) |
| `subject` | Original subject (before sandbox) |
| `template_name` | `templateKey` or legacy template name |
| `status` | `sent` or `failed` |
| `error_message` | Populated on failure |

Log is viewable from `/admin/email-templates` (email log tab).

---

## Adding a New Email Template

1. **Insert a row** into `email_templates` via a new migration file or the admin panel:

   ```sql
   INSERT INTO email_templates (template_key, subject, html_content, is_active)
   VALUES (
     'course_enrollment_confirmed',
     'You''re enrolled in {{course_title}}',
     '<p>Hi {{first_name}},</p><p>You''ve been enrolled in <strong>{{course_title}}</strong>.</p>',
     true
   );
   ```

2. **Add a fallback** in `lib/email/defaults.ts` (optional but recommended):

   ```ts
   export const DEFAULT_TEMPLATES: Record<string, { content: string }> = {
     course_enrollment_confirmed: {
       content: '<p>You have been enrolled in a new course.</p>',
     },
     // ...
   }
   ```

3. **Send the email** from your Server Action or route handler:

   ```ts
   await sendEmailFromTemplate({
     to: user.email,
     templateKey: 'course_enrollment_confirmed',
     variables: {
       first_name: profile.full_name ?? 'Member',
       course_title: course.title,
     },
   })
   ```

4. **Test** by enabling the email sandbox in dev settings and confirming the send in email log.

---

## See Also

- [database-schema.md](./database-schema.md) — `email_templates` and `email_log` table schemas
- [deployment.md](./deployment.md) — `RESEND_API_KEY` environment variable
- [contributing.md](./contributing.md) — When to use Server Actions vs route handlers
