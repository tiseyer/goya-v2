import { NextResponse } from 'next/server'
import { sendEmail } from '@/lib/email/send'
import { VerificationApprovedEmail } from '@/app/emails/VerificationApprovedEmail'
import * as React from 'react'

export async function POST(req: Request) {
  try {
    const { email, firstName, designation } = await req.json()
    await sendEmail({
      to: email,
      subject: '🎉 Your GOYA teacher status has been verified!',
      template: React.createElement(VerificationApprovedEmail, { firstName, designation }),
      templateName: 'VerificationApprovedEmail',
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
