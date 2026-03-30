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
