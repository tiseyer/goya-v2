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
        designation,
        profileUrl: 'https://goya.community/members',
      },
    })
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ error: String(e) }, { status: 500 })
  }
}
