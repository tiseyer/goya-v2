---
title: Emails
audience: ["admin"]
section: admin
order: 10
last_updated: "2026-04-01"
---

# Emails

The Emails section provides centralized management of all platform email functionality. Navigate to **Emails** in the admin sidebar or go to `/admin/emails`.

The page has four tabs: **Templates**, **Scheduled**, **Triggered**, and **Email Provider**.

## Table of Contents

- [Templates Tab](#templates-tab)
- [Scheduled Tab](#scheduled-tab)
- [Triggered Tab](#triggered-tab)
- [Email Provider Tab](#email-provider-tab)

---

## Templates Tab

View and manage all email templates used across the platform.

Each template row shows:
- **Name** and description
- **Subject line** (italic preview)
- **Last edited** date
- **Active/Paused** toggle — paused templates will not be sent
- **Send Test** button — opens a modal to send a test email to any address
- **Edit** button — opens the rich text editor for that template

### Editing a template

Click **Edit** to open the template editor. The editor supports:
- Rich text formatting (bold, italic, links, alignment, colors)
- Variable placeholders like `{{firstName}}` — shown in a dropdown
- Live preview with sample data
- Auto-save every 30 seconds
- **Reset to Default** to restore original content
- **Send Test** to verify changes before going live

### Initializing templates

If any templates have empty content, an **Initialize Default Content** button appears. This populates all empty templates with sensible defaults.

---

## Scheduled Tab

Shows email jobs that run on a recurring schedule via Vercel Cron Jobs.

Each row shows:
- **Name** and description
- **Schedule** (human-readable, e.g. "Every Monday at 9:00 AM")
- **Template** used
- **Recipients**
- **Last sent** date
- **Active/Paused** status with toggle

Current scheduled emails:
| Name | Schedule | Template | Recipients |
|------|----------|----------|------------|
| Admin Digest | Every Monday at 9:00 AM | admin_digest | All admins |
| Credits Expiry Reminder | Daily at 8:00 AM | credits_expiring | Members with expiring credits |

> **Note:** Pausing a schedule here prevents the email from being sent, but the underlying cron job continues to run.

---

## Triggered Tab

Shows emails that are sent automatically when specific platform events occur.

Each row shows:
- **Trigger event** — what causes the email to be sent
- **Template** — which template is used
- **Recipient** — who receives the email
- **Status** — Active or Paused, with toggle

Current triggered emails:

| Trigger Event | Template | Recipient |
|---------------|----------|-----------|
| User registers | welcome | New user |
| Onboarding completed | onboarding_complete | User |
| Verification approved | verification_approved | User |
| Verification rejected | verification_rejected | User |
| School approved | school_approved | School owner |
| School rejected | school_rejected | School owner |
| Password reset requested | password_reset | User |
| Faculty member invited | faculty_invite | Invited user |
| New direct message | new_message | Message recipient |

> **Note:** Pausing a trigger here sets the template to inactive, which prevents the email from being sent. The trigger event itself still fires in the codebase.

---

## Email Provider Tab

Configure the email delivery provider and test your email setup.

### Provider Configuration

The platform uses **Resend** for email delivery. Configuration fields:

| Field | Description |
|-------|-------------|
| **API Key** | Managed via `RESEND_API_KEY` environment variable (read-only in UI) |
| **From Name** | Display name for outgoing emails (e.g. "GOYA") |
| **From Email** | Sender address (e.g. hello@globalonlineyogaassociation.org) |
| **Reply-To Email** | Reply address (e.g. member@globalonlineyogaassociation.org) |

A connection status indicator shows:
- **Connected** (green) — last test email succeeded
- **Error** (red) — last test email failed
- **Not tested** (grey) — no test has been sent yet

Click **Save** to store display settings (from name, from email, reply-to) in the database.

### Send Test Email

1. Enter a recipient email address.
2. Select what to send:
   - **Simple Test** — a basic test message confirming email delivery works
   - Any template from the dropdown — sends with example variable values
3. Click **Send Test**.

The result is shown inline (success or error message). A successful test also updates the connection status to "Connected".

---

**See also:** [Settings](./settings.md) | [Chatbot](./chatbot.md) | [Overview](./overview.md)
