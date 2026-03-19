import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send'
import { VerificationRejectedEmail } from '@/app/emails/VerificationRejectedEmail'
import * as React from 'react'

export async function POST(req: Request) {
  try {
    const { email, firstName, reason } = await req.json()
    await sendEmail({
      to: email,
      subject: 'Update required on your GOYA registration',
      template: React.createElement(VerificationRejectedEmail, { firstName, reason }),
      templateName: 'VerificationRejectedEmail',
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
