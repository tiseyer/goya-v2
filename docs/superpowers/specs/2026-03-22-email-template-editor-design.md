# Email Template Editor — Design Spec
Date: 2026-03-22

## Overview

A visual WYSIWYG email template editor built into the GOYA admin backend. Admins can create and edit transactional email templates directly in the browser using a Tiptap rich-text editor, preview them with real example data, and send test emails. Templates are stored in Supabase and used at send-time by a new `sendEmailFromTemplate()` function that replaces the existing React Email system.

---

## Goals

- 10 transactional email templates editable without code changes
- WYSIWYG editing with live preview (GOYA header/footer included)
- Variable insertion (`{{firstName}}` etc.) via clickable chips
- Test email send from the editor
- Templates can be toggled active/inactive — inactive templates silently skip sending
- Reset to hardcoded defaults at any time
- Auto-save every 30 seconds
- Replace the existing React Email (`@react-email/render`) system entirely

---

## Database

**New table: `public.email_templates`**

| Column | Type | Notes |
|---|---|---|
| `id` | uuid | PK |
| `template_key` | text | Unique, e.g. `welcome` |
| `name` | text | Display name |
| `description` | text | Short description |
| `subject` | text | Email subject, may contain `{{variables}}` |
| `html_content` | text | Body HTML only (no header/footer) |
| `is_active` | boolean | If false, sending is silently skipped |
| `last_edited_by` | uuid | FK → auth.users |
| `created_at` | timestamptz | |
| `updated_at` | timestamptz | Auto-updated via trigger |

**RLS:**
- Admins and moderators can read/write (via profiles.role check)
- Service role can read (for email sending)

**Seed:** 10 rows inserted on migration with empty `html_content` (populated via "Initialize Default Content" button or via defaults on first edit).

**Migration file:** `supabase/migrations/20260337_add_email_templates.sql`

---

## The 10 Templates

| key | name |
|---|---|
| `welcome` | Welcome Email |
| `onboarding_complete` | Onboarding Complete |
| `verification_approved` | Verification Approved |
| `verification_rejected` | Verification Rejected |
| `credits_expiring` | Credits Expiring |
| `new_message` | New Message Notification |
| `school_approved` | School Approved |
| `school_rejected` | School Rejected |
| `admin_digest` | Admin Weekly Digest |
| `password_reset` | Password Reset |

---

## Email Infrastructure (`lib/email/`)

### `lib/email/wrapper.ts`
Exports `wrapInEmailLayout(content: string): string`. Wraps body HTML in the full GOYA email HTML (dark navy header with GOYA/Global Online Yoga Association, white content card, footer with © year, privacy/terms/unsubscribe links, CASL notice).

### `lib/email/defaults.ts`
Exports `DEFAULT_TEMPLATES: Record<string, { subject: string; content: string }>` with hardcoded default subject and HTML body for all 10 templates. Used for Reset and for "Initialize Default Content".

### `lib/email/variables.ts`
Exports `TEMPLATE_VARIABLES: Record<string, { key: string; label: string; example: string }[]>` — variable definitions per template used for chip rendering and example-data substitution in preview.

### `lib/email/send.ts` — changes
- **New function: `sendEmailFromTemplate()`** — fetches template from DB, replaces `{{variables}}`, wraps in layout, calls Resend directly (no React Email render step).
- **Existing `sendEmail()`** — kept as-is for now but no longer called from any trigger point.
- All existing callers of `sendEmail()` are updated to call `sendEmailFromTemplate()` instead.
- Old React Email template components in `app/emails/` are deleted.

```typescript
// New signature
export async function sendEmailFromTemplate({
  to,
  templateKey,
  variables,
}: {
  to: string | string[]
  templateKey: string
  variables: Record<string, string>
}): Promise<{ success: boolean; reason?: string }>
```

If template is not found or `is_active = false`, returns `{ success: false, reason: 'template_inactive' }` silently (no throw).

---

## Admin UI

### Tab Addition — `app/admin/settings/page.tsx`
Third tab: **"Email Templates"** added after "Analytics". Tab renders `<EmailTemplatesList />`.

### `app/admin/settings/components/EmailTemplatesList.tsx`
**List of all 10 templates.** Each row:
- Left: name (bold), description (muted), subject preview (italic, truncated)
- Right: "Last edited" date or "Never edited", active/inactive toggle pill (saves immediately to DB), "Edit" button → navigates to `/admin/email-templates/[key]`

**Top-right of the list:** "Initialize Default Content" button (small, outline). Only shown if any template has empty `html_content`. On click: loops through `DEFAULT_TEMPLATES`, upserts all 10 into DB, shows progress then success message.

### `app/admin/email-templates/[key]/page.tsx`
Full-page 3-column editor. This is a `'use client'` page. Loads template data from Supabase on mount.

**Top sticky bar:**
- Left: `← Back to Templates` link
- Center: template name (read-only)
- Right: `Reset to Default` (ghost, red text) | `Send Test Email` (outline teal) | `Save Template` (primary teal)

**Left panel (280px fixed):**
- Template name + description
- Active toggle with label
- Subject input (full width text field)
- Variable chips for subject insertion (clicking inserts `{{variableName}}` at subject cursor)
- "Available Variables" section: teal outline pill per variable with label below, hover shows example value. Clicking inserts into editor at current cursor.

**Center panel (flex):**
- Tiptap toolbar (sticky), 2 rows:
  - Row 1: Bold | Italic | Underline | Strike | Sep | H1 H2 H3 Para | Sep | Text color picker | BG color picker
  - Row 2: Align L/C/R | Sep | Bullet list | Numbered list | Sep | Insert Link | Insert CTA Button | Insert Divider | Insert Variable
- Editor canvas: `max-w-[600px]` centered, white background, thin border + shadow (email frame), min-h 400px, grows with content
- `{{variables}}` rendered as teal pill marks (custom Tiptap extension or just visual styling via CSS)
- Placeholder: "Start writing your email content here..."
- Auto-save every 30s → "Saving..." indicator in top bar

**Right panel (320px fixed):**
- "Preview" title
- Toggle: "Show with example data" (default ON) — when ON, replaces `{{vars}}` with example values from `TEMPLATE_VARIABLES`
- Preview div with full email HTML (header + content + footer), isolated styling, updates in real-time

**Save behavior:**
- Tiptap `getHTML()` → saved as `html_content`
- Subject saved as-is
- `last_edited_by` = current user id
- `updated_at` = now (via DB trigger)
- Success toast: "Template saved ✓"

**Reset to Default:**
- Confirmation dialog (AlertDialog)
- On confirm: loads `DEFAULT_TEMPLATES[key]` into editor + subject field
- Does NOT auto-save — user must click Save

**Send Test Email modal:**
- Input: "Send to" (pre-filled with current admin email, editable)
- Info: "All variables will be replaced with example values"
- Subject preview with examples applied
- On send: build full HTML, replace all vars with examples, call `sendEmailFromTemplate()` equivalent directly (or a new server action `sendTestEmail()`)
- Toast: "Test email sent to [address] ✓"

---

## Tiptap Extensions Used

```
@tiptap/react
@tiptap/starter-kit
@tiptap/extension-color
@tiptap/extension-text-style
@tiptap/extension-link
@tiptap/extension-underline
@tiptap/extension-text-align
@tiptap/extension-placeholder
```

No custom Tiptap node for variable chips needed — variables in the editor are just styled text. The teal pill appearance is achieved via CSS targeting the `{{...}}` pattern in the rendered preview only.

---

## Server Actions

- `saveTemplate(key, subject, htmlContent)` — upserts to `email_templates`
- `toggleTemplateActive(key, isActive)` — updates `is_active` field
- `initializeDefaultTemplates()` — bulk upsert of DEFAULT_TEMPLATES
- `sendTestEmail(key, toAddress)` — builds HTML with example vars, sends via Resend

All server actions validate that the caller is admin/moderator before executing.

---

## Migration of Existing Email Callers

All existing call sites (welcome, onboarding complete, verification approved/rejected, credits expiring, new message, school approved/rejected, admin digest, password reset) are updated from:
```typescript
sendEmail({ to, subject, template: <ReactEmailComponent />, templateName })
```
to:
```typescript
sendEmailFromTemplate({ to, templateKey: 'welcome', variables: { firstName, mrn, loginUrl } })
```

After migration, `app/emails/` React Email components are deleted.

---

## File Summary

**New files:**
- `supabase/migrations/20260337_add_email_templates.sql`
- `lib/email/wrapper.ts`
- `lib/email/defaults.ts`
- `lib/email/variables.ts`
- `app/admin/settings/components/EmailTemplatesList.tsx`
- `app/admin/email-templates/[key]/page.tsx`

**Modified files:**
- `lib/email/send.ts` — add `sendEmailFromTemplate()`
- `app/admin/settings/page.tsx` — add third tab
- All existing email trigger points (callers of `sendEmail`)

**Deleted files:**
- `app/emails/` React Email template components (after migration)

---

## Success Criteria

1. `/admin/settings` → "Email Templates" tab → 10 templates listed
2. "Initialize Default Content" populates all 10 from defaults
3. Edit any template → 3-column editor opens
4. Live preview updates in real time with example data
5. Variable chip click inserts `{{variable}}` at editor cursor
6. Send Test Email → email arrives looking correct
7. Save Template → persisted to DB
8. Register new user → Welcome email uses DB template
9. Reset to Default → editor resets (no auto-save)
10. Toggle Inactive → that email type stops sending silently
11. Auto-save every 30s
