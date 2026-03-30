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
        reason,
        contactUrl: 'mailto:member@globalonlineyogaassociation.org',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
