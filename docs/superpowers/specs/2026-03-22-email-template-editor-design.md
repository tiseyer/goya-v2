# Email Template Editor — Design Spec
Date: 2026-03-22

## Overview

A visual WYSIWYG email template editor built into the GOYA admin backend. Admins can create and edit transactional email templates directly in the browser using a Tiptap rich-text editor, preview them with real example data, and send test emails. Templates are stored in Supabase and used at send-time by a new `sendEmailFromTemplate()` function that replaces the existing React Email system entirely.

---

## Goals

- 10 transactional email templates editable without code changes
- WYSIWYG editing with live preview (GOYA header/footer included)
- Variable insertion (`{{firstName}}` etc.) via clickable chips
- Test email send from the editor
- Templates can be toggled active/inactive — inactive templates silently skip sending
- Reset to hardcoded defaults at any time (resets both subject and html_content)
- Auto-save every 30 seconds (fixed interval, not debounced)
- Replace the existing React Email (`@react-email/render`) system entirely
- Admin-only, desktop-only UI

---

## Database

**New table: `public.email_templates`**

```sql
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
```

**RLS:**
- Admins and moderators (via `profiles.role IN ('admin', 'moderator')`) can SELECT, INSERT, UPDATE, DELETE
- Service role bypasses RLS — `sendEmailFromTemplate()` uses the service role client, so no additional policy needed for the send path

**`is_active` default:** `true` — freshly seeded templates are active but have empty `html_content`. If `html_content` is empty at send time, `sendEmailFromTemplate()` falls back to `DEFAULT_TEMPLATES[templateKey].content` rather than sending a blank email.

**No plain-text fallback column:** Not included in this version. All sends are HTML-only (Resend handles basic plain-text stripping automatically).

**No revision history:** Reset is stateless — it just overwrites with hardcoded content. No undo beyond clicking Save again.

**Migration file:** `supabase/migrations/20260337_add_email_templates.sql`

**Seed:** 10 rows with template metadata but empty `html_content` (populated via "Initialize Default Content" button on first use).

---

## The 10 Templates

| template_key | name | key variables |
|---|---|---|
| `welcome` | Welcome Email | firstName, mrn, loginUrl |
| `onboarding_complete` | Onboarding Complete | firstName, memberType, dashboardUrl |
| `verification_approved` | Verification Approved | firstName, designation, profileUrl |
| `verification_rejected` | Verification Rejected | firstName, reason, contactUrl |
| `credits_expiring` | Credits Expiring | firstName, amount, creditType, expiryDate, submitUrl |
| `new_message` | New Message Notification | firstName, senderName, messagePreview, messagesUrl |
| `school_approved` | School Approved | firstName, schoolName, schoolUrl |
| `school_rejected` | School Rejected | firstName, schoolName, reason |
| `admin_digest` | Admin Weekly Digest | count, pendingVerifications, pendingCredits, pendingSchools, pendingContacts, inboxUrl |
| `password_reset` | Password Reset | firstName, resetUrl, expiryMinutes |

---

## Email Infrastructure (`lib/email/`)

### `lib/email/wrapper.ts`

```typescript
export function wrapInEmailLayout(content: string): string
```

Returns a complete HTML document string (not MJML, not a React component). Uses inline styles throughout (no external CSS — required for email client compatibility). Structure: `<!DOCTYPE html>` → `<body>` → dark navy header (GOYA + subtitle, text-only no images) → white content card → footer with © year, links, CASL notice. No CSS inlining step needed because all styles are already inline.

### `lib/email/defaults.ts`

```typescript
export const DEFAULT_TEMPLATES: Record<string, { subject: string; content: string }> = {
  welcome: { subject: 'Welcome to GOYA, {{firstName}}!', content: '...' },
  // ... all 10 templates
}
```

All 10 entries are hardcoded in this file. `content` is the body HTML (no header/footer — `wrapInEmailLayout` adds those). Reset loads both `subject` and `content` from this record.

### `lib/email/variables.ts`

```typescript
export const TEMPLATE_VARIABLES: Record<string, Array<{ key: string; label: string; example: string }>> = {
  welcome: [
    { key: 'firstName', label: 'First Name', example: 'Sarah' },
    { key: 'mrn', label: 'Member Number', example: '12345678' },
    { key: 'loginUrl', label: 'Login URL', example: 'https://goya.community/login' },
  ],
  // ... all 10 templates
}
```

Used for: chip rendering in editor sidebar, example-data substitution in live preview, and pre-filling example values in test email sends.

### `lib/email/send.ts`

**New function:**
```typescript
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

Behavior:
1. Fetch template from DB using service role client
2. If not found or `is_active = false`: return `{ success: false, reason: 'template_inactive' }` silently (no throw, no log noise)
3. If `html_content` is empty: use `DEFAULT_TEMPLATES[templateKey].content` as fallback
4. Variable substitution: `new RegExp('\\{\\{key\\}\\}', 'g')` replace on both subject and content. Missing variables → empty string (no error)
5. Wrap in `wrapInEmailLayout(content)`
6. Call Resend directly (not through existing `sendEmail()`)
7. Log to `email_log` table (same as before)

**Existing `sendEmail()`:** Kept in place but marked `@deprecated`. No callers after migration. Not deleted yet in this version (safety net for rollback).

**Variable format:** `{{camelCaseName}}` — double curly braces, camelCase. This is the canonical format used in both editor storage and send-time substitution.

---

## Existing Call Sites to Migrate

All of these call `sendEmail()` today and must be updated to `sendEmailFromTemplate()`:

| Location | templateKey | Key variables |
|---|---|---|
| Auth registration trigger / welcome action | `welcome` | firstName, mrn, loginUrl |
| Onboarding completion action | `onboarding_complete` | firstName, memberType, dashboardUrl |
| Admin verification approval | `verification_approved` | firstName, designation, profileUrl |
| Admin verification rejection | `verification_rejected` | firstName, reason, contactUrl |
| Credits expiry cron/action | `credits_expiring` | firstName, amount, creditType, expiryDate, submitUrl |
| Message notification | `new_message` | firstName, senderName, messagePreview, messagesUrl |
| School approval | `school_approved` | firstName, schoolName, schoolUrl |
| School rejection | `school_rejected` | firstName, schoolName, reason |
| Admin digest cron | `admin_digest` | count, pendingVerifications, pendingCredits, pendingSchools, pendingContacts, inboxUrl |
| Password reset | `password_reset` | firstName, resetUrl, expiryMinutes |

**Note on `password_reset`:** Supabase Auth handles its own password reset email via the dashboard config. If no custom call site exists in the codebase, `password_reset` is still included as a template for future use (e.g., admin-triggered resets) but has no call site to migrate. Confirm during implementation by searching for existing callers.|

After updating all callers, `app/emails/` React Email components are deleted. Migration is done in one PR — not gated behind production verification (dev branch only at this stage).

---

## Admin UI

### `app/admin/settings/page.tsx` — changes

Add third tab "Email Templates" after "Analytics". Tab renders `<EmailTemplatesList />`. `EmailTemplatesList` fetches its own data from Supabase on mount (no props needed).

### `app/admin/settings/components/EmailTemplatesList.tsx`

**Loading state:** Skeleton rows while fetching.

**Each row:**
- Left: name (bold), description (muted, text-sm), subject (italic, muted, truncated, text-xs)
- Right: "Last edited [date]" or "Never edited", active/inactive toggle pill (green/gray), "Edit" button → `router.push('/admin/email-templates/[key]')`
- Toggle saves immediately via `toggleTemplateActive()` server action, with optimistic UI update

**Top-right:** "Initialize Default Content" button (small outline). Shown only if any template has empty `html_content`. On click: calls `initializeDefaultTemplates()`, shows "Initializing 10 templates..." progress, then "All templates initialized ✓" toast. After success, refreshes list.

### `app/admin/email-templates/[key]/page.tsx`

`'use client'` component. Fetches template row from Supabase on mount.

**Loading state:** Full-page skeleton.

**Not found:** If `key` doesn't match a known `template_key`, redirect to `/admin/settings` (with `#email-templates` hash).

**Top sticky bar:**
- Left: `← Back to Templates` link
- Center: template name (read-only text)
- Right: `Reset to Default` (ghost, red text) | `Send Test Email` (outline teal) | `Save Template` (primary teal)
- Auto-save indicator: small gray "Saving..." text appears next to the Save button during auto-save, disappears on completion or shows "Save failed" in red on error

**Left panel (280px, fixed, scrollable):**
- Template name (bold heading) + description (muted)
- Active toggle with label "Emails will send" / "Emails paused"
- Subject input (full-width text field) with variable chips for subject insertion
- "Available Variables" section: one teal outline pill per variable, label below the pill, tooltip on hover showing "Example: [value]". Clicking inserts `{{variableName}}` at editor cursor (or at end of subject if subject field was last focused)

**Center panel (flex-1, scrollable):**

Toolbar (sticky at top, 2 rows):
- Row 1: Bold | Italic | Underline | Strike | `|` | H1 H2 H3 Para | `|` | Text color picker (presets: #0f2044, #14b8a6, #9e6b7a, #ffffff, #64748b + custom) | BG color picker (same presets)
- Row 2: Align L/C/R | `|` | Bullet list | Numbered list | `|` | Insert Link | Insert CTA Button | Insert Divider | Insert Variable

Editor canvas:
- `max-w-[600px]` centered, white background, `1px solid #e2e8f0` border, `box-shadow: 0 1px 4px rgba(0,0,0,0.06)`
- `min-height: 400px`, grows with content
- Placeholder: "Start writing your email content here..."
- `{{variables}}` in editor content are visually highlighted with teal background (CSS: `span` with class) — handled by a simple Tiptap CSS decoration or just left as styled text (no custom Tiptap node needed)

Insert CTA Button popup: button text input + URL input + color picker → inserts a Tiptap-compatible HTML `<a>` with inline styles.

Insert Link popup: URL input + "Open in new tab" checkbox.

**Auto-save:** Fixed 30-second interval (`setInterval`). Only fires if content has changed since last save. On failure: shows "Save failed" indicator, does not retry automatically.

**Unsaved changes guard:** On navigate-away, browser default `beforeunload` prompt if `isDirty` is true.

**Right panel (320px, fixed, scrollable):**
- Title: "Preview"
- Toggle: "Show with example data" (default ON)
- Preview rendered in a `<div>` with `dangerouslySetInnerHTML`. Content = `wrapInEmailLayout(editorHtml)` so the full GOYA header/footer renders in the preview exactly as it would in an inbox. Scoped wrapper class resets font/spacing. Updates in real-time on every Tiptap `onUpdate`.
- When toggle ON: all `{{vars}}` replaced with `TEMPLATE_VARIABLES[key]` example values before passing to `wrapInEmailLayout`
- When toggle OFF: raw `{{vars}}` shown as-is inside the wrapped layout

### Send Test Email Modal

Fields:
- "Send to" input (pre-filled with current admin's email, editable, validated as email format)
- Info text: "All variables will be replaced with example values for the test."
- Subject preview line: subject with all vars replaced by examples (read-only)

On send:
- Calls `sendTestEmail(key, toAddress, currentSubject, currentContent)` server action
- Server action substitutes all vars with `TEMPLATE_VARIABLES[key]` example values, calls `wrapInEmailLayout()`, then sends via Resend directly. No DB read needed — uses passed content.
- Success toast: "Test email sent to [address] ✓"
- Error toast: "Failed to send — [error message]"
- Modal closes on success

**Note:** `sendTestEmail` uses the current editor content (passed as argument), not the DB-saved version.

### Reset to Default

- Opens `AlertDialog` with title "Reset to Default?" and description "This will replace the current content with the original default template. You can still undo by closing without saving."
- On confirm: loads `DEFAULT_TEMPLATES[key]` into editor (`editor.commands.setContent(...)`) and subject field
- Does NOT auto-save. `isDirty` is set to true so user knows they have unsaved changes.

---

## Server Actions

All actions are in `app/actions/email-templates.ts`. All validate that caller is admin/moderator before executing.

```typescript
saveTemplate(key: string, subject: string, htmlContent: string): Promise<void>
// Full upsert. Updates html_content, subject, updated_at, and last_edited_by (= auth.uid()). Called by Save button AND auto-save timer. Uses a simple isSaving boolean lock — if a save is already in flight, the new call is queued and runs after completion (no concurrent upserts).

toggleTemplateActive(key: string, isActive: boolean): Promise<void>
// Updates is_active field only.

initializeDefaultTemplates(): Promise<void>
// Upserts all DEFAULT_TEMPLATES into DB. No-ops on existing non-empty rows (only fills empty html_content).

sendTestEmail(key: string, toAddress: string, currentSubject: string, currentContent: string): Promise<{ success: boolean; error?: string }>
// Builds full HTML from currentContent (not DB), substitutes example vars, sends via Resend.
```

---

## Tiptap Extensions

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

No custom Tiptap node for variable chips. Variables are plain text `{{variableName}}` in the editor. The teal highlight in the editor is applied via CSS attribute selector targeting the text pattern (or a simple inline style span on insertion).

---

## File Summary

**New files:**
- `supabase/migrations/20260337_add_email_templates.sql`
- `lib/email/wrapper.ts`
- `lib/email/defaults.ts`
- `lib/email/variables.ts`
- `app/actions/email-templates.ts`
- `app/admin/settings/components/EmailTemplatesList.tsx`
- `app/admin/email-templates/[key]/page.tsx`

**Modified files:**
- `lib/email/send.ts` — add `sendEmailFromTemplate()`, deprecate `sendEmail()`
- `app/admin/settings/page.tsx` — add third tab
- All existing email trigger files (see call site table above)

**Deleted files:**
- `app/emails/` React Email template components (after all callers migrated)

---

## Success Criteria

1. `/admin/settings` → "Email Templates" tab → 10 templates listed with correct metadata
2. "Initialize Default Content" populates all 10 from defaults
3. Click "Edit" on any template → 3-column editor opens with existing content loaded
4. Live preview updates in real time; example data toggle works
5. Variable chip click inserts `{{variable}}` at editor cursor
6. "Send Test Email" → email arrives with GOYA header/footer and example data substituted
7. "Save Template" → persisted to DB, success toast, `isDirty` resets
8. Register new test user → Welcome email uses DB template content (not React Email)
9. "Reset to Default" → editor resets, no auto-save fires
10. Toggle Inactive → that email type stops sending silently (`reason: 'template_inactive'`)
11. Auto-save fires every 30s when content has changed, "Saving..." indicator appears
12. Navigate away with unsaved changes → browser prompt appears
13. All 10 templates editable, saveable, testable
